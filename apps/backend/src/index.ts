import express from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Cursor-based pagination parameters
 * Enables efficient infinite scroll with O(log n) complexity
 */
interface PaginationParams {
  cursor?: string;      // Base64 encoded cursor from previous page
  limit?: number;       // Items per page (default: 50, max: 100)
}

/**
 * Opportunity filter parameters
 * All filters leverage composite indexes for optimal performance
 */
interface OpportunityFilters {
  platformId?: string;
  categoryId?: string;
  minWage?: number;
  maxWage?: number;
  positionType?: string;
}

/**
 * Paginated response structure
 * Follows Relay cursor pagination specification
 */
interface PaginatedResponse<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

/**
 * Decoded cursor structure
 * Composite cursor ensures stable ordering even with concurrent inserts
 */
interface DecodedCursor {
  id: string;
  lastSeenAt: Date;
}

// ============================================================================
// CURSOR UTILITIES
// ============================================================================

/**
 * Encode cursor for pagination
 * Format: base64(id:lastSeenAt)
 * 
 * @param id - Opportunity ID
 * @param lastSeenAt - Last seen timestamp
 * @returns Base64 encoded cursor string
 */
function encodeCursor(id: string, lastSeenAt: Date): string {
  return Buffer.from(`${id}:${lastSeenAt.toISOString()}`).toString('base64');
}

/**
 * Decode cursor from pagination request
 * 
 * @param cursor - Base64 encoded cursor string
 * @returns Decoded cursor object with id and timestamp
 * @throws Error if cursor format is invalid
 */
function decodeCursor(cursor: string): DecodedCursor {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [id, timestamp] = decoded.split(':');
    
    if (!id || !timestamp) {
      throw new Error('Invalid cursor format');
    }
    
    return { 
      id, 
      lastSeenAt: new Date(timestamp) 
    };
  } catch (error) {
    throw new Error('Invalid cursor: unable to decode');
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/opportunities
 * 
 * Fetch opportunities with cursor-based pagination and efficient filtering.
 * 
 * Performance Optimization:
 * - Uses composite indexes: [status, platformId, lastSeenAt], [status, categoryId, lastSeenAt]
 * - Cursor-based pagination eliminates offset scan overhead
 * - Asymptotic complexity: O(log n) instead of O(n log n)
 * 
 * Query Parameters:
 * - cursor: Pagination cursor from previous response
 * - limit: Number of items per page (default: 50, max: 100)
 * - platformId: Filter by platform UUID
 * - categoryId: Filter by category UUID
 * - minWage: Minimum wage estimate
 * - maxWage: Maximum wage estimate
 * - positionType: Filter by position type (TASK, BATCH, PROJECT)
 * 
 * Response:
 * - data: Array of opportunities with related platform and category
 * - pageInfo: Pagination metadata with cursors
 */
app.get('/api/opportunities', async (req, res) => {
  try {
    // Parse and validate pagination parameters
    const limit = Math.min(
      parseInt(req.query.limit as string) || 50,
      100
    );
    const cursor = req.query.cursor as string | undefined;
    
    // Parse filter parameters
    const filters: OpportunityFilters = {
      platformId: req.query.platformId as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      minWage: req.query.minWage ? parseFloat(req.query.minWage as string) : undefined,
      maxWage: req.query.maxWage ? parseFloat(req.query.maxWage as string) : undefined,
      positionType: req.query.positionType as string | undefined,
    };
    
    // Decode cursor if provided
    let decodedCursor: DecodedCursor | null = null;
    if (cursor) {
      try {
        decodedCursor = decodeCursor(cursor);
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid cursor',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Build where clause with filters
    // This leverages the composite indexes for O(log n) performance
    const where: Prisma.OpportunityWhereInput = {
      status: 'ACTIVE',
      ...(filters.platformId && { platformId: filters.platformId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.minWage && { wageEstimate: { gte: filters.minWage } }),
      ...(filters.maxWage && { 
        wageEstimate: filters.minWage 
          ? { gte: filters.minWage, lte: filters.maxWage }
          : { lte: filters.maxWage }
      }),
      ...(filters.positionType && { positionType: filters.positionType }),
      
      // Cursor condition for pagination
      // Uses composite comparison for stable ordering
      ...(decodedCursor && {
        OR: [
          { lastSeenAt: { lt: decodedCursor.lastSeenAt } },
          {
            lastSeenAt: decodedCursor.lastSeenAt,
            id: { lt: decodedCursor.id }
          }
        ]
      })
    };
    
    // Fetch limit + 1 to determine if there's a next page
    // This is more efficient than a separate COUNT query
    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: [
        { lastSeenAt: 'desc' },
        { id: 'desc' } // Tie-breaker for stable ordering
      ],
      take: limit + 1,
      include: {
        platform: true,
        category: true,
        skills: {
          include: { skill: true }
        },
        languages: {
          include: { language: true }
        }
      }
    });
    
    // Check if there's a next page
    const hasNextPage = opportunities.length > limit;
    const data = hasNextPage ? opportunities.slice(0, limit) : opportunities;
    
    // Generate cursors for pagination
    const startCursor = data.length > 0 
      ? encodeCursor(data[0].id, data[0].lastSeenAt) 
      : null;
    const endCursor = data.length > 0 
      ? encodeCursor(data[data.length - 1].id, data[data.length - 1].lastSeenAt) 
      : null;
    
    const response: PaginatedResponse<typeof data[0]> = {
      data,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!cursor,
        startCursor,
        endCursor
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/platforms
 * 
 * Fetch all active platforms.
 * 
 * TODO: Phase 2 - Add Redis caching layer
 * - Cache platforms list with 5-minute TTL
 * - Invalidate cache on platform updates
 * - Use Redis key: "platforms:active"
 * 
 * Performance: Currently O(n) for full table scan
 * With Redis: O(1) for cached responses
 */
app.get('/api/platforms', async (req, res) => {
  try {
    // TODO: Check Redis cache first
    // const cached = await redis.get('platforms:active');
    // if (cached) return res.json(JSON.parse(cached));
    
    const platforms = await prisma.platform.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    });
    
    // TODO: Cache result in Redis
    // await redis.setex('platforms:active', 300, JSON.stringify(platforms));
    
    res.json(platforms);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/categories
 * 
 * Fetch all categories with hierarchical structure.
 * 
 * TODO: Phase 2 - Add Redis caching
 * - Cache category tree with 10-minute TTL
 * - Use Redis key: "categories:tree"
 */
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        parent: true,
        children: true
      }
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// WEBSOCKET SERVER
// ============================================================================

/**
 * WebSocket server for real-time opportunity updates
 * 
 * TODO: Phase 2 - Integrate with Redis Pub/Sub
 * - Subscribe to "opportunities:new" channel
 * - Broadcast new opportunities to connected clients
 * - Add client-side filtering based on user preferences
 */
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    // Handle client filters or auth here later
    console.log('received: %s', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Made with Bob

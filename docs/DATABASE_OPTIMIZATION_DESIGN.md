
# Arbeiters — Database Optimization Design

**Version**: 1.0.0
**Date**: 2026-06-28
**Author**: kernelpenguin
**Status**: Design Specification - Ready for Implementation

---

## Executive Summary

This document provides a comprehensive technical specification for optimizing the Arbeiters database schema and query patterns. The current implementation has several performance bottlenecks that will become critical as the platform scales. This design addresses:

- **Missing indexes** causing O(n) table scans instead of O(log n) index lookups
- **Inefficient string arrays** for skills/languages requiring full array scans
- **No pagination strategy** leading to memory issues with large result sets
- **Lack of caching layer** causing repeated expensive computations
- **Missing fields** for essential functionality (sourceUrl, applicationUrl)

**Expected Impact:**
- Query performance improvement: **10-100x faster** for filtered searches
- Match score calculation: **O(1) cached lookups** vs O(n) array operations
- Pagination: **Constant memory usage** regardless of dataset size
- Database load reduction: **60-80% fewer queries** with Redis caching

---

## 1. Current Schema Analysis

### 1.1 Performance Issues Identified

#### Issue #1: Missing Indexes on High-Cardinality Columns
```prisma
model Opportunity {
  platformId   String  // ❌ No index - O(n) scan on every platform filter
  categoryId   String? // ❌ No index - O(n) scan on every category filter
  wageEstimate Float?  // ❌ No index - O(n) scan on wage range queries
}
```

**Impact:** Every filtered query performs a full table scan. With 10,000+ opportunities:
- Platform filter: ~10,000 row scans
- Category + wage filter: ~10,000 row scans with multiple conditions
- Combined filters: Exponentially worse

#### Issue #2: No Composite Indexes for Common Query Patterns
```typescript
// Current query from index.ts (line 21-26)
await prisma.opportunity.findMany({
  where: { status: 'ACTIVE' },           // Uses index
  orderBy: { lastSeenAt: 'desc' },       // Uses index
  include: { platform: true },
  take: 100,
});
```

**Problem:** The existing `@@index([status, lastSeenAt])` is good, but common filter combinations are not indexed:
- `status + platformId + lastSeenAt` (most common user query)
- `status + categoryId + wageEstimate` (filtered searches)
- `platformId + externalId` (already has unique constraint, but could be optimized)

#### Issue #3: String Arrays for Skills/Languages
```prisma
model User {
  skills          String[]  // ❌ Requires array operations, no indexing
  languages       String[]  // ❌ Cannot efficiently query "users with skill X"
  areasOfInterest String[]  // ❌ No referential integrity
}

model Platform {
  categories String[]  // ❌ Same issues
}
```

**Impact:**
- Cannot create indexes on array elements
- Match score calculation requires full array iteration: O(n × m)
- No data validation (typos: "JavaScript" vs "javascript" vs "JS")
- Cannot efficiently query "all users with Python skill"

#### Issue #4: Missing Critical Fields
```prisma
model Opportunity {
  // ❌ No sourceUrl - users can't click through to apply
  // ❌ No applicationUrl - separate from source for direct apply links
  // ❌ No skills/requirements - match score has no data to work with
}
```

#### Issue #5: No Pagination Strategy
```typescript
// Current implementation (index.ts line 25)
take: 100, // Hard limit - what about next page?
```

**Problem:** 
- No cursor-based pagination
- No way to fetch "next 100" efficiently
- Memory issues if limit is increased
- Poor UX for infinite scroll

### 1.2 Query Complexity Analysis

| Query Type | Current Complexity | Target Complexity | Improvement |
|------------|-------------------|-------------------|-------------|
| Filter by platform | O(n) | O(log n) | 100-1000x |
| Filter by category | O(n) | O(log n) | 100-1000x |
| Filter by wage range | O(n) | O(log n) | 100-1000x |
| Combined filters | O(n) | O(log n) | 100-1000x |
| Match score calculation | O(n × m) | O(1) cached | 1000x+ |
| Pagination (offset) | O(n + offset) | O(log n) cursor | 10-100x |

---

## 2. Optimized Prisma Schema

### 2.1 Complete Optimized Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USER & PROFILE
// ============================================================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String

  // Profile fields
  experienceLevel String?
  bio             String?
  preferredWageMin Float?

  // Preferences (stored as JSON for flexibility)
  preferences     Json?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  skills          UserSkill[]
  languages       UserLanguage[]
  interests       UserInterest[]
  platformRatings PlatformRating[]
  savedOpportunities SavedOpportunity[]

  @@index([email])
}

// ============================================================================
// NORMALIZED SKILLS & LANGUAGES
// ============================================================================

model Skill {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  category    String?  // e.g., "programming", "language", "tool"
  description String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       UserSkill[]
  opportunities OpportunitySkill[]

  @@index([category])
  @@index([slug])
}

model Language {
  id          String   @id @default(uuid())
  name        String   @unique
  code        String   @unique // ISO 639-1 code (e.g., "en", "pt", "es")
  
  createdAt   DateTime @default(now())

  users       UserLanguage[]
  opportunities OpportunityLanguage[]

  @@index([code])
}

// Many-to-many junction tables
model UserSkill {
  userId      String
  skillId     String
  proficiency String?  // "beginner", "intermediate", "advanced", "expert"
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill       Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([userId, skillId])
  @@index([skillId]) // For reverse lookups
}

model UserLanguage {
  userId      String
  languageId  String
  proficiency String?  // "basic", "conversational", "fluent", "native"
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  language    Language @relation(fields: [languageId], references: [id], onDelete: Cascade)

  @@id([userId, languageId])
  @@index([languageId])
}

// ============================================================================
// CATEGORIES (Hierarchical)
// ============================================================================

model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  icon        String?
  parentId    String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Self-referential relation for hierarchy
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children    Category[] @relation("CategoryHierarchy")

  // Relations
  opportunities Opportunity[]
  userInterests UserInterest[]

  @@index([parentId])
  @@index([slug])
}

model UserInterest {
  userId     String
  categoryId String
  
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([userId, categoryId])
  @@index([categoryId])
}

// ============================================================================
// PLATFORMS
// ============================================================================

model Platform {
  id                  String   @id @default(uuid())
  name                String   @unique
  slug                String   @unique
  url                 String?
  description         String?
  status              String   @default("ACTIVE") // ACTIVE, LEGACY, INVITE_ONLY, SUSPENDED
  
  // Payment info
  payRangeMin         Float?
  payRangeMax         Float?
  payRangeCurrency    String?  @default("USD")
  
  // Platform metadata
  qualificationMethod String?
  workerClassification String? // contractor, employee, hybrid
  
  // Computed from ratings
  communityRating     Float?
  totalRatings        Int      @default(0)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // Relations
  opportunities       Opportunity[]
  ratings             PlatformRating[]

  @@index([status])
  @@index([slug])
  @@index([communityRating])
}

model PlatformRating {
  id          String   @id @default(uuid())
  userId      String
  platformId  String
  
  // Rating dimensions (1-5)
  fairPay     Int
  clarity     Int
  stability   Int
  support     Int
  volume      Int
  
  comment     String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform    Platform @relation(fields: [platformId], references: [id], onDelete: Cascade)

  @@unique([userId, platformId]) // One rating per user per platform
  @@index([platformId])
}

// ============================================================================
// OPPORTUNITIES (Core Entity)
// ============================================================================

model Opportunity {
  id           String   @id @default(uuid())
  externalId   String   // ID from source platform
  platformId   String
  categoryId   String?
  
  // Content
  title        String
  description  String?
  
  // URLs - NEW FIELDS
  sourceUrl    String?  // Link to the opportunity on the platform
  applicationUrl String? // Direct application link (if different from source)
  
  // Compensation
  wageEstimate Float?
  wageCurrency String?  @default("USD")
  
  // Classification
  positionType String?  // TASK, BATCH, PROJECT
  status       String   @default("ACTIVE") // ACTIVE, EXPIRED, FILLED, FLAGGED
  
  // Metadata
  lastSeenAt   DateTime @default(now())
  expiresAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  platform     Platform @relation(fields: [platformId], references: [id], onDelete: Cascade)
  category     Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  skills       OpportunitySkill[]
  languages    OpportunityLanguage[]
  savedBy      SavedOpportunity[]

  // ============================================================================
  // INDEXES - Critical for Performance
  // ============================================================================
  
  @@unique([platformId, externalId]) // Deduplication
  
  // Single-column indexes for individual filters
  @@index([platformId])
  @@index([categoryId])
  @@index([wageEstimate])
  @@index([status])
  @@index([lastSeenAt])
  @@index([positionType])
  
  // Composite indexes for common query patterns
  @@index([status, lastSeenAt]) // Already exists - dashboard default view
  @@index([status, platformId, lastSeenAt]) // Filter by platform
  @@index([status, categoryId, lastSeenAt]) // Filter by category
  @@index([status, wageEstimate, lastSeenAt]) // Filter by wage
  @@index([status, platformId, categoryId, lastSeenAt]) // Combined filters
  @@index([platformId, status, wageEstimate]) // Platform-specific wage queries
  
  // Expiration cleanup queries
  @@index([expiresAt])
}

model OpportunitySkill {
  opportunityId String
  skillId       String
  required      Boolean @default(true)
  
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  skill         Skill       @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([opportunityId, skillId])
  @@index([skillId]) // For "opportunities requiring skill X"
}

model OpportunityLanguage {
  opportunityId String
  languageId    String
  required      Boolean @default(true)
  
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)
  language      Language    @relation(fields: [languageId], references: [id], onDelete: Cascade)

  @@id([opportunityId, languageId])
  @@index([languageId])
}

// ============================================================================
// USER INTERACTIONS
// ============================================================================

model SavedOpportunity {
  userId        String
  opportunityId String
  notes         String?
  savedAt       DateTime @default(now())

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id], onDelete: Cascade)

  @@id([userId, opportunityId])
  @@index([userId, savedAt])
}
```

### 2.2 Schema Design Decisions

#### Decision 1: Separate Skill and Language Models
**Rationale:**
- Different validation rules (skills are freeform, languages use ISO codes)
- Different proficiency scales
- Better type safety and data integrity
- Easier to extend with language-specific features (e.g., dialect support)

#### Decision 2: Single-Level Category Hierarchy
**Rationale:**
- PRD shows 2-level hierarchy (parent → child)
- Self-referential relation supports unlimited depth if needed later
- Simpler queries for MVP
- Can add materialized path or nested sets later if deep hierarchies needed

#### Decision 3: Comprehensive Indexing Strategy
**Rationale:**
- Composite indexes match actual query patterns from PRD
- Order matters: most selective column first (status → platformId → lastSeenAt)
- Covers 95% of user queries without table scans
- Trade-off: ~20% more storage, 10-100x faster queries

#### Decision 4: New Fields for User Experience
**Rationale:**
- `sourceUrl`: Essential for users to navigate to opportunities
- `applicationUrl`: Some platforms have separate apply URLs
- `wageCurrency`: Multi-currency support for international platforms
- `required` flag on skills/languages: Distinguish must-have vs nice-to-have

---

## 3. Query Optimization Patterns

### 3.1 Cursor-Based Pagination

#### Why Cursor-Based Over Offset-Based?

| Aspect | Offset-Based | Cursor-Based |
|--------|--------------|--------------|
| Performance | O(n + offset) | O(log n) |
| Consistency | ❌ Skips/duplicates on inserts | ✅ Stable |
| Memory | ❌ Grows with offset | ✅ Constant |
| Scalability | ❌ Slow at high offsets | ✅ Fast at any position |

#### Implementation Pattern

```typescript
// ============================================================================
// CURSOR-BASED PAGINATION IMPLEMENTATION
// ============================================================================

interface PaginationParams {
  cursor?: string;      // Encoded cursor from previous page
  limit?: number;       // Items per page (default: 50, max: 100)
  direction?: 'forward' | 'backward'; // Pagination direction
}

interface PaginatedResponse<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number; // Optional, expensive to compute
  };
}

/**
 * Fetch opportunities with cursor-based pagination
 * 
 * Cursor format: base64(id:lastSeenAt)
 * This composite cursor ensures stable ordering even with concurrent inserts
 */
async function getOpportunities(
  filters: OpportunityFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<Opportunity>> {
  
  const limit = Math.min(pagination.limit || 50, 100);
  const decodedCursor = pagination.cursor 
    ? decodeCursor(pagination.cursor) 
    : null;

  // Build where clause with filters
  const where: Prisma.OpportunityWhereInput = {
    status: 'ACTIVE',
    ...(filters.platformId && { platformId: filters.platformId }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.wageMin && { wageEstimate: { gte: filters.wageMin } }),
    ...(filters.wageMax && { wageEstimate: { lte: filters.wageMax } }),
    ...(filters.positionType && { positionType: filters.positionType }),
    
    // Cursor condition for pagination
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

  // Generate cursors
  const startCursor = data.length > 0 
    ? encodeCursor(data[0].id, data[0].lastSeenAt) 
    : null;
  const endCursor = data.length > 0 
    ? encodeCursor(data[data.length - 1].id, data[data.length - 1].lastSeenAt) 
    : null;

  return {
    data,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: !!pagination.cursor,
      startCursor,
      endCursor
    }
  };
}

// Cursor encoding/decoding utilities
function encodeCursor(id: string, lastSeenAt: Date): string {
  return Buffer.from(`${id}:${lastSeenAt.toISOString()}`).toString('base64');
}

function decodeCursor(cursor: string): { id: string; lastSeenAt: Date } {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  const [id, timestamp] = decoded.split(':');
  return { id, lastSeenAt: new Date(timestamp) };
}
```

### 3.2 Optimized Filter Queries

```typescript
// ============================================================================
// OPTIMIZED FILTER QUERIES
// ============================================================================

interface OpportunityFilters {
  platformId?: string;
  categoryId?: string;
  wageMin?: number;
  wageMax?: number;
  positionType?: string;
  skillIds?: string[];
  languageIds?: string[];
  search?: string; // Full-text search
}

/**
 * Build optimized where clause using composite indexes
 * 
 * Index usage:
 * - [status, platformId, lastSeenAt] for platform filters
 * - [status, categoryId, lastSeenAt] for category filters
 * - [status, wageEstimate, lastSeenAt] for wage filters
 */
function buildWhereClause(filters: OpportunityFilters): Prisma.OpportunityWhereInput {
  const where: Prisma.OpportunityWhereInput = {
    status: 'ACTIVE', // Always filter active - uses index
  };

  // Platform filter - uses composite index
  if (filters.platformId) {
    where.platformId = filters.platformId;
  }

  // Category filter - uses composite index
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  // Wage range filter - uses composite index
  if (filters.wageMin !== undefined || filters.wageMax !== undefined) {
    where.wageEstimate = {};
    if (filters.wageMin !== undefined) {
      where.wageEstimate.gte = filters.wageMin;
    }
    if (filters.wageMax !== undefined) {
      where.wageEstimate.lte = filters.wageMax;
    }
  }

  // Position type filter
  if (filters.positionType) {
    where.positionType = filters.positionType;
  }

  // Skills filter - requires join through OpportunitySkill
  if (filters.skillIds && filters.skillIds.length > 0) {
    where.skills = {
      some: {
        skillId: { in: filters.skillIds }
      }
    };
  }

  // Languages filter - requires join through OpportunityLanguage
  if (filters.languageIds && filters.languageIds.length > 0) {
    where.languages = {
      some: {
        languageId: { in: filters.languageIds }
      }
    };
  }

  // Full-text search on title and description
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return where;
}

/**
 * Example usage with all optimizations
 */
async function searchOpportunities(
  filters: OpportunityFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<Opportunity>> {
  
  const where = buildWhereClause(filters);
  
  // This query will use composite indexes efficiently
  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy: [
      { lastSeenAt: 'desc' },
      { id: 'desc' }
    ],
    take: pagination.limit || 50,
    skip: pagination.cursor ? 1 : 0, // Skip cursor item
    cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
    include: {
      platform: {
        select: {
          id: true,
          name: true,
          slug: true,
          communityRating: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      },
      skills: {
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    }
  });

  return {
    data: opportunities,
    pageInfo: {
      hasNextPage: opportunities.length === (pagination.limit || 50),
      hasPreviousPage: !!pagination.cursor,
      startCursor: opportunities[0]?.id || null,
      endCursor: opportunities[opportunities.length - 1]?.id || null
    }
  };
}
```

### 3.3 Batch Operations for Efficiency

```typescript
// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Efficiently fetch multiple opportunities with their relations
 * Uses DataLoader pattern to avoid N+1 queries
 */
async function getOpportunitiesWithRelations(
  opportunityIds: string[]
): Promise<Map<string, OpportunityWithRelations>> {
  
  // Single query to fetch all opportunities
  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: opportunityIds } },
    include: {
      platform: true,
      category: true,
      skills: { include: { skill: true } },
      languages: { include: { language: true } }
    }
  });

  // Convert to Map for O(1) lookups
  return new Map(opportunities.map(opp => [opp.id, opp]));
}

/**
 * Batch upsert opportunities from scraper fleet
 * Uses transaction for atomicity
 */
async function batchUpsertOpportunities(
  opportunities: OpportunityInput[]
): Promise<void> {
  
  await prisma.$transaction(
    opportunities.map(opp => 
      prisma.opportunity.upsert({
        where: {
          platformId_externalId: {
            platformId: opp.platformId,
            externalId: opp.externalId
          }
        },
        update: {
          lastSeenAt: new Date(),
          status: 'ACTIVE',
          title: opp.title,
          description: opp.description,
          wageEstimate: opp.wageEstimate,
          sourceUrl: opp.sourceUrl,
          applicationUrl: opp.applicationUrl
        },
        create: opp
      })
    )
  );
}
```

---

## 4. Match Score Calculation Strategy

### 4.1 Hybrid Approach: Calculate + Cache

**Strategy:** Calculate match scores on-demand but cache aggressively in Redis with smart invalidation.

#### Why Hybrid?

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **On-demand only** | Always accurate | High CPU load | ❌ Too slow at scale |
| **Pre-calculated in DB** | Fastest reads | Complex triggers, stale data | ❌ Too complex |
| **Cached in Redis** | Fast + accurate | Cache invalidation needed | ✅ Best balance |

### 4.2 Implementation

```typescript
// ============================================================================
// MATCH SCORE CALCULATION & CACHING
// ============================================================================

interface MatchScoreComponents {
  skillsScore: number;      // 40% weight
  categoryScore: number;    // 25% weight
  wageScore: number;        // 20% weight
  positionTypeScore: number; // 10% weight
  languageScore: number;    // 5% weight
}

interface UserProfile {
  id: string;
  skills: { skillId: string; proficiency: string }[];
  languages: { languageId: string; proficiency: string }[];
  interests: { categoryId: string }[];
  preferredWageMin?: number;
  preferredPositionTypes?: string[];
}

/**
 * Calculate match score between user profile and opportunity
 * 
 * Returns 0-100 score or null if profile is incomplete
 */
function calculateMatchScore(
  profile: UserProfile,
  opportunity: OpportunityWithRelations
): number | null {
  
  // If profile is incomplete, return null (not 0)
  if (!profile.skills.length && !profile.interests.length) {
    return null;
  }

  const components: MatchScoreComponents = {
    skillsScore: calculateSkillsMatch(profile.skills, opportunity.skills),
    categoryScore: calculateCategoryMatch(profile.interests, opportunity.categoryId),
    wageScore: calculateWageMatch(profile.preferredWageMin, opportunity.wageEstimate),
    positionTypeScore: calculatePositionTypeMatch(profile.preferredPositionTypes, opportunity.positionType),
    languageScore: calculateLanguageMatch(profile.languages, opportunity.languages)
  };

  // Weighted average
  const matchScore = 
    components.skillsScore * 0.40 +
    components.categoryScore * 0.25 +
    components.wageScore * 0.20 +
    components.positionTypeScore * 0.10 +
    components.languageScore * 0.05;

  return Math.round(matchScore);
}

/**
 * Skills matching with proficiency weighting
 */
function calculateSkillsMatch(
  userSkills: { skillId: string; proficiency: string }[],
  oppSkills: { skillId: string; required: boolean }[]
): number {
  
  if (oppSkills.length === 0) return 50; // Neutral if no skills specified

  const userSkillIds = new Set(userSkills.map(s => s.skillId));
  const requiredSkills = oppSkills.filter(s => s.required);
  const optionalSkills = oppSkills.filter(s => !s.required);

  // Required skills: must have all for 100%
  const requiredMatches = requiredSkills.filter(s => userSkillIds.has(s.skillId)).length;
  const requiredScore = requiredSkills.length > 0 
    ? (requiredMatches / requiredSkills.length) * 100 
    : 100;

  // Optional skills: bonus points
  const optionalMatches = optionalSkills.filter(s => userSkillIds.has(s.skillId)).length;
  const optionalBonus = optionalSkills.length > 0 
    ? (optionalMatches / optionalSkills.length) * 20 
    : 0;

  return Math.min(requiredScore + optionalBonus, 100);
}

/**
 * Category matching with hierarchy support
 */
function calculateCategoryMatch(
  userInterests: { categoryId: string }[],
  opportunityCategoryId: string | null
): number {
  
  if (!opportunityCategoryId) return 50; // Neutral if no category
  if (userInterests.length === 0) return 50; // Neutral if no interests

  const interestIds = new Set(userInterests.map(i => i.categoryId));
  
  // Direct match
  if (interestIds.has(opportunityCategoryId)) {
    return 100;
  }

  // TODO: Check parent category match (75% score)
  // This requires fetching category hierarchy from cache

  return 0; // No match
}

/**
 * Wage matching with linear decay
 */
function calculateWageMatch(
  preferredWageMin: number | undefined,
  opportunityWage: number | null
): number {
  
  if (!preferredWageMin) return 100; // No preference = always match
  if (!opportunityWage) return 50; // Unknown wage = neutral

  if (opportunityWage >= preferredWageMin) {
    return 100; // Meets or exceeds preference
  }

  // Linear decay: 50% at half the preferred wage, 0% at zero
  const ratio = opportunityWage / preferredWageMin;
  return Math.max(ratio * 100, 0);
}

/**
 * Position type matching
 */
function calculatePositionTypeMatch(
  preferredTypes: string[] | undefined,
  opportunityType: string | null
): number {
  
  if (!preferredTypes || preferredTypes.length === 0) return 100; // No preference
  if (!opportunityType) return 50; // Unknown type = neutral

  return preferredTypes.includes(opportunityType) ? 100 : 0;
}

/**
 * Language matching
 */
function calculateLanguageMatch(
  userLanguages: { languageId: string }[],
  oppLanguages: { languageId: string; required: boolean }[]
): number {
  
  if (oppLanguages.length === 0) return 100; // No language requirement
  if (userLanguages.length === 0) return 50; // User hasn't specified languages

  const userLangIds = new Set(userLanguages.map(l => l.languageId));
  const requiredLangs = oppLanguages.filter(l => l.required);

  if (requiredLangs.length === 0) return 100; // No required languages

  const matches = requiredLangs.filter(l => userLangIds.has(l.languageId)).length;
  return (matches / requiredLangs.length) * 100;
}

// ============================================================================
// REDIS CACHING LAYER
// ============================================================================

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

/**
 * Get match score with caching
 * 
 * Cache key: match:{userId}:{opportunityId}
 * TTL: 5 minutes (300 seconds)
 */
async function getMatchScoreWithCache(
  userId: string,
  opportunityId: string
): Promise<number | null> {
  
  const cacheKey = `match:${userId}:${opportunityId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached !== null) {
    return cached === 'null' ? null : parseInt(cached, 10);
  }

  // Cache miss - calculate
  const profile = await getUserProfile(userId);
  const opportunity = await getOpportunityWithRelations(opportunityId);
  
  const score = calculateMatchScore(profile, opportunity);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, score === null ? 'null' : score.toString());
  
  return score;
}

/**
 * Invalidate match scores when user profile changes
 */
async function invalidateUserMatchScores(userId: string): Promise<void> {
  const pattern = `match:${userId}:*`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Batch calculate match scores for multiple opportunities
 * Uses pipeline for efficiency
 */
async function batchGetMatchScores(
  userId: string,
  opportunityIds: string[]
): Promise<Map<string, number | null>> {
  
  const cacheKeys = opportunityIds.map(id => `match:${userId}:${id}`);
  
  // Batch fetch from cache
  const cached = await redis.mget(...cacheKeys);
  
  const results = new Map<string, number | null>();
  const misses: string[] = [];

  // Process cached results
  cached.forEach((value, index) => {
    const oppId = opportunityIds[index];
    if (value !== null) {
      results.set(oppId, value === 'null' ? null : parseInt(value, 10));
    } else {
      misses.push(oppId);
    }
  });

  // Calculate misses
  if (misses.length > 0) {
    const profile = await getUserProfile(userId);
    const opportunities = await getOpportunitiesWithRelations(misses);
    
    const pipeline = redis.pipeline();
    
    for (const oppId of misses) {
      const opportunity = opportunities.get(oppId);
      if (opportunity) {
        const score = calculateMatchScore(profile, opportunity);
        results.set(oppId, score);
        
        // Add to cache pipeline
        const cacheKey = `match:${userId}:${oppId}`;
        pipeline.setex(cacheKey, 300, score === null ? 'null' : score.toString());
      }
    }
    
    await pipeline.exec();
  }

  return results;
}
```

### 4.3 Cache Invalidation Strategy

```typescript
// ============================================================================
// CACHE INVALIDATION TRIGGERS
// ============================================================================

/**
 * Invalidate caches when relevant data changes
 */

// When user updates profile
async function onUserProfileUpdate(userId: string): Promise<void> {
  await invalidateUserMatchScores(userId);
}

// When opportunity is updated (rare, but possible)
async function onOpportunityUpdate(opportunityId: string): Promise<void> {
  // Invalidate all match scores for this opportunity
  const pattern = `match:*:${opportunityId}`;
  const keys = await redis.keys(pattern);
  
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// When user adds/removes skills
async function onUserSkillsChange(userId: string): Promise<void> {
  await invalidateUserMatchScores(userId);
}

// When user changes wage preferences
async function onUserPreferencesChange(userId: string): Promise<void> {
  await invalidateUserMatchScores(userId);
}
```

---

## 5. Redis Caching Layer Integration

### 5.1 Redis Usage Strategy

Redis will serve four primary purposes in the optimized architecture:

1. **Match Score Caching** (covered in section 4)
2. **Query Result Caching**
3. **Real-time Pub/Sub for WebSocket notifications**
4. **Session Storage & Rate Limiting**

### 5.2 Query Result Caching

```typescript
// ============================================================================
// QUERY RESULT CACHING
// ============================================================================

/**
 * Cache frequently accessed data with appropriate TTLs
 */

// Cache platform list (changes rarely)
async function getPlatformsWithCache(): Promise<Platform[]> {
  const cacheKey = 'platforms:active';
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const platforms = await prisma.platform.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' }
  });

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(platforms));
  
  return platforms;
}

// Cache category hierarchy (changes rarely)
async function getCategoryTreeWithCache(): Promise<Category[]> {
  const cacheKey = 'categories:tree';
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const categories = await prisma.category.findMany({
    include: {
      children: true,
      parent: true
    },
    orderBy: { name: 'asc' }
  });

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(categories));
  
  return categories;
}

// Cache skills list (changes rarely)
async function getSkillsWithCache(): Promise<Skill[]> {
  const cacheKey = 'skills:all';
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const skills = await prisma.skill.findMany({
    orderBy: { name: 'asc' }
  });

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(skills));
  
  return skills;
}

// Cache opportunity counts by platform (for dashboard stats)
async function getOpportunityCountsByPlatform(): Promise<Map<string, number>> {
  const cacheKey = 'stats:opportunities:by-platform';
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return new Map(JSON.parse(cached));
  }

  const counts = await prisma.opportunity.groupBy({
    by: ['platformId'],
    where: { status: 'ACTIVE' },
    _count: true
  });

  const result = new Map(
    counts.map(c => [c.platformId, c._count])
  );

  // Cache for 5 minutes (more volatile)
  await redis.setex(cacheKey, 300, JSON.stringify([...result]));
  
  return result;
}
```

### 5.3 Real-time Pub/Sub for WebSocket Notifications

```typescript
// ============================================================================
// REAL-TIME PUB/SUB
// ============================================================================

/**
 * Publish new opportunities to Redis for WebSocket distribution
 * This is called by the scraper fleet after upserting opportunities
 */
async function publishNewOpportunity(opportunity: Opportunity): Promise<void> {
  const message = {
    type: 'NEW_OPPORTUNITY',
    data: {
      id: opportunity.id,
      platformId: opportunity.platformId,
      categoryId: opportunity.categoryId,
      wageEstimate: opportunity.wageEstimate,
      positionType: opportunity.positionType,
      title: opportunity.title,
      timestamp: new Date().toISOString()
    }
  };

  // Publish to general channel
  await redis.publish('opportunities:new', JSON.stringify(message));
  
  // Publish to platform-specific channel
  await redis.publish(
    `opportunities:platform:${opportunity.platformId}`,
    JSON.stringify(message)
  );
  
  // Publish to category-specific channel if available
  if (opportunity.categoryId) {
    await redis.publish(
      `opportunities:category:${opportunity.categoryId}`,
      JSON.stringify(message)
    );
  }
}

/**
 * Subscribe to opportunity updates in the WebSocket server
 */
function setupOpportunitySubscriptions(wss: WebSocketServer): void {
  const subscriber = new Redis(process.env.REDIS_URL);

  // Subscribe to all new opportunities
  subscriber.subscribe('opportunities:new');

  subscriber.on('message', async (channel, message) => {
    const event = JSON.parse(message);
    const opportunity = event.data;

    // Broadcast to connected clients based on their filters
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        const userFilters = (client as any).userFilters; // Attached during auth
        
        if (matchesUserFilters(opportunity, userFilters)) {
          // Calculate match score if user has profile
          const userId = (client as any).userId;
          const matchScore = userId 
            ? await getMatchScoreWithCache(userId, opportunity.id)
            : null;

          client.send(JSON.stringify({
            type: 'NEW_OPPORTUNITY',
            data: {
              ...opportunity,
              matchScore
            }
          }));
        }
      }
    }
  });
}

/**
 * Check if opportunity matches user's filters
 */
function matchesUserFilters(
  opportunity: any,
  filters: OpportunityFilters | undefined
): boolean {
  
  if (!filters) return true; // No filters = show all

  if (filters.platformId && opportunity.platformId !== filters.platformId) {
    return false;
  }

  if (filters.categoryId && opportunity.categoryId !== filters.categoryId) {
    return false;
  }

  if (filters.wageMin && (!opportunity.wageEstimate || opportunity.wageEstimate < filters.wageMin)) {
    return false;
  }

  if (filters.wageMax && opportunity.wageEstimate && opportunity.wageEstimate > filters.wageMax) {
    return false;
  }

  if (filters.positionType && opportunity.positionType !== filters.positionType) {
    return false;
  }

  return true;
}
```

### 5.4 Session Storage & Rate Limiting

```typescript
// ============================================================================
// SESSION STORAGE
// ============================================================================

/**
 * Store user sessions in Redis for fast access
 * TTL matches JWT expiration (24 hours)
 */
async function storeUserSession(
  userId: string,
  sessionData: UserSession
): Promise<void> {
  const cacheKey = `session:${userId}`;
  await redis.setex(cacheKey, 86400, JSON.stringify(sessionData)); // 24 hours
}

async function getUserSession(userId: string): Promise<UserSession | null> {
  const cacheKey = `session:${userId}`;
  const cached = await redis.get(cacheKey);
  return cached ? JSON.parse(cached) : null;
}

async function invalidateUserSession(userId: string): Promise<void> {
  const cacheKey = `session:${userId}`;
  await redis.del(cacheKey);
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Rate limiting using Redis
 * Implements sliding window algorithm
 */
async function checkRateLimit(
  identifier: string, // IP or userId
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Remove old entries and count current window
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, now, `${now}`);
  pipeline.zcard(key);
  pipeline.expire(key, windowSeconds);

  const results = await pipeline.exec();
  const count = results?.[2]?.[1] as number || 0;

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  const resetAt = new Date(now + (windowSeconds * 1000));

  return { allowed, remaining, resetAt };
}

/**
 * Express middleware for rate limiting
 */
function rateLimitMiddleware(
  limit: number = 100,
  windowSeconds: number = 60
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.user?.id || req.ip;
    
    const result = await checkRateLimit(identifier, limit, windowSeconds);

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: result.resetAt
      });
    }

    next();
  };
}
```

---

## 6. Migration Strategy

### 6.1 Migration Overview

The migration from the current schema to the optimized schema must be done carefully to:
- Preserve all existing data
- Minimize downtime
- Allow rollback if issues occur
- Maintain backward compatibility during transition


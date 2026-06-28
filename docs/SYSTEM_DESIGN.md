# Arbeiters — System Design

**Versão**: 0.1.0-draft
**Data**: 2026-06-16

---

## 1. Visão Arquitetural

Arbeiters utiliza uma arquitetura orientada a eventos e processamento assíncrono para garantir escalabilidade (atendendo à restrição matemática `N_scrapers = empresas³ / N`) e performance no consumo de dados (Oportunidades em tempo real).

A arquitetura é dividida em três pilares:
1. **Frontend (MVP Dashboard)**: Aplicação web em tempo real consumindo APIs e WebSockets.
2. **Backend (Core API)**: Servidor central que gerencia usuários, perfis, filtros e orquestra a entrega de dados.
3. **Scraper Fleet (A Frota)**: Conjunto de workers concorrentes isolados que interagem com as plataformas alvo.

---

## 2. Topologia de Alto Nível

```mermaid
graph TD
    %% Frontend
    subgraph Client
        UI[Web Dashboard UI]
        Z[Zustand Store]
        UI --> Z
    end

    %% Backend
    subgraph Core API
        API[Express REST API]
        WS[WebSocket Server]
        Auth[Auth Middleware]
    end

    Client -- HTTP GET/POST --> API
    Client -- WebSocket --> WS

    %% Scraper Fleet (Concurrency Engine)
    subgraph Scraper Fleet (BullMQ Workers)
        W_O[Worker Outlier]
        W_D[Worker DataAnnotation]
        W_A[Worker Alignerr]
        W_N[Worker N...]
    end

    %% Queue & Cache
    subgraph Message Broker
        Redis[Redis (BullMQ + Cache + Pub/Sub)]
    end

    %% Database
    subgraph Persistence
        PG[(PostgreSQL)]
    end

    API --> PG
    WS -. Subscribes .- Redis

    Redis -- Jobs --> W_O
    Redis -- Jobs --> W_D
    Redis -- Jobs --> W_A

    W_O -- Upsert / Notify --> PG
    W_O -- Publish Event --> Redis
    W_D -- Upsert / Notify --> PG
    W_D -- Publish Event --> Redis

    %% External
    W_O -. Headless Browser / Proxies .-> ExtOutlier(Outlier.ai)
    W_D -. Headless Browser / Proxies .-> ExtDA(DataAnnotation)
```

---

## 3. Scraper Fleet (Paralelismo e Concorrência)

A inovação principal para redução de custos é a Fleet de Scrapers desacoplada dos usuários.

### 3.1 Orquestração com BullMQ (Redis)
- O Core agenda "Jobs de Raspagem" no Redis (ex: `scrape-outlier-coding-tier`).
- A Fleet consome esses jobs concorrentemente.
- O número de workers (concorrência) pode ser ajustado dinamicamente:
  - Fase 1 (MVP): `concurrency: empresas^2`
  - Fase 2 (Ajuste): `concurrency: empresas^3 / N`
  - Fase 3 (Scale): `concurrency: empresas`

### 3.2 Lógica do Worker
Cada Worker (Node.js + Playwright) executa o seguinte fluxo:
1. Recebe o Job.
2. Adquire um Proxy Residencial do pool.
3. Injeta a sessão de uma Conta de Coleta (Dummy Account) para a respectiva plataforma.
4. Navega até a URL/Dashboard.
5. Realiza o parsing do DOM ou intercepta requests XHR/Fetch para extrair a lista de tarefas.
6. Fecha o contexto (liberando recursos rapidamente).
7. Envia os resultados processados para a camada de Persistência.

---

## 4. Deduplicação e Inserção (Persistência)

Quando a Fleet encontra oportunidades, elas são enviadas ao Banco de Dados (PostgreSQL) usando Prisma.

### Estratégia de Upsert
Como múltiplos workers podem ver a mesma vaga simultaneamente, usamos uma chave composta de deduplicação (geralmente `platform_id` + `external_task_id` ou um hash do título+descrição).

```sql
INSERT INTO opportunities (external_id, platform_id, title, category_id, status, last_seen_at)
VALUES ($1, $2, $3, $4, 'ACTIVE', NOW())
ON CONFLICT (external_id, platform_id) 
DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at, status = 'ACTIVE';
```
*Isso garante que o banco não cresça infinitamente com duplicatas e atualiza o "sinal de vida" da oportunidade.*

---

## 5. Distribuição em Tempo Real (Pub/Sub)

Para que os usuários recebam as vagas instantes após a extração ("Panda Crazy Style"):

1. **Worker Extrai**: O worker salva no Postgres e publica um evento no Redis: `PUBLISH new_opportunity { id: 123, platform: 'Outlier', category: 'Coding' }`.
2. **Core Subscreve**: O backend Node.js escuta esse canal do Redis.
3. **Match & Broadcast**: O backend recebe a oportunidade, verifica na memória (ou cache) quais usuários com WebSockets ativos têm filtros que dão "match" com aquela vaga.
4. **Push**: Envia o payload pelo WebSocket apenas para as conexões relevantes.
5. **Client-side**: O Zustand recebe o evento, atualiza o store, pisca o card (Yellow flash) e toca o alarme de áudio configurado pelo usuário.

---

## 6. Esquema do Banco de Dados (Prisma Draft)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  // ... perfil (skills, languages)
  preferences Json   // Filtros salvos, configs de som
}

model Platform {
  id            String   @id @default(uuid())
  name          String   @unique
  status        String   // ACTIVE, LEGACY
  opportunities Opportunity[]
}

model Opportunity {
  id           String   @id @default(uuid())
  externalId   String   // ID originário da plataforma
  platformId   String
  title        String
  description  String?
  wageEstimate Float?
  status       String   // ACTIVE, EXPIRED, FILLED
  lastSeenAt   DateTime @default(now())
  createdAt    DateTime @default(now())

  platform     Platform @relation(fields: [platformId], references: [id])

  @@unique([platformId, externalId]) // Garante deduplicação
  @@index([status, lastSeenAt])      // Otimiza queries do dashboard
}
```

# Arbeiters - Development Sprints & SDLC

Este documento define o ciclo de vida de desenvolvimento de software (SDLC) para o projeto Arbeiters, dividido em Sprints ágeis, seguindo as melhores práticas corporativas.

## Metodologia
Utilizamos uma abordagem iterativa baseada em Scrum/Kanban, com Sprints de 1 a 2 semanas. Cada Sprint possui um objetivo claro (Sprint Goal) e entregáveis tangíveis.

## Sprints

### Sprint 1: Fundação & Landing Page (Atual)
**Objetivo:** Estabelecer a infraestrutura do monorepo, definir a arquitetura central (Scraper Fleet + Backend) e publicar a Landing Page conceitual ("Produto Classista").
*   [x] Setup do Monorepo (NPM Workspaces).
*   [x] Configuração inicial do Backend (Express + Prisma + WebSocket).
*   [x] Setup do Scraper Fleet base.
*   [x] Prototipação e Desenvolvimento da Landing Page em Angular (Estética Angular.dev + Construtivista).
*   [x] Configuração do repositório Git e padrões de contribuição (Conventional Commits, Git Flow).

### Sprint 2: Core Backend & Data Layer
**Objetivo:** Implementar o modelo de dados completo, a API RESTful para consumo pelo frontend e a infraestrutura de filas para os scrapers.
*   [ ] Refinar Prisma Schema (Trabalhos, Plataformas, Histórico).
*   [ ] Implementar endpoints da API (`/api/opportunities`, `/api/stats`).
*   [ ] Configurar o BullMQ no `scraper-fleet` conectado ao Redis.
*   [ ] Implementar testes unitários para a camada de serviço.

### Sprint 3: Scraper Fleet MVP
**Objetivo:** Desenvolver os primeiros *workers* (extratores) funcionais para pelo menos duas plataformas (ex: Outlier, Surge AI).
*   [ ] Desenvolver worker para Plataforma A (Autenticação dummy + Extração).
*   [ ] Desenvolver worker para Plataforma B.
*   [ ] Implementar rotina de *Upsert* no banco de dados para evitar duplicatas.
*   [ ] Testes de integração dos scrapers.

### Sprint 4: Dashboard UI (Aplicação Principal)
**Objetivo:** Desenvolver o portal do usuário (trabalhador) para visualização e filtragem em tempo real das oportunidades.
*   [ ] Setup do Angular app para o Dashboard.
*   [ ] Integração com WebSocket para atualizações em tempo real.
*   [ ] Componentes de filtragem (wage/hr, plataforma).
*   [ ] Implementar o Design System "Classista" no Dashboard.

### Sprint 5: Segurança, Otimização e Deploy (Beta)
**Objetivo:** Preparar a aplicação para o primeiro ambiente de produção (Staging/Beta).
*   [ ] Revisão de segurança (Rate limiting, sanitização, CORS).
*   [ ] Configuração de pipelines CI/CD (GitHub Actions).
*   [ ] Otimização de performance (SSR, Caching, Bundle size).
*   [ ] Deploy da infraestrutura (Vercel/Render/AWS).

## SDLC (Software Development Life Cycle)
1.  **Planejamento:** Definição dos requisitos e design do sistema (Concluído no `SYSTEM_DESIGN.md`).
2.  **Desenvolvimento:** Execução estruturada por Sprints e features isoladas.
3.  **Testes (QA):** Testes unitários com Jest, testes E2E com Playwright. Revisão de código obrigatória via Pull Requests.
4.  **Deploy:** CI/CD automatizado via GitHub Actions para ambientes de Staging e Production.
5.  **Manutenção:** Monitoramento contínuo via logs (Winston/Datadog) e métricas de saúde da frota de scrapers.

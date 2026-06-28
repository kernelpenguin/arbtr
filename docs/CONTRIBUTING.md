# Arbeiters - Guia de Contribuição e Boas Práticas

Este repositório segue rigorosamente as convenções corporativas e científicas de engenharia de software para garantir escalabilidade, legibilidade e manutenibilidade.

## 1. Estrutura do Repositório (Monorepo)
O projeto utiliza uma arquitetura de Monorepo com NPM Workspaces. Isso permite o compartilhamento de configurações e dependências entre os serviços:
*   `apps/backend/`: API e Orquestração (Node.js/Express/Prisma).
*   `apps/frontend/`: Dashboard de Usuário.
*   `apps/landing-page/`: Landing Page (Angular).
*   `apps/scraper-fleet/`: Workers de Extração (BullMQ/Playwright).
*   `docs/`: Documentação de arquitetura, negócio e SDLC.

## 2. Git Flow e Gerenciamento de Branches
Adotamos uma versão simplificada do Git Flow:
*   `main`: Branch de produção. Código sempre estável e *deployable*.
*   `develop`: Branch de integração. Todas as features convergem para cá antes de um release.
*   `feature/<nome-da-feature>`: Para desenvolvimento de novas funcionalidades. Ex: `feature/scraper-outlier`.
*   `bugfix/<nome-do-bug>`: Para correções de bugs não críticos na `develop`.
*   `hotfix/<nome-do-bug>`: Para correções críticas diretamente na `main`.

## 3. Padrão de Commits (Conventional Commits)
Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/). Formato obrigatório:
`<tipo>[escopo opcional]: <descrição curta>`

**Tipos Permitidos:**
*   `feat:` Nova funcionalidade (Adiciona ao produto).
*   `fix:` Correção de bug.
*   `docs:` Alterações exclusivas em documentação.
*   `style:` Mudanças de formatação que não afetam a lógica (espaços, ponto e vírgula, etc).
*   `refactor:` Refatoração de código (nem nova funcionalidade, nem correção de bug).
*   `perf:` Alterações de código que melhoram a performance.
*   `test:` Adição ou correção de testes.
*   `chore:` Atualização de dependências, builds ou ferramentas auxiliares.

*Exemplo:* `feat(scraper-fleet): implementa autenticação dummy para plataforma Surge`

## 4. Pull Requests (PRs) e Code Review
Nenhum código vai para `develop` ou `main` sem um Pull Request revisado.
*   Todo PR deve seguir o template oficial (`.github/pull_request_template.md`).
*   O PR deve estar vinculado a uma Issue rastreável.
*   CI/CD pipelines devem passar em todas as etapas (lint, testes) antes do merge.

## 5. Qualidade de Código (Linting & Formatting)
*   Utilizamos **ESLint** e **Prettier**. O código deve ser formatado antes do commit.
*   A tipagem é obrigatória em todos os pacotes (`TypeScript` com `strict: true`).
*   Evite `any`. Defina interfaces e tipos explicitamente no modelo de domínio.

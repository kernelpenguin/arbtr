# Arbeiters — Regras de Negócio

**Versão**: 0.1.0-draft
**Data**: 2026-06-16
**Referência**: [PRD.md](file:///home/pop/Arbeiters/docs/PRD.md)

---

## RN01 — Princípio da Não-Exclusão

> **A triagem inteligente NUNCA bloqueia acesso a oportunidades.**

- O match score (0-100%) é calculado e exibido, mas **todas** as oportunidades permanecem visíveis e acessíveis para **todos** os usuários.
- Não existe conceito de "não qualificado" dentro do Arbeiters. A qualificação é responsabilidade de cada plataforma.
- O sistema pode ordenar por relevância (match score), mas o usuário sempre pode reordenar por qualquer critério.
- Diferença fundamental com ATS corporativos: aqui, a triagem serve o trabalhador, não a empresa.

---

## RN02 — Cálculo do Match Score

O match score entre perfil do trabalhador e oportunidade é calculado como média ponderada:

| Fator | Peso | Cálculo |
|---|---|---|
| **Habilidades** | 40% | Interseção entre skills do perfil e skills requeridas pela categoria |
| **Área de conhecimento** | 25% | Match direto entre áreas de interesse e categoria da oportunidade |
| **Faixa salarial** | 20% | Oportunidade dentro da faixa desejada = 100%; fora = decai linearmente |
| **Tipo de posição** | 10% | Match entre tipo preferido (avulsa/batch/longa) e tipo da oportunidade |
| **Idioma** | 5% | Idioma da oportunidade está nos idiomas do perfil |

**Regras especiais**:
- Se o perfil está vazio/incompleto, match score = `null` (não calculado, não zero).
- Match score `null` não penaliza a ordenação — oportunidades aparecem normalmente.

---

## RN03 — Sugestão "Fora da Bolha"

- Se > 80% das interações do usuário nos últimos 30 dias foram em **uma mesma categoria**, o sistema ativa sugestões "fora da bolha".
- Oportunidades fora da categoria dominante recebem label: `🌱 Algo diferente para você?`.
- A sugestão respeita o perfil: sugere categorias adjacentes (ex: Coding → STEM/Math), não completamente aleatórias.
- O usuário pode desativar este recurso.

**Mapa de adjacência de categorias**:
```
Coding ←→ STEM/Math ←→ Pesquisa/Fact-checking
Escrita Criativa ←→ Tradução ←→ Avaliação de Texto
RLHF ←→ Red-teaming ←→ Safety Testing
Imagem ←→ Vídeo ←→ Multimodal
Áudio/Fala ←→ Música/Acústica
Prompt Engineering ←→ Coding ←→ Red-teaming
```

---

## RN04 — Ciclo de Vida de Oportunidades

```
                  ┌──────────┐
                  │ SCRAPED  │ (coletada pela Fleet)
                  └────┬─────┘
                       │ desduplicação
                       ▼
                  ┌──────────┐
                  │ ACTIVE   │ (visível no dashboard)
                  └────┬─────┘
                       │
              ┌────────┼─────────┐
              │                  │
              ▼                  ▼
         ┌────────┐         ┌──────────┐
         │EXPIRED │         │FLAGGED   │
         │(auto)  │         │(comunid.)│
         └────────┘         └──────────┘
```

- **SCRAPED → ACTIVE**: Oportunidade é raspada, passa por verificação de integridade (URL válida, título mínimo) e entra no banco central.
- **Desduplicação**: Se a Fleet raspar a mesma oportunidade múltiplas vezes, o banco realiza um *Upsert*, atualizando o campo `lastSeenAt` e mantendo a oportunidade como ACTIVE.
- **ACTIVE → EXPIRED**: Quando a Fleet não vê a oportunidade na plataforma por `N` ciclos consecutivos (depende da frequência de scraping daquela plataforma) ou após tempo máximo padrão (ex: 24h para tarefa avulsa).
- **ACTIVE → FLAGGED**: Usuários podem reportar que a vaga sumiu ou tem erro. Após `X` flags, o status muda para investigação manual ou re-checagem forçada pelo scraper.

---

## RN05 — Orquestração da Fleet (Scrapers)

- O número de scrapers em execução é ditado pela fórmula: `N_scrapers = empresas³ / N_balanceamento`. No início do MVP, roda-se `empresas²` para redundância.
- Cada worker na Fleet atua com um IP de proxy distinto.
- Para plataformas que requerem login para ver vagas, a Fleet utiliza um pool restrito de *contas de coleta (dummy accounts)*.
- O sistema possui rate limiting de saída interno por plataforma para evitar *IP bans* ou bloqueio das contas de coleta.

---

## RN06 — Sistema de Notificações

### Gatilhos de Notificação
Uma notificação é gerada quando:
1. Uma nova oportunidade **ACTIVE** passa nos filtros configurados pelo usuário (RN06.1).
2. Uma oportunidade salva nos favoritos muda de status (RN06.2).
3. Um alerta comunitário é emitido para uma plataforma que o usuário monitora (RN06.3).

### Configurações por Usuário
| Configuração | Tipo | Default |
|---|---|---|
| `pushEnabled` | boolean | `true` |
| `soundEnabled` | boolean | `true` |
| `soundFile` | enum | `'default'` |
| `minWageFilter` | number ($/hr) | `null` (sem filtro) |
| `categories` | array<CategoryId> | `[]` (todas) |
| `platforms` | array<PlatformId> | user's active platforms |
| `positionTypes` | array<enum> | `[]` (todos) |
| `quietHoursStart` | time | `null` |
| `quietHoursEnd` | time | `null` |

### Regras de Throttling
- Máximo de **1 notificação push a cada 30 segundos** por usuário (agrupa se houver burst).
- Notificações agregadas: "🔔 5 novas oportunidades em Coding nos últimos 10 minutos".
- Quiet hours respeitados incondicionalmente.

---

## RN07 — Ratings de Plataformas

- Cada usuário pode avaliar cada plataforma **uma vez** (editável).
- Dimensões avaliadas (1-5 estrelas cada):
  - **Pagamento justo** — O quanto paga é condizente com o trabalho?
  - **Clareza de instruções** — As guidelines são claras e estáveis?
  - **Estabilidade da conta** — Risco de desativação arbitrária?
  - **Suporte** — O suporte é humano e responsivo?
  - **Volume de trabalho** — Trabalho disponível é consistente?
- Score geral = média aritmética das 5 dimensões.
- Mínimo de **5 avaliações** para exibir score público (evita outliers).
- Comentários opcionais (texto livre, max 500 chars). Moderados por regras anti-spam.

---

## RN08 — Perfil do Trabalhador

### Campos do Perfil
| Campo | Tipo | Obrigatório |
|---|---|---|
| `displayName` | string | Sim |
| `email` | string | Sim (registro) |
| `skills` | array<Skill> | Não |
| `languages` | array<Language> | Não |
| `areasOfInterest` | array<CategoryId> | Não |
| `preferredWageMin` | number ($/hr) | Não |
| `preferredPositionTypes` | array<enum> | Não |
| `activePlatforms` | array<PlatformId> | Não |
| `experienceLevel` | enum: junior/mid/senior | Não |
| `bio` | string (max 300 chars) | Não |

### Regras
- Perfil mínimo = email + displayName. Todo o resto é opcional.
- Perfil incompleto **não** restringe funcionalidades. Apenas impede cálculo de match score (RN02).
- O usuário pode exportar todos os seus dados a qualquer momento (JSON).
- O usuário pode deletar sua conta e todos os dados associados.

---

## RN09 — Plataformas (Dados Curados)

- O catálogo de plataformas é **seed** inicial mantido pela equipe + contribuições comunitárias moderadas.
- Uma plataforma tem status:
  - `ACTIVE` — Operando normalmente, aceitando novos trabalhadores.
  - `LEGACY` — Ainda existe mas está em declínio (ex: Remotasks).
  - `INVITE_ONLY` — Não aceita cadastro aberto (ex: Surge AI).
  - `SUSPENDED` — Relatos massivos de problemas. Alerta exibido.
- Campos da plataforma:

| Campo | Tipo |
|---|---|
| `id` | UUID |
| `name` | string |
| `url` | URL |
| `description` | text |
| `status` | enum |
| `categories` | array<CategoryId> |
| `payRange` | { min: number, max: number, currency: string } |
| `qualificationMethod` | text |
| `workerClassification` | enum: contractor/employee/hybrid |
| `communityRating` | computed (RN07) |

---

## RN10 — Filtros do Dashboard

### Filtros Disponíveis
| Filtro | Tipo | Comportamento |
|---|---|---|
| **Wage/hr** | range slider | Filtra por `wageEstimate`. Oportunidades sem estimativa são incluídas (com label "💰 não estimado"). |
| **Tipo de posição** | multi-select | `TASK` (avulsa), `BATCH` (lote), `PROJECT` (longo prazo). Default: todos. |
| **Área de conhecimento** | multi-select (hierárquico) | Usa taxonomia de categorias. Selecionar pai inclui filhos. |
| **Plataforma** | multi-select | Apenas plataformas ativas do usuário. |
| **Status** | multi-select | `ACTIVE`, `EXPIRED`, `FILLED`. Default: apenas ACTIVE. |
| **Match score** | range slider | 0-100%. Disponível apenas se perfil preenchido. |

### Persistência
- Filtros são salvos no perfil do usuário (server-side).
- Último estado de filtros restaurado ao recarregar.
- Botão "Reset filtros" retorna ao default.

---

## RN11 — Segurança & Privacidade

- Senhas armazenadas com bcrypt (salt rounds ≥ 12).
- JWT com expiração de 24h. Refresh token com expiração de 7 dias.
- Rate limiting: 100 requests/minuto por IP. 30 requests/minuto para contribuição de oportunidades.
- Dados do perfil visíveis apenas para o próprio usuário (não há perfis públicos no MVP).
- Ratings são anônimos (vinculados ao userId internamente, mas exibidos sem identificação).
- Logs não registram PII sensível.
- Conformidade com LGPD: consentimento explícito, direito ao esquecimento, portabilidade de dados.

---

## RN12 — Reputação do Contribuidor

- Cada usuário tem um `reputationScore` (começa em 0).
- Ações que **aumentam** reputação:
  - Oportunidade submetida fica ACTIVE por ≥ 24h sem flags: +5 pontos.
  - Rating de plataforma submetido: +1 ponto.
  - Flag correto (oportunidade confirmada como incorreta): +2 pontos.
- Ações que **diminuem** reputação:
  - Oportunidade submetida é rejeitada na moderação: -2 pontos.
  - Oportunidade submetida recebe ≥ 3 flags em < 1h: -5 pontos.
- Reputação mínima = 0 (nunca negativa).
- Usuários com reputação ≥ 50 podem ter oportunidades auto-aprovadas (skip moderação manual).

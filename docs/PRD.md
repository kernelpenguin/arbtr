# Arbeiters — Product Requirements Document (PRD)

**Versão**: 0.1.0-draft
**Data**: 2026-06-16
**Autor**: Equipe Arbeiters
**Status**: Rascunho — Aguardando Revisão

---

## 1. Visão do Produto

### 1.1 Contexto

Na era do crowdsourcing clássico, o Amazon Mechanical Turk (MTurk) era a plataforma dominante. Ferramentas como **Panda Crazy**, **HIT Forker** e **HIT Scraper** surgiram para resolver um problema fundamental: **centralizar, monitorar e capturar oportunidades de trabalho** de forma eficiente. O Panda Crazy, em particular, revolucionou o workflow dos turkers ao automatizar a detecção e aceitação de HITs via um sistema de ciclos rotativos com notificações em tempo real.

A mudança de paradigma é clara: o trabalho dos anônimos agora se dá quase exclusivamente com **LLMs** — RLHF, avaliação de código, red-teaming, anotação multimodal, treinamento de modelos de música, etc. Porém, diferentemente da era MTurk (uma única plataforma), hoje existem **dezenas de plataformas fragmentadas**: Outlier AI, DataAnnotation.tech, Alignerr, Surge AI, Appen/TELUS, Remotasks, Invisible Technologies, Mercor, Toloka, entre outras.

**Nenhuma delas oferece um sistema de notificação em tempo real confiável.** Os trabalhadores são obrigados a monitorar manualmente múltiplos dashboards, frequentemente usando extensões de auto-refresh arriscadas (que podem violar ToS). Este é o gap que Arbeiters preenche.

### 1.2 Declaração do Produto

**Arbeiters** é uma ferramenta que centraliza oportunidades de trabalho com IA/LLM de múltiplas plataformas em um único dashboard, notificando o usuário em tempo real e orientando-o com um sistema de triagem inteligente de perfil — sem jamais bloquear acesso a qualquer tipo de trabalho.

### 1.3 Proposta de Valor

> *"O Panda Crazy da era LLM — mas para todas as plataformas, não apenas uma."*

- **Para trabalhadores multi-plataforma**: Elimina a necessidade de monitorar N dashboards manualmente.
- **Para especialistas**: Filtra trabalho por área de conhecimento, faixa salarial e tipo de posição.
- **Para generalistas**: Descobre oportunidades fora da zona de conforto — se você programa o dia inteiro, talvez queira treinar LLMs de música para variar e ganhar extra.

---

## 2. Público-Alvo

### 2.1 Personas

#### Persona 1: "Ana, a Poliglota de Plataformas"
- Ativa em 4-5 plataformas simultaneamente (Outlier, DataAnnotation, Alignerr, Appen).
- Perde oportunidades porque não consegue monitorar tudo ao mesmo tempo.
- Especialista em coding review, mas aceita tarefas de escrita criativa quando coding está seco.
- **Dor principal**: "Quando finalmente vejo a notificação de email, a tarefa já acabou."

#### Persona 2: "Bruno, o Desenvolvedor de Dia / Annotator de Noite"
- Programador full-time que faz trabalho de anotação/RLHF nas horas vagas.
- Interessa-se por tarefas de coding no Outlier ($40-50/hr) mas também por red-teaming e math/STEM.
- Quer algo rápido e não intrusivo — ver o que tem, pegar, fazer.
- **Dor principal**: "Não quero ficar refreshando 3 abas a noite inteira."

#### Persona 3: "Carla, a Recém-Chegada"
- Acabou de descobrir que pode ganhar dinheiro treinando IAs.
- Não sabe quais plataformas são legítimas nem quais pagam melhor.
- Precisa de orientação sobre onde se cadastrar e quais habilidades desenvolver.
- **Dor principal**: "São tantas plataformas… por onde começo?"

---

## 3. Funcionalidades

### 3.1 Funcionalidades Core (MVP)

#### F1: Catálogo de Plataformas
- Lista curada de plataformas de trabalho com IA/LLM.
- Para cada plataforma: nome, URL, tipo de trabalho disponível, faixa salarial típica, método de qualificação, status (ativa/legacy/invitation-only).
- O usuário seleciona quais plataformas deseja monitorar.

#### F2: Agregador de Oportunidades (o "Panda")
- Dashboard centralizado mostrando oportunidades de trabalho de todas as plataformas selecionadas.
- Cada oportunidade exibe: plataforma de origem, título, categoria, pagamento estimado ($/hr), tipo (tarefa avulsa / batch / projeto longo), área de conhecimento, timestamp.
- Visualização em cards com status codificado por cores (inspirado no Panda Crazy).
- Agrupamento por abas configuráveis (por plataforma, por categoria, por prioridade).

#### F3: Filtros e Busca
- Filtro por **wage/hr** (faixa salarial mínima/máxima).
- Filtro por **tipo de posição**: tarefa avulsa, batch, projeto longo/full position.
- Filtro por **área de conhecimento**: Coding, Creative Writing, Math/STEM, Music/Audio, Red-teaming, Image/Video, Multilingual, General.
- Filtro por **plataforma**.
- Busca textual por título/descrição.
- Filtros combináveis e persistentes (salvos no perfil).

#### F4: Sistema de Notificações
- Notificações via browser (push notifications).
- Alertas sonoros configuráveis (inspirados no Panda Crazy).
- Notificações filtradas: o usuário configura *quais* oportunidades geram alerta (com base nos filtros de F3).
- Indicadores visuais de "novo" e "expirando" nos cards.

#### F5: Perfil do Trabalhador & Triagem Inteligente
- O usuário cadastra: habilidades, experiência, idiomas, áreas de interesse, plataformas ativas.
- O sistema calcula um **match score** entre perfil e oportunidade (0-100%).
- **Regra fundamental: a triagem NUNCA bloqueia.** Tudo é visível, sempre. O match score é recomendação, não barreira.
- "Explorar novos territórios": se o trabalhador só pega coding, o sistema sugere oportunidades fora da bolha (ex: música, escrita criativa) com label tipo "🌱 Algo diferente para você?".
- Histórico de atividade: quais tarefas fez, quanto ganhou (auto-reportado), em quais plataformas.

#### F6: Ratings de Plataformas (à la Turkopticon)
- Trabalhadores avaliam plataformas em: pagamento justo, clareza de instruções, estabilidade da conta, suporte, volume de trabalho.
- Média comunitária visível no catálogo e nos cards de oportunidade.
- Alertas comunitários: "⚠️ Relatos de desativações em massa no Outlier esta semana".

### 3.2 Funcionalidades Futuras (Pós-MVP)

- **F7: Integração Direta com Plataformas** — Scraping/API para detecção automática de oportunidades (com cuidado extremo com ToS).
- **F8: Extensão de Browser** — Monitoramento via extensão Chrome/Firefox, similar ao Panda Crazy Max.
- **F9: Dashboard Financeiro** — Tracking de ganhos por plataforma, projeção mensal, comparativo $/hr real vs. estimado.
- **F10: Marketplace de Scripts/Templates** — Comunidade compartilha templates de prompts, scripts de automação, dicas.
- **F11: Mobile PWA** — Notificações push no celular.
- **F12: API Pública** — Para que a comunidade construa suas próprias integrações.

---

## 4. Categorias de Trabalho (Taxonomia)

A taxonomia é o coração da estrutura de dados do Arbeiters. Baseada na pesquisa de mercado:

```
Trabalho com IA/LLM
├── Coding & Engenharia de Software
│   ├── Code Review / Avaliação de código gerado por IA
│   ├── Geração de código / Pair programming com IA
│   ├── Debugging & Análise de complexidade
│   └── DevOps / Infraestrutura de IA
├── RLHF & Alinhamento
│   ├── Ranking de outputs (preferência humana)
│   ├── Avaliação de qualidade de respostas
│   └── Safety / Red-teaming / Adversarial prompting
├── Escrita & Linguística
│   ├── Escrita criativa (ficção, poesia, argumentação)
│   ├── Avaliação de texto gerado por IA
│   ├── Tradução & Localização
│   └── Classificação de texto / NER / Sentiment
├── STEM & Acadêmico
│   ├── Matemática & Raciocínio lógico
│   ├── Ciências (física, química, biologia)
│   ├── Pesquisa & Fact-checking
│   └── Domínio especializado (médico, jurídico, financeiro)
├── Multimodal & Mídia
│   ├── Imagem (anotação, segmentação, geração)
│   ├── Vídeo (temporal tracking, descrição)
│   ├── Áudio & Fala (transcrição, diarização)
│   └── Música & Acústica (tagging, geração)
├── Prompt Engineering
│   ├── Criação e refinamento de prompts
│   ├── Testing & Benchmarking
│   └── Jailbreaking & Safety testing
└── Avaliação & Busca
    ├── Relevância de busca / Ads
    ├── Avaliação de chatbot / Assistente
    └── Moderação de conteúdo
```

---

## 5. Arquitetura Técnica (Alto Nível)

### 5.1 Stack Proposto

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend** | TypeScript + React (Vite) | Ecossistema maduro, excelente para dashboards interativos |
| **Estilização** | Vanilla CSS (design system próprio) | Controle total, sem dependência de framework CSS |
| **Estado** | Zustand | Leve, sem boilerplate, suporta persistência |
| **Backend** | Node.js + Express | Mesmo ecossistema que o frontend, rápido para MVP |
| **Banco de Dados** | PostgreSQL | Relacional, robusto, suporta JSON para dados flexíveis |
| **ORM** | Prisma | Type-safe, migrations automáticas, excelente DX |
| **Autenticação** | JWT + bcrypt | Simples, stateless |
| **Notificações** | Web Push API + Service Workers | Push notifications nativas do browser |
| **Testes** | Vitest (unit) + Playwright (e2e) | Rápidos, modernos, boa DX |
| **CI/CD** | GitHub Actions | Integração natural com o repositório |

### 5.2 Modelo de Dados (Entidades Principais)

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   User      │────▶│ UserPlatform    │────▶│  Platform    │
│             │     │ (N:M)           │     │              │
│ - id        │     │ - userId        │     │ - id         │
│ - email     │     │ - platformId    │     │ - name       │
│ - name      │     │ - username      │     │ - url        │
│ - skills[]  │     │ - isActive      │     │ - categories │
│ - prefs     │     │ - qualLevel     │     │ - payRange   │
└─────────────┘     └─────────────────┘     │ - status     │
       │                                     └──────────────┘
       │                                            │
       ▼                                            ▼
┌──────────────┐    ┌───────────────────┐   ┌──────────────┐
│ UserProfile  │    │   Opportunity     │──▶│  Category    │
│              │    │                   │   │              │
│ - skills     │    │ - id              │   │ - id         │
│ - languages  │    │ - platformId      │   │ - name       │
│ - interests  │    │ - title           │   │ - parent     │
│ - wageMin    │    │ - description     │   │ - icon       │
│ - posTypes   │    │ - categoryId      │   └──────────────┘
│ - areas      │    │ - wageEstimate    │
└──────────────┘    │ - positionType    │
                    │ - status          │
       │            │ - postedAt        │
       ▼            │ - expiresAt       │
┌──────────────┐    │ - matchScore      │
│ Notification │    └───────────────────┘
│ Preference   │
│              │           │
│ - minWage    │           ▼
│ - categories │    ┌───────────────────┐
│ - platforms  │    │ PlatformRating    │
│ - sound      │    │                   │
│ - pushOn     │    │ - userId          │
└──────────────┘    │ - platformId      │
                    │ - fairPay (1-5)   │
                    │ - clarity (1-5)   │
                    │ - stability (1-5) │
                    │ - support (1-5)   │
                    │ - volume (1-5)    │
                    │ - comment         │
                    └───────────────────┘
```

### 5.3 Fluxo de Dados (MVP)

No MVP, a extração de dados utiliza um modelo de **Scraping Centralizado** com uma frota de workers (Scraper Fleet) que extraem as oportunidades e alimentam o banco de dados central:

```
                    ┌────────────────────────┐
                    │  Plataformas (Fontes)  │
                    └─────────┬──────────────┘
                              │
                    ┌─────────▼──────────────┐
                    │  Scraper Fleet         │
                    │  (N_scrapers = f(Emp)) │
                    │  (Proxies Rotativos)   │
                    └─────────┬──────────────┘
                              │
                              ▼
┌──────────────┐    ┌─────────────────────┐    ┌──────────────┐
│  Desduplicação│───▶│  Opportunity Pool   │───▶│  Match       │
│  (DB Nível)  │    │  (banco central)    │    │  Engine      │
└──────────────┘    └─────────────────────┘    │  (perfil ×   │
                             │                 │   oport.)    │
                             │                 └──────┬───────┘
                             ▼                        │
                    ┌─────────────────────┐           │
                    │  Notification       │◀──────────┘
                    │  Dispatcher         │
                    │  (push + audio)     │
                    └─────────────────────┘
```

---

## 6. Requisitos Não-Funcionais

| Requisito | Especificação |
|---|---|
| **Performance** | Dashboard carrega em < 2s. Filtros aplicam em < 200ms. |
| **Responsividade** | Desktop-first, mas funcional em tablet e mobile. |
| **Acessibilidade** | WCAG 2.1 AA. Navegação por teclado. Suporte a leitor de tela. |
| **Privacidade** | Dados do perfil são do usuário. Exportação completa. Sem venda de dados. |
| **Segurança** | Senhas com bcrypt. JWT com expiração. HTTPS obrigatório. |
| **Disponibilidade** | 99.5% uptime (alvo pós-MVP). |
| **Internacionalização** | Interface inicialmente em PT-BR e EN. Estrutura preparada para i18n. |

---

## 7. Métricas de Sucesso

| Métrica | Alvo MVP (3 meses) |
|---|---|
| Plataformas cadastradas | ≥ 8 |
| Categorias de trabalho mapeadas | ≥ 20 |
| Usuários ativos semanais | ≥ 50 |
| Oportunidades reportadas/semana | ≥ 100 |
| NPS (Net Promoter Score) | ≥ 40 |

---

## 8. Fora de Escopo (MVP)

- Integração com APIs oficiais de plataformas (nenhuma oferece API pública para workers, dependemos da nossa fleet de scrapers).
- Login com a conta real do usuário nas plataformas de destino (o scraping é anônimo/contas dummy para evitar desautenticação do usuário).
- Pagamentos ou intermediação financeira.
- Mobile nativo (PWA é suficiente para MVP).

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Plataformas bloqueiam scraping | Alto | MVP usa crowdsourcing, não scraping |
| Dados de oportunidades desatualizam rápido | Médio | Sistema de expiração automática + reportes comunitários |
| Baixa adoção inicial | Alto | Foco em comunidades Reddit (r/outlier_ai, r/DataAnnotationTech) |
| Usuários inserem dados imprecisos | Médio | Moderação comunitária + sistema de votos |
| Viés no sistema de triagem | Médio | Triagem é recomendação, não bloqueio. Transparência total. |

---

## 10. Roadmap

### Fase 1 — Fundação (Semanas 1-4)
- Setup do projeto (repo, CI, testes, linting).
- Modelo de dados e migrations.
- Autenticação básica (registro/login).
- CRUD de plataformas (seed inicial).
- Taxonomia de categorias (seed inicial).

### Fase 2 — Core (Semanas 5-8)
- CRUD de oportunidades (contribuição comunitária).
- Dashboard agregador com filtros.
- Perfil do trabalhador.
- Match engine (perfil × oportunidade).
- Notificações browser push.

### Fase 3 — Comunidade (Semanas 9-12)
- Ratings de plataformas.
- Sistema de moderação comunitária.
- Alertas comunitários.
- Sugestão "fora da bolha".
- Polish e otimização de UX.

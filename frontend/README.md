# LeadsZ — Frontend

SPA do CRM LeadsZ: leads, funil (stages), timeline, templates de mensagem e equipe.

Produção: https://leadz.thalysdev.com

Documentação de produto: [`../docs/04-frontend.md`](../docs/04-frontend.md).

## Pré-requisitos

- Node.js 20+ (22+ recomendado)
- API local rodando (veja [`../backend/README.md`](../backend/README.md))

## Como rodar

```bash
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

### Variáveis (`.env`)

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | Base da API (ex.: `http://localhost:3001/api`) |
| `VITE_API_VERSION` | Versão do path (ex.: `v0`) |
| `VITE_APP_ENV` | `development` \| `production` |

Badge de ambiente só em `localhost` / `127.0.0.1`:

- `development` (ou ausente) → **DEV**
- `production` → **PROD** (útil ao apontar a API de prod no localhost)
- Deploy em domínio real → sem badge

### Scripts

```bash
npm run build      # build de produção
npm run preview    # preview do build
npm run lint       # ESLint
```

## Stack

| Área | Tecnologia |
| --- | --- |
| UI | React 19, Vite, Tailwind CSS, shadcn/ui |
| Forms | React Hook Form, Zod |
| Estado | Zustand |
| API | Axios, TanStack React Query |
| Rotas | React Router DOM |
| Deploy | Firebase Hosting |

## Estrutura

```
src/
├── pages/          # Telas (auth, dashboard, leads, templates, team, profile)
├── layouts/        # Shell público e autenticado
├── routes/         # map.ts + routes.tsx
├── services/       # Cliente Axios e integrações da API
├── store/          # Zustand (auth, etc.)
├── types/          # Contratos (lead, template, timeline…)
├── components/     # UI shadcn + componentes compartilhados
├── middleware/     # Guards do shell privado
├── lib/            # Utilitários (crm, phone, env…)
└── hooks/          # Hooks reutilizáveis
```

### Rotas principais

| Rota | Tela |
| --- | --- |
| `/login`, `/register` | Auth |
| `/forgot-password`, `/reset-password` | Recuperação |
| `/invite/:token` | Aceitar convite |
| `/app/dashboard` | Dashboard CRM |
| `/app/leads` | Lista (tabela / Kanban) |
| `/app/leads/:id` | Detalhe (timeline, checkpoints, templates) |
| `/app/templates` | Biblioteca de templates |
| `/app/team` | Equipe / convites |
| `/app/profile` | Perfil |

Novas rotas: editar `src/routes/map.ts` e criar a página em `pages/<módulo>/`.

### API

`src/services/api.ts` — Axios com `baseURL` de `VITE_API_URL` + `VITE_API_VERSION`; interceptor adiciona o JWT de `localStorage` (`auth-storage`).

## Documentação

| Doc | Conteúdo |
| --- | --- |
| [docs/04-frontend.md](../docs/04-frontend.md) | Páginas e rotas |
| [docs/00-visao-geral.md](../docs/00-visao-geral.md) | Produto e escopo |
| [README raiz](../README.MD) | Setup do monorepo |

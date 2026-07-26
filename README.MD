# LeadsZ

CRM simples para registrar leads contactados, acompanhar o funil (stages), timeline e templates de mensagem — com geração via Groq.

| Superfície | URL |
| --- | --- |
| Frontend | https://leadz.thalysdev.com |
| API | https://leadz-api.thalysdev.com |

Documentação de produto e arquitetura: [`docs/`](docs/README.md).

## Estrutura

```text
leadsz/
├── backend/     NestJS + TypeORM + PostgreSQL (API)
├── frontend/    React + Vite + Tailwind (SPA)
└── docs/        Documentação canônica do produto
```

Cada pacote tem o próprio `package.json` e dependências. Não há workspace na raiz.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19, Vite, Tailwind, TanStack Query, Zustand |
| Backend | NestJS, TypeORM, Passport JWT, Swagger |
| Banco | PostgreSQL 16 |
| IA | Groq (templates) |
| Deploy | Firebase Hosting (front) + Cloudflare Tunnel (API) |

## Pré-requisitos

- Node.js 20+ (ou Bun)
- Docker (Postgres local via compose do backend)

## Setup rápido

### 1. Banco

```bash
cd backend
cp .env.example .env
docker compose up -d
```

Postgres sobe em `localhost:5433` (mapeado de `5432` no container). Ajuste `DB_*` no `.env` se necessário.

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

- API: `http://localhost:3001/api/v0`
- Swagger: `http://localhost:3001/api/v0`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

## Variáveis de ambiente

### Frontend (`frontend/.env`)

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | Base da API (ex.: `http://localhost:3001/api`) |
| `VITE_API_VERSION` | Versão do path (ex.: `v0`) |
| `VITE_APP_ENV` | `development` \| `production` |

Badge de ambiente (só em `localhost` / `127.0.0.1`):

- `VITE_APP_ENV=development` (ou ausente) → badge **DEV**
- `VITE_APP_ENV=production` → badge **PROD** (útil ao apontar a API de prod no localhost)
- Deploy em domínio real → sem badge

### Backend (`backend/.env`)

Veja [`backend/.env.example`](backend/.env.example). Principais:

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta HTTP (default local: `3001`) |
| `APP_ENV` | `development` \| `production` (espelha o front) |
| `FRONTEND_URL` | URL do SPA (links de convite/e-mail) |
| `CORS_ORIGIN` | Origens permitidas (vírgula se várias) |
| `DB_*` | Conexão PostgreSQL |
| `JWT_SECRET_KEY` | Segredo JWT |
| `FEATURE_SEEDING` | Seed de dados em dev |
| `GROQ_*` | Geração de templates |
| `MAIL_*` | SMTP |
| `CLOUDINARY_*` | Storage de mídia |

## Scripts úteis

**Backend**

| Script | Uso |
| --- | --- |
| `npm run start:dev` | API com watch |
| `npm run build` | Compila para `dist/` |
| `npm run start:prod` | Roda `dist/main` |
| `npm test` | Testes |

**Frontend**

| Script | Uso |
| --- | --- |
| `npm run dev` | Vite em desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |

## Documentação

| Doc | Conteúdo |
| --- | --- |
| [docs/00-visao-geral.md](docs/00-visao-geral.md) | Produto, personas, escopo |
| [docs/01-arquitetura.md](docs/01-arquitetura.md) | Stack e fluxos |
| [docs/03-backend-api.md](docs/03-backend-api.md) | Módulos e endpoints |
| [docs/04-frontend.md](docs/04-frontend.md) | Páginas e rotas |
| [docs/08-deploy-e-dominios.md](docs/08-deploy-e-dominios.md) | Firebase + Tunnel |

Índice completo: [`docs/README.md`](docs/README.md).

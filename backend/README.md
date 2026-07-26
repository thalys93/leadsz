# LeadsZ — Backend

API do CRM LeadsZ: auth multi-tenant, leads, timeline, templates (Groq), e-mail e dashboard.

Produção: https://leadz-api.thalysdev.com

Documentação de produto: [`../docs/03-backend-api.md`](../docs/03-backend-api.md).

## Pré-requisitos

- Node.js 20+ (22+ recomendado)
- Docker (PostgreSQL via `docker compose`)

## Como rodar

```bash
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

Postgres: `localhost:5433` (mapeado de `5432` no container).

- API: `http://localhost:3001/api/v0`
- Swagger: `http://localhost:3001/api/v0`
- Health: `http://localhost:3001/api/v0/system-check`

### Scripts

```bash
npm run build       # compila para dist/
npm run start:prod  # roda dist/main
npm run lint
npm test
npm run test:e2e
```

## Stack

| Área | Tecnologia |
| --- | --- |
| Framework | NestJS 11 |
| Banco | PostgreSQL 16, TypeORM |
| Auth | Passport JWT + Local |
| Docs | Swagger / OpenAPI |
| Mail | Nodemailer + Handlebars |
| Storage | Cloudinary |
| IA | Groq (templates) |
| Validação | class-validator, class-transformer |

## Estrutura

```
src/
├── auth/               # Login, registro, JWT, forgot/reset
├── company/            # Company + convites
├── lead/               # CRUD leads, channels, checkpoints, score
├── timeline/           # Eventos e notas
├── message-template/   # Templates + generate (Groq) + use
├── dashboard/          # Resumo CRM
├── user/               # Perfil e usuários
├── mail/               # SMTP + templates Handlebars
├── storage/            # Assinaturas Cloudinary
├── roles/              # RBAC
├── seeding/            # Seed (FEATURE_SEEDING)
├── security/           # Guards e decorators
├── feature-flags/      # Flags via env (FEATURE_*)
├── config/             # app.config, orm.config
└── main.ts             # Bootstrap, Swagger, CORS
```

Isolamento multi-tenant: queries de domínio filtram por `companyId` do usuário autenticado.

### Variáveis principais

Veja [`.env.example`](.env.example). Destaques:

| Variável | Descrição | Default local |
| --- | --- | --- |
| `PORT` | Porta HTTP | `3001` |
| `APP_ENV` | `development` \| `production` | `development` |
| `API_VERSION` | Prefixo da API | `v0` |
| `FRONTEND_URL` | SPA (links de convite/e-mail) | `http://localhost:5173` |
| `CORS_ORIGIN` | Origens permitidas | — |
| `DB_*` | PostgreSQL | host `localhost`, porta `5433` |
| `JWT_SECRET_KEY` | Segredo JWT | — |
| `FEATURE_SEEDING` | Seed em boot | `true` |
| `GROQ_*` | Geração de templates | — |
| `MAIL_*` | SMTP | — |
| `CLOUDINARY_*` | Storage | — |

### Feature flags

```
FEATURE_SEEDING=true
```

Uso: `FeatureFlagsService.isEnabled('seeding')`.

### Frontend

```
VITE_API_URL=http://localhost:3001/api
VITE_API_VERSION=v0
```

## Documentação

| Doc | Conteúdo |
| --- | --- |
| [docs/03-backend-api.md](../docs/03-backend-api.md) | Módulos e endpoints |
| [docs/01-arquitetura.md](../docs/01-arquitetura.md) | Stack e fluxos |
| [README raiz](../README.MD) | Setup do monorepo |

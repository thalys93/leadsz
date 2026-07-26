# LeadsZ — Backend

API do CRM LeadsZ: auth multi-tenant, leads, timeline, templates (Groq), e-mail e dashboard.

Produção: https://leadz-api.thalysdev.com

Documentação de produto: [`../docs/03-backend-api.md`](../docs/03-backend-api.md).

## Pré-requisitos

- Node.js 20+ (22+ recomendado)
- Docker (PostgreSQL + API via `docker compose`)

## Como rodar

### API no Docker

```bash
cp .env.example .env
docker compose up -d --build
```

Sobe Postgres + API. A API publica `PORT` (padrão `3003`). O compose sobrescreve `DB_HOST` para o serviço do banco.

- Health: http://localhost:3003/api/v0/system-check
- Swagger: http://localhost:3003/api/v0

### API no host (dev)

```bash
cp .env.example .env
docker compose up -d leadsz_db
npm install
# aponte DB_PORT para DB_HOST_PORT (5434) no .env
npm run start:dev
```

### Tunnel (Cloudflare)

A API pública usa o `server-tunnel` do homelab (`n8n/cloudflare/config.yml`):

- Hostname: `leadz-api.thalysdev.com` → `http://localhost:3003`
- DNS: `cloudflared tunnel route dns -f server-tunnel leadz-api.thalysdev.com`
- Depois reinicie: `docker compose -f ../n8n/docker-compose.yml up -d cloudflared`

Não há container de tunnel neste compose — o `homelab-cloudflared` já faz o proxy.

## Variáveis principais

Veja [`.env.example`](.env.example). Destaques:

| Variável | Descrição | Default |
| --- | --- | --- |
| `PORT` | Porta HTTP | `3003` |
| `APP_ENV` | `development` \| `production` | `development` |
| `API_VERSION` | Prefixo da API | `v0` |
| `FRONTEND_URL` | SPA (links de convite/e-mail) | `http://localhost:5173` |
| `CORS_ORIGIN` | Origens permitidas (vírgula) | — |
| `APP_PUBLIC_URL` | URL pública da API | `https://leadz-api.thalysdev.com` |
| `DB_*` | PostgreSQL | — |
| `DB_HOST_PORT` | Porta do Postgres no host | `5434` |
| `JWT_SECRET_KEY` | Segredo JWT | — |
| `FEATURE_SEEDING` | Seed em boot | `true` |
| `GROQ_*` | Geração de templates | — |
| `MAIL_*` | SMTP | — |
| `CLOUDINARY_*` | Storage | — |

**Não commite o arquivo `.env`.**

## Scripts

```bash
npm run start:dev   # desenvolvimento com watch
npm run build
npm run start:prod
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

### Frontend

```
VITE_API_URL=http://localhost:3003/api
VITE_API_VERSION=v0
```

Em produção (Firebase): `VITE_API_URL=https://leadz-api.thalysdev.com/api`

## Documentação

| Doc | Conteúdo |
| --- | --- |
| [docs/03-backend-api.md](../docs/03-backend-api.md) | Módulos e endpoints |
| [docs/01-arquitetura.md](../docs/01-arquitetura.md) | Stack e fluxos |
| [README raiz](../README.MD) | Setup do monorepo |

# Developer onboarding

This guide gets a new developer running the Lyceum Club website and API locally. The project is a Docker-first monorepo: you do **not** need PHP, Composer, MySQL, or Laravel installed on your computer.

## What is in the repository?

| Location | Responsibility |
| --- | --- |
| `apps/web` | React 19, TypeScript, Vite, and Tailwind multi-page website |
| `apps/api` | Laravel 12 API, authentication, user management, email confirmation, and migrations |
| `apps/web/src/data` | Current fixture and JSON content served by the site/API |
| `docs` | Architecture, scope, onboarding, and deployment guidance |
| `docker-compose.yml` | Local web, API, and MySQL environment |

The browser calls the Laravel API under `/api/v1`. The local Docker website is served on port `8080`; the API is served on port `8000`.

## Prerequisites

- Git
- Docker Desktop, running with Linux containers enabled
- Node.js 20+ only if you will run frontend tests/builds outside Docker

Check Docker before continuing:

```powershell
docker --version
docker compose version
```

## First-time setup

Run all commands from the repository root:

```powershell
Set-Location C:\.develop\.projects\web\lyceum-club
```

### 1. Create your local API environment

```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

`apps/api/.env` is local-only and must never be committed.

Edit it and set these values:

```dotenv
APP_ENV=local
APP_DEBUG=true
APP_KEY=
JWT_SECRET_KEY=
CORS_ORIGINS=http://localhost:8080
```

For local Docker development, the database connection uses the bundled `db` service. Docker Compose applies `DB_HOST=db` automatically. Keep the development database values from `.env.example` unless you deliberately use a different local database.

### 2. Generate application secrets

Generate the Laravel application key through Docker:

```powershell
docker compose run --rm --no-deps api php artisan key:generate --show
```

Copy the returned `base64:...` value into `APP_KEY` in `apps/api/.env`.

Generate a JWT secret with PowerShell:

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Copy the result into `JWT_SECRET_KEY` in `apps/api/.env`.

If you are testing account confirmation, also configure the SMTP fields in `.env`. Leave SMTP credentials empty only when you are not testing confirmation email delivery.

### 3. Build and start the stack

```powershell
docker compose up --build -d
docker compose exec api php artisan migrate --force
```

Open these local endpoints:

| Service | Address |
| --- | --- |
| Website | `http://localhost:8080` |
| API health check | `http://localhost:8000/health` |
| Events API example | `http://localhost:8000/api/v1/events` |

Verify the stack:

```powershell
docker compose ps
curl.exe http://localhost:8000/health
curl.exe http://localhost:8000/api/v1/events
```

## Daily development workflow

### Start and stop services

```powershell
docker compose up -d
docker compose down
```

`docker compose down` preserves the local MySQL data volume. To delete all local database data and start clean, run this destructive command:

```powershell
docker compose down -v
```

### View logs

```powershell
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db
```

Use `Ctrl+C` to stop following logs; it does not stop the containers.

### Work on the frontend

Frontend source is in `apps/web`. The Docker `web` service serves a production-style build, so rebuild it after frontend changes:

```powershell
docker compose up --build -d web
```

For fast hot-reload development, use Node.js locally:

```powershell
npm install
npm run dev:web
```

The Vite server runs on `http://localhost:5173`. When using it with the Docker API, set `CORS_ORIGINS=http://localhost:5173,http://localhost:8080` in `apps/api/.env`, then restart the API:

```powershell
docker compose up -d --force-recreate api
```

### Work on the API

API source is in `apps/api`.

- Add route definitions in `apps/api/routes/api.php`.
- Add controllers in `apps/api/app/Http/Controllers`.
- Add models in `apps/api/app/Models`.
- Add database migrations in `apps/api/database/migrations`.
- Keep public API paths under `/api/v1`.

After API code changes, rebuild/restart the API container:

```powershell
docker compose up --build -d api
```

When adding a migration, apply it locally:

```powershell
docker compose exec api php artisan migrate
```

Do not edit a migration that has already been used by another developer or deployed. Create a new migration instead.

### Content data

The public club/event/news/formation/convention content currently resides in `apps/web/src/data`. Docker mounts this directory read-only into the API container, so API content endpoints use the current files without copying them into the image.

The frontend defaults to fixture data. To make it call Laravel, use `apps/web/.env`:

```dotenv
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Rebuild the web container after changing Vite environment variables:

```powershell
docker compose up --build -d web
```

## Testing before a commit

Run the frontend checks:

```powershell
npm run test:web
npm run build:web
```

Run a basic Docker/API smoke test:

```powershell
docker compose ps
curl.exe http://localhost:8000/health
curl.exe http://localhost:8000/api/v1/events
```

Manually verify the website at `http://localhost:8080`, particularly pages or API flows changed by your branch.

The API runtime image intentionally installs production Composer dependencies only. PHPUnit is therefore not available inside that image yet. When API tests are expanded, add a dedicated development/test Docker target rather than adding development dependencies to the production image.

Before pushing, inspect your changes:

```powershell
git status
git diff --check
git diff
```

Never commit `.env`, database dumps, `node_modules`, `vendor`, `dist`, or generated Laravel storage files. The root `.gitignore` excludes them.

## Common problems

### The API image fails during build

Rebuild after pulling the latest project changes:

```powershell
docker compose build --no-cache api
```

The API Dockerfile installs `pdo_mysql` and `mbstring`; a missing-extension error usually means an older cached Dockerfile/image is still in use.

### The browser shows a CORS error

Set `CORS_ORIGINS` to the exact web address you are using, then recreate the API:

```powershell
docker compose up -d --force-recreate api
```

Use `http://localhost:8080` for the Docker website and `http://localhost:5173` for the Vite dev server.

### The API cannot connect to MySQL

Check the database service and API logs:

```powershell
docker compose ps
docker compose logs api
docker compose logs db
```

For Compose, the API must reach the database at `DB_HOST=db`, not `127.0.0.1`.

### You need a clean database

```powershell
docker compose down -v
docker compose up --build -d
docker compose exec api php artisan migrate --force
```

This deletes all local database data.

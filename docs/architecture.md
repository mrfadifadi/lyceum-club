# Architecture and deployment

## Runtime architecture

```text
Browser
  -> apps/web: static React/Vite multi-page site
  -> apps/api: Laravel JSON API at /api/v1
  -> MySQL: users, applications, content-related data
```

`apps/web` is a static multi-page React application. It can run from local content fixtures while the API is being developed, or call Laravel when `VITE_USE_MOCK_DATA=false` and `VITE_API_BASE_URL` are configured.

`apps/api` owns authentication, accounts, email confirmation, authorization, database migrations, and public API endpoints. Public content is currently sourced from the JSON files in `apps/web/src/data` through `CONTENT_DATA_PATH`. This is appropriate for the current static-content workflow. Move content into database tables only when an administrative publishing workflow is required.

## Local containers

`docker-compose.yml` starts three services:

| Service | Purpose | Local address |
| --- | --- | --- |
| `web` | Nginx serving the built frontend | `http://localhost:8080` |
| `api` | Laravel API | `http://localhost:8000` |
| `db` | MySQL 8.0 | `localhost:3306` |

Before starting the stack, create `apps/api/.env` from `.env.example`, use a strong `APP_KEY` and `JWT_SECRET_KEY`, and configure SMTP if confirmation email is enabled. After startup, run `docker compose exec api php artisan migrate --force`.

For local Docker development, Compose mounts `apps/web/src/data` read-only into the API container. This lets Laravel serve the current fixture/JSON content without copying it into the API image.

## Production deployment

1. Build and host `apps/web` as static content behind a CDN or web server with HTTPS.
2. Deploy `apps/api` as a PHP/Laravel service behind HTTPS.
3. Use managed MySQL and run migrations as a controlled release step.
4. Set `CORS_ORIGINS` to the exact public website origin; do not use wildcard origins.
5. Store `APP_KEY`, `JWT_SECRET_KEY`, database credentials, and SMTP credentials in the platform secret manager.
6. Set `APP_ENV=production`, `APP_DEBUG=false`, and a production `APP_URL`.
7. Monitor `/health`, application logs, database health, and failed email delivery.

The supplied Docker files provide a reproducible local image build. They are a starting point for AWS deployment; the preferred production choices are a CDN/static host for the web app, a managed container or PHP runtime for Laravel, and managed MySQL.

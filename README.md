# Lyceum Club

Lyceum Club is a deployable monorepo for a public club website and its Laravel API.

## Applications

- `apps/web` — React 19, TypeScript, Vite, and Tailwind CSS multi-page website.
- `apps/api` — Laravel 12 JSON API, MySQL migrations, authentication, user management, and email confirmation.
- `docs` — architecture, deployment, and project scope documentation.

New contributors should start with [Developer onboarding](docs/developer-onboarding.md).

## Quick start with Docker

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Set a real `APP_KEY`, `JWT_SECRET_KEY`, SMTP configuration, and `CORS_ORIGINS=http://localhost:8080` in `apps/api/.env`.
3. Start the stack:

   ```powershell
   docker compose up --build -d
   docker compose exec api php artisan migrate --force
   ```

The website runs at `http://localhost:8080`; API health is at `http://localhost:8000/health`.

The Docker Compose API container connects to the bundled MySQL service as `db`. The frontend production build is configured to call `http://localhost:8000/api/v1` locally.

## Native development

Frontend:

```powershell
npm install
npm run dev:web
```

API:

```powershell
Set-Location apps/api
Copy-Item .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

## Quality checks

```powershell
npm run test:web
npm run build:web
Set-Location apps/api
composer test
```

Do not commit `.env` files, dependency folders, runtime storage, or production secrets. The root `.gitignore` covers these generated and machine-specific files.

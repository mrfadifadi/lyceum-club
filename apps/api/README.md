# Lyceum Club API

Laravel 12 API for the Lyceum Club website. The API base path is `/api/v1`.

## Requirements

- PHP 8.2+ with `pdo_mysql`, `pdo_sqlite`, `mbstring`, `openssl`, and `json`
- Composer 2
- MySQL 8.0+

## Local setup

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Set `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET_KEY`, and `CORS_ORIGINS` in `.env`. Set a random JWT secret of at least 32 characters. Configure `SMTP_HOST` and `SMTP_FROM_EMAIL` to send confirmation emails. If SMTP login is needed, set both `SMTP_USERNAME` and `SMTP_PASSWORD`; enable exactly one of `SMTP_USE_TLS` or `SMTP_USE_SSL`.

For the Docker Compose stack, use `DB_HOST=db`, then run migrations after the stack starts:

```powershell
docker compose exec api php artisan migrate --force
```

`CONTENT_DATA_PATH` defaults to `../web/src/data`. Use an absolute path only when the frontend data is deployed separately.

## Routes

| Method | Path | Access |
| --- | --- | --- |
| GET | `/club`, `/events`, `/events/{slug}`, `/news`, `/news/{slug}`, `/formations`, `/conventions`, `/conventions/{slug}` | Public |
| POST | `/users` | Register; sends confirmation code |
| POST | `/users/confirmation-code` | Resend confirmation code |
| POST | `/users/confirm` | Confirm email |
| POST | `/login` | Login |
| GET, PATCH | `/users/{userId}` | Account owner or administrator |
| GET, DELETE | `/users` and `/users/{userId}` | Administrator |

Protected endpoints require the bearer token returned by `/login`. Registration creates an inactive account. Confirmation codes expire after 15 minutes and allow five attempts.

## Tests

```powershell
composer test
```

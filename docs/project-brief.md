# Project brief

## Goal

Deliver a public website for Lyceum Club, a persistent MySQL database, a secure Laravel backend, and a deployment path suitable for AWS.

## Current technical stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | PHP 8.2+ and Laravel 12 |
| Database | MySQL 8.0+ |
| API | JSON over `/api/v1` |
| Local environment | Docker Compose |
| Testing | Vitest for web; PHPUnit for API |
| Deployment target | AWS-compatible container/static hosting |

## MVP scope

- Public pages for the club, events, news, formations, conventions, and contact/join information.
- Public content API endpoints.
- User registration, email confirmation, login, role-aware profile access, and administrator-only user management.
- MySQL schema migrations.
- A static frontend production build and containerized local environment.

## Current boundaries and next work

- The frontend reads fixture data by default; turn on Laravel data through `VITE_USE_MOCK_DATA=false` once the API environment is available.
- The Join Us interface validates a CV but does not yet upload or submit it. Define the multipart API contract before connecting this workflow.
- Public content currently lives in frontend JSON files. Introduce a content-management/admin workflow only when editors need to change content without a code release.
- Create the client-specific content, images, contact data, social links, and production environment values before launch.

## Delivery practices

- Keep source changes in Git and review before deployment.
- Keep secrets out of Git; use `.env` only locally and a secret manager in production.
- Run frontend and API tests before releases, then run Laravel migrations as a controlled deployment step.
- Maintain diagrams as the data model and permissions mature: ERD, use-case diagram, API flow, and deployment diagram.

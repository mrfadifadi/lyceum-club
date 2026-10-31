# Lyceum Club web app

React 19 + TypeScript + Vite multi-page website. Each root HTML file is a real page entry; this is not a client-side-router application.

## Commands

From the repository root:

```powershell
npm install
npm run dev:web
npm run test:web
npm run build:web
```

The development site runs at `http://localhost:5173`. The production build is written to `dist/`.

## Structure

```text
apps/web/
  *.html              Multi-page HTML entry points
  src/entries/        React bootstrap module for each page
  src/pages/          Page components
  src/components/     Shared, layout, form, and UI components
  src/data/           Current public content fixtures and JSON files
  src/services/api.ts Data access layer
  src/lib/            Routes, validation, and utilities
  public/             Static assets
```

## API configuration

Copy `.env.example` to `.env` and configure:

```dotenv
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

With `VITE_USE_MOCK_DATA=true` (the default), pages use the local fixtures. With it set to `false`, the content service calls Laravel. Keep all API calls and authentication token handling in `src/services/api.ts`.

## Current limitations

- The Join Us flow validates the form and CV selection but does not yet upload or submit the application. Define and implement the Laravel multipart endpoint before enabling it in production.
- Events, news, formations, conventions, and club details currently use fixture/JSON content. Replace sample entries with approved club content before launch.
- Footer contact and social details must be populated from the final club information.

The frontend is static after `npm run build`; it can be deployed to a CDN or static host. Configure the Laravel API CORS policy with the exact deployed website origin.

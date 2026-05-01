# Shiva Vexarts App

Full-stack artwork storefront built with React, Vite, Hono, tRPC, Drizzle ORM, Neon Postgres, and Vercel Blob.

## Project Structure

```text
api/          Hono backend, tRPC routers, auth/session helpers, server entrypoints
contracts/    Shared constants, errors, and exported schema types
db/           Drizzle schema, relations placeholder, and seed script
public/       Static fallback artwork and hero assets
src/          React frontend, UI components, pages, sections, cart store
```

## Environment

Copy the example file for local development:

```bash
cp .env.local.example .env.local
```

Required variables:

```text
DATABASE_URL
JWT_SECRET
ADMIN_EMAIL
BLOB_READ_WRITE_TOKEN
PUBLIC_ASSET_BASE_URL
VITE_PUBLIC_ASSET_BASE_URL
```

`PUBLIC_ASSET_BASE_URL` and `VITE_PUBLIC_ASSET_BASE_URL` may be left empty to use static files from `public/`.

## Local Development

```bash
npm install
npm run dev
```

Useful database commands:

```bash
npm run db:push
npm run db:seed
```

## Production Build

```bash
npm run check
npm run lint
npm run build
npm start
```

`npm run build` emits both the Vite frontend and a standalone Node server at `dist/server.js`.

## Vercel Deployment

Set these environment variables in the Vercel project dashboard:

```text
DATABASE_URL
JWT_SECRET
ADMIN_EMAIL
BLOB_READ_WRITE_TOKEN
PUBLIC_ASSET_BASE_URL
VITE_PUBLIC_ASSET_BASE_URL
```

Vercel uses `api/index.ts` as the serverless adapter, which imports the same Hono app used locally. The rewrite in `vercel.json` sends `/api/*` requests to that adapter and all other routes to the SPA.

After deployment, verify:

```text
/api/health
/api/config-check
```

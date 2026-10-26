# Housekeeping

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Archived.** This project is no longer maintained. It's published as a
> template you can copy and run yourself.

A small, login-gated admin panel for
[personal-dashboard](https://github.com/lucas-gundehug/personal-dashboard).
It edits the dashboard's workout history and progression directly in its
database, changes the dashboard's login code, and checks that the dashboard
is up. Without a personal-dashboard of your own, only the login, the
passphrase change and the changelog do anything.

## Features

Left-nav sections (`src/components/app-shell.tsx`):

- **Overview** (`/`) — landing page.
- **Training** (`/training`) — this week's sessions and ratings, each
  exercise's progression step (set it by hand), and "reset this week".
  The plan itself is still edited on the dashboard's `/workout-edit` page.
- **Health** (`/health`) — pings the dashboard's `/api/public/health`.
- **Admin** (`/admin`) — change this app's own passphrase and the
  dashboard's 4-digit access code.
- **Changelog** (`/changelog`) — the audit log: which admin change was made
  and when.

## Stack

[TanStack Start](https://tanstack.com/start) (React 19, file-based routing,
SSR) + [Vite](https://vitejs.dev) + [Tailwind CSS v4](https://tailwindcss.com),
made to deploy on [Vercel](https://vercel.com) (Nitro's `vercel` preset).
Package management with [Bun](https://bun.sh).

## Auth

Gated by a single real passphrase (not a 4-digit PIN) — see
[src/lib/auth.ts](src/lib/auth.ts). This tool holds service-role
(RLS-bypassing) access to the dashboard's database, so both
`HOUSEKEEPING_PASSPHRASE` and `HOUSEKEEPING_TOKEN_SECRET` are required with
no insecure fallback.

## Setup

1. Set up [personal-dashboard](https://github.com/lucas-gundehug/personal-dashboard)
   first, including its database (`supabase/schema.sql` in that repo).
2. Install and run this app:

   ```bash
   bun install
   cp .env.example .env.local   # fill in the values, see below
   bun run dev
   ```

   The site runs on `http://localhost:8080`.

3. Fill in `.env.local` (and later the same variables in Vercel's project
   settings):
   - `HOUSEKEEPING_PASSPHRASE`, `HOUSEKEEPING_TOKEN_SECRET` — required.
   - `PERSONAL_DASHBOARD_SUPABASE_URL`,
     `PERSONAL_DASHBOARD_SUPABASE_SERVICE_ROLE_KEY` — the same values as
     the dashboard's `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`; needed for
     Training.
   - `PERSONAL_DASHBOARD_BASE_URL` — the dashboard's address, e.g.
     `https://example.com`; needed for Health and the access-code change.
   - `PERSONAL_DASHBOARD_SERVICE_SECRET` — a long random value; set the
     same value as `HOUSEKEEPING_SERVICE_SECRET` on the dashboard. Needed for
     the access-code change.
   - `KV_REST_API_URL` / `KV_REST_API_TOKEN` — optional Upstash Redis, so a
     changed passphrase and the audit log survive restarts.

4. Deploy: import the repo in Vercel and add the same variables.

Checks: `bun run lint && bun run typecheck && bun run test && bun run build`.

## License

MIT — see [LICENSE](LICENSE).

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Purpose & Architecture

- **Purpose:** `MuseumPass` (`museum-seat-scout`) is a browser-persisted museum catalog and visit-slot booking web application built with React, TypeScript, TanStack Start/Router, and Vite, with no real user accounts, secrets, or paid external services.
- **Architecture:**
  - Booking rules (ticket limits, seat math, validation, filters) live as pure functions in `src/lib/museum/booking.ts` with tests beside them; UI only calls them. Why: one tested source of truth for seat availability.
  - Bookings are client-side state (`src/lib/museum/store.tsx`, React context + reducer) persisted to the visitor's browser storage; museum seed data is static in `src/lib/museum/catalog.ts`. Why: the user chose a browser-only demo with no backend or accounts.
  - Render-visible time ("now", today's date list) is read only after hydration via `useNow()`. Why: avoids server/browser markup mismatch.
  - Routes, components, and tests live under `src/routes/`, `src/components/`, and `src/test/`.

## Setup & Safe Commands

- **Setup:** Install dependencies in the repository root with `npm install`.
- **Safe verification commands:**
  - Run tests: `npm test` (`vitest run`)
  - Type check: `npx tsc --noEmit`
  - Production build: `npm run build` (`vite build`)
- **Lint & formatting caution:** `npm run lint` (`eslint .`) currently reports baseline formatting/lint issues; do not run `npm run format` (`prettier --write .`) or bulk lint auto-fixes across the repository without explicit approval and review.

## Coding Conventions & Test Expectations

- Keep changes scoped to the requested task; do not touch unrelated files or generated artifacts unless required.
- Preserve existing acceptance criteria (catalog browsing/filtering, booking validation, overbooking prevention, and booking retrieval/cancellation with seat restoration).
- Run `npm test` and `npx tsc --noEmit` (and `npm run build` when appropriate) after code changes and verify no regressions were introduced.
- If an external/web assistant does not automatically load `AGENTS.md` from disk, explicitly state and enforce these rules during the session.

## Forbidden Actions

- **No secrets or real PII:** Never commit, print, or hardcode API keys, tokens, credentials, `.env` secrets, or real personal data.
- **No production deployments:** Never run production deploy commands (such as `npx nitro deploy` or platform deploys) or modify deployment targets without explicit permission.
- **No destructive commands:** Never delete files/directories, drop data, reset uncommitted local changes (`git reset --hard`, `git checkout -- .`), force-push, or rewrite published git history.
- **No unapproved dependency changes:** Never add, remove, or upgrade packages in `package.json` or lockfiles without explicit approval.
# Handoff: la-balance-admin

Primary orientation doc for a fresh Claude Code session on this repo. Everything
below was derived by reading the code on branch `claude/handoff-documentation-19ofc6`
(identical to `main` at the time of writing). Anything not verifiable from the repo
is marked **UNKNOWN** rather than guessed — fill those in, don't assume.

## What this project is

A Next.js 14 (App Router) **kitchen dashboard** for restaurant pickup orders. Staff
open one page and move each order through five states. A separate customer-facing app
(not in this repo) posts orders in over CORS.

- GitHub repo: `jmdm815/la-balance-admin`
- Package name: `restaurant-admin-app`, version `1.5.0`
- Live URL: **UNKNOWN** — not recorded anywhere in the repo
- Hosting: **UNKNOWN** — no `vercel.json`, no CI config, no deploy scripts are committed.
  The `ALLOWED_ORIGIN` example in the README points at a `*.vercel.app` domain, which
  suggests Vercel, but nothing in the repo confirms the project/team or that it is deployed.
- Admin login: **there is none.** See "Security notes" below — this is not an oversight
  in the docs, the app genuinely has no authentication.

## Getting started

```bash
git clone https://github.com/jmdm815/la-balance-admin.git
cd la-balance-admin
npm install

# Required — the app throws at import time without these (Redis.fromEnv()).
cat > .env.local <<'ENV'
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
ALLOWED_ORIGIN=https://your-customer-app.vercel.app
ENV

npm run dev     # http://localhost:3000
npm run build   # production build / typecheck
```

There is no test suite, no linter config, and no `npm start`-able build committed.
`npm run build` is the only real verification gate — run it before pushing.

## Architecture

Six source files. The whole app is:

```
app/layout.tsx          Root layout: header, logo, global CSS import
app/page.tsx            The entire UI — one client component
app/api/orders/route.ts The entire API — GET/POST/PATCH/DELETE/OPTIONS
lib/redis.ts            Upstash client, types, and the two storage helpers
app/globals.css         All styling (hand-written CSS, no framework)
public/logo.svg         Header logo
```

**Data model** (`lib/redis.ts`):

```ts
type OrderStatus = "new" | "preparing" | "ready" | "picked_up" | "cancelled";
type OrderItem   = { name, price, quantity, instructions? };
type Order       = { id, customerName, phone, pickupType, items, status, placedAt };
```

`pickupType` is `"in-store" | "drive-through"`. IDs come from `buildOrderId()`:
`ORD-` plus the last 6 digits of `Date.now()`.

**Storage.** Every order lives in a *single* Redis key, `restaurant:orders`, holding the
whole array. `getOrders()` reads it, `saveOrders()` overwrites it. There is no per-order
key and no index.

**API** (`app/api/orders/route.ts`) — all five handlers operate on that one key:

| Method | Body | Effect |
| --- | --- | --- |
| `GET` | — | Returns the full order array |
| `POST` | `{customerName, phone, pickupType, items}` | Creates an order, `status: "new"`, `unshift`ed to the front |
| `PATCH` | `{id, status}` | Sets that order's status; 404 if the id is unknown |
| `DELETE` | `{id}` | Filters the order out; always returns success |
| `OPTIONS` | — | CORS preflight, 204 |

Note `DELETE` takes a **JSON body**, which is unusual and trips up some clients.

**UI** (`app/page.tsx`). One client component. Fetches `/api/orders` once on mount
(`cache: "no-store"`), groups orders by status into the five sections in
`sectionOrder`, sorts newest-first by `placedAt`. Each card shows a computed total
(`Σ price × quantity`), five status buttons, and a delete button. Every mutation
re-fetches the whole list.

## Known issues and rough edges

These are real, currently in `main`, and worth knowing before you change anything:

1. **No authentication anywhere.** `/api/orders` is fully open — anyone who finds the
   URL can read every customer's name and phone number, and can create, re-status,
   or delete orders. This is the single biggest thing to fix before real use.
2. **CORS is effectively open to one hard-coded origin, and the check is dead code.**
   In `corsHeaders()`, the expression
   `requestOrigin === allowedOrigin ? allowedOrigin : allowedOrigin` returns the same
   value on both branches, so `requestOrigin` is never actually used. And
   `ALLOWED_ORIGIN` defaults to `"*"` when unset. It behaves as intended only because
   the browser compares the echoed origin itself — but the conditional should be
   simplified or made real.
3. **Read-modify-write race.** `POST`/`PATCH`/`DELETE` each read the entire array,
   mutate it in memory, and write it back. Two concurrent requests will lose one of the
   writes. Fine for one kitchen tablet; not fine under load. Per-order keys or a Lua/
   transaction would fix it.
4. **No polling or realtime.** The dashboard loads once on mount. New orders do not
   appear until a manual refresh or a mutation triggers `loadOrders()`. A `setInterval`
   poll is the obvious small fix.
5. **No delete confirmation.** "Delete order" fires immediately, no undo.
6. **`DELETE` never 404s** — deleting an unknown id reports success.
7. **No `.gitignore` and no lockfile committed.** `node_modules/` and `.next/` are
   untracked only by luck; a lockfile would make installs reproducible.
8. **Git history is three "Add files via upload" commits** made through the GitHub web
   UI. There is no meaningful commit history to bisect, and no prior local dev setup.

## Suggested next steps

Roughly in priority order:

1. Put auth in front of the dashboard and the mutating API methods.
2. Add `.gitignore` and commit `package-lock.json`.
3. Add polling (or SSE) so the dashboard updates without a refresh.
4. Clean up the dead conditional in `corsHeaders()`.
5. Move to per-order Redis keys if more than one device will ever write concurrently.
6. Add a confirm step on delete.

## Conventions

- TypeScript `strict: true`. Path alias `@/*` maps to the repo root (`@/lib/redis`).
- No CSS framework — extend `app/globals.css` and use the existing class names
  (`order-card`, `status-pill status-<status>`, `primary-button`, `secondary-button`,
  `danger-button`, `compact`, `muted`).
- Status values are `snake_case` in data (`picked_up`) and title-case in the `labels`
  map for display. Adding a status means touching `OrderStatus` in **both**
  `lib/redis.ts` and `app/page.tsx` (the type is duplicated, not imported), plus
  `labels`, `sectionOrder`, and a `.status-<name>` CSS rule.

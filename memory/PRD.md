# Seed Fund Portfolio Explorer — PRD

## Original Problem Statement
Build a modern, responsive React dashboard over the Startup India Seed Fund Portfolio API
(`https://seedfundapi.startupindia.gov.in:3535/api/portfoliofilter`) with global search,
range sliders + multi-select filters, glass/soft-shadow card grid, detail modal with tabs,
dark/light theme, infinite scroll, sort, reset, total-results counter, skeletons, empty
state — premium SaaS look (Stripe / Notion).

## Architecture (current — post Vite + Node migration, Feb 2026)
- **Backend** — Node.js / Express (`/app/backend/server.js`), runs on `0.0.0.0:8001`.
  - `package.json` (deps: express, axios, cors, morgan, dotenv)
  - Endpoints: `GET /api/`, `/api/portfolio`, `/api/portfolio/facets`, `/api/portfolio/refresh`
  - 10-min in-memory cache; `axios` + `https.Agent({ rejectUnauthorized:false })` for upstream
  - Supervisor command updated to `node server.js`
- **Frontend** — React 18 + **Vite 5** (replaces CRA), runs on `0.0.0.0:3000`.
  - `vite.config.js` — `@` alias to `/src`, `server.proxy['/api']` → `localhost:8001`
    (override via `VITE_PROXY_TARGET` for upstream-direct dev)
  - `index.html` at project root (Vite convention) + `src/main.jsx` entry
  - HMR on `clientPort: 443` for the Emergent HTTPS preview
  - PostCSS / Tailwind configs renamed to `.cjs` (because `package.json` is `type:module`)
  - All API calls use `import.meta.env.VITE_BACKEND_URL`
- **Backed-up Python files**: `server.py.bak`, `requirements.txt.bak` (kept for reference).

## Design System (per `/app/design_guidelines.json`)
- Archetype 4 — Swiss / High-Contrast, light theme default
- Fonts: Chivo (headings), IBM Plex Sans (body), IBM Plex Mono (mono/numerics)
- Palette: deep indigo `#1E3A8A`, saffron `#EA580C` accent, success green
- Card-lift hover (`-translate-y` + soft shadow), sticky glass header, grid-fade hero

## Implemented (Feb 2026)
- ✅ Backend proxy + normalisation + facets endpoint (originally Python, now **Node/Express**)
- ✅ Sticky search header with global debounced search
- ✅ Filter sidebar: 4 multi-selects + 4 dual-thumb range sliders
- ✅ Sort dropdown (5 options)
- ✅ Card grid (1/2/3/4 cols), hover lift, lazy images, fallback initials
- ✅ Detail modal with 3 tabs (Basic / Financial / Metadata)
- ✅ Skeleton loading, empty state with reset
- ✅ Light/dark theme toggle (localStorage)
- ✅ Infinite scroll via `IntersectionObserver`
- ✅ Reset Filters (sidebar + inline + empty-state)
- ✅ Total results counter
- ✅ INR Lakh/Crore formatter (handles negatives)
- ✅ **Toolchain migration**: CRA → Vite, FastAPI/Python → Express/Node.js

## Test Status
Iteration_1 (pre-migration): Backend 100% (4/4 pytest), Frontend 100%.
Post-migration verification: live preview confirmed — counter 193, search "Goa"→5 cards,
theme toggle, modal tabs, infinite scroll all working.

## Backlog / Next
- P1: Pre-migration code-review note about `requests.post` blocking is now obsolete; Node's
  axios is non-blocking on event loop already. ✓
- P2: Persist filter state in URL params for shareable views.
- P2: Export filtered list to CSV.
- P2: State-level choropleth map view.
- P3: "Compare" mode (up to 3 incubators side-by-side).

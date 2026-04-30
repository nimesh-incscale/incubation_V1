# Seed Fund Portfolio Explorer — PRD

## Original Problem Statement
Build a modern, responsive React dashboard over the Startup India Seed Fund Portfolio API
(`https://seedfundapi.startupindia.gov.in:3535/api/portfoliofilter`) with:
global search, range sliders + multi-select filters, glass/soft-shadow card grid, detail modal
with tabs, dark/light theme, infinite scroll, sort, reset, total-results counter, skeletons,
empty state — premium SaaS look (Stripe / Notion).

## Architecture
- **Backend** — FastAPI (`/app/backend/server.py`). Proxies + normalises upstream JSON, exposes:
  - `GET /api/portfolio` — full normalised list (`{count, data[]}`)
  - `GET /api/portfolio/facets` — distinct values + numeric ranges for filter UI
  - `GET /api/portfolio/refresh` — bust cache
  - 10-min in-memory cache; `requests` with `verify=False` (upstream uses self-signed chain)
- **Frontend** — React (CRA) + Tailwind + shadcn/ui + lucide-react.
  - `pages/Dashboard.jsx` — orchestrates state, infinite scroll, sort, search, filters
  - `components/`: PortfolioCard, PortfolioCardSkeleton, FilterSidebar, MultiSelect, DetailModal,
    ThemeToggle, EmptyState
  - `context/ThemeContext.jsx` — light/dark, localStorage persisted (light default)
  - `lib/format.js` — INR Lakh/Crore formatter with negatives support
  - `hooks/useDebounce.js`

## Design System (per `/app/design_guidelines.json`)
- Archetype 4 — Swiss / High-Contrast, light theme default
- Fonts: Chivo (headings), IBM Plex Sans (body), IBM Plex Mono (mono/numerics)
- Palette: deep indigo `#1E3A8A`, saffron `#EA580C` accent, success green
- Card-lift hover (`-translate-y` + soft shadow), sticky glass header, grid-fade hero

## Implemented (Feb 2026)
- ✅ Backend proxy + normalisation + facets endpoint
- ✅ Sticky search header with global debounced search (incubator/sector/city/state)
- ✅ Filter sidebar: 4 multi-selects + 4 dual-thumb range sliders
- ✅ Sort dropdown (5 options) with mobile + desktop variants
- ✅ Card grid (1/2/3/4 cols), glass-feel cards, hover lift, lazy images, fallback initials
- ✅ Detail modal with 3 tabs (Basic / Financial / Metadata) + structured KV display
- ✅ Skeleton loading state, "No portfolios found" empty state with reset
- ✅ Light/dark theme toggle (localStorage)
- ✅ Infinite scroll via `IntersectionObserver` + end-of-list marker
- ✅ Reset Filters (sidebar + inline + empty-state)
- ✅ Total results counter (`X of Y incubators`)
- ✅ INR Lakh/Crore formatter (handles negative over-allocations)

## Test Status (iteration_1)
Backend 100% (4/4 pytest), Frontend 100% (search, sort, filters, sliders, reset, modal tabs,
theme toggle, infinite scroll, empty state). Two minor design issues raised + fixed in same
iteration (counter spacing + negative-amount formatting).

## Backlog / Next
- P1: Replace blocking `requests.post` with `httpx.AsyncClient` to avoid event-loop block
- P2: Persist user filter state in URL params for shareable views
- P2: Export filtered list to CSV
- P2: Map view (state-level choropleth) for spatial discovery
- P3: Add a "Compare" mode (select up to 3 incubators side-by-side)

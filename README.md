# Startup India · Seed Fund Portfolio Explorer

A premium SaaS-style dashboard over the public **Startup India Seed Fund** API,
built end-to-end with **Node.js + Express** on the backend and **React + Vite**
on the frontend.

> Live data source: `https://seedfundapi.startupindia.gov.in:3535/api/portfoliofilter`
> (193 government-recognised incubators, 26 states, 238 sectors, ~₹500 Cr in approved grants).

---

## ✨ Features

- **Global search** across incubator name, sectors, city and state (debounced).
- **Advanced filters**: 4 multi-select facets (incubator, sector, state, city) +
  4 dual-thumb range sliders (first approved / re-apply approved / total
  remaining / grant remaining).
- **Card grid** with logos, lazy-loaded images, fallback initials, hover lift,
  glassmorphism feel.
- **Detail modal** with three tabs — Basic Info · Financial · Metadata.
- **Sorting** (5 options) and **infinite scroll**.
- **Light / dark theme** toggle (persisted in `localStorage`, light is default).
- **Shareable URL filters** — every filter, search query and sort choice is
  serialized into the URL so users can deep-link.
- **CSV export** of the current filtered view.
- **Skeletons** while loading and a friendly **empty state** with reset.
- Mobile-first responsive layout.

---

## 🧱 Architecture

```
.
├── backend/                    # Node.js + Express API
│   ├── server.js               # Bootstrap (env + listen)
│   └── src/
│       ├── app.js              # Express app factory
│       ├── routes/portfolio.js
│       ├── controllers/portfolio.js
│       ├── services/
│       │   ├── upstream.js     # Upstream fetch + normalisation
│       │   └── facets.js       # Distinct values + ranges
│       └── utils/cache.js      # TTL in-memory cache
│
└── frontend/                   # React + Vite SPA
    ├── index.html              # Vite entry HTML
    ├── vite.config.js          # @ alias, dev proxy, HMR config
    └── src/
        ├── main.jsx            # ReactDOM bootstrap
        ├── App.jsx             # Router + ThemeProvider + Toaster
        ├── pages/Dashboard.jsx # Main dashboard
        ├── components/         # PortfolioCard, FilterSidebar, MultiSelect,
        │                       # DetailModal, ThemeToggle, EmptyState, etc.
        ├── components/ui/      # shadcn/ui primitives
        ├── context/ThemeContext.jsx
        ├── hooks/useDebounce.js
        └── lib/
            ├── format.js       # INR Lakh/Crore formatter
            ├── csv.js          # RFC-4180 CSV export
            ├── urlState.js     # URL ⇄ filter-state serializer
            └── utils.js        # cn() helper
```

---

## 🚀 Getting Started

### 1. Backend

```bash
cd backend
yarn install
yarn start              # → http://localhost:8001
```

Environment (`backend/.env` — already provided):

```
MONGO_URL=...           # reserved (template parity, not currently used)
DB_NAME=...
CORS_ORIGINS=*
PORT=8001
HOST=0.0.0.0
```

#### REST endpoints (all under `/api`)

| Method | Path                       | Purpose                                       |
| ------ | -------------------------- | --------------------------------------------- |
| GET    | `/api/`                    | Health + cache info                           |
| GET    | `/api/portfolio`           | Full normalised list `{count, data[]}`        |
| GET    | `/api/portfolio/facets`    | Filter facets (states/cities/incubators/sectors) + numeric ranges |
| GET    | `/api/portfolio/refresh`   | Bust cache and refetch upstream               |

The upstream uses a non-standard SSL chain — the proxy handles that
transparently with a permissive `https.Agent`. A 10-minute in-memory cache
sits in front of the upstream; if upstream fails we **gracefully serve the
last good snapshot** instead of a 502.

### 2. Frontend

```bash
cd frontend
yarn install
yarn dev                # → http://localhost:3000
```

Environment (`frontend/.env`):

```
VITE_BACKEND_URL=https://your-backend-host          # leave empty to use Vite's dev proxy
# Optional — override the dev proxy target (defaults to http://localhost:8001)
# VITE_PROXY_TARGET=http://localhost:8001
```

**Frontend-only mode**: leave `VITE_BACKEND_URL` empty and Vite's
`server.proxy['/api']` will forward calls to whatever you set as
`VITE_PROXY_TARGET` (a local backend, or even the upstream API directly).

#### Build for production

```bash
cd frontend
yarn build              # → frontend/dist
yarn preview            # local static preview
```

---

## 🧰 Tech Stack

| Layer       | Library                                  |
| ----------- | ---------------------------------------- |
| Backend     | Node.js 18+, Express 4, axios, cors, morgan, dotenv |
| Frontend    | React 18, Vite 5, react-router-dom 6     |
| Styling     | Tailwind CSS, shadcn/ui, lucide-react    |
| Forms/UI    | radix-ui primitives, sonner (toasts), cmdk |
| Fonts       | Chivo · IBM Plex Sans · IBM Plex Mono    |

---

## 🎨 Design System

Swiss / High-Contrast aesthetic — authoritative, financial-data feel.

| Token                | Light            | Dark             |
| -------------------- | ---------------- | ---------------- |
| Background           | `#F8F9FA`        | `#020617`        |
| Surface              | `#FFFFFF`        | `#0F172A`        |
| Primary (deep indigo)| `#1E3A8A`        | `#3B82F6`        |
| Accent (saffron)     | `#EA580C`        | `#F97316`        |
| Success (green)      | `#15803D`        | `#22C55E`        |

Card hover lifts (`-translate-y-1`) and casts a diffuse primary-tinted shadow.

---

## 🔗 Shareable URLs

Filter state lives in the URL. Examples:

```
/?q=Goa
/?st=Karnataka%7CKerala&sec=Agri-Tech%7CClean%20Tech
/?sort=eval_desc&r_totalGrantremainingAmount=1000000,20000000
```

Open any link → the dashboard re-hydrates with the same filters / sort.

---

## 📤 CSV Export

Click the **Export** button in the header to download the current filtered
list as a UTF-8 CSV (Excel-compatible, BOM-prefixed, RFC-4180-quoted).
Columns: ID, Incubator Name, City, State, Sectors, all four amount fields,
Evaluation.

---

## 📜 License

Educational / portfolio project. Data is a **public dataset** from the
Government of India's Startup India Seed Fund Scheme.

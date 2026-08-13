# CAP Cut-off Finder — Maharashtra Engineering Admissions 2026

A fast, modern web app for browsing **Maharashtra Engineering CAP Round 1 cut-off data** and the **Provisional/Final Merit List 2026** for the MHT-CET PCM stream. Search 368 colleges and 2134 branches by code or name, view category-wise opening/closing ranks and percentiles, and look up any of **229,359 candidates** by rank, percentile, or name — all in a clean, mobile-first UI.

> Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, and SQLite (better-sqlite3).

---

## Table of Contents

- [Features](#features)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Data Sources](#data-sources)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Search Modes](#search-modes)
- [URL Deep Linking](#url-deep-linking)
- [Performance & Memory Notes](#performance--memory-notes)
- [Rebuilding the Data](#rebuilding-the-data)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Two powerful search tabs

**1. Colleges tab — CAP Round 1 cut-offs**
- Browse all 368 engineering colleges across Maharashtra.
- Search by college name (e.g. "COEP", "VJTI", "Government College") or 5-digit code (e.g. "01002").
- Click any college to see all its branches (e.g. Computer Engineering, Mechanical, AI&DS, etc.).
- For each branch, view category-wise CAP Round 1 cut-offs: opening/closing ranks **and** percentiles for Open, OBC, SC, ST, NT-A/B/C/D, EWS, VJ/DT, SBC, SEBC, etc.
- Search-as-you-type with debounced dropdown (250 ms), keyboard navigation (↑ ↓ Enter Esc).

**2. Provisional Merit List tab — search 229,359 candidates**
- **By Rank** — enter merit number (1 to 229,563); returns the matched student plus 5 neighbors above and below for context.
- **By Percentile** — type a prefix like `99.89` or a full value like `99.8987775`. Returns **all** matching students (no artificial 50-row cap). Example: `63.0034130` returns 398 tied students.
- **By Name** — token-order-independent name search. `WANKHEDE ADITYA SATISH`, `ADITYA WANKHEDE`, and `SATISH WANKHEDE` all resolve to the same candidates. Tokens are matched as substrings of the candidate's name tokens, case-insensitive.
- **Auto** mode (default) — automatically picks the right search type based on the query:
  - Pure digits (no dot) → rank search
  - Contains letters → name search
  - Decimal number → percentile search
- Click any result to open a detail page showing all 19 fields: merit percentile, MHT-CET PCM percentiles, HSC marks (PCM + total), SSC marks (total + math + science + English), category, gender, minority status, and Yes-counts.

### UI/UX polish
- Mobile-first responsive layout with adaptive grid.
- Hash-based deep linking — share URLs like `#01002` (college code) or `#s123` (student rank).
- Sticky dropdown header showing total matches and "showing first N" warnings when truncated.
- Example chips for common queries (one-click fill).
- Emerald accent color, smooth transitions, dark-mode-ready components.
- Anonymous telemetry-free (no analytics, no tracking).

---

## Live Demo

After starting the dev or production server, open:

```
http://localhost:3000
```

---

## Tech Stack

| Layer            | Choice                                              | Notes |
|------------------|-----------------------------------------------------|-------|
| Framework        | **Next.js 16.1** (App Router, Turbopack)            | API routes + page in one app |
| UI Library       | **React 19**                                        | Server + Client Components |
| Language         | **TypeScript 5**                                    | Strict mode |
| Styling          | **Tailwind CSS v4** + **shadcn/ui**                 | Custom emerald accent |
| Icons            | **lucide-react**                                    | Tree-shaken |
| Database         | **SQLite** via **better-sqlite3**                   | Read-only, 45.6 MB, 229,359 rows |
| PDF Parsing      | **pdftotext** + Python                              | Build-time only |
| Package Manager  | **Bun** (or npm)                                    | `bun.lock` committed |
| Deployment       | **Vercel** (or any Node host)                       | See [Deployment](#maharastra-colleges-list.vercel.app) |

---

## Data Sources

Both datasets are derived from official State CET Cell, Maharashtra publications for the 2026-27 admission cycle.

| File                                | Source PDF                                  | Records        | Use |
|-------------------------------------|---------------------------------------------|----------------|-----|
| `src/data/colleges.json` (3.0 MB)   | `CAP 1 MH.pdf` (1,566 pages)                | 368 colleges / 2134 branches | College cut-off search |
| `src/data/students.db` (45.6 MB)    | `FE2026_PCMMH_MeritList_Final.pdf` (68 MB)  | 229,359 candidates | Rank / percentile / name search |
| `src/data/students.json` (40 MB)    | (same as above)                             | 229,359 candidates | Source-of-truth backup |
| `src/data/students-slim.json` (16 MB) | (same as above)                           | 229,359 candidates | Slim 6-field variant for embedded use |

The student schema (19 fields per candidate):

```
merit_no, app_id, name, category, gender, yes_count, minority,
merit_percentile, math_percentile, physics_percentile, chemistry_percentile,
hsc_pcm, hsc_math, hsc_physics, hsc_total,
ssc_total, ssc_math, ssc_science, ssc_english
```

---

## Project Structure

```
cap-cutoff-finder/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (metadata, fonts)
│   │   ├── page.tsx                    # Main page (tabs + hash routing)
│   │   ├── globals.css                 # Tailwind + global styles
│   │   ├── icon.svg                    # Favicon (SVG)
│   │   ├── apple-icon.png              # iOS icon
│   │   └── api/
│   │       ├── route.ts                # /api health check
│   │       ├── colleges/route.ts       # GET /api/colleges?q=
│   │       ├── college/[code]/route.ts # GET /api/college/[code]
│   │       ├── students/route.ts       # GET /api/students?q=&mode=&limit=
│   │       └── student/[rank]/route.ts # GET /api/student/[rank]
│   ├── components/
│   │   ├── college-search.tsx          # College search input + dropdown
│   │   ├── college-detail.tsx          # College detail view
│   │   ├── cut-off-table.tsx           # Category-wise cut-off table
│   │   ├── student-search.tsx          # Student search input + dropdown
│   │   ├── student-detail.tsx          # Student detail view (19 fields)
│   │   ├── logo.tsx                    # Logo + wordmark
│   │   ├── brutal-tools-badge.tsx      # Developer credit pill
│   │   └── ui/                         # shadcn/ui primitives (40+ files)
│   ├── lib/
│   │   ├── students.ts                 # SQLite access layer (search + detail)
│   │   ├── colleges.ts                 # College data accessors
│   │   ├── db.ts                       # Prisma client (if used)
│   │   └── utils.ts                    # cn() helper
│   └── data/
│       ├── colleges.json               # 3 MB — college cut-offs
│       ├── students.db                 # 45.6 MB — SQLite (runtime)
│       ├── students.json               # 40 MB — full backup
│       └── students-slim.json          # 16 MB — slim variant
├── scripts/
│   ├── build_students_db.py            # PDF → students.db + students.json
│   ├── build_students_final.py         # PDF → students.json + students-slim.json
│   ├── extract_pdf.py                  # CAP 1 MH.pdf → colleges.json
│   ├── parse_merit.py                  # Merit list parsing experiments
│   ├── parse_text.py                   # Text parsing utilities
│   └── compact_students.py             # JSON size optimizer
├── public/                             # Static assets
├── prisma/                             # Prisma schema (if used)
├── package.json
├── bun.lock
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                         # Vercel config (function timeouts)
├── Caddyfile                           # Reverse-proxy config (optional)
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js ≥ 20.9** (Node 20 LTS or 22 LTS recommended)
- **Bun** (preferred) or npm
- **Python 3** with `pdftotext` (only needed if rebuilding data from PDFs)
- ~150 MB free disk space for `node_modules` and data files

### Install & Run

```bash
# 1. Install dependencies
bun install
# (or: npm install)

# 2. Start the dev server
bun run dev
# (or: npm run dev)

# 3. Open the app
open http://localhost:3000
```

The dev server uses Turbopack and starts in ~1 second. The first page load compiles on demand (~5 s); subsequent navigations are instant.

### Production build

```bash
bun run build        # or: npm run build
bun run start        # or: npm run start
```

The production build is **strongly recommended** for memory-constrained environments. The dev server with Turbopack can become unstable when loading the 40 MB student JSON. Production mode (`next build` + `next start`) is rock-solid.

---

## Available Scripts

| Script            | Description |
|-------------------|-------------|
| `bun run dev`     | Start dev server with Turbopack on port 3000 |
| `bun run build`   | Production build (outputs to `.next/`) |
| `bun run start`   | Start production server (must run `build` first) |
| `bun run lint`    | ESLint check |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run Prisma migrations |
| `bun run db:reset` | Reset database (destructive) |

---

## API Reference

All endpoints are server-rendered on demand (`export const dynamic = "force-dynamic"`) and return JSON.

### `GET /api/colleges`

List all colleges or search by name/code.

| Param | Type   | Default | Description |
|-------|--------|---------|-------------|
| `q`   | string | —       | Search query (matches name or code). If omitted, returns the full index. |

**Response (200):**
```json
{
  "results": [
    { "code": "01002", "name": "Government College of Engineering, Amravati", "branchCount": 7, "branchNames": ["Civil Engineering", "Computer Engineering", "..."] }
  ],
  "count": 368
}
```

### `GET /api/college/[code]`

Fetch a single college with all its branches and cut-off rows.

**Response (200):** full `College` object with `branches[].rows[]` containing `stage`, `ranks[]`, `percentiles[]`, `categories[]`.

**Response (404):** `{ "error": "College not found" }`

### `GET /api/students`

Search the merit list by rank, percentile, or name.

| Param  | Type   | Default | Description |
|--------|--------|---------|-------------|
| `q`    | string | —       | Search query |
| `mode` | string | `auto`  | One of `auto`, `rank`, `percentile`, `name` |
| `limit`| number | `5000` (rank/percentile) or `100` (name) | Max results to return |

**Auto mode detection:**
- `/^\d{1,6}$/` (no dot) → **rank**
- `/[a-zA-Z]/` → **name**
- otherwise → **percentile**

**Response (200):**
```json
{
  "count": 6,
  "results": [
    { "merit_no": 1, "app_id": "EN26414939", "name": "WANKHEDE ADITYA SATISH", "category": "OBC", "gender": "Male", "merit_percentile": "100.0000000" }
  ],
  "total": 6,
  "mode": "name",
  "limited": false,
  "limit": 100
}
```

When `limited: true`, the API found more matches than `limit` allows. The UI shows a "showing first N, refine your query" warning.

### `GET /api/student/[rank]`

Fetch a single student's full 19-field profile.

**Response (200):**
```json
{
  "merit_no": 1,
  "app_id": "EN26414939",
  "name": "WANKHEDE ADITYA SATISH",
  "category": "OBC",
  "gender": "Male",
  "yes_count": 0,
  "minority": "-/-",
  "merit_percentile": "100.0000000",
  "math_percentile": "100.0000000",
  "physics_percentile": "100.0000000",
  "chemistry_percentile": "100.0000000",
  "hsc_pcm": "86.33",
  "hsc_math": "86.00",
  "hsc_physics": "83.00",
  "hsc_total": "80.17",
  "ssc_total": "75.80",
  "ssc_math": "96.00",
  "ssc_science": "82.00",
  "ssc_english": "71.00"
}
```

**Response (404):** `{ "error": "No student found with merit rank 999999." }`

---

## Search Modes

### Auto (default)

The smart mode that picks the right search type based on the query:

| Query         | Detected as  | Why |
|---------------|--------------|-----|
| `1`           | rank         | Pure digits, no dot |
| `5000`        | rank         | Pure digits, no dot |
| `99.89`       | percentile   | Decimal number |
| `99.8987775`  | percentile   | Decimal number |
| `ADITYA`      | name         | Contains letters |
| `ADITYA WANKHEDE` | name     | Contains letters |
| `WANKHEDE ADITYA SATISH` | name | Contains letters |

### Rank

Returns the matched student plus 5 students above and 5 below (11 total when available). Useful for browsing neighbors. Marks `exact_match: true` when the requested rank exists.

### Percentile

Prefix search on `merit_percentile`. Returns **all** matching students sorted by merit_no ascending. There is no 50-row cap — if `63.0034130` returns 398 tied students, you'll see all 398 (subject to `limit`, default 5000, max 10000).

Use this to find every candidate who scored a specific percentile, or every candidate whose percentile starts with `99.89`.

### Name

Token-order-independent substring search on `name`. Both the query and stored name are uppercased and split on whitespace. Each query token must appear as a substring of the stored name (in any order).

**Examples:**

| Query                       | Matches | Why |
|-----------------------------|---------|-----|
| `WANKHEDE ADITYA SATISH`    | 1       | All 3 tokens present in the full name |
| `ADITYA WANKHEDE`           | 6       | Both tokens present, in any order |
| `WANKHEDE`                  | ~200+   | Single-token substring match |
| `SATISH WANKHEDE`           | 6       | Tokens matched in reverse order |
| `WANKH`                     | ~200+   | Partial-token substring match |

Default limit is 100 (more would overwhelm the dropdown). API max is 500.

---

## URL Deep Linking

The app uses `window.location.hash` for shareable URLs. No server round-trip required — the hash is parsed client-side.

| URL                              | Opens |
|----------------------------------|-------|
| `http://localhost:3000/`         | Home (search) |
| `http://localhost:3000/#01002`   | College detail page for code 01002 |
| `http://localhost:3000/#s123`    | Student detail page for merit rank 123 |

Press the browser's back button to return to the previous view.

---

## Performance & Memory Notes

This project taught us some hard lessons about scaling Next.js with large in-memory datasets. The current architecture is the result of several iterations.

### Why SQLite (not JSON) for the student list

A 40 MB `students.json` parses into ~2 GB of V8 heap (object graphs are 50× larger than the source text). On memory-constrained serverless (Vercel: 1 GB per function), this caused **OOM kills** during `next build` and on the first request to `/api/students`.

**Solution:** Move the student data into a SQLite database (`students.db`, 45.6 MB) and query it via `better-sqlite3` with read-only access. SQLite streams rows from disk with near-zero RAM cost — the server stays under 100 MB even when returning 5000 results.

### Why we keep `students.json` and `students-slim.json` around

- **`students.json`** — source-of-truth backup. Used by `scripts/build_students_db.py` to rebuild the SQLite file.
- **`students-slim.json`** — 16 MB variant with only 6 fields (merit_no, app_id, name, category, gender, merit_percentile). Useful if you ever want to embed the search data into a client bundle (e.g. for an offline PWA). Not currently imported at runtime.

### Vercel deployment tips

- The `students.db` file (45.6 MB) **must** be in the serverless function bundle. Configure `vercel.json` to include it, or move it under `public/` (worse — public files are served as static assets, not bundled).
- Set `maxDuration: 10` on API routes (already configured in `vercel.json`) — percentile searches returning 5000 rows can take 1–2 seconds cold.
- Use `npx next build` (Webpack mode), **not** Turbopack, for production builds. Turbopack is faster for dev but has had issues with large JSON imports in some Next 16 versions.

### Read-only SQLite on Vercel

We open the database with `{ readonly: true, fileMustExist: true }` and skip WAL/mmap pragmas — those require write access to the database file (WAL creates `-wal` and `-shm` sidecar files). On Vercel's read-only filesystem, those pragmas fail with `SQLITE_READONLY`.

---

## Rebuilding the Data

If a new merit list PDF is published, you can rebuild the data files without touching any code.

### Prerequisites

```bash
# pdftotext (part of poppler-utils)
sudo apt install poppler-utils

# Python 3 with standard library only (no extra packages needed)
python3 --version
```

### Rebuild student data

```bash
# Place the new PDF at /home/c/my-project/upload/FE2026_PCMMH_MeritList_Final.pdf
# (or edit the PDF_PATH constant in the script)

python3 scripts/build_students_db.py
```

This script:
1. Runs `pdftotext -layout` on the PDF (produces an 84 MB text file).
2. Parses each student row with a regex-based parser.
3. Sorts by merit_no.
4. Writes `src/data/students.json` (40 MB source-of-truth).
5. Builds `src/data/students.db` (45.6 MB SQLite) with indexes on `merit_no` and `merit_percentile`.

Expected runtime: ~30 seconds (mostly `pdftotext`).

### Rebuild college data

```bash
# Place the new cut-off PDF at /home/c/my-project/upload/CAP 1 MH.pdf

python3 scripts/extract_pdf.py
```

This produces `src/data/colleges.json` (3 MB).

### Verify the rebuild

```bash
python3 -c "
import sqlite3
db = sqlite3.connect('src/data/students.db')
c = db.cursor()
print('Count:', c.execute('SELECT COUNT(*) FROM students').fetchone()[0])
print('First:', c.execute('SELECT merit_no, name, merit_percentile FROM students ORDER BY merit_no LIMIT 1').fetchone())
print('WANKHEDE ADITYA:', c.execute(\"SELECT merit_no, name FROM students WHERE name LIKE '%WANKHEDE%' AND name LIKE '%ADITYA%' ORDER BY merit_no\").fetchall()[:3])
"
```

---

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Vercel auto-detects Next.js — no config needed.
4. The `vercel.json` file configures `maxDuration: 10` on the heavier API routes.
5. Make sure `src/data/students.db` is committed to the repo (it's 45.6 MB — within Vercel's 100 MB unzipped limit per serverless function).

```bash
# Deploy from CLI
npm i -g vercel
vercel
```

### Self-hosted (Docker / VPS / Caddy)

```bash
# Build
bun run build

# Run production server on port 3000
bun run start

# Optional: reverse proxy with Caddy (Caddyfile included)
caddy run
```

The included `Caddyfile` proxies HTTPS to `localhost:3000` — edit it to use your domain.

---

## Contributing

This is a single-maintainer project, but issues and pull requests are welcome.

### Areas for improvement

- **Fuzzy name matching** — currently uses substring matching per token. A Levenshtein-based fallback for typos would be nice.
- **Download search results as CSV/Excel** — useful for counselors who want to share a list of candidates.
- **Category filter on college cut-offs** — let users filter to only show categories they care about.
- **Multi-round support** — currently only CAP Round 1. Adding Round 2/3 would require extending the `CutOffRow` schema.
- **PWA / offline mode** — bundle `students-slim.json` into a service worker for offline name search.

### Development workflow

```bash
bun install
bun run dev          # https://localhost:3000
# Make changes...
bun run lint         # Check for issues
bun run build        # Verify production build
```

---

## License

This project is provided as-is for educational and informational purposes. The underlying data (CAP cut-offs and merit list) is the property of the **State CET Cell, Maharashtra** — please consult their official website for terms of use.

The code in this repository is licensed under the **MIT License**. You are free to copy, modify, and distribute with attribution.

---

**Built for Maharashtra Engineering aspirants 2026-27.** Good luck with your admission!

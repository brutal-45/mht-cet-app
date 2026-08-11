# Project Worklog — CAP Cut-off Finder

---
Task ID: 1
Agent: main (Super Z)
Task: Rebuild student data from FE2026_PCMMH_MeritList_Final.pdf (uploaded as 7z) and verify name search with token-order-independent matching works end-to-end.

Work Log:
- Extracted `FE2026_PCMMH_MeritList_Final.7z` (47 MB) using `py7zr` — produced `FE2026_PCMMH_MeritList_Final.pdf` (68 MB), identical MD5 to the PDF already in `/home/z/my-project/upload/`.
- Verified existing `students-slim.json` (16 MB, 227,048 rows from older Provisional PDF) was stale vs `students.json` (40 MB, 229,359 rows from Final PDF) — needed rebuild.
- Re-ran `scripts/build_students_final.py` to rebuild both `students.json` (40.4 MB, 229,359 rows) and `students-slim.json` (16.1 MB, 229,359 rows) from the Final PDF.
- Re-ran `scripts/build_students_db.py` to rebuild `students.db` (45.6 MB, 229,359 rows) — this is the file actually used at runtime via `better-sqlite3`.
- Confirmed all three data artifacts are now consistent (229,359 students, first=#1 WANKHEDE ADITYA SATISH, last=#229,563 JADHAV SUMIT SANTOSH).
- Verified `src/lib/students.ts` already contains `searchByName()` + `searchByNameWithTotal()` using `LIKE '%token%'` ANDed across all query tokens — this gives token-order-independent matching out of the box.
- Verified `/api/students/route.ts` already handles `mode=name` AND auto-detects name search when query contains alphabetic characters.
- Verified `src/components/student-search.tsx` already has a "By Name" mode toggle button plus example chips ("ADITYA WANKHEDE", "WANKHEDE") that switch to name mode.
- Installed missing `better-sqlite3` dependency via `bun install` (was in package.json but not in node_modules).
- Production build: `npx next build` succeeded cleanly (7.3s compile, 6 static + 5 dynamic routes).
- Smoke tests against production server (`next start`):
  - `GET /api/students?q=ADITYA%20WANKHEDE&mode=auto` → mode=name, total=6, includes #1 WANKHEDE ADITYA SATISH — proves token order doesn't matter.
  - `GET /api/students?q=WANKHEDE%20ADITYA%20SATISH&mode=name` → total=1 (exact match).
  - `GET /api/students?q=1&mode=auto` → mode=rank, exact_match=true, returns rank 1 + neighbors.
  - `GET /api/students?q=99.89&mode=auto` → mode=percentile, total=32 (prefix match).
  - `GET /api/student/1` → returns all 19 fields for WANKHEDE ADITYA SATISH.
  - `GET /` → HTTP 200 in 12ms.

Stage Summary:
- Data refreshed from Final PDF: 229,359 students across `students.db`, `students.json`, `students-slim.json`.
- Name search fully functional at all three layers (lib, API, UI) — "ADITYA WANKHEDE" and "WANKHEDE ADITYA" both find WANKHEDE ADITYA SATISH at rank #1 plus 5 other ADITYA WANKHEDEs.
- All existing features (rank search, percentile search, student detail page) preserved.
- Production build green; server starts and serves all endpoints correctly.

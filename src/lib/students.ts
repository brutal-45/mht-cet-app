// Types and accessors for the final merit list (PCM, 2026-27).
//
// Data is stored in a SQLite database file `src/data/students.db` (~48 MB).
// SQLite is used instead of JSON because:
//   - JSON.parse() of a 17 MB file consumes ~500 MB of heap on V8, which
//     OOM-kills the Next.js server on memory-constrained environments.
//   - SQLite queries the file directly from disk with near-zero RAM cost.
//   - SQLite's LIKE operator handles prefix and substring searches natively.
//
// All search modes (rank, percentile, name) run as SQL queries.
// The database file is read at runtime via `better-sqlite3`. On Vercel
// serverless, the file must be in the bundle — we ensure this by placing
// it in `src/data/` and configuring `vercel.json` to include it.
//
// Schema:
//   CREATE TABLE students (
//     merit_no INTEGER,
//     app_id TEXT,
//     name TEXT,
//     category TEXT,
//     gender TEXT,
//     yes_count INTEGER,
//     minority TEXT,
//     merit_percentile TEXT,
//     math_percentile TEXT,
//     physics_percentile TEXT,
//     chemistry_percentile TEXT,
//     hsc_pcm TEXT,
//     hsc_math TEXT,
//     hsc_physics TEXT,
//     hsc_total TEXT,
//     ssc_total TEXT,
//     ssc_math TEXT,
//     ssc_science TEXT,
//     ssc_english TEXT
//   );
//   CREATE INDEX idx_merit_no ON students(merit_no);
//   CREATE INDEX idx_merit_percentile ON students(merit_percentile);

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export interface Student {
  merit_no: number;
  app_id: string;
  name: string;
  category: string;
  gender: string;
  yes_count: number;
  minority: string;
  merit_percentile: string;
  math_percentile: string;
  physics_percentile: string;
  chemistry_percentile: string;
  hsc_pcm: string;
  hsc_math: string;
  hsc_physics: string;
  hsc_total: string;
  ssc_total: string;
  ssc_math: string;
  ssc_science: string;
  ssc_english: string;
}

// Slim student — only 6 fields, used for search results and dropdown display
export interface SlimStudent {
  merit_no: number;
  app_id: string;
  name: string;
  category: string;
  gender: string;
  merit_percentile: string;
}

// Lazy-loaded SQLite database connection
let dbCache: Database.Database | null = null;

function getDb(): Database.Database {
  if (dbCache) return dbCache;
  const dbPath = path.join(process.cwd(), "src", "data", "students.db");
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Students database not found at ${dbPath}`);
  }
  // Open read-only. No pragmas — WAL mode and mmap_size both require write
  // access to the database file (WAL creates -wal/-shm files, mmap_size
  // may try to update the database header). On read-only filesystems
  // (Vercel serverless), these pragmas fail with SQLITE_READONLY.
  dbCache = new Database(dbPath, { readonly: true, fileMustExist: true });
  return dbCache;
}

export function getStudentCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as cnt FROM students").get() as { cnt: number };
  return row.cnt;
}

function rowToSlim(row: Record<string, unknown>): SlimStudent {
  return {
    merit_no: row.merit_no as number,
    app_id: row.app_id as string,
    name: row.name as string,
    category: row.category as string,
    gender: row.gender as string,
    merit_percentile: row.merit_percentile as string,
  };
}

function rowToFullStudent(row: Record<string, unknown>): Student {
  return {
    merit_no: row.merit_no as number,
    app_id: row.app_id as string,
    name: row.name as string,
    category: row.category as string,
    gender: row.gender as string,
    yes_count: row.yes_count as number,
    minority: row.minority as string,
    merit_percentile: row.merit_percentile as string,
    math_percentile: row.math_percentile as string,
    physics_percentile: row.physics_percentile as string,
    chemistry_percentile: row.chemistry_percentile as string,
    hsc_pcm: row.hsc_pcm as string,
    hsc_math: row.hsc_math as string,
    hsc_physics: row.hsc_physics as string,
    hsc_total: row.hsc_total as string,
    ssc_total: row.ssc_total as string,
    ssc_math: row.ssc_math as string,
    ssc_science: row.ssc_science as string,
    ssc_english: row.ssc_english as string,
  };
}

/**
 * Look up a student by merit number (rank). Returns null if not found.
 * Uses the merit_no index — O(log n).
 */
export function getStudentByRank(rank: number): Student | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM students WHERE merit_no = ?").get(rank) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToFullStudent(row) : null;
}

/**
 * Search students by MHT-CET percentile.
 *
 * Behavior:
 *   - If `query` exactly matches a percentile (e.g. "99.8987775"), returns
 *     all students with that exact percentile — there may be HUNDREDS of ties.
 *   - If `query` is a prefix (e.g. "99.89"), returns all students whose
 *     percentile starts with that prefix, sorted by merit_no ascending.
 *
 * Returns up to `limit` results (default 5000 — covers ~99.9% of queries)
 * plus a `total` count via `searchByPercentileWithTotal()`.
 */
export function searchByPercentile(query: string, limit = 5000): SlimStudent[] {
  return searchByPercentileWithTotal(query, limit).matches;
}

export interface PercentileSearchResult {
  matches: SlimStudent[];
  total: number; // total matches in dataset (may exceed `limit`)
  exactMatch: boolean; // true if query equals a stored percentile value exactly
}

export function searchByPercentileWithTotal(
  query: string,
  limit = 5000
): PercentileSearchResult {
  const q = query.trim();
  if (!q || !/^\d+(\.\d+?)?$/.test(q) || parseFloat(q) > 100) {
    return { matches: [], total: 0, exactMatch: false };
  }

  const db = getDb();
  const pattern = `${q}%`;

  // Get total count
  const totalRow = db
    .prepare("SELECT COUNT(*) as cnt FROM students WHERE merit_percentile LIKE ?")
    .get(pattern) as { cnt: number };

  // Check for exact match
  const exactRow = db
    .prepare("SELECT COUNT(*) as cnt FROM students WHERE merit_percentile = ?")
    .get(q) as { cnt: number };

  // Fetch the page
  const rows = db
    .prepare(
      `SELECT merit_no, app_id, name, category, gender, merit_percentile
       FROM students
       WHERE merit_percentile LIKE ?
       ORDER BY merit_no ASC
       LIMIT ?`
    )
    .all(pattern, limit) as Record<string, unknown>[];

  return {
    matches: rows.map(rowToSlim),
    total: totalRow.cnt,
    exactMatch: exactRow.cnt > 0,
  };
}

/**
 * Search students by rank (merit number). Returns exact match plus nearby
 * students (so the user can scroll through neighbors). Default returns the
 * matched student + 5 above + 5 below (11 total).
 */
export function searchByRankWithNeighbors(rank: number, around = 5): SlimStudent[] {
  const db = getDb();
  // Find the closest merit_no (in case the given rank doesn't exist)
  const closestRow = db
    .prepare(
      `SELECT merit_no FROM students
       ORDER BY ABS(merit_no - ?)
       LIMIT 1`
    )
    .get(rank) as { merit_no: number } | undefined;

  if (!closestRow) return [];

  const closestRank = closestRow.merit_no;
  const rows = db
    .prepare(
      `SELECT merit_no, app_id, name, category, gender, merit_percentile
       FROM students
       WHERE merit_no BETWEEN ? AND ?
       ORDER BY merit_no ASC`
    )
    .all(closestRank - around, closestRank + around) as Record<string, unknown>[];

  return rows.map(rowToSlim);
}

/**
 * Normalize a name query: uppercase, collapse whitespace, split into tokens.
 * Empty string → empty array.
 */
function tokenizeNameQuery(query: string): string[] {
  return query
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Search students by name.
 *
 * Behavior:
 *   - Tokenizes the query (e.g., "ADITYA WANKHEDE" → ["ADITYA", "WANKHEDE"]).
 *   - Returns all students whose name contains EVERY token as a substring,
 *     in ANY order. So "ADITYA WANKHEDE" matches "WANKHEDE ADITYA SATISH",
 *     and "WANKH ADITYA" also matches the same record.
 *   - Single-token queries work too: "ADITYA" returns all Adityas.
 *   - Case-insensitive (we uppercase both query and stored name; SQLite LIKE
 *     is case-insensitive for ASCII by default, but the data is already
 *     uppercase so this is a no-op).
 *   - Sorted by merit_no ascending (best rank first).
 *
 * Returns up to `limit` results (default 100) plus a `total` count via
 * `searchByNameWithTotal()`.
 */
export function searchByName(query: string, limit = 100): SlimStudent[] {
  return searchByNameWithTotal(query, limit).matches;
}

export interface NameSearchResult {
  matches: SlimStudent[];
  total: number;
}

export function searchByNameWithTotal(
  query: string,
  limit = 100
): NameSearchResult {
  const tokens = tokenizeNameQuery(query);
  if (tokens.length === 0) return { matches: [], total: 0 };

  const db = getDb();

  // Build WHERE clause: each token becomes a LIKE '%token%' condition (AND)
  const whereClauses = tokens.map(() => "name LIKE ?").join(" AND ");
  const params = tokens.map((t) => `%${t}%`);

  // Get total count
  const totalRow = db
    .prepare(`SELECT COUNT(*) as cnt FROM students WHERE ${whereClauses}`)
    .get(...params) as { cnt: number };

  // Fetch the page
  const rows = db
    .prepare(
      `SELECT merit_no, app_id, name, category, gender, merit_percentile
       FROM students
       WHERE ${whereClauses}
       ORDER BY merit_no ASC
       LIMIT ?`
    )
    .all(...params, limit) as Record<string, unknown>[];

  return {
    matches: rows.map(rowToSlim),
    total: totalRow.cnt,
  };
}

// Types for the CAP college cut-off data
// NOTE: We import the JSON directly (not fs.readFileSync) so the data file
// is bundled into the serverless function on Vercel. fs.readFileSync would
// fail on Vercel because the data/ folder is not in the function's filesystem.
import collegeDataRaw from "@/data/colleges.json";

export interface CutOffRow {
  stage: string;
  ranks: string[];
  percentiles: string[];
  categories: string[];
}

export interface Branch {
  branch_code: string;
  branch_name: string;
  status: string;
  college_code: string | null;
  rows: CutOffRow[];
}

export interface College {
  code: string;
  name: string;
  branches: Branch[];
}

export interface CollegeIndex {
  code: string;
  name: string;
  branchCount: number;
  branchNames: string[];
}

// In-memory cache (also survives across warm serverless invocations)
let collegeListCache: College[] | null = null;

export function getCollegeList(): College[] {
  if (collegeListCache) return collegeListCache;
  collegeListCache = collegeDataRaw as College[];
  return collegeListCache;
}

export function getCollegeIndex(): CollegeIndex[] {
  return getCollegeList().map((c) => ({
    code: c.code,
    name: c.name,
    branchCount: c.branches.length,
    branchNames: c.branches.map((b) => b.branch_name),
  }));
}

export function getCollegeByCode(code: string): College | null {
  const normalized = code.trim().padStart(5, "0");
  return getCollegeList().find((c) => c.code === normalized) ?? null;
}

export function searchColleges(query: string, limit = 50): CollegeIndex[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const index = getCollegeIndex();
  // Priority 1: exact code match
  const exactCode = index.filter((c) => c.code === q.padStart(5, "0"));
  // Priority 2: code starts with
  const codeStartsWith = index.filter(
    (c) => c.code.startsWith(q) && c.code !== q.padStart(5, "0")
  );
  // Priority 3: name contains
  const nameContains = index.filter(
    (c) => !c.code.startsWith(q) && c.name.toLowerCase().includes(q)
  );
  // Priority 4: branch name contains
  const branchContains = index.filter((c) => {
    if (c.code.startsWith(q)) return false;
    if (c.name.toLowerCase().includes(q)) return false;
    return c.branchNames.some((bn) => bn.toLowerCase().includes(q));
  });

  const combined = [...exactCode, ...codeStartsWith, ...nameContains, ...branchContains];
  return combined.slice(0, limit);
}

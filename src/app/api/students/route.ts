import { NextResponse } from "next/server";
import {
  getStudentCount,
  searchByNameWithTotal,
  searchByPercentileWithTotal,
  searchByRankWithNeighbors,
  type SlimStudent,
} from "@/lib/students";

export const dynamic = "force-dynamic";

function toSlim(s: SlimStudent) {
  return s;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const mode = (searchParams.get("mode") ?? "auto").trim();
  // Percentile / rank can return up to 10000; name defaults to 100 (more
  // would be overwhelming in the dropdown).
  const maxLimit = mode === "name" ? 500 : 10000;
  const defaultLimit = mode === "name" ? 100 : 5000;
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(defaultLimit), 10) || defaultLimit)
  );

  // Empty query → return total count + a few sample students (top 10)
  if (!q) {
    const count = getStudentCount();
    // Use rank 1 + neighbors as the sample (cheap — no full materialization)
    const sample = searchByRankWithNeighbors(1, 9);
    return NextResponse.json({
      count,
      results: sample,
      total: count,
    });
  }

  // Decide search mode
  // "auto" → if query is purely digits (no decimal), search by rank;
  //          otherwise if it contains letters, search by name;
  //          otherwise (decimal number) search by percentile.
  // "rank" → search by rank (merit_no)
  // "percentile" → search by percentile
  // "name" → search by candidate name (any token order)
  let effectiveMode = mode;
  if (mode === "auto") {
    if (/^\d{1,6}$/.test(q) && !q.includes(".")) {
      effectiveMode = "rank";
    } else if (/[a-zA-Z]/.test(q)) {
      effectiveMode = "name";
    } else {
      effectiveMode = "percentile";
    }
  }

  if (effectiveMode === "rank") {
    const rank = parseInt(q, 10);
    if (!Number.isFinite(rank) || rank < 1) {
      return NextResponse.json({
        count: 0,
        results: [],
        total: 0,
        mode: "rank",
      });
    }
    const results = searchByRankWithNeighbors(rank, 5);
    const exactMatch = results.some((s) => s.merit_no === rank);
    return NextResponse.json({
      count: results.length,
      results,
      total: results.length,
      mode: "rank",
      exact_match: exactMatch,
    });
  }

  if (effectiveMode === "name") {
    const { matches, total } = searchByNameWithTotal(q, limit);
    const results = matches.map(toSlim);
    return NextResponse.json({
      count: results.length,
      results,
      total,
      mode: "name",
      limited: total > results.length,
      limit,
    });
  }

  // Percentile search
  if (!/^\d+(\.\d+?)?$/.test(q) || parseFloat(q) > 100) {
    return NextResponse.json({
      count: 0,
      results: [],
      total: 0,
      mode: "percentile",
      error: "Invalid percentile. Please enter a number between 0 and 100.",
    });
  }

  const { matches, total, exactMatch } = searchByPercentileWithTotal(q, limit);
  const results = matches.map(toSlim);

  return NextResponse.json({
    count: results.length,
    results,
    total,
    mode: "percentile",
    exact_match: exactMatch,
    limited: total > results.length,
    limit,
  });
}

import { NextResponse } from "next/server";
import { getCollegeIndex, searchColleges } from "@/lib/colleges";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q) {
    const results = searchColleges(q);
    return NextResponse.json({ results, count: results.length });
  }

  const index = getCollegeIndex();
  return NextResponse.json({ results: index, count: index.length });
}

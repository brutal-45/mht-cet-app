import { NextResponse } from "next/server";
import { getStudentByRank } from "@/lib/students";

export const dynamic = "force-dynamic";

/**
 * GET /api/student/[rank] — fetch a single student's full profile by merit
 * number (rank). Returns 404 if no student has this rank.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ rank: string }> }
) {
  const { rank: rankStr } = await params;
  const rank = parseInt(rankStr, 10);
  if (!Number.isFinite(rank) || rank < 1) {
    return NextResponse.json(
      { error: "Invalid rank. Must be a positive integer." },
      { status: 400 }
    );
  }

  const student = getStudentByRank(rank);
  if (!student) {
    return NextResponse.json(
      { error: `No student found with merit rank ${rank}.` },
      { status: 404 }
    );
  }

  return NextResponse.json(student);
}

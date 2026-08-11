import { NextResponse } from "next/server";
import { getCollegeByCode } from "@/lib/colleges";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: "Missing college code" }, { status: 400 });
  }
  const college = getCollegeByCode(code);
  if (!college) {
    return NextResponse.json({ error: "College not found" }, { status: 404 });
  }
  return NextResponse.json(college);
}

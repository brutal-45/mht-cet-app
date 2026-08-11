#!/usr/bin/env python3
"""
Parse the layout-preserved text file (from `pdftotext -layout`) of CAP 1 MH.pdf
into structured JSON: colleges -> branches -> cut-off rows.
"""
import re
import json
from pathlib import Path

TXT_PATH = "/home/z/my-project/scripts/cap1.txt"
OUT_PATH = "/home/z/my-project/src/data/colleges.json"

COLLEGE_RE = re.compile(r'^\s*(\d{5})\s*-\s*(.+?)\s*$')
BRANCH_RE = re.compile(r'^\s*(\d{10})\s*-\s*(.+?)\s*$')
STATUS_RE = re.compile(r'^\s*Status\s*:\s*(.+?)\s*$', re.IGNORECASE)


def is_skip_line(stripped):
    if not stripped:
        return True
    skip_prefixes = (
        "Legends:", "Government of Maharashtra", "State Common",
        "Cut Off List", "Maharashtra & Minority",
    )
    for p in skip_prefixes:
        if stripped.startswith(p):
            return True
    # The vertical "D i r" header letters appear alone
    if stripped in ("D", "i", "r", "D i r"):
        return True
    return False


def parse_line(line):
    """Return (kind, payload) for a given line."""
    stripped = line.strip()
    if is_skip_line(stripped):
        return ("skip", None)

    m = COLLEGE_RE.match(line)
    if m:
        return ("college", (m.group(1), m.group(2).strip()))
    m = BRANCH_RE.match(line)
    if m:
        return ("branch", (m.group(1), m.group(2).strip()))
    m = STATUS_RE.match(line)
    if m:
        return ("status", m.group(1).strip())

    if stripped in ("State Level", "All India Level"):
        return ("level", stripped)

    if stripped.startswith("Stage"):
        # header row of categories
        parts = stripped.split()
        # parts[0] == "Stage"
        return ("stage_header", parts[1:])

    tokens = stripped.split()
    if tokens and re.match(r'^[IVX]+$|^\d+$', tokens[0]):
        rest = tokens[1:]
        if rest and all(re.match(r'^\d+$', t) for t in rest):
            return ("rank_row", (tokens[0], rest))

    if stripped.startswith("("):
        nums = re.findall(r'\(([\d.]+)\)', stripped)
        if nums:
            return ("percentile_row", nums)

    return ("other", stripped)


def main():
    with open(TXT_PATH, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    colleges = {}
    current_college = None
    current_branch = None
    current_categories = None
    current_values = None

    skipped = 0
    for line in lines:
        kind, payload = parse_line(line)
        if kind == "skip":
            skipped += 1
            continue

        if kind == "college":
            code, name = payload
            if code not in colleges:
                colleges[code] = {"code": code, "name": name, "branches": []}
            elif not colleges[code].get("name"):
                colleges[code]["name"] = name
            current_college = code
            current_branch = None
            continue

        if kind == "branch":
            bcode, bname = payload
            current_branch = {
                "branch_code": bcode,
                "branch_name": bname,
                "status": "",
                "college_code": current_college,
                "rows": []
            }
            if current_college and current_college in colleges:
                colleges[current_college]["branches"].append(current_branch)
            else:
                # Branch before any college header — shouldn't happen, but be safe
                pass
            current_categories = None
            current_values = None
            continue

        if kind == "status":
            if current_branch is not None:
                current_branch["status"] = payload
            continue

        if kind == "stage_header":
            current_categories = payload
            continue

        if kind == "rank_row":
            stage, ranks = payload
            current_values = {
                "stage": stage,
                "ranks": ranks,
                "percentiles": [],
                "categories": current_categories or []
            }
            if current_branch is not None:
                current_branch["rows"].append(current_values)
            continue

        if kind == "percentile_row":
            if current_values is not None:
                current_values["percentiles"] = payload
                current_values = None
            continue

    # Convert to list, sort
    college_list = sorted(colleges.values(), key=lambda c: c["code"])

    # Stats
    total_branches = sum(len(c["branches"]) for c in college_list)
    branches_with_rows = sum(
        1 for c in college_list for b in c["branches"] if b["rows"]
    )
    print(f"Colleges: {len(college_list)}")
    print(f"Branches: {total_branches}")
    print(f"Branches with cut-off rows: {branches_with_rows}")
    print(f"Skipped lines: {skipped}")

    Path(OUT_PATH).parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(college_list, f, ensure_ascii=False, indent=1)
    print(f"Saved to {OUT_PATH}")

    # Sample
    print("\nSample (first 3 colleges, first branch each):")
    for c in college_list[:3]:
        print(f"  {c['code']} - {c['name']} ({len(c['branches'])} branches)")
        if c["branches"]:
            b = c["branches"][0]
            print(f"    {b['branch_code']} - {b['branch_name']}")
            print(f"    status: {b['status']}")
            if b["rows"]:
                r = b["rows"][0]
                print(f"    stage={r['stage']}, cats={len(r['categories'])}, ranks={len(r['ranks'])}, percs={len(r['percentiles'])}")
                print(f"    first 3 cats: {r['categories'][:3]}")
                print(f"    first 3 ranks: {r['ranks'][:3]}")
                print(f"    first 3 percs: {r['percentiles'][:3]}")


if __name__ == "__main__":
    main()

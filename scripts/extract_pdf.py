#!/usr/bin/env python3
"""
Extract college + branch + cut-off data from CAP 1 MH.pdf using PyMuPDF (faster).
"""
import re
import json
import fitz  # PyMuPDF
from pathlib import Path

PDF_PATH = "/home/z/my-project/upload/CAP 1 MH.pdf"
OUT_PATH = "/home/z/my-project/download/colleges.json"

COLLEGE_RE = re.compile(r'^\s*(\d{5})\s*-\s*(.+?)\s*$')
BRANCH_RE = re.compile(r'^\s*(\d{11})\s*-\s*(.+?)\s*$')
STATUS_RE = re.compile(r'^\s*Status\s*:\s*(.+?)\s*$', re.IGNORECASE)


def extract_pages():
    colleges = {}
    current_college = None
    current_branch = None
    current_categories = None
    current_values = None

    doc = fitz.open(PDF_PATH)
    total = doc.page_count
    print(f"Total pages: {total}")

    for pi in range(total):
        if pi % 100 == 0:
            print(f"  page {pi+1}/{total}")
        page = doc[pi]
        text = page.get_text("text")
        lines = text.split("\n")

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            if stripped.startswith("Legends:") or stripped.startswith("Government of Maharashtra") or stripped.startswith("State Common") or stripped.startswith("Cut Off List"):
                continue

            # College header
            m_col = COLLEGE_RE.match(line)
            if m_col:
                code = m_col.group(1)
                name = m_col.group(2).strip()
                if code not in colleges:
                    colleges[code] = {"code": code, "name": name, "branches": []}
                elif not colleges[code].get("name"):
                    colleges[code]["name"] = name
                current_college = code
                current_branch = None
                continue

            # Branch header
            m_br = BRANCH_RE.match(line)
            if m_br:
                bcode = m_br.group(1)
                bname = m_br.group(2).strip()
                current_branch = {
                    "branch_code": bcode,
                    "branch_name": bname,
                    "status": "",
                    "college_code": current_college,
                    "rows": []
                }
                if current_college and current_college in colleges:
                    colleges[current_college]["branches"].append(current_branch)
                continue

            # Status
            m_st = STATUS_RE.match(line)
            if m_st and current_branch is not None:
                current_branch["status"] = m_st.group(1).strip()
                continue

            # State Level / All India Level marker (ignore)
            if stripped in ("State Level", "All India Level"):
                continue

            # Stage header
            if stripped.startswith("Stage"):
                parts = stripped.split()
                current_categories = parts[1:]
                continue

            # Data row
            tokens = stripped.split()
            if tokens and re.match(r'^[IVX]+$|^\d+$', tokens[0]):
                rest = tokens[1:]
                if rest and all(re.match(r'^\d+$', t) for t in rest):
                    stage = tokens[0]
                    current_values = {
                        "stage": stage,
                        "ranks": rest,
                        "percentiles": [],
                        "categories": current_categories or []
                    }
                    if current_branch is not None:
                        current_branch["rows"].append(current_values)
                    continue

            # Percentile row
            if stripped.startswith("(") and current_values is not None:
                nums = re.findall(r'\(([\d.]+)\)', stripped)
                current_values["percentiles"] = nums
                current_values = None
                continue

    doc.close()
    return colleges


def main():
    Path(OUT_PATH).parent.mkdir(parents=True, exist_ok=True)
    colleges = extract_pages()
    college_list = sorted(colleges.values(), key=lambda c: c["code"])
    total_branches = sum(len(c["branches"]) for c in college_list)
    print(f"Colleges: {len(college_list)}, Branches: {total_branches}")
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(college_list, f, ensure_ascii=False, indent=1)
    print(f"Saved to {OUT_PATH}")
    for c in college_list[:3]:
        print(f"  {c['code']} - {c['name']} ({len(c['branches'])} branches)")
        for b in c["branches"][:2]:
            print(f"    {b['branch_code']} - {b['branch_name']}  rows={len(b['rows'])}  cats={b['rows'][0]['categories'][:5] if b['rows'] else []}")


if __name__ == "__main__":
    main()

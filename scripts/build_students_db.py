#!/usr/bin/env python3
"""
Build the SQLite database from the final merit list PDF.

Produces: src/data/students.db (~48 MB)
And also: src/data/students.json (~42 MB, kept as source-of-truth backup)

Usage:
    python3 scripts/build_students_db.py
"""
import json
import sqlite3
import subprocess
from pathlib import Path

PDF_PATH = "/home/z/my-project/upload/FE2026_PCMMH_MeritList_Final.pdf"
TXT_PATH = "/home/z/my-project/scripts/work/merit_final.txt"
JSON_PATH = "/home/z/my-project/src/data/students.json"
DB_PATH = "/home/z/my-project/src/data/students.db"

FIELDS = [
    'merit_no', 'app_id', 'name', 'category', 'gender', 'yes_count', 'minority',
    'merit_percentile', 'math_percentile', 'physics_percentile', 'chemistry_percentile',
    'hsc_pcm', 'hsc_math', 'hsc_physics', 'hsc_total',
    'ssc_total', 'ssc_math', 'ssc_science', 'ssc_english',
]

import re
ROW_START_RE = re.compile(r'^\s*(\d+)\s+(EN\d+)\s+\S')
MINORITY_RE = re.compile(r'^(-/-|LM/-|RM/-|LM/RM|Yes/-|-/RM|LM/Yes|Yes/RM|Yes/Yes|-/Yes)$')


def pdf_to_text():
    Path(TXT_PATH).parent.mkdir(parents=True, exist_ok=True)
    print(f"Extracting text from {PDF_PATH}...")
    subprocess.run(
        ['pdftotext', '-layout', PDF_PATH, TXT_PATH],
        capture_output=True, text=True, check=True,
    )
    size = Path(TXT_PATH).stat().st_size / (1024 * 1024)
    print(f"  wrote {size:.1f} MB to {TXT_PATH}")


def parse_row(line):
    stripped = line.rstrip('\n')
    if not ROW_START_RE.match(stripped):
        return None
    cet_pos = stripped.find('MHT-CET-PCM')
    if cet_pos < 0:
        return None
    after_cet = stripped[cet_pos + len('MHT-CET-PCM'):].strip()
    nums = after_cet.split()
    if len(nums) != 12:
        return None
    for n in nums:
        if not re.match(r'^\d+\.\d+$', n):
            return None
    m = re.match(r'^\s*(\d+)\s+(EN\d+)\s+(.*)MHT-CET-PCM\s*\d+\.\d+', stripped)
    if not m:
        return None
    merit = int(m.group(1))
    app_id = m.group(2)
    info = m.group(3).rstrip()
    tokens = re.split(r'\s{2,}', info.strip())
    tokens = [t for t in tokens if t]
    if len(tokens) < 4:
        return None
    minority = '-/-'
    if MINORITY_RE.match(tokens[-1]):
        minority = tokens[-1]
        tokens = tokens[:-1]
    gender = None
    gender_idx = -1
    for i, t in enumerate(tokens):
        if t in ('Male', 'Female'):
            gender = t
            gender_idx = i
            break
    if gender is None:
        return None
    before_gender = tokens[:gender_idx]
    after_gender = tokens[gender_idx + 1:]
    if len(before_gender) == 0:
        return None
    if len(before_gender) >= 2:
        category = before_gender[-1].rstrip('$')
        name = ' '.join(before_gender[:-1]).strip()
    else:
        merged = before_gender[0]
        cat_match = re.search(
            r'\s+(Open|OBC|SC|ST|NT\s*1(?:\s*\(NT-A\))?|NT\s*2(?:\s*\(NT-C\))?|NT\s*3(?:\s*\(NT-D\))?|DT/VJ|NT-C|NT-D|NT-A|NT-B|SBC|SEBC|VJ/DT|EWS)$',
            merged,
        )
        if cat_match:
            category = cat_match.group(1)
            name = merged[:cat_match.start()].strip()
        else:
            name = merged
            category = 'Unknown'
    yes_count = sum(1 for t in after_gender if t == 'Yes')
    return {
        'merit_no': merit, 'app_id': app_id, 'name': name, 'category': category,
        'gender': gender, 'yes_count': yes_count, 'minority': minority,
        'merit_percentile': nums[0], 'math_percentile': nums[1],
        'physics_percentile': nums[2], 'chemistry_percentile': nums[3],
        'hsc_pcm': nums[4], 'hsc_math': nums[5], 'hsc_physics': nums[6],
        'hsc_total': nums[7], 'ssc_total': nums[8], 'ssc_math': nums[9],
        'ssc_science': nums[10], 'ssc_english': nums[11],
    }


def main():
    pdf_to_text()
    with open(TXT_PATH, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()

    students = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not ROW_START_RE.match(line):
            i += 1
            continue
        if 'Merit' in line and 'Application' in line:
            i += 1
            continue
        if 'Published on' in line or ('Page ' in line and 'of 4958' in line):
            i += 1
            continue
        s = parse_row(line)
        if s:
            students.append(s)
            i += 1
            continue
        if i + 1 < len(lines):
            joined = line.rstrip('\n') + ' ' + lines[i + 1].lstrip()
            s2 = parse_row(joined)
            if s2:
                students.append(s2)
                i += 2
                continue
        i += 1

    print(f"Parsed {len(students)} students")
    students.sort(key=lambda s: s['merit_no'])

    # Save as JSON (source of truth)
    full_rows = [[s[f] for f in FIELDS] for s in students]
    full_data = {'fields': FIELDS, 'count': len(full_rows), 'students': full_rows}
    Path(JSON_PATH).parent.mkdir(parents=True, exist_ok=True)
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(full_data, f, ensure_ascii=False, separators=(',', ':'))
    json_mb = Path(JSON_PATH).stat().st_size / (1024 * 1024)
    print(f"Saved {json_mb:.1f} MB to {JSON_PATH}")

    # Build SQLite database (used at runtime for fast, memory-efficient queries)
    print(f"Building SQLite database at {DB_PATH}...")
    if Path(DB_PATH).exists():
        Path(DB_PATH).unlink()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    col_defs = []
    for f in FIELDS:
        if f in ('merit_no', 'yes_count'):
            col_defs.append(f"{f} INTEGER")
        else:
            col_defs.append(f"{f} TEXT")
    c.execute(f"CREATE TABLE students ({', '.join(col_defs)})")
    c.execute("CREATE INDEX idx_merit_no ON students(merit_no)")
    c.execute("CREATE INDEX idx_merit_percentile ON students(merit_percentile)")
    placeholders = ','.join(['?'] * len(FIELDS))
    c.executemany(f"INSERT INTO students VALUES ({placeholders})", full_rows)
    conn.commit()
    c.execute("SELECT COUNT(*) FROM students")
    cnt = c.fetchone()[0]
    conn.close()
    db_mb = Path(DB_PATH).stat().st_size / (1024 * 1024)
    print(f"Saved {db_mb:.1f} MB to {DB_PATH} ({cnt} rows)")

    # Sanity checks
    print("\nFirst 3 students:")
    for s in students[:3]:
        print(f"  #{s['merit_no']} {s['app_id']} {s['name']} | {s['category']} | {s['gender']} | {s['merit_percentile']}")
    print("\nLast 3 students:")
    for s in students[-3:]:
        print(f"  #{s['merit_no']} {s['app_id']} {s['name']} | {s['category']} | {s['gender']} | {s['merit_percentile']}")


if __name__ == '__main__':
    main()

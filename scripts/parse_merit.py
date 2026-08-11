#!/usr/bin/env python3
"""
Parse the layout-preserved text of FE2026 Provisional Merit List (PCM) into JSON.

Strategy:
1. For each line, find "MHT-CET-PCM" position.
2. Everything after MHT-CET-PCM = numbers (12 of them).
3. Everything before MHT-CET-PCM (after app_id) = name + category + gender + Yes flags + minority.
4. Split the "before" part by 2+ whitespace to get tokens.
"""
import re
import json
from pathlib import Path

TXT_PATH = "/home/z/my-project/scripts/work/merit.txt"
OUT_PATH = "/home/z/my-project/src/data/students.json"

# Match the start of a student row: <merit_no> <app_id>
ROW_START_RE = re.compile(r'^\s*(\d+)\s+(EN\d+)\s+\S')
# Minority types
MINORITY_RE = re.compile(r'^(-/-|LM/-|RM/-|LM/RM|Yes/-|-/RM|LM/Yes|Yes/RM|Yes/Yes|-/Yes)$')


def parse_row(line):
    stripped = line.rstrip('\n')
    if not ROW_START_RE.match(stripped):
        return None

    # Find MHT-CET-PCM marker
    cet_pos = stripped.find('MHT-CET-PCM')
    if cet_pos < 0:
        return None

    # Numbers portion = everything after "MHT-CET-PCM"
    after_cet = stripped[cet_pos + len('MHT-CET-PCM'):].strip()
    nums = after_cet.split()
    if len(nums) != 12:
        return None
    # Validate all are numeric
    for n in nums:
        if not re.match(r'^\d+\.\d+$', n):
            return None

    # Info portion = from end of app_id to start of MHT-CET-PCM
    # We need to find where app_id ends. Use regex.
    m = re.match(r'^\s*(\d+)\s+(EN\d+)\s+(.*)MHT-CET-PCM\s*\d+\.\d+', stripped)
    if not m:
        return None

    merit = int(m.group(1))
    app_id = m.group(2)
    info = m.group(3).rstrip()

    # The info ends with the minority token, then spaces, then MHT-CET-PCM
    # Split info by 2+ whitespace
    tokens = re.split(r'\s{2,}', info.strip())
    # Remove empty tokens
    tokens = [t for t in tokens if t]

    if len(tokens) < 4:  # need at least name, category, gender, minority
        return None

    # Last token should be minority
    minority = '-/-'
    if MINORITY_RE.match(tokens[-1]):
        minority = tokens[-1]
        tokens = tokens[:-1]
    else:
        # Maybe minority got merged with previous token. Try to extract.
        # Or maybe there's no minority (shouldn't happen, default to -/-)
        pass

    # Now tokens = [name, category, gender, ...Yes flags]
    # Find gender
    gender = None
    gender_idx = -1
    for i, t in enumerate(tokens):
        if t in ('Male', 'Female'):
            gender = t
            gender_idx = i
            break

    if gender is None:
        return None

    # Before gender: name + category
    before_gender = tokens[:gender_idx]
    # After gender: Yes flags
    after_gender = tokens[gender_idx + 1:]

    if len(before_gender) == 0:
        return None

    # The last token of before_gender is the category, the rest is the name
    if len(before_gender) >= 2:
        category = before_gender[-1].rstrip('$')
        name = ' '.join(before_gender[:-1]).strip()
    else:
        # Name and category merged. Try to extract category.
        merged = before_gender[0]
        cat_match = re.search(
            r'\s+(Open|OBC|SC|ST|NT\s*1(?:\s*\(NT-A\))?|NT\s*2(?:\s*\(NT-C\))?|NT\s*3(?:\s*\(NT-D\))?|DT/VJ|NT-C|NT-D|NT-A|NT-B|SBC|SEBC|VJ/DT|EWS)$',
            merged
        )
        if cat_match:
            category = cat_match.group(1)
            name = merged[:cat_match.start()].strip()
        else:
            name = merged
            category = 'Unknown'

    # Count Yes flags (we can't easily tell which column they belong to without position)
    yes_count = sum(1 for t in after_gender if t == 'Yes')

    return {
        'merit_no': merit,
        'app_id': app_id,
        'name': name,
        'category': category,
        'gender': gender,
        'yes_count': yes_count,
        'minority': minority,
        'merit_percentile': nums[0],
        'math_percentile': nums[1],
        'physics_percentile': nums[2],
        'chemistry_percentile': nums[3],
        'hsc_pcm': nums[4],
        'hsc_math': nums[5],
        'hsc_physics': nums[6],
        'hsc_total': nums[7],
        'ssc_total': nums[8],
        'ssc_math': nums[9],
        'ssc_science': nums[10],
        'ssc_english': nums[11],
    }


def main():
    with open(TXT_PATH, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()

    students = []
    skipped_examples = []
    skipped_count = 0

    for line_no, line in enumerate(lines, 1):
        # Quick filter: only lines that look like student rows
        if not ROW_START_RE.match(line):
            continue
        # Skip header lines that start with "Merit No"
        if 'Merit' in line and 'Application' in line:
            continue
        # Skip "Published on" footer
        if 'Published on' in line or 'Page ' in line and 'of 7404' in line:
            continue

        s = parse_row(line)
        if s:
            students.append(s)
        else:
            skipped_count += 1
            if len(skipped_examples) < 10:
                skipped_examples.append((line_no, line[:250]))

    print(f"Parsed {len(students)} students")
    print(f"Skipped {skipped_count} rows that looked like student rows but didn't parse")

    # Sort by merit_no
    students.sort(key=lambda s: s['merit_no'])

    # Save
    Path(OUT_PATH).parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(students, f, ensure_ascii=False, separators=(',', ':'))

    size_mb = Path(OUT_PATH).stat().st_size / (1024 * 1024)
    print(f"Saved {size_mb:.2f} MB to {OUT_PATH}")

    # Sample
    print("\nFirst 5 students:")
    for s in students[:5]:
        print(f"  #{s['merit_no']} {s['app_id']} {s['name']} | {s['category']} | {s['gender']} | {s['merit_percentile']}")

    print("\nLast 3 students:")
    for s in students[-3:]:
        print(f"  #{s['merit_no']} {s['app_id']} {s['name']} | {s['category']} | {s['gender']} | {s['merit_percentile']}")

    if skipped_examples:
        print(f"\nFirst 5 skipped lines:")
        for ln, content in skipped_examples[:5]:
            print(f"  L{ln}: {content}")

    # Test searches
    for query in ['99.89', '99.8987775', '99.99', '95.5']:
        matching = [s for s in students if s['merit_percentile'].startswith(query)]
        print(f"\nPercentile starts with '{query}': {len(matching)} matches")
        for s in matching[:2]:
            print(f"  #{s['merit_no']} {s['name']} | {s['merit_percentile']}")


if __name__ == '__main__':
    main()

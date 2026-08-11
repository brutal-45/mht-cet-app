#!/usr/bin/env python3
"""
Convert students.json from object format to compact array format to minimize size.

Format: array of arrays, where each inner array is:
  [merit_no, app_id, name, category, gender, yes_count, minority,
   merit_perc, math_perc, physics_perc, chem_perc,
   hsc_pcm, hsc_math, hsc_phy, hsc_total,
   ssc_total, ssc_math, ssc_sci, ssc_eng]

We also store a header with field indices for the frontend.
"""
import json
from pathlib import Path

IN_PATH = "/home/z/my-project/src/data/students.json"
OUT_PATH = "/home/z/my-project/src/data/students-compact.json"

# Field order
FIELDS = [
    'merit_no', 'app_id', 'name', 'category', 'gender', 'yes_count', 'minority',
    'merit_percentile', 'math_percentile', 'physics_percentile', 'chemistry_percentile',
    'hsc_pcm', 'hsc_math', 'hsc_physics', 'hsc_total',
    'ssc_total', 'ssc_math', 'ssc_science', 'ssc_english',
]


def main():
    with open(IN_PATH, 'r', encoding='utf-8') as f:
        students = json.load(f)

    print(f"Loaded {len(students)} students")

    # Convert to array format
    compact = []
    for s in students:
        row = [
            s['merit_no'],
            s['app_id'],
            s['name'],
            s['category'],
            s['gender'],
            s['yes_count'],
            s['minority'],
            s['merit_percentile'],
            s['math_percentile'],
            s['physics_percentile'],
            s['chemistry_percentile'],
            s['hsc_pcm'],
            s['hsc_math'],
            s['hsc_physics'],
            s['hsc_total'],
            s['ssc_total'],
            s['ssc_math'],
            s['ssc_science'],
            s['ssc_english'],
        ]
        compact.append(row)

    # Save with header
    output = {
        'fields': FIELDS,
        'count': len(compact),
        'students': compact,
    }

    Path(OUT_PATH).parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, separators=(',', ':'))

    size_mb = Path(OUT_PATH).stat().st_size / (1024 * 1024)
    print(f"Saved {size_mb:.2f} MB to {OUT_PATH}")

    # Compare sizes
    old_mb = Path(IN_PATH).stat().st_size / (1024 * 1024)
    print(f"Old size: {old_mb:.2f} MB → New size: {size_mb:.2f} MB (saved {old_mb - size_mb:.2f} MB)")


if __name__ == '__main__':
    main()

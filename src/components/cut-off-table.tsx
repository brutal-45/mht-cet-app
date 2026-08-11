"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { CutOffRow } from "@/lib/colleges";

interface CutOffTableProps {
  rows: CutOffRow[];
  branchName: string;
}

function stageLabel(stage: string): string {
  switch (stage) {
    case "I":
      return "Stage I";
    case "II":
      return "Stage II";
    case "III":
      return "Stage III";
    default:
      return `Stage ${stage}`;
  }
}

/**
 * Cut-off table component for a single branch.
 * Each stage gets its own table with categories as columns
 * and two rows (Rank + Percentile).
 */
export function CutOffTable({ rows, branchName }: CutOffTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No cut-off data available for this branch.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row, idx) => {
        const categories = row.categories || [];
        const ranks = row.ranks || [];
        const percs = row.percentiles || [];
        const colCount = Math.max(categories.length, ranks.length, percs.length);
        // Build aligned columns
        const cells = Array.from({ length: colCount }, (_, i) => ({
          category: categories[i] ?? "—",
          rank: ranks[i] ?? "—",
          percentile: percs[i] ?? "—",
        }));

        return (
          <div
            key={`${stageLabel(row.stage)}-${idx}`}
            className="rounded-lg border border-border/80 overflow-hidden"
          >
            <div className="flex items-center justify-between bg-muted/60 px-3 py-2 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {stageLabel(row.stage)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {colCount} categories
                </span>
              </div>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="sticky left-0 z-10 bg-muted/30 backdrop-blur w-28 min-w-28 font-semibold">
                      Type
                    </TableHead>
                    {cells.map((c, i) => (
                      <TableHead
                        key={i}
                        className="font-mono text-xs whitespace-nowrap min-w-24"
                      >
                        {c.category}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="sticky left-0 z-10 bg-background font-semibold text-xs">
                      Merit No.
                    </TableCell>
                    {cells.map((c, i) => (
                      <TableCell
                        key={i}
                        className="font-mono text-xs whitespace-nowrap"
                      >
                        {c.rank}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="bg-muted/20">
                    <TableCell className="sticky left-0 z-10 bg-muted/20 font-semibold text-xs">
                      Percentile
                    </TableCell>
                    {cells.map((c, i) => (
                      <TableCell
                        key={i}
                        className="font-mono text-xs whitespace-nowrap text-emerald-700 dark:text-emerald-400"
                      >
                        {c.percentile !== "—" ? c.percentile : "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Legend: G=General, L=Ladies, H=Home University, O=Other than Home University,
        S=State Level, AI=All India Seat. Merit No. is Maharashtra State General Merit
        No.; figures in parentheses (green) are Merit Percentiles.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CutOffTable } from "@/components/cut-off-table";
import type { College } from "@/lib/colleges";
import { ArrowLeft, Building2, GraduationCap, Layers, Search } from "lucide-react";

interface CollegeDetailProps {
  code: string;
  onBack: () => void;
  onSearchAnother: () => void;
}

export function CollegeDetail({ code, onBack, onSearchAnother }: CollegeDetailProps) {
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setError(null);
     
    setCollege(null);
    fetch(`/api/college/${encodeURIComponent(code)}`)
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Failed to load college ${code}`);
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setCollege(data as College);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unknown error");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !college) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">College not found</CardTitle>
          <CardDescription>
            {error ?? `No college exists with code "${code}".`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to search
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Parse status parts
  const statusParts = college.branches[0]?.status
    ? college.branches[0].status.split(":").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to search
        </Button>
        <Button onClick={onSearchAnother} variant="ghost" size="sm">
          <Search className="mr-2 h-4 w-4" /> Search another college
        </Button>
      </div>

      {/* College header card */}
      <Card className="border-emerald-200 dark:border-emerald-900">
        <CardHeader>
          <div className="flex flex-wrap items-start gap-3">
            <Badge
              variant="outline"
              className="font-mono text-base px-3 py-1 bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
            >
              {college.code}
            </Badge>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl sm:text-3xl leading-tight">
                {college.name}
              </CardTitle>
              <CardDescription className="mt-1">
                CAP Round I — Maharashtra &amp; Minority Seats, FY 2025-26
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted/40">
              <GraduationCap className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Branches</p>
                <p className="text-sm font-semibold">{college.branches.length}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted/40">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Institute Type</p>
                <p className="text-sm font-semibold">
                  {statusParts[0] ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted/40">
              <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">University</p>
                <p className="text-sm font-semibold truncate">
                  {statusParts[1] ?? "—"}
                </p>
              </div>
            </div>
          </div>
          {statusParts[2] && (
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium">Affiliation:</span> {statusParts[2]}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branches list */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <GraduationCap className="h-5 w-5" /> Branch-wise Cut-off Details
        </h2>
        <Accordion type="multiple" className="w-full space-y-3" defaultValue={[`branch-0`]}>
          {college.branches.map((branch, idx) => (
            <AccordionItem
              key={branch.branch_code}
              value={`branch-${idx}`}
              className="border border-border/80 rounded-lg overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/40 hover:no-underline [&[data-state=open]]:bg-muted/50">
                <div className="flex flex-wrap items-center gap-3 text-left w-full min-w-0">
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs shrink-0"
                  >
                    {branch.branch_code}
                  </Badge>
                  <span className="font-medium text-sm sm:text-base truncate">
                    {branch.branch_name}
                  </span>
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs shrink-0 hidden sm:inline-flex"
                  >
                    {branch.rows.length} stage{branch.rows.length > 1 ? "s" : ""}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2">
                <div className="text-xs text-muted-foreground mb-3">
                  <span className="font-medium text-foreground">Status:</span>{" "}
                  {branch.status || "—"}
                </div>
                <CutOffTable rows={branch.rows} branchName={branch.branch_name} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

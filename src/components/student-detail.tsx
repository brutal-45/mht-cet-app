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
  Trophy,
  User,
  ArrowLeft,
  Search,
  GraduationCap,
  FlaskConical,
  Atom,
  Calculator,
  School,
  BookOpen,
} from "lucide-react";
import type { Student } from "@/lib/students";

interface StudentDetailProps {
  rank: number;
  onBack: () => void;
  onSearchAnother: () => void;
}

function FieldRow({
  label,
  value,
  icon: Icon,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/30 transition-colors">
      <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span
        className={`text-sm ${mono ? "font-mono" : "font-medium"} ${
          highlight ? "text-emerald-700 dark:text-emerald-400 font-semibold" : ""
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

export function StudentDetail({ rank, onBack, onSearchAnother }: StudentDetailProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
     
    setError(null);
     
    setStudent(null);
    fetch(`/api/student/${rank}`)
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Failed to load student #${rank}`);
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setStudent(data as Student);
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
  }, [rank]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Student not found</CardTitle>
          <CardDescription>{error ?? `No student with rank #${rank}.`}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to search
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to search
        </Button>
        <Button onClick={onSearchAnother} variant="ghost" size="sm">
          <Search className="mr-2 h-4 w-4" /> Search another student
        </Button>
      </div>

      {/* Hero card */}
      <Card className="border-emerald-200 dark:border-emerald-900">
        <CardHeader>
          <div className="flex flex-wrap items-start gap-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-emerald-600 text-white shrink-0">
              <Trophy className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className="font-mono text-base px-3 py-1 bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                >
                  Rank #{student.merit_no}
                </Badge>
                <Badge variant="secondary">{student.category}</Badge>
                <Badge variant="outline">{student.gender}</Badge>
                {student.yes_count > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                  >
                    {student.yes_count} reservation flag{student.yes_count > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl sm:text-3xl leading-tight">
                {student.name || "(Name withheld)"}
              </CardTitle>
              <CardDescription className="mt-1 font-mono">
                Application ID: {student.app_id}
              </CardDescription>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">MHT-CET Percentile</p>
              <p className="text-3xl sm:text-4xl font-bold font-mono text-emerald-700 dark:text-emerald-400 leading-tight">
                {student.merit_percentile}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MHT-CET scores */}
        <SectionCard title="MHT-CET-PCM Subject Percentiles" icon={Calculator}>
          <FieldRow
            label="Overall Merit Percentile"
            value={student.merit_percentile}
            mono
            highlight
          />
          <FieldRow label="Mathematics" value={student.math_percentile} mono />
          <FieldRow label="Physics" value={student.physics_percentile} mono />
          <FieldRow label="Chemistry" value={student.chemistry_percentile} mono />
        </SectionCard>

        {/* Personal / reservation */}
        <SectionCard title="Personal & Reservation" icon={User}>
          <FieldRow label="Merit Rank" value={`#${student.merit_no}`} mono highlight />
          <FieldRow label="Application ID" value={student.app_id} mono />
          <FieldRow label="Category" value={student.category} />
          <FieldRow label="Gender" value={student.gender} />
          <FieldRow
            label="Reservation flags (PWD/EWS/TFWS/Orphan)"
            value={student.yes_count > 0 ? `${student.yes_count} active` : "None"}
          />
          <FieldRow label="Minority Type (LM/RM)" value={student.minority} />
        </SectionCard>

        {/* HSC marks */}
        <SectionCard title="HSC (Class 12)" icon={School}>
          <FieldRow label="HSC PCM %" value={student.hsc_pcm} mono />
          <FieldRow label="HSC Math %" value={student.hsc_math} mono />
          <FieldRow label="HSC Physics %" value={student.hsc_physics} mono />
          <FieldRow
            label="HSC / Diploma / D.Voc. Total %"
            value={student.hsc_total}
            mono
            highlight
          />
        </SectionCard>

        {/* SSC marks */}
        <SectionCard title="SSC (Class 10)" icon={BookOpen}>
          <FieldRow label="SSC Total %" value={student.ssc_total} mono />
          <FieldRow label="SSC Math %" value={student.ssc_math} mono />
          <FieldRow label="SSC Science %" value={student.ssc_science} mono />
          <FieldRow label="SSC English %" value={student.ssc_english} mono />
        </SectionCard>
      </div>

      {/* Subjects legend */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">About this data</p>
          <p>
            Source: <span className="font-mono">FE2026_PCMMH_MeritList_Final.pdf</span> (4,958 pages, 229,359 candidates) published by the State CET Cell, Maharashtra on 27 July 2026 for A.Y. 2026-27 admissions to First Year Engineering &amp; Technology and Integrated M.E./M.Tech programs.
          </p>
          <p>
            This is the <strong>final</strong> merit list for Maharashtra State PCM candidates. Rankings here are locked and used for CAP counselling.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

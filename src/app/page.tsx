"use client";

import { useEffect, useState, useCallback } from "react";
import { CollegeSearch } from "@/components/college-search";
import { CollegeDetail } from "@/components/college-detail";
import { StudentSearch } from "@/components/student-search";
import { StudentDetail } from "@/components/student-detail";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo, Wordmark } from "@/components/logo";
import { BrutalToolsBadge } from "@/components/brutal-tools-badge";
import {
  Building2,
  Layers,
  BookOpen,
  Database,
  Info,
  ShieldCheck,
  Trophy,
  Users,
  GraduationCap,
  Percent,
} from "lucide-react";

interface Stats {
  totalColleges: number;
  totalBranches: number;
  totalRows: number;
}

type Tab = "colleges" | "students";

export default function Home() {
  const [tab, setTab] = useState<Tab>("colleges");
  const [selectedCollegeCode, setSelectedCollegeCode] = useState<string | null>(null);
  const [selectedStudentRank, setSelectedStudentRank] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  // Sync from URL hash on mount + hashchange
  // Hash formats:
  //   #01002        → college code (5-digit, zero-padded)
  //   #s123         → student rank 123
  //   empty         → home (search)
  useEffect(() => {
    const syncHash = () => {
      const raw = window.location.hash.replace(/^#/, "").trim();
      if (!raw) {
        setSelectedCollegeCode(null);
        setSelectedStudentRank(null);
        return;
      }
      if (raw.startsWith("s") && /^\d+$/.test(raw.slice(1))) {
        const rank = parseInt(raw.slice(1), 10);
        setSelectedStudentRank(rank);
        setSelectedCollegeCode(null);
        setTab("students");
      } else if (/^\d{1,5}$/.test(raw)) {
        const code = raw.padStart(5, "0");
        setSelectedCollegeCode(code);
        setSelectedStudentRank(null);
        setTab("colleges");
      } else {
        setSelectedCollegeCode(null);
        setSelectedStudentRank(null);
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  // Fetch college stats once
  useEffect(() => {
    fetch("/api/colleges")
      .then((r) => r.json())
      .then((data) => {
        const results = data.results ?? [];
        const totalRows = results.reduce(
          (acc: number, r: { branchCount: number }) => acc + r.branchCount,
          0
        );
        setStats({
          totalColleges: results.length,
          totalBranches: totalRows,
          totalRows,
        });
      })
      .catch(() => void 0);
  }, []);

  // Fetch student count once (when user first switches to students tab)
  useEffect(() => {
    if (tab !== "students" || studentCount !== null) return;
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => setStudentCount(data.total ?? data.count ?? 0))
      .catch(() => void 0);
  }, [tab, studentCount]);

  const onSelectCollege = useCallback((code: string) => {
    const normalized = code.padStart(5, "0");
    setSelectedCollegeCode(normalized);
    if (window.location.hash !== `#${normalized}`) {
      window.location.hash = normalized;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onSelectStudent = useCallback((rank: number) => {
    setSelectedStudentRank(rank);
    if (window.location.hash !== `#s${rank}`) {
      window.location.hash = `s${rank}`;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const onBackToCollegeSearch = useCallback(() => {
    setSelectedCollegeCode(null);
    if (window.location.hash) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  const onBackToStudentSearch = useCallback(() => {
    setSelectedStudentRank(null);
    if (window.location.hash) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  const onTabChange = useCallback((newTab: Tab) => {
    setTab(newTab);
    // Clear selections when switching tabs
    setSelectedCollegeCode(null);
    setSelectedStudentRank(null);
    if (window.location.hash) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  const showCollegeDetail = tab === "colleges" && selectedCollegeCode !== null;
  const showStudentDetail = tab === "students" && selectedStudentRank !== null;
  const showSearch = !showCollegeDetail && !showStudentDetail;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/40 via-background to-background dark:from-emerald-950/20">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/85 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onTabChange("colleges")}
            className="flex items-center gap-2.5 min-w-0 group"
            aria-label="Go to home / search"
          >
            <Logo size={38} />
            <Wordmark
              title="CAP Cut-off Finder"
              subtitle="Maharashtra Engineering · 2025-26"
            />
          </button>
          {/* Right-side stats depending on active tab */}
          {tab === "colleges" && stats && (
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">{stats.totalColleges}</span> colleges
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">{stats.totalBranches}</span> branches
              </span>
            </div>
          )}
          {tab === "students" && studentCount !== null && (
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">{studentCount.toLocaleString()}</span> candidates
              </span>
            </div>
          )}
        </div>

        {/* Tab bar (only on search screen, hidden on detail screens to maximize space) */}
        {showSearch && (
          <div className="max-w-6xl mx-auto px-4 pb-2.5 -mt-1">
            <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-sm">
              <button
                type="button"
                onClick={() => onTabChange("colleges")}
                className={`px-4 py-1.5 rounded-md transition-colors inline-flex items-center gap-1.5 ${
                  tab === "colleges"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-4 w-4" />
                CAP Cut-off 2025-26
              </button>
              <button
                type="button"
                onClick={() => onTabChange("students")}
                className={`px-4 py-1.5 rounded-md transition-colors inline-flex items-center gap-1.5 ${
                  tab === "students"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Trophy className="h-4 w-4" />
                Final Merit List 2026
                <Badge
                  variant="secondary"
                  className="ml-1 text-[10px] px-1.5 py-0 h-4"
                >
                  NEW
                </Badge>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
          {/* ============ COLLEGES TAB ============ */}
          {tab === "colleges" &&
            (showCollegeDetail ? (
              <CollegeDetail
                code={selectedCollegeCode!}
                onBack={onBackToCollegeSearch}
                onSearchAnother={onBackToCollegeSearch}
              />
            ) : (
              <>
                {/* Hero search section */}
                <section className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    >
                      <BookOpen className="h-3 w-3 mr-1" /> CAP Round I · 2025-26
                    </Badge>
                    <BrutalToolsBadge variant="pill" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    Find Your Engineering College{" "}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      by Code
                    </span>
                  </h2>
                  <p className="text-base sm:text-lg text-muted-foreground mb-7 leading-relaxed">
                    Enter a <span className="font-semibold text-foreground">5-digit college code</span>{" "}
                    (like <span className="font-mono text-emerald-700 dark:text-emerald-400">01002</span> for
                    Government College of Engineering, Amravati) or part of a college name to instantly
                    see branch-wise CAP Round 1 cut-offs — Merit No. &amp; Percentile for every category.
                  </p>
                  <CollegeSearch onSelectCollege={onSelectCollege} autoFocus />
                </section>

                {/* Stats cards */}
                {stats && (
                  <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mb-10 sm:mb-14">
                    <Card className="border-emerald-200/60 dark:border-emerald-900/50">
                      <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-bold leading-tight">{stats.totalColleges}</p>
                          <p className="text-xs text-muted-foreground">Colleges</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-200/60 dark:border-emerald-900/50">
                      <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-bold leading-tight">{stats.totalBranches}</p>
                          <p className="text-xs text-muted-foreground">Branches</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-200/60 dark:border-emerald-900/50 col-span-2 sm:col-span-1">
                      <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Database className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-bold leading-tight">6,341</p>
                          <p className="text-xs text-muted-foreground">Cut-off entries</p>
                        </div>
                      </CardContent>
                    </Card>
                  </section>
                )}

                {/* How to use */}
                <section className="max-w-3xl mx-auto">
                  <Card>
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold mb-3">How to use this tool</h3>
                          <ol className="space-y-2.5 text-sm text-muted-foreground">
                            <li className="flex gap-2.5">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">1.</span>
                              <span>
                                Type a <strong className="text-foreground">5-digit college code</strong> from
                                your CAP brochure (e.g. <span className="font-mono">01002</span>). Partial
                                codes like <span className="font-mono">11</span> also work — they list every
                                college whose code begins with <span className="font-mono">11</span>.
                              </span>
                            </li>
                            <li className="flex gap-2.5">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">2.</span>
                              <span>
                                Or type part of a <strong className="text-foreground">college name</strong> —
                                e.g. <em>COEP</em>, <em>VJTI</em>, <em>Government</em>, <em>Walchand</em>.
                              </span>
                            </li>
                            <li className="flex gap-2.5">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">3.</span>
                              <span>
                                Click a result to open the college page. Every branch shows category-wise
                                Maharashtra State <strong className="text-foreground">Merit No.</strong> and{" "}
                                <strong className="text-foreground">Merit Percentile</strong> for CAP Round I.
                              </span>
                            </li>
                            <li className="flex gap-2.5">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">4.</span>
                              <span>
                                Each college page is shareable via URL hash (e.g.{" "}
                                <span className="font-mono text-xs">…/#01002</span>) — bookmark it or send
                                the link to a friend.
                              </span>
                            </li>
                          </ol>
                          <div className="mt-5 pt-4 border-t border-border/60 text-xs text-muted-foreground space-y-2">
                            <p className="font-medium text-foreground">Category legend</p>
                            <p>
                              Starting letter: <strong>G</strong>=General, <strong>L</strong>=Ladies.
                              Ending letter: <strong>H</strong>=Home University,{" "}
                              <strong>O</strong>=Other than Home University,{" "}
                              <strong>S</strong>=State Level, <strong>AI</strong>=All India Seat.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Disclaimer card */}
                  <Card className="mt-4 border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10">
                    <CardContent className="p-4 sm:p-5 flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">Disclaimer:</span>{" "}
                        This is an unofficial search interface built to make the publicly published
                        CAP Round I cut-off data easier to browse. Numbers are extracted from the
                        State CET Cell Maharashtra PDF. Always verify with the official CET Cell
                        notification before making admission decisions.
                      </p>
                    </CardContent>
                  </Card>
                </section>
              </>
            ))}

          {/* ============ STUDENTS TAB ============ */}
          {tab === "students" &&
            (showStudentDetail ? (
              <StudentDetail
                rank={selectedStudentRank!}
                onBack={onBackToStudentSearch}
                onSearchAnother={onBackToStudentSearch}
              />
            ) : (
              <>
                {/* Hero search section */}
                <section className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    >
                      <Trophy className="h-3 w-3 mr-1" /> Final Merit List · 2026-27
                    </Badge>
                    <BrutalToolsBadge variant="pill" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    Find Any Candidate by{" "}
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Rank, Percentile or Name
                    </span>
                  </h2>
                  <p className="text-base sm:text-lg text-muted-foreground mb-7 leading-relaxed">
                    Search the <span className="font-semibold text-foreground">Final Merit List</span>{" "}
                    for Maharashtra State PCM candidates (A.Y. 2026-27). Enter a{" "}
                    <span className="font-semibold text-foreground">merit rank</span> (e.g.{" "}
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">1</span>,{" "}
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">5000</span>), a{" "}
                    <span className="font-semibold text-foreground">MHT-CET percentile</span> (e.g.{" "}
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">99.8987775</span> or
                    partial like{" "}
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">99.89</span>), or a{" "}
                    <span className="font-semibold text-foreground">candidate name</span> (e.g.{" "}
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">WANKHEDE ADITYA SATISH</span> or{" "}
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">ADITYA WANKHEDE</span> — token order doesn't matter).
                  </p>
                  <StudentSearch onSelectStudent={onSelectStudent} />
                </section>

                {/* Stats cards */}
                <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl mx-auto mb-10 sm:mb-14">
                  <Card className="border-emerald-200/60 dark:border-emerald-900/50">
                    <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xl font-bold leading-tight">
                          {studentCount !== null ? studentCount.toLocaleString() : "229,359"}
                        </p>
                        <p className="text-xs text-muted-foreground">Candidates</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-200/60 dark:border-emerald-900/50">
                    <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xl font-bold leading-tight">1–229,563</p>
                        <p className="text-xs text-muted-foreground">Merit rank range</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-200/60 dark:border-emerald-900/50 col-span-2 sm:col-span-1">
                    <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Percent className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xl font-bold leading-tight">100.0 – 0.00</p>
                        <p className="text-xs text-muted-foreground">Percentile range</p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* How to use */}
                <section className="max-w-3xl mx-auto">
                  <Card>
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold mb-3">How to search</h3>
                          <ol className="space-y-2.5 text-sm text-muted-foreground">
                            <li className="flex gap-2.5">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">1.</span>
                              <span>
                                Pick a mode using the toggle above the search bar:{" "}
                                <strong className="text-foreground">Auto</strong> (smart detect),{" "}
                                <strong className="text-foreground">By Rank</strong>,{" "}
                                <strong className="text-foreground">By Percentile</strong>, or{" "}
                                <strong className="text-foreground">By Name</strong>.
                              </span>
                            </li>
                            <li className="flex gap-2.5">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">2.</span>
                              <span>
                                For <strong className="text-foreground">rank search</strong>, enter an
                                integer like <span className="font-mono">1</span>,{" "}
                                <span className="font-mono">5000</span>, or{" "}
                                <span className="font-mono">150000</span>. We show the matching candidate
                                plus nearby ranks so you can scan neighbors.
                              </span>
                            </li>
                            <li className="flex gap-2.5">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">3.</span>
                              <span>
                                For <strong className="text-foreground">percentile search</strong>, enter
                                the full 7-decimal value (e.g.{" "}
                                <span className="font-mono">99.8987775</span>) for an exact match, or a
                                partial prefix (e.g. <span className="font-mono">99.89</span>) to list all
                                candidates whose percentile starts with those digits.
                              </span>
                            </li>
                            <li className="flex gap-2.5">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">4.</span>
                              <span>
                                For <strong className="text-foreground">name search</strong>, type any part
                                of the candidate's name — tokens can be in any order, so both{" "}
                                <span className="font-mono">WANKHEDE ADITYA SATISH</span> and{" "}
                                <span className="font-mono">ADITYA WANKHEDE</span> will find the same student.
                                Partial tokens like <span className="font-mono">WANKH</span> also work.
                              </span>
                            </li>
                            <li className="flex gap-2.5">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">5.</span>
                              <span>
                                Click any result to see the full candidate profile — MHT-CET subject
                                percentiles, HSC marks, SSC marks, category, gender, and reservation flags.
                                Each profile is shareable via URL (e.g.{" "}
                                <span className="font-mono text-xs">…/#s5000</span>).
                              </span>
                            </li>
                          </ol>
                          <div className="mt-5 pt-4 border-t border-border/60 text-xs text-muted-foreground space-y-2">
                            <p className="font-medium text-foreground">About the data</p>
                            <p>
                              Source: <span className="font-mono">FE2026_PCMMH_MeritList_Final.pdf</span>{" "}
                              (4,958 pages, 229,359 candidates) published by the State CET Cell Maharashtra
                              on 27 July 2026 for A.Y. 2026-27 admissions to First Year Engineering &amp;
                              Technology and Integrated M.E./M.Tech (5-year) programs.
                            </p>
                            <p>
                              This is the <strong>final</strong> merit list for Maharashtra State PCM
                              candidates — rankings here are locked and used for CAP counselling.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Disclaimer card */}
                  <Card className="mt-4 border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10">
                    <CardContent className="p-4 sm:p-5 flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">Disclaimer:</span>{" "}
                        This is an unofficial search interface built to make the publicly published
                        final merit list easier to browse. Always verify with the official CET Cell
                        notification. Candidate names are shown exactly as published in the PDF.
                      </p>
                    </CardContent>
                  </Card>
                </section>
              </>
            ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/85 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-5 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Logo size={24} />
              <div className="text-left">
                <p className="font-semibold text-foreground leading-tight">CAP Cut-off Finder</p>
                <p className="text-[10px] leading-tight mt-0.5">
                  CAP Round 1 · 1,566 pages · 368 colleges · 2,134 branches
                  <span className="mx-1.5">·</span>
                  Final Merit List · 4,958 pages · 229,359 candidates
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-1.5">
              <BrutalToolsBadge variant="footer" />
              <p className="text-[10px] text-center sm:text-right">
                For informational use only. Verify with official CET Cell notifications.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

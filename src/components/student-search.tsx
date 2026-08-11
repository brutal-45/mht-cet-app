"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  X,
  Trophy,
  Percent,
  ArrowRight,
  Sparkles,
  Hash,
  User,
} from "lucide-react";

export interface StudentSearchResult {
  merit_no: number;
  app_id: string;
  name: string;
  category: string;
  gender: string;
  merit_percentile: string;
}

interface StudentSearchProps {
  onSelectStudent: (rank: number) => void;
  initialMode?: "auto" | "rank" | "percentile" | "name";
}

type SearchMode = "auto" | "rank" | "percentile" | "name";

export function StudentSearch({
  onSelectStudent,
  initialMode = "auto",
}: StudentSearchProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [searchMeta, setSearchMeta] = useState<{
    mode?: string;
    exact_match?: boolean;
    limited?: boolean;
    total?: number;
  }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
       
      setLoading(false);
       
      setSearchMeta({});
      return;
    }
     
    setLoading(true);
    const t = setTimeout(() => {
      // For name mode, use a smaller limit (100) — larger would overwhelm the dropdown.
      // For other modes, allow up to 5000.
      const urlLimit = mode === "name" ? 100 : 5000;
      fetch(`/api/students?q=${encodeURIComponent(q)}&mode=${mode}&limit=${urlLimit}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.results ?? []);
          setSearchMeta({
            mode: data.mode,
            exact_match: data.exact_match,
            limited: data.limited,
            total: data.total,
          });
          setLoading(false);
          setHighlightIdx(-1);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [query, mode]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (rank: number) => {
      setFocused(false);
      setQuery("");
      onSelectStudent(rank);
    },
    [onSelectStudent]
  );

  const showDropdown = focused && query.trim().length > 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target =
        highlightIdx >= 0 && highlightIdx < results.length
          ? results[highlightIdx]
          : results[0];
      if (target) handleSelect(target.merit_no);
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  const exampleQueries = [
    { label: "Rank #1", value: "1", mode: "rank" as const },
    { label: "Rank #5000", value: "5000", mode: "rank" as const },
    { label: "99.8987775", value: "99.8987775", mode: "percentile" as const },
    { label: "99.89", value: "99.89", mode: "percentile" as const },
    { label: "95.5", value: "95.5", mode: "percentile" as const },
    { label: "ADITYA WANKHEDE", value: "ADITYA WANKHEDE", mode: "name" as const },
    { label: "WANKHEDE", value: "WANKHEDE", mode: "name" as const },
  ];

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Mode toggle */}
      <div className="flex justify-center mb-3">
        <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-0.5 text-xs flex-wrap gap-0.5">
          <button
            type="button"
            onClick={() => setMode("auto")}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              mode === "auto"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3 w-3 inline mr-1" />
            Auto
          </button>
          <button
            type="button"
            onClick={() => setMode("rank")}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              mode === "rank"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="h-3 w-3 inline mr-1" />
            By Rank
          </button>
          <button
            type="button"
            onClick={() => setMode("percentile")}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              mode === "percentile"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Percent className="h-3 w-3 inline mr-1" />
            By Percentile
          </button>
          <button
            type="button"
            onClick={() => setMode("name")}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              mode === "name"
                ? "bg-emerald-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-3 w-3 inline mr-1" />
            By Name
          </button>
        </div>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={
            mode === "rank"
              ? "Enter merit rank (e.g. 1, 5000, 100000)..."
              : mode === "percentile"
                ? "Enter MHT-CET percentile (e.g. 99.8987775 or 99.89)..."
                : mode === "name"
                  ? "Enter candidate name (e.g. WANKHEDE ADITYA SATISH or ADITYA WANKHEDE)..."
                  : "Enter rank, percentile, or candidate name..."
          }
          className="pl-10 pr-10 h-14 text-base sm:text-lg shadow-sm border-2 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
          aria-label="Search students by rank, percentile, or name"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute z-30 mt-2 w-full bg-popover border border-border rounded-lg shadow-lg max-h-[70vh] overflow-y-auto"
        >
          {loading && (
            <div className="p-3 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No matches found.</p>
              <p className="mt-1">
                {mode === "rank"
                  ? "Make sure the rank is a positive integer (1 to ~229,563)."
                  : mode === "percentile"
                    ? "Enter a valid percentile (0–100), e.g. 99.89 or 99.8987775."
                    : mode === "name"
                      ? "Try a different spelling or fewer tokens. The PDF uses uppercase names — e.g. WANKHEDE ADITYA SATISH."
                      : "Enter a rank, percentile, or candidate name."}
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              {/* Result meta header */}
              <div className="px-3 py-2 text-xs border-b border-border bg-muted/30 flex items-center justify-between gap-2 sticky top-0 z-10 backdrop-blur-sm">
                <span className="text-muted-foreground">
                  {searchMeta.exact_match
                    ? searchMeta.mode === "percentile"
                      ? "Exact percentile match"
                      : "Exact match"
                    : searchMeta.mode === "rank"
                      ? "Rank + nearby students"
                      : searchMeta.mode === "name"
                        ? "Name match (any token order)"
                        : "Percentile prefix match"}
                  {" · "}
                  <span className="font-semibold text-foreground">
                    {searchMeta.total ?? results.length}
                  </span>{" "}
                  student{(searchMeta.total ?? results.length) !== 1 ? "s" : ""}
                  {searchMeta.limited && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {"  ·  showing first "}{results.length}{", refine your query for fewer"}
                    </span>
                  )}
                </span>
              </div>

              <ul className="py-1">
                {results.map((r, idx) => (
                  <li key={r.merit_no} role="option" aria-selected={idx === highlightIdx}>
                    <button
                      type="button"
                      onClick={() => handleSelect(r.merit_no)}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                        idx === highlightIdx
                          ? "bg-emerald-50 dark:bg-emerald-950/40"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <span className="inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-semibold shrink-0">
                        #{r.merit_no}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">
                          {r.name || "(Name withheld)"}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {r.app_id} · {r.category} · {r.gender}
                        </span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="block text-sm font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {r.merit_percentile}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          percentile
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Example chips */}
      {!query && (
        <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Try:
          </span>
          {exampleQueries.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setMode(ex.mode);
                setQuery(ex.value);
                inputRef.current?.focus();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-muted/60 transition-colors"
            >
              {ex.mode === "rank" ? (
                <Hash className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              ) : ex.mode === "percentile" ? (
                <Percent className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <User className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              )}
              {ex.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

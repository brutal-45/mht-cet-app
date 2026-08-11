"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Hash, Building2, ArrowRight, Sparkles } from "lucide-react";

export interface CollegeSearchResult {
  code: string;
  name: string;
  branchCount: number;
  branchNames: string[];
}

interface CollegeSearchProps {
  onSelectCollege: (code: string) => void;
  initialValue?: string;
  autoFocus?: boolean;
}

export function CollegeSearch({
  onSelectCollege,
  initialValue = "",
  autoFocus = false,
}: CollegeSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<CollegeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
       
      setLoading(false);
      return;
    }
     
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/colleges?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.results ?? []);
          setLoading(false);
          setHighlightIdx(-1);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
        });
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (code: string) => {
      setFocused(false);
      setQuery("");
      onSelectCollege(code);
    },
    [onSelectCollege]
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
      if (target) {
        handleSelect(target.code);
      } else if (/^\d{1,5}$/.test(query.trim())) {
        // Direct code lookup even if no result
        handleSelect(query.trim().padStart(5, "0"));
      }
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  const exampleCodes = ["01002", "03012", "03014", "16006"];

  return (
    <div ref={containerRef} className="w-full relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          placeholder="Search by college code (e.g. 01002) or name (e.g. Government, COEP, VJTI)..."
          className="pl-10 pr-10 h-14 text-base sm:text-lg shadow-sm border-2 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
          aria-label="Search colleges by code or name"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="college-search-listbox"
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

      {showDropdown && (
        <div
          id="college-search-listbox"
          role="listbox"
          className="absolute z-30 mt-2 w-full bg-popover border border-border rounded-lg shadow-lg max-h-[60vh] overflow-y-auto"
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
                Try a 5-digit college code (e.g. <span className="font-mono">01002</span>) or
                part of a college name.
              </p>
              {/^\d+$/.test(query.trim()) && (
                <button
                  type="button"
                  onClick={() => handleSelect(query.trim().padStart(5, "0"))}
                  className="mt-2 inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Try direct lookup: {query.trim().padStart(5, "0")}{" "}
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-1">
              {results.map((r, idx) => (
                <li key={r.code} role="option" aria-selected={idx === highlightIdx}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r.code)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                      idx === highlightIdx
                        ? "bg-emerald-50 dark:bg-emerald-950/40"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-semibold shrink-0">
                      {r.code}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">
                        {r.name}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {r.branchCount} branch{r.branchCount !== 1 ? "es" : ""}
                        {r.branchNames.length > 0 && (
                          <> · {r.branchNames.slice(0, 3).join(", ")}{r.branchNames.length > 3 ? "..." : ""}</>
                        )}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Example chips */}
      {!query && (
        <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Try:
          </span>
          {exampleCodes.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setQuery(c.padStart(5, "0"));
                inputRef.current?.focus();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-muted/60 transition-colors font-mono"
            >
              <Hash className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              {c.padStart(5, "0")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setQuery("Government");
              inputRef.current?.focus();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-muted/60 transition-colors"
          >
            <Building2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Government
          </button>
        </div>
      )}
    </div>
  );
}

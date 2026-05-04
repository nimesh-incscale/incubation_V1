import { useEffect, useMemo, useRef, useState, useCallback } from "react";
//import axios from "axios";
import api from "../lib/api";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, ArrowDownAZ, RotateCcw, Database, Sparkles, Building2, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";

import PortfolioCard from "../components/PortfolioCard";
import PortfolioCardSkeleton from "../components/PortfolioCardSkeleton";
import FilterSidebar from "../components/FilterSidebar";
import DetailModal from "../components/DetailModal";
import ThemeToggle from "../components/ThemeToggle";
import EmptyState from "../components/EmptyState";

import useDebounce from "../hooks/useDebounce";
import { downloadCsv } from "../lib/csv";
import { filtersToParams, paramsToFilters } from "../lib/urlState";
import { toast } from "sonner";

//const API = `${import.meta.env.VITE_BACKEND_URL || ""}/api`;
const PAGE_SIZE = 12;

const SORTS = [
    { id: "grant_desc", label: "Grant remaining · High to Low", field: "totalGrantremainingAmount", dir: -1 },
    { id: "grant_asc", label: "Grant remaining · Low to High", field: "totalGrantremainingAmount", dir: 1 },
    { id: "approved_desc", label: "First approved · High to Low", field: "first_total_approved_amt", dir: -1 },
    { id: "name_asc", label: "Incubator name · A → Z", field: "incubator_name", dir: 1 },
    { id: "eval_desc", label: "Evaluation score · High to Low", field: "evaluation", dir: -1 },
];

const INITIAL_FILTERS = {
    search: "",
    incubators: [],
    sectors: [],
    states: [],
    cities: [],
    ranges: {},
};

export default function Dashboard() {
    const [items, setItems] = useState([]);
    const [facets, setFacets] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [sort, setSort] = useState(SORTS[0].id);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [selected, setSelected] = useState(null);
    const hydratedRef = useRef(false);

    const debouncedSearch = useDebounce(filters.search, 200);
    const sentinelRef = useRef(null);

    // ----- Data fetching + URL hydration -----
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                // const [p, f] = await Promise.all([
                //     axios.get(`${API}/portfolio`),
                //     axios.get(`${API}/portfolio/facets`),
                // ]);
                const [p, f] = await Promise.all([
                    api.get("/portfolio"),
                    api.get("/portfolio/facets"),
                ]); 
                if (!mounted) return;
                setItems(p.data?.data || []);
                setFacets(f.data);
                // Hydrate filters from URL (or fall back to full extents).
                const { filters: hydrated, sort: hydratedSort } = paramsToFilters({
                    params: searchParams,
                    facets: f.data,
                    defaultSort: SORTS[0].id,
                });
                setFilters(hydrated);
                setSort(hydratedSort);
                hydratedRef.current = true;
            } catch (e) {
                console.error(e);
                if (mounted) setError("Could not load portfolio data. Please try again.");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ----- Sync filters/sort -> URL params -----
    useEffect(() => {
        if (!hydratedRef.current || !facets) return;
        const next = filtersToParams({
            filters,
            sort,
            defaultSort: SORTS[0].id,
            facets,
        });
        setSearchParams(next, { replace: true });
    }, [filters, sort, facets, setSearchParams]);

    // ----- Filtering & sorting (memoised) -----
    const filteredSorted = useMemo(() => {
        if (!items.length) return [];
        const q = debouncedSearch.trim().toLowerCase();

        const inRange = (val, range) => {
            if (!range) return true;
            const [min, max] = range;
            return val >= min && val <= max;
        };

        const out = items.filter((it) => {
            if (q) {
                const blob = `${it.incubator_name} ${it.sectors} ${it.city} ${it.state}`.toLowerCase();
                if (!blob.includes(q)) return false;
            }
            if (filters.incubators.length && !filters.incubators.includes(it.incubator_name)) return false;
            if (filters.states.length && !filters.states.includes(it.state)) return false;
            if (filters.cities.length && !filters.cities.includes(it.city)) return false;
            if (filters.sectors.length) {
                const has = filters.sectors.some((s) => it.sectors_list.includes(s));
                if (!has) return false;
            }
            const r = filters.ranges || {};
            if (!inRange(it.first_total_approved_amt, r.first_total_approved_amt)) return false;
            if (!inRange(it.reapply_total_approved_amt, r.reapply_total_approved_amt)) return false;
            if (!inRange(it.totalRemainingAmount, r.totalRemainingAmount)) return false;
            if (!inRange(it.totalGrantremainingAmount, r.totalGrantremainingAmount)) return false;
            return true;
        });

        const cfg = SORTS.find((s) => s.id === sort) || SORTS[0];
        out.sort((a, b) => {
            const av = a[cfg.field] ?? 0;
            const bv = b[cfg.field] ?? 0;
            if (typeof av === "string" || typeof bv === "string") {
                return cfg.dir * String(av).localeCompare(String(bv));
            }
            return cfg.dir * (av - bv);
        });
        return out;
    }, [items, debouncedSearch, filters, sort]);

    // Reset infinite-scroll window when filters change.
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [debouncedSearch, filters.incubators, filters.sectors, filters.states, filters.cities, filters.ranges, sort]);

    // Infinite scroll observer.
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((v) => Math.min(v + PAGE_SIZE, filteredSorted.length));
                }
            },
            { rootMargin: "240px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [filteredSorted.length]);

    const visibleItems = filteredSorted.slice(0, visibleCount);

    const resetAll = useCallback(() => {
        if (!facets) return setFilters(INITIAL_FILTERS);
        setFilters({
            search: "",
            incubators: [],
            sectors: [],
            states: [],
            cities: [],
            ranges: {
                first_total_approved_amt: [
                    facets.ranges.first_total_approved_amt.min,
                    facets.ranges.first_total_approved_amt.max,
                ],
                reapply_total_approved_amt: [
                    facets.ranges.reapply_total_approved_amt.min,
                    facets.ranges.reapply_total_approved_amt.max,
                ],
                totalRemainingAmount: [
                    facets.ranges.totalRemainingAmount.min,
                    facets.ranges.totalRemainingAmount.max,
                ],
                totalGrantremainingAmount: [
                    facets.ranges.totalGrantremainingAmount.min,
                    facets.ranges.totalGrantremainingAmount.max,
                ],
            },
        });
    }, [facets]);

    const totalCount = items.length;
    const filteredCount = filteredSorted.length;

    const exportCsv = useCallback(() => {
        if (!filteredSorted.length) {
            toast.error("Nothing to export — filters return zero rows.");
            return;
        }
        const stamp = new Date().toISOString().slice(0, 10);
        downloadCsv(filteredSorted, `seedfund-portfolio-${stamp}.csv`);
        toast.success(`Exported ${filteredSorted.length} incubators to CSV`);
    }, [filteredSorted]);

    return (
        <div className="min-h-screen bg-background text-foreground" data-testid="dashboard-root">
            {/* Sticky Header */}
            <header
                className="sticky top-0 z-40 border-b border-border glass-header"
                data-testid="sticky-header"
            >
                <div className="mx-auto flex max-w-[1480px] items-center gap-3 px-4 py-3 md:px-8 md:py-4">
                    <a href="/" className="flex items-center gap-2.5 mr-2 shrink-0" data-testid="brand-link">
                        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div className="hidden md:flex flex-col leading-tight">
                            <span className="font-heading text-[15px] font-bold tracking-tight">Seed Fund · Portfolio</span>
                            <span className="text-[11px] text-muted-foreground">Startup India · Public Data</span>
                        </div>
                    </a>

                    <div className="relative flex-1 min-w-0">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={filters.search}
                            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                            placeholder="Search incubator, sector, city or state…"
                            className="h-10 pl-9 pr-3 font-body bg-secondary/40 border-border/80 focus-visible:ring-primary"
                            data-testid="global-search-input"
                        />
                    </div>

                    <div className="hidden md:block w-[260px]">
                        <Select value={sort} onValueChange={setSort}>
                            <SelectTrigger className="h-10" data-testid="sort-select">
                                <ArrowDownAZ className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SORTS.map((s) => (
                                    <SelectItem key={s.id} value={s.id} data-testid={`sort-option-${s.id}`}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* <Button
                        variant="outline"
                        onClick={exportCsv}
                        className="hidden md:inline-flex h-10 gap-2"
                        data-testid="export-csv-btn"
                        title="Export current filtered view as CSV"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                    </Button> */}

                    {/* Mobile filter trigger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className="lg:hidden h-10 gap-2"
                                data-testid="mobile-filter-trigger"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                <span className="hidden sm:inline">Filters</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[88vw] sm:w-[420px] p-0">
                            <SheetHeader className="px-6 pt-6">
                                <SheetTitle className="font-heading">Filters</SheetTitle>
                            </SheetHeader>
                            <div className="px-2 pb-6">
                                {facets && (
                                    <FilterSidebar
                                        embedded
                                        facets={facets}
                                        filters={filters}
                                        onChange={setFilters}
                                        onReset={resetAll}
                                    />
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    <ThemeToggle />
                </div>

                {/* Sub-bar: counts */}
                <div className="border-t border-border/60 bg-background/40">
                    <div className="mx-auto flex max-w-[1480px] items-center justify-between px-4 py-2 md:px-8 text-xs">
                        <div className="flex items-center gap-2 font-mono text-muted-foreground" data-testid="results-counter">
                            <Sparkles className="h-3.5 w-3.5 text-saffron" />
                            <span className="text-foreground font-semibold">{filteredCount.toLocaleString("en-IN")}</span>
                            <span>&nbsp;of {totalCount.toLocaleString("en-IN")} incubators</span>
                            {(filters.incubators.length + filters.sectors.length + filters.states.length + filters.cities.length > 0 || debouncedSearch) && (
                                <button
                                    onClick={resetAll}
                                    className="ml-3 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-secondary transition-colors"
                                    data-testid="reset-filters-inline"
                                >
                                    <RotateCcw className="h-3 w-3" /> Reset
                                </button>
                            )}
                        </div>
                        <div className="md:hidden w-[180px]">
                            <Select value={sort} onValueChange={setSort}>
                                <SelectTrigger className="h-8 text-xs" data-testid="sort-select-mobile">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORTS.map((s) => (
                                        <SelectItem key={s.id} value={s.id} className="text-xs">
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            {/* <section className="relative overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-grid-fade opacity-60" />
                <div className="relative mx-auto max-w-[1480px] px-4 md:px-8 py-10 md:py-14">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-saffron" /> Public · Real-time proxy
                    </div>
                    <h1 className="mt-4 font-heading text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
                        India's Seed Fund <span className="text-primary">portfolio</span>, mapped clearly.
                    </h1>
                    <p className="mt-3 max-w-2xl text-base md:text-lg text-muted-foreground">
                        Browse approved grants, sectors and remaining capital across every recognised incubator —
                        sortable, filterable, and ready for your next decision.
                    </p>
                </div>
            </section> */}

            {/* Body */}
            <main className="mx-auto max-w-[1480px] px-4 md:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar (desktop) */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className="sticky top-[124px] max-h-[calc(100vh-148px)] overflow-y-auto thin-scroll rounded-xl border border-border bg-card p-5 shadow-sm">
                            {facets ? (
                                <FilterSidebar
                                    facets={facets}
                                    filters={filters}
                                    onChange={setFilters}
                                    onReset={resetAll}
                                />
                            ) : (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map((k) => (
                                        <div key={k} className="h-16 rounded-md bg-muted animate-pulse" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Grid */}
                    <section className="flex-1 min-w-0">
                        {error && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" data-testid="error-state">
                                {error}
                            </div>
                        )}

                        {loading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6" data-testid="loading-grid">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <PortfolioCardSkeleton key={i} />
                                ))}
                            </div>
                        )}

                        {!loading && filteredSorted.length === 0 && (
                            <EmptyState onReset={resetAll} />
                        )}

                        {!loading && filteredSorted.length > 0 && (
                            <div
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                                data-testid="portfolio-grid"
                            >
                                {visibleItems.map((it, idx) => (
                                    <PortfolioCard
                                        key={it.id}
                                        item={it}
                                        index={idx}
                                        onOpen={() => setSelected(it)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Sentinel & load indicator */}
                        {!loading && visibleCount < filteredSorted.length && (
                            <div ref={sentinelRef} className="flex justify-center py-10" data-testid="infinite-sentinel">
                                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                                    <Database className="h-4 w-4 animate-pulse" />
                                    Loading more incubators…
                                </div>
                            </div>
                        )}

                        {!loading && visibleCount >= filteredSorted.length && filteredSorted.length > 0 && (
                            <div className="py-10 text-center text-xs font-mono text-muted-foreground" data-testid="end-of-list">
                                — End of results · {filteredSorted.length} shown —
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-background">
                <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div>
                        Copyright © 2026 Start-Up Sahay Private Limited. All Rights Reserved | Design and Developed By Start-Up Sahay Private Limited
                        {/* Data source ·{" "}
                        <a
                            href="https://seedfundscheme.startupindia.gov.in/"
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4 hover:text-foreground"
                        >
                            Startup India Seed Fund Scheme
                        </a> */}
                    </div>
                    {/* <div className="font-mono">© {new Date().getFullYear()} · Built for the ecosystem</div> */}
                </div>
            </footer>

            <DetailModal item={selected} onClose={() => setSelected(null)} />
        </div>
    );
}

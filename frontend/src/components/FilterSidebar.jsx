import { useMemo } from "react";
import { RotateCcw, Filter } from "lucide-react";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import MultiSelect from "./MultiSelect";
import { formatINR } from "../lib/format";

const RANGE_FIELDS = [
    { key: "first_total_approved_amt", label: "First total approved" },
    { key: "reapply_total_approved_amt", label: "Re-apply approved" },
    { key: "totalRemainingAmount", label: "Total remaining" },
    { key: "totalGrantremainingAmount", label: "Grant remaining" },
];

export default function FilterSidebar({ facets, filters, onChange, onReset, embedded = false }) {
    const setField = (key, value) => onChange((f) => ({ ...f, [key]: value }));
    const setRange = (key, val) =>
        onChange((f) => ({ ...f, ranges: { ...f.ranges, [key]: val } }));

    const incubatorOptions = useMemo(() => facets.incubators.map((v) => ({ value: v, label: v })), [facets]);
    const sectorOptions = useMemo(() => facets.sectors.map((v) => ({ value: v, label: v })), [facets]);
    const stateOptions = useMemo(() => facets.states.map((v) => ({ value: v, label: v })), [facets]);
    const cityOptions = useMemo(() => facets.cities.map((v) => ({ value: v, label: v })), [facets]);

    return (
        <div className={embedded ? "p-4" : ""} data-testid="filter-sidebar">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-heading font-bold">
                    <Filter className="h-4 w-4 text-primary" /> Filters
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={onReset}
                    data-testid="filter-reset-btn"
                >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
            </div>

            <Separator className="my-4" />

            {/* Multi-selects */}
            <div className="space-y-4">
                <FieldGroup label="Incubator">
                    <MultiSelect
                        options={incubatorOptions}
                        value={filters.incubators}
                        onChange={(v) => setField("incubators", v)}
                        placeholder="All incubators"
                        testid="filter-incubator"
                    />
                </FieldGroup>
                <FieldGroup label="Sector">
                    <MultiSelect
                        options={sectorOptions}
                        value={filters.sectors}
                        onChange={(v) => setField("sectors", v)}
                        placeholder="All sectors"
                        testid="filter-sector"
                    />
                </FieldGroup>
                <FieldGroup label="State">
                    <MultiSelect
                        options={stateOptions}
                        value={filters.states}
                        onChange={(v) => setField("states", v)}
                        placeholder="All states"
                        testid="filter-state"
                    />
                </FieldGroup>
                <FieldGroup label="City">
                    <MultiSelect
                        options={cityOptions}
                        value={filters.cities}
                        onChange={(v) => setField("cities", v)}
                        placeholder="All cities"
                        testid="filter-city"
                    />
                </FieldGroup>
            </div>

            <Separator className="my-5" />

            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Amount ranges (INR)
            </div>

            <div className="space-y-5">
                {RANGE_FIELDS.map(({ key, label }) => {
                    const meta = facets.ranges[key];
                    const cur = filters.ranges?.[key] || [meta.min, meta.max];
                    const step = Math.max(1, Math.round((meta.max - meta.min) / 100));
                    if (meta.min === meta.max) return null;
                    return (
                        <div key={key} data-testid={`range-${key}`}>
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="font-medium">{label}</span>
                                <span className="font-mono text-muted-foreground tabular-nums">
                                    {formatINR(cur[0])} – {formatINR(cur[1])}
                                </span>
                            </div>
                            <Slider
                                value={cur}
                                min={meta.min}
                                max={meta.max}
                                step={step}
                                onValueChange={(val) => setRange(key, val)}
                                className="my-3"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const FieldGroup = ({ label, children }) => (
    <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
            {label}
        </div>
        {children}
    </div>
);

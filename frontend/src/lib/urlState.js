/**
 * URL ⇄ filter-state serializer.
 *
 *   - String values are URI-encoded.
 *   - Multi-select arrays are joined with `|` (sectors contain commas, so we
 *     can't use comma).
 *   - Range values that match the full extent are dropped from the URL to
 *     keep shareable links short.
 */

const ARRAY_KEYS = {
    inc: "incubators",
    sec: "sectors",
    st: "states",
    city: "cities",
};
const REVERSE_ARRAY_KEYS = Object.fromEntries(
    Object.entries(ARRAY_KEYS).map(([k, v]) => [v, k])
);

const RANGE_FIELDS = [
    "first_total_approved_amt",
    "reapply_total_approved_amt",
    "totalRemainingAmount",
    "totalGrantremainingAmount",
];

const splitArr = (v) => (v ? v.split("|").filter(Boolean) : []);

/** Convert filters + sort → URLSearchParams, omitting defaults. */
export function filtersToParams({ filters, sort, defaultSort, facets }) {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    for (const [shortKey, longKey] of Object.entries(ARRAY_KEYS)) {
        if (filters[longKey]?.length) params.set(shortKey, filters[longKey].join("|"));
    }
    if (facets?.ranges && filters.ranges) {
        for (const f of RANGE_FIELDS) {
            const cur = filters.ranges[f];
            const ext = facets.ranges[f];
            if (!cur || !ext) continue;
            if (cur[0] !== ext.min || cur[1] !== ext.max) {
                params.set(`r_${f}`, `${cur[0]},${cur[1]}`);
            }
        }
    }
    if (sort && sort !== defaultSort) params.set("sort", sort);
    return params;
}

/** Hydrate filters + sort from a URLSearchParams instance. */
export function paramsToFilters({ params, facets, defaultSort }) {
    const out = {
        search: params.get("q") || "",
        incubators: splitArr(params.get("inc")),
        sectors: splitArr(params.get("sec")),
        states: splitArr(params.get("st")),
        cities: splitArr(params.get("city")),
        ranges: {},
    };

    if (facets?.ranges) {
        for (const f of RANGE_FIELDS) {
            const ext = facets.ranges[f];
            const raw = params.get(`r_${f}`);
            if (raw) {
                const [a, b] = raw.split(",").map((n) => Number(n));
                out.ranges[f] = [
                    Number.isFinite(a) ? a : ext.min,
                    Number.isFinite(b) ? b : ext.max,
                ];
            } else {
                out.ranges[f] = [ext.min, ext.max];
            }
        }
    }

    const sort = params.get("sort") || defaultSort;
    return { filters: out, sort };
}

export const URL_ARRAY_KEY_MAP = REVERSE_ARRAY_KEYS;

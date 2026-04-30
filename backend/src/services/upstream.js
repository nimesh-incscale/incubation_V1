/**
 * Upstream service — talks to the public Startup India Seed Fund API,
 * normalises payloads and shields callers behind a TTL cache.
 */
const axios = require("axios");
const https = require("https");
const { TTLCache } = require("../utils/cache");

const UPSTREAM_URL =
    "https://seedfundapi.startupindia.gov.in:3535/api/portfoliofilter";
const UPSTREAM_IMAGE_BASE = "https://seedfundapi.startupindia.gov.in:3535";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Self-signed / non-standard chain on a non-standard port — bypass strict TLS.
const upstreamAgent = new https.Agent({ rejectUnauthorized: false });

const cache = new TTLCache(CACHE_TTL_MS);

/** Coerce one upstream record into the stable shape the frontend consumes. */
function normaliseItem(raw) {
    let image = raw.image || "";
    if (image && !image.startsWith("http")) {
        image = `${UPSTREAM_IMAGE_BASE}${image}`;
    }
    const sectorsRaw = raw.sectors || "";
    const sectorsList = sectorsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    return {
        id: raw.Id ?? raw.id,
        image,
        incubator_name: raw.incubator_name || "",
        description: raw.description || "",
        sectors: sectorsRaw,
        sectors_list: sectorsList,
        state: raw.state || "",
        city: raw.city || "",
        first_total_approved_amt: Number(raw.first_total_approved_amt || 0),
        reapply_total_approved_amt: Number(raw.reapply_total_approved_amt || 0),
        totalRemainingAmount: Number(raw.totalRemainingAmount || 0),
        totalGrantremainingAmount: Number(raw.totalGrantremainingAmount || 0),
        evaluation: raw.Evaluation || 0,
        incubator_user_id: raw.incubator_user_id ?? null,
    };
}

/**
 * Fetch the full normalised list from upstream (with caching).
 * @param {object} opts
 * @param {boolean} [opts.force] - bypass cache
 */
async function fetchPortfolio({ force = false } = {}) {
    if (!force) {
        const fresh = cache.get();
        if (fresh) return fresh;
    }
    try {
        const { data: payload } = await axios.post(
            UPSTREAM_URL,
            {},
            {
                timeout: 20000,
                httpsAgent: upstreamAgent,
                headers: { "Content-Type": "application/json" },
            }
        );
        const rawItems = Array.isArray(payload) ? payload : payload?.data;
        if (!Array.isArray(rawItems)) {
            throw new Error("Unexpected upstream payload shape");
        }
        const items = rawItems.map(normaliseItem);
        cache.set(items);
        return items;
    } catch (err) {
        // Soft-fail: serve stale snapshot if we have one.
        const stale = cache.stale();
        if (stale) {
            console.warn(`[upstream] fetch failed, serving stale: ${err.message}`);
            return stale;
        }
        throw err;
    }
}

function cacheInfo() {
    const info = cache.info();
    return { ...info, refreshed_at: cache.ts };
}

module.exports = { fetchPortfolio, cacheInfo, normaliseItem };

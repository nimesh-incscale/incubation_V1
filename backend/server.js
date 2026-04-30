/**
 * Seed Fund Portfolio Proxy — Node.js / Express edition.
 *
 * Proxies the public Startup India Seed Fund portfolio dataset so the React
 * (Vite) frontend can consume it without CORS / SSL chain issues, and adds
 * light in-memory caching plus normalisation.
 */
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const axios = require("axios");
const https = require("https");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const PORT = parseInt(process.env.PORT || "8001", 10);
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim());

const UPSTREAM_URL =
    "https://seedfundapi.startupindia.gov.in:3535/api/portfoliofilter";
const UPSTREAM_IMAGE_BASE = "https://seedfundapi.startupindia.gov.in:3535";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = { ts: 0, data: [] };

// Upstream uses a self-signed / non-standard chain on a non-standard port.
const upstreamAgent = new https.Agent({ rejectUnauthorized: false });

/** Coerce upstream record into a stable shape for the frontend. */
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

async function fetchUpstream({ force = false } = {}) {
    const now = Date.now();
    if (!force && cache.data.length && now - cache.ts < CACHE_TTL_MS) {
        return cache.data;
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
        cache.data = rawItems.map(normaliseItem);
        cache.ts = now;
        return cache.data;
    } catch (err) {
        console.error("[upstream] fetch failed:", err.message);
        if (cache.data.length) return cache.data; // Serve stale on failure.
        throw err;
    }
}

const app = express();
app.disable("x-powered-by");
app.use(express.json());
app.use(morgan("tiny"));
app.use(
    cors({
        origin: CORS_ORIGINS.includes("*") ? true : CORS_ORIGINS,
        credentials: true,
    })
);

const router = express.Router();

router.get("/", (_req, res) => {
    res.json({
        message: "Seed Fund Portfolio Proxy",
        items_cached: cache.data.length,
    });
});

router.get("/portfolio", async (_req, res) => {
    try {
        const items = await fetchUpstream();
        res.json({ count: items.length, data: items });
    } catch (err) {
        res.status(502).json({ detail: `Upstream fetch failed: ${err.message}` });
    }
});

router.get("/portfolio/refresh", async (_req, res) => {
    try {
        const items = await fetchUpstream({ force: true });
        res.json({ count: items.length, refreshed_at: cache.ts });
    } catch (err) {
        res.status(502).json({ detail: `Upstream fetch failed: ${err.message}` });
    }
});

router.get("/portfolio/facets", async (_req, res) => {
    try {
        const items = await fetchUpstream();

        const states = [...new Set(items.map((i) => i.state).filter(Boolean))].sort();
        const cities = [...new Set(items.map((i) => i.city).filter(Boolean))].sort();
        const incubators = [
            ...new Set(items.map((i) => i.incubator_name).filter(Boolean)),
        ].sort();

        const sectorsSet = new Set();
        for (const it of items) for (const s of it.sectors_list) sectorsSet.add(s);
        const sectors = [...sectorsSet].sort();

        const rangeOf = (field) => {
            const vals = items.map((i) => i[field]);
            return vals.length
                ? { min: Math.min(...vals), max: Math.max(...vals) }
                : { min: 0, max: 0 };
        };

        res.json({
            states,
            cities,
            incubators,
            sectors,
            ranges: {
                first_total_approved_amt: rangeOf("first_total_approved_amt"),
                reapply_total_approved_amt: rangeOf("reapply_total_approved_amt"),
                totalRemainingAmount: rangeOf("totalRemainingAmount"),
                totalGrantremainingAmount: rangeOf("totalGrantremainingAmount"),
            },
            total: items.length,
        });
    } catch (err) {
        res.status(502).json({ detail: `Upstream fetch failed: ${err.message}` });
    }
});

app.use("/api", router);

// Catch-all 404 for unknown /api routes.
app.use("/api", (_req, res) => res.status(404).json({ detail: "Not found" }));

// Generic error handler.
app.use((err, _req, res, _next) => {
    console.error("[error]", err);
    res.status(500).json({ detail: err.message || "Internal Server Error" });
});

app.listen(PORT, HOST, () => {
    console.log(`[server] Seed Fund Portfolio Proxy listening on http://${HOST}:${PORT}`);
});

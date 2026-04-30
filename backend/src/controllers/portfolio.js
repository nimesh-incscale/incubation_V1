/**
 * Portfolio HTTP controllers — thin glue between Express and the services.
 */
const { fetchPortfolio, cacheInfo } = require("../services/upstream");
const { buildFacets } = require("../services/facets");

const sendUpstreamError = (res, err) => {
    res.status(502).json({ detail: `Upstream fetch failed: ${err.message}` });
};

async function root(_req, res) {
    res.json({
        message: "Seed Fund Portfolio Proxy",
        cache: cacheInfo(),
    });
}

async function listPortfolio(_req, res) {
    try {
        const items = await fetchPortfolio();
        res.json({ count: items.length, data: items });
    } catch (err) {
        sendUpstreamError(res, err);
    }
}

async function refreshPortfolio(_req, res) {
    try {
        const items = await fetchPortfolio({ force: true });
        res.json({ count: items.length, refreshed_at: cacheInfo().ts });
    } catch (err) {
        sendUpstreamError(res, err);
    }
}

async function listFacets(_req, res) {
    try {
        const items = await fetchPortfolio();
        res.json(buildFacets(items));
    } catch (err) {
        sendUpstreamError(res, err);
    }
}

module.exports = { root, listPortfolio, refreshPortfolio, listFacets };

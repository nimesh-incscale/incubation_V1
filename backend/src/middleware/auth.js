/**
 * API Key guard — rejects any request that doesn't carry the correct
 * secret in the  X-API-Key  header.
 */
function requireApiKey(req, res, next) {
    const key = req.headers["x-api-key"];

    if (!key || key !== process.env.API_SECRET_KEY) {
        return res.status(401).json({ detail: "Unauthorized" });
    }

    next();
}

module.exports = { requireApiKey };
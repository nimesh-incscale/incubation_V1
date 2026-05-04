/**
 * Express app factory — keeps server.js a thin bootstrapper.
 */
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const portfolioRoutes = require("./routes/portfolio");
const { requireApiKey } = require("./middleware/auth"); 

function createApp({ corsOrigins = ["*"] } = {}) {
    const app = express();
    app.disable("x-powered-by");
    app.use(express.json());
    app.use(morgan("tiny"));
    app.use(
        cors({
            origin: corsOrigins.includes("*") ? true : corsOrigins,
            credentials: true,
        })
    );

    app.use("/api", requireApiKey); 
    app.use("/api", portfolioRoutes);
    app.use("/api", (_req, res) => res.status(404).json({ detail: "Not found" }));

    // Generic error handler — last resort.
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => {
        console.error("[error]", err);
        res.status(500).json({ detail: err.message || "Internal Server Error" });
    });

    return app;
}

module.exports = { createApp };

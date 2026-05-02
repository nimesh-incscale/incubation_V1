/**
 * Bootstrap entrypoint for the Seed Fund Portfolio Proxy.
 * Real wiring lives in /src — this file just reads env and starts the server.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { createApp } = require("./src/app");

//const PORT = parseInt(process.env.PORT || "8001", 10);
const PORT = process.env.PORT || 5000; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SERVER_RUNNING_ON_PORT: ${PORT}`);
});
const HOST = process.env.HOST || "0.0.0.0";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim());

const app = createApp({ corsOrigins: CORS_ORIGINS });

app.listen(PORT, HOST, () => {
    console.log(`[server] Seed Fund Portfolio Proxy listening on http://${HOST}:${PORT}`);
});

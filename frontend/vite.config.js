import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Vite config for the Seed Fund Portfolio dashboard.
 *
 *   – Dev server runs on 0.0.0.0:3000 (matches Emergent supervisor expectation).
 *   – `@` alias points to /src (drop-in replacement for the old CRA alias).
 *   – server.proxy is the LOCAL-DEV fallback: if you don't have the Node API
 *     backend running, set VITE_PROXY_TARGET=upstream to route /api/* directly
 *     to the public Startup India endpoint instead of the local backend.
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const proxyTarget = env.VITE_PROXY_TARGET || "http://localhost:5000";

    return {
        plugins: [react()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
        server: {
            host: "0.0.0.0",
            port: 3000,
            strictPort: true,
            // Allow Emergent preview hostname (and any reverse-proxy host).
            allowedHosts: true,
            // Run HMR over the public HTTPS port the preview serves on.
            hmr: { clientPort: 443 },
            proxy: {
                "/api": {
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: false,
                    // target: "http://localhost:5000", // Point to the backend port
                    // changeOrigin: true,
                    // secure: false,
                },
            },
            watch: {
                ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
            },
        },
        build: {
            outDir: "dist",
            sourcemap: false,
        },
    };
});

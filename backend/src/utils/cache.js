/**
 * Tiny TTL-based in-memory cache.
 * Single source of truth for the upstream snapshot.
 */
class TTLCache {
    constructor(ttlMs) {
        this.ttlMs = ttlMs;
        this.value = null;
        this.ts = 0;
    }

    get() {
        if (this.value && Date.now() - this.ts < this.ttlMs) return this.value;
        return null;
    }

    set(value) {
        this.value = value;
        this.ts = Date.now();
    }

    /** Return cached value even if stale (used as a graceful fallback). */
    stale() {
        return this.value;
    }

    invalidate() {
        this.value = null;
        this.ts = 0;
    }

    info() {
        return { hasValue: !!this.value, ts: this.ts, ageMs: Date.now() - this.ts };
    }
}

module.exports = { TTLCache };

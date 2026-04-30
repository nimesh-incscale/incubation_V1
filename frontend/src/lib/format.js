// Indian-locale currency formatting (Lakhs & Crores) with compact long form.
export function formatINR(value, { compact = true } = {}) {
    const v = Number(value || 0);
    if (!compact) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(v);
    }
    if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2).replace(/\.00$/, "")} Cr`;
    if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2).replace(/\.00$/, "")} L`;
    if (v >= 1_000) return `₹${(v / 1_000).toFixed(1).replace(/\.0$/, "")} K`;
    return `₹${v}`;
}

export function initialsOf(name = "") {
    return name
        .replace(/[^A-Za-z0-9 ]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || "")
        .join("") || "??";
}

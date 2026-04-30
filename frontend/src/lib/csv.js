/**
 * CSV export utilities for the portfolio dataset.
 * Handles RFC-4180 quoting (wrap fields containing commas / quotes / newlines).
 */
const COLUMNS = [
    { key: "id", label: "ID" },
    { key: "incubator_name", label: "Incubator Name" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "sectors", label: "Sectors" },
    { key: "first_total_approved_amt", label: "First Approved (INR)" },
    { key: "reapply_total_approved_amt", label: "Re-apply Approved (INR)" },
    { key: "totalRemainingAmount", label: "Total Remaining (INR)" },
    { key: "totalGrantremainingAmount", label: "Grant Remaining (INR)" },
    { key: "evaluation", label: "Evaluation" },
];

function escapeCell(val) {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

export function toCsv(items) {
    const header = COLUMNS.map((c) => c.label).join(",");
    const rows = items.map((it) =>
        COLUMNS.map((c) => escapeCell(it[c.key])).join(",")
    );
    return [header, ...rows].join("\n");
}

export function downloadCsv(items, filename = "seedfund-portfolio.csv") {
    const csv = toCsv(items);
    // Prepend BOM so Excel detects UTF-8.
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

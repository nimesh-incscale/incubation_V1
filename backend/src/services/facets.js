/**
 * Facet builder — derives distinct values + numeric ranges
 * from the normalised portfolio list, for the frontend filter UI.
 */
function buildFacets(items) {
    const states = [...new Set(items.map((i) => i.state).filter(Boolean))].sort();
    const cities = [...new Set(items.map((i) => i.city).filter(Boolean))].sort();
    const incubators = [
        ...new Set(items.map((i) => i.incubator_name).filter(Boolean)),
    ].sort();

    const sectorsSet = new Set();
    for (const it of items) for (const s of it.sectors_list) sectorsSet.add(s);
    const sectors = [...sectorsSet].sort();

    const rangeOf = (field) => {
        if (!items.length) return { min: 0, max: 0 };
        let min = Infinity;
        let max = -Infinity;
        for (const it of items) {
            const v = it[field];
            if (v < min) min = v;
            if (v > max) max = v;
        }
        return { min, max };
    };

    return {
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
    };
}

module.exports = { buildFacets };

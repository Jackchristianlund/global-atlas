/** Response and coordinate validation. Invalid rows are rejected with a reason, never patched. */
export function isFiniteNumber(v) {
    return typeof v === 'number' && Number.isFinite(v);
}
export function validCoord(lat, lng) {
    return isFiniteNumber(lat) && isFiniteNumber(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
}
export function validYear(y, min = 1800, max = new Date().getUTCFullYear()) {
    return isFiniteNumber(y) && Number.isInteger(y) && y >= min && y <= max;
}
export function validISODate(d) {
    if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d))
        return false;
    const t = Date.parse(d + 'T00:00:00Z');
    // Round-trip: Date.parse would silently roll 2026-02-30 over to March.
    return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === d;
}
/** Parse a CSV cell into number | null; rejects junk like '..', 'NA', ''. */
export function num(cell) {
    if (cell === undefined)
        return null;
    const s = cell.trim();
    if (s === '' || s === 'NA' || s === '..' || s === 'null')
        return null;
    const v = Number(s);
    return Number.isFinite(v) ? v : null;
}
/** Minimal CSV parser with quote handling (no external dependency). */
export function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let q = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    cell += '"';
                    i++;
                }
                else
                    q = false;
            }
            else
                cell += c;
        }
        else if (c === '"')
            q = true;
        else if (c === ',') {
            row.push(cell);
            cell = '';
        }
        else if (c === '\n') {
            row.push(cell);
            cell = '';
            if (row.length > 1 || row[0] !== '')
                rows.push(row);
            row = [];
        }
        else if (c !== '\r')
            cell += c;
    }
    if (cell !== '' || row.length) {
        row.push(cell);
        rows.push(row);
    }
    return rows;
}
export function csvToObjects(text) {
    const [head, ...rest] = parseCsv(text);
    return rest.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

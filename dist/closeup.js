import { mercatorY } from "./frame.js";
const RADIANS = Math.PI / 180;
/** The polygons in a GeoJSON object, optionally only from features with a property, as `["kind", "reef"]`. */
export function polygons(shapes, where) {
    if (Array.isArray(shapes))
        return shapes.flatMap((s) => polygons(s, where));
    const from = (g) => g?.type === "MultiPolygon" ? g.coordinates : g?.type === "Polygon" ? [g.coordinates] : [];
    if (shapes.features)
        return shapes.features.filter((f) => !where || f.properties?.[where[0]] === where[1]).flatMap((f) => from(f.geometry));
    if (shapes.geometry)
        return from(shapes.geometry);
    return from(shapes);
}
/** A square of `span` degrees of latitude centred on a point. */
function boundsAround([lon, lat], span) {
    const south = lat - span / 2;
    const north = lat + span / 2;
    const half = (mercatorY(north) - mercatorY(south)) / RADIANS / 2;
    return [
        [lon - half, south],
        [lon + half, north],
    ];
}
/** Douglas–Peucker on a closed ring, split at its farthest point so neither half is degenerate. */
function simplify(points, tolerance) {
    if (points.length <= 4)
        return points;
    const keep = new Uint8Array(points.length);
    keep[0] = keep[points.length - 1] = 1;
    let far = 0;
    let farDistance = -1;
    for (let i = 1; i < points.length - 1; i++) {
        const d = (points[i][0] - points[0][0]) ** 2 + (points[i][1] - points[0][1]) ** 2;
        if (d > farDistance)
            [farDistance, far] = [d, i];
    }
    keep[far] = 1;
    const stack = [
        [0, far],
        [far, points.length - 1],
    ];
    const tolerance2 = tolerance * tolerance;
    while (stack.length) {
        const [a, b] = stack.pop();
        const [ax, ay] = points[a];
        const dx = points[b][0] - ax;
        const dy = points[b][1] - ay;
        const length2 = dx * dx + dy * dy;
        let index = -1;
        let max = tolerance2;
        for (let i = a + 1; i < b; i++) {
            const t = length2 ? Math.max(0, Math.min(1, ((points[i][0] - ax) * dx + (points[i][1] - ay) * dy) / length2)) : 0;
            const d = (points[i][0] - ax - t * dx) ** 2 + (points[i][1] - ay - t * dy) ** 2;
            if (d > max)
                [max, index] = [d, i];
        }
        if (index > -1) {
            keep[index] = 1;
            stack.push([a, index], [index, b]);
        }
    }
    return points.filter((_, i) => keep[i]);
}
function area(ring) {
    let sum = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
        sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
    return Math.abs(sum / 2);
}
const round = (n) => Math.round(n * 10) / 10;
/** SVG path data for the polygons, with relative moves to keep it short. */
function toPath(list, project, tolerance, minArea) {
    let d = "";
    for (const polygon of list) {
        for (const [i, ring] of polygon.entries()) {
            const points = simplify(ring.map(project), tolerance);
            if (points.length < 4 || area(points) < minArea) {
                if (i === 0)
                    break; // the outline itself is too small to see
                continue;
            }
            let [x, y] = [round(points[0][0]), round(points[0][1])];
            d += `M${x} ${y}`;
            for (let k = 1; k < points.length - 1; k++) {
                const nx = round(points[k][0]);
                const ny = round(points[k][1]);
                const dx = round(nx - x);
                const dy = round(ny - y);
                if (dx === 0 && dy === 0)
                    continue;
                d += `l${dx}${dy < 0 ? "" : " "}${dy}`;
                [x, y] = [nx, ny];
            }
            d += "z";
        }
    }
    return d;
}
function within(list, [[west, south], [east, north]]) {
    const margin = Math.max(east - west, north - south) * 0.1;
    return list.filter((polygon) => polygon[0].some(([lon, lat]) => lon > west - margin && lon < east + margin && lat > south - margin && lat < north + margin));
}
/**
 * Draws the close-up of a place from detailed outlines (use `polygons()` to
 * take them out of GeoJSON). Plain arithmetic: run it on the server, at build
 * time, or in the browser.
 */
export function drawCloseUp(at, outlines, { span = 0.14, size = 460 } = {}) {
    const bounds = boundsAround(at, span);
    const [[west, south], [east, north]] = bounds;
    const top = mercatorY(north);
    const scale = size / (top - mercatorY(south));
    const project = ([lon, lat]) => [(lon - west) * RADIANS * scale, (top - mercatorY(lat)) * scale];
    return {
        width: (east - west) * RADIANS * scale,
        height: size,
        shallows: toPath(within(outlines.shallows ?? [], bounds), project, 0.8, 1),
        land: toPath(within(outlines.land, bounds), project, 0.6, 0.4),
    };
}

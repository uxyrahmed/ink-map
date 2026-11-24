import { latitudeAt, mercatorY } from "./frame.js";
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
function toPath(list, project, tolerance, minArea, box) {
    let d = "";
    for (const polygon of list) {
        for (const [i, ring] of polygon.entries()) {
            const points = simplify(clip(ring.map(project), box), tolerance);
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
/** Each polygon's box, worked out once: the outlines are read many times over. */
const boxes = new WeakMap();
function boxOf(polygon) {
    let box = boxes.get(polygon);
    if (!box) {
        box = [Infinity, Infinity, -Infinity, -Infinity];
        for (const [lon, lat] of polygon[0]) {
            if (lon < box[0])
                box[0] = lon;
            if (lon > box[2])
                box[2] = lon;
            if (lat < box[1])
                box[1] = lat;
            if (lat > box[3])
                box[3] = lat;
        }
        boxes.set(polygon, box);
    }
    return box;
}
/** The polygons any part of which could show: a reef wider than the area has no corner inside it, and still shows. */
function within(list, [[west, south], [east, north]]) {
    const margin = Math.max(east - west, north - south) * 0.1;
    return list.filter((polygon) => {
        const box = boxOf(polygon);
        return box[0] < east + margin && box[2] > west - margin && box[1] < north + margin && box[3] > south - margin;
    });
}
/**
 * A ring cut to a box (Sutherland–Hodgman), so an atoll's whole rim is not carried
 * along for the corner of it that shows. The box is wider than the drawing, so the
 * straight edges the cut leaves are out of sight.
 */
function clip(ring, [x0, y0, x1, y1]) {
    const edges = [
        [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
        [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
        [(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
        [(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
    ];
    let points = ring;
    for (const [inside, cross] of edges) {
        if (points.every(inside))
            continue;
        const out = [];
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            const [ain, bin] = [inside(a), inside(b)];
            if (ain)
                out.push(a);
            if (ain !== bin)
                out.push(cross(a, b));
        }
        points = out;
        if (!points.length)
            return points;
    }
    if (points !== ring && points.length)
        points.push(points[0]);
    return points;
}
/**
 * The area that holds a set of points with room around them, optionally grown to a
 * shape (`ratio`, width over height). Measured on the map, not in degrees, so the
 * shape is the shape it is drawn in.
 */
export function fit(points, { padding = 0.15, ratio, minSpan = 0.015 } = {}) {
    if (!points.length)
        throw new Error("fit() needs at least one point");
    const xs = points.map(([lon]) => lon * RADIANS);
    const ys = points.map(([, lat]) => mercatorY(lat));
    let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const pad = padding * Math.max(x1 - x0, y1 - y0);
    let width = x1 - x0 + 2 * pad;
    let height = Math.max(y1 - y0 + 2 * pad, minSpan * RADIANS);
    if (ratio) {
        if (width / height < ratio)
            width = height * ratio;
        else
            height = width / ratio;
    }
    const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
    [x0, x1, y0, y1] = [cx - width / 2, cx + width / 2, cy - height / 2, cy + height / 2];
    return [
        [x0 / RADIANS, latitudeAt(y0)],
        [x1 / RADIANS, latitudeAt(y1)],
    ];
}
/** An area made `times` larger about its middle: what to draw so a map fitted to the area has something to pan to. */
export function grow([[west, south], [east, north]], times) {
    const [x, y] = [(west + east) / 2, (mercatorY(south) + mercatorY(north)) / 2];
    const [w, h] = [((east - west) / 2) * times, ((mercatorY(north) - mercatorY(south)) / 2) * times];
    return [
        [x - w, latitudeAt(y - h)],
        [x + w, latitudeAt(y + h)],
    ];
}
/** Where a point on the earth falls on an area, as fractions of its width and height. */
export function place({ bounds: [[west, south], [east, north]] }, [longitude, latitude]) {
    const top = mercatorY(north);
    return [(longitude - west) / (east - west), (top - mercatorY(latitude)) / (top - mercatorY(south))];
}
/**
 * Draws any rectangle of the earth from detailed outlines (use `polygons()` to take
 * them out of GeoJSON, and `fit()` for the rectangle that holds your points). Plain
 * arithmetic: run it on the server, at build time, or in the browser.
 */
export function drawArea(bounds, outlines, { size = 460 } = {}) {
    const [[west, south], [east, north]] = bounds;
    const top = mercatorY(north);
    const scale = size / (top - mercatorY(south));
    const width = (east - west) * RADIANS * scale;
    const project = ([lon, lat]) => [(lon - west) * RADIANS * scale, (top - mercatorY(lat)) * scale];
    // Cut a little outside the drawing, so the cut never shows.
    const margin = Math.max(width, size) * 0.08;
    const box = [-margin, -margin, width + margin, size + margin];
    return {
        bounds,
        width,
        height: size,
        shallows: toPath(within(outlines.shallows ?? [], bounds), project, 0.8, 1, box),
        land: toPath(within(outlines.land, bounds), project, 0.6, 0.4, box),
    };
}
/**
 * Draws the close-up of a place from detailed outlines (use `polygons()` to
 * take them out of GeoJSON). Plain arithmetic: run it on the server, at build
 * time, or in the browser.
 */
export function drawCloseUp(at, outlines, { span = 0.14, size = 460 } = {}) {
    const { width, height, shallows, land } = drawArea(boundsAround(at, span), outlines, { size });
    return { width, height, shallows, land };
}

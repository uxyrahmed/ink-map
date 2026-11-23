#!/usr/bin/env node
/**
 * Draws a map for ink-map from outlines in a GeoJSON file:
 *
 *   ink.svg     every shape, as drawn in ink (the small ones as round dots)
 *   wash.svg    the shallow water around them: three bands, each a fixed
 *               distance from the nearest shape
 *   frame.json  the area and size of the drawing, so points can be placed on
 *               it, and the wash's easternmost point
 *
 * Both SVGs are used as CSS masks, so their colour comes from the page's
 * stylesheet and the page shows through everywhere else.
 *
 *   npx ink-map-draw shapes.geojson --out public/map
 *
 *   --out <folder>       where to write the three files (default: the current folder)
 *   --bounds w,s,e,n     the area to draw, in degrees (default: the shapes, with sea around them)
 *   --height <units>     units from north to south, about one pixel each on a desktop screen (default 760)
 *   --where key=value    only use features with this property, for example kind=reef
 *
 * The file is a GeoJSON FeatureCollection (or one Feature or geometry) of
 * Polygons and MultiPolygons in longitude and latitude. Credit its source
 * wherever the drawing shows (the `credit` of the drawing you pass to InkMap).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string", default: "." }, bounds: { type: "string" }, height: { type: "string", default: "760" }, where: { type: "string" } },
});
const SOURCE = positionals[0];
if (!SOURCE) {
  console.error("Usage: ink-map-draw <shapes.geojson> [--out folder] [--bounds w,s,e,n] [--height 760] [--where key=value]");
  process.exit(1);
}
const OUT_DIR = options.out;

// --- the shapes ---

const source = JSON.parse(await readFile(SOURCE, "utf8"));
const features = source.type === "FeatureCollection" ? source.features : [source.type === "Feature" ? source : { properties: {}, geometry: source }];
const [key, value] = options.where?.split("=") ?? [];
const reefs = features
  .filter((f) => !key || String(f.properties?.[key]) === value)
  .flatMap((f) => (f.geometry?.type === "MultiPolygon" ? f.geometry.coordinates : f.geometry?.type === "Polygon" ? [f.geometry.coordinates] : []));
if (reefs.length === 0) {
  console.error("No Polygon or MultiPolygon shapes found in " + SOURCE);
  process.exit(1);
}

/** The area to draw: as asked, or the shapes with a margin of sea for the wash. */
function area0() {
  if (options.bounds) {
    const [w, s, e, n] = options.bounds.split(",").map(Number);
    return [
      [w, s],
      [e, n],
    ];
  }
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const polygon of reefs) for (const [lon, lat] of polygon[0]) [w, s, e, n] = [Math.min(w, lon), Math.min(s, lat), Math.max(e, lon), Math.max(n, lat)];
  const margin = 0.06 * Math.max(e - w, n - s);
  return [
    [w - margin, Math.max(-85, s - margin)],
    [e + margin, Math.min(85, n + margin)],
  ];
}
const BOUNDS = area0();
/** Units from north to south. One unit is about one pixel on a desktop screen. */
const HEIGHT = Number(options.height);
/** Cells per unit in the grid the wash is worked out on. */
const GRID = 3;
/** The wash: how far each band reaches from the nearest shape (units), outermost first, and how strong it is. */
const BANDS = [
  { reach: 22, opacity: 0.08 },
  { reach: 14, opacity: 0.09 },
  { reach: 7, opacity: 0.11 },
];

// --- projection (Web Mercator, as lib/map/chart.ts) ---

const RADIANS = Math.PI / 180;
const mercatorY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const [[west, south], [east, north]] = BOUNDS;
const top = mercatorY(north);
const scale = HEIGHT / (top - mercatorY(south));
const WIDTH = (east - west) * RADIANS * scale;
const project = ([lon, lat]) => [(lon - west) * RADIANS * scale, (top - mercatorY(lat)) * scale];

// --- geometry ---

const round = (n) => Math.round(n * 10) / 10;

function area(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return Math.abs(sum / 2);
}

/** Douglas–Peucker on a closed ring, split at its farthest point so neither half is degenerate. */
function simplify(points, tolerance) {
  if (points.length <= 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  let far = 0;
  let farDistance = -1;
  for (let i = 1; i < points.length - 1; i++) {
    const d = (points[i][0] - points[0][0]) ** 2 + (points[i][1] - points[0][1]) ** 2;
    if (d > farDistance) [farDistance, far] = [d, i];
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
      if (d > max) [max, index] = [d, i];
    }
    if (index > -1) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** A closed ring as path data with straight sides and relative moves. */
function straight(ring) {
  let [x, y] = [round(ring[0][0]), round(ring[0][1])];
  let d = `M${x} ${y}`;
  for (let k = 1; k < ring.length; k++) {
    const nx = round(ring[k][0]);
    const ny = round(ring[k][1]);
    const dx = round(nx - x);
    const dy = round(ny - y);
    if (dx === 0 && dy === 0) continue;
    d += `l${dx}${dy < 0 ? "" : " "}${dy}`;
    [x, y] = [nx, ny];
  }
  return `${d}z`;
}

/** A closed ring as a smooth path: curves through the middle of each side, bending at the corners. */
function smooth(ring) {
  const n = ring.length;
  const middle = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = middle(ring[n - 1], ring[0]);
  let d = `M${round(start[0])} ${round(start[1])}`;
  for (let i = 0; i < n; i++) {
    const to = middle(ring[i], ring[(i + 1) % n]);
    d += `Q${round(ring[i][0])} ${round(ring[i][1])} ${round(to[0])} ${round(to[1])}`;
  }
  return `${d}z`;
}

// --- the reefs, in ink ---

/**
 * Reefs big enough to have a shape are drawn as they are; the rest, most of
 * them at this size, as round dots (one path per dot size, drawn with a round
 * line cap as wide as the dot).
 */
function drawReefs(reefs) {
  let shapes = "";
  const dots = new Map();
  for (const polygon of reefs) {
    const outline = polygon[0].map(project);
    if (area(outline) < 0.6) {
      let [left, up, right, down, sumX, sumY] = [Infinity, Infinity, -Infinity, -Infinity, 0, 0];
      for (const [x, y] of outline) {
        [left, up, right, down] = [Math.min(left, x), Math.min(up, y), Math.max(right, x), Math.max(down, y)];
        sumX += x;
        sumY += y;
      }
      const radius = Math.round(Math.max(0.5, Math.min(0.9, 0.5 * Math.sqrt((right - left) * (down - up)))) * 4) / 4;
      const at = `M${round(sumX / outline.length)} ${round(sumY / outline.length)}h0`;
      dots.set(radius, (dots.get(radius) ?? "") + at);
      continue;
    }
    for (const [i, ring] of polygon.entries()) {
      const points = simplify(i === 0 ? outline : ring.map(project), 0.35);
      if (points.length < 4 || area(points) < 0.6) continue;
      shapes += straight(points.slice(0, -1));
    }
  }
  return { shapes, dots: [...dots].map(([radius, d]) => ({ radius, d })) };
}

// --- the wash, from each point's distance to the nearest reef ---

/** Fills the polygons (grid units) into a grid of 0s and 1s, even-odd. */
function rasterize(polygons, w, h) {
  const mask = new Uint8Array(w * h);
  for (const polygon of polygons) {
    let [minY, maxY] = [Infinity, -Infinity];
    for (const ring of polygon) for (const [, y] of ring) [minY, maxY] = [Math.min(minY, y), Math.max(maxY, y)];
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(h - 1, Math.ceil(maxY)); y++) {
      const line = y + 0.5;
      const crossings = [];
      for (const ring of polygon) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [xi, yi] = ring[i];
          const [xj, yj] = ring[j];
          if (yi > line !== yj > line) crossings.push(xi + ((line - yi) / (yj - yi)) * (xj - xi));
        }
      }
      crossings.sort((a, b) => a - b);
      for (let k = 0; k + 1 < crossings.length; k += 2) {
        const from = Math.max(0, Math.round(crossings[k]));
        const to = Math.min(w, Math.round(crossings[k + 1]));
        for (let x = from; x < to; x++) mask[y * w + x] = 1;
        // A reef thinner than a cell still leaves a mark.
        if (to <= from) mask[y * w + Math.min(w - 1, Math.max(0, Math.floor((crossings[k] + crossings[k + 1]) / 2)))] = 1;
      }
    }
  }
  return mask;
}

/** Exact distance, in cells, from every cell to the nearest filled one (Felzenszwalb and Huttenlocher). */
function distances(mask, w, h) {
  const FAR = 1e20;
  const size = Math.max(w, h);
  const f = new Float64Array(size);
  const d = new Float64Array(size);
  const v = new Int32Array(size);
  const z = new Float64Array(size + 1);
  const out = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = mask[i] ? 0 : FAR;
  const pass = (n) => {
    let k = 0;
    v[0] = 0;
    z[0] = -FAR;
    z[1] = FAR;
    for (let q = 1; q < n; q++) {
      let s;
      do {
        const p = v[k];
        s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
      } while (s <= z[k] && --k >= 0);
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = FAR;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) ** 2 + f[v[k]];
    }
  };
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = out[y * w + x];
    pass(h);
    for (let y = 0; y < h; y++) out[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = out[y * w + x];
    pass(w);
    for (let x = 0; x < w; x++) out[y * w + x] = Math.sqrt(d[x]);
  }
  return out;
}

/** Box blur, twice: rounds the bands where the reach of two reefs meets. */
function blur(field, w, h, r) {
  const a = Float64Array.from(field);
  const b = new Float64Array(w * h);
  const span = 2 * r + 1;
  for (let times = 0; times < 2; times++) {
    for (let y = 0; y < h; y++) {
      let sum = 0;
      for (let x = -r; x <= r; x++) sum += a[y * w + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        b[y * w + x] = sum / span;
        sum += a[y * w + Math.min(w - 1, x + r + 1)] - a[y * w + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let y = -r; y <= r; y++) sum += b[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = sum / span;
        sum += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
}

/** Marching squares: the closed lines around everything below `level`, in cells. */
function contours(field, w, h, level) {
  const value = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? level + 1e6 : field[y * w + x]);
  const key = (p) => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`;
  const from = new Map(); // where a piece starts -> the pieces starting there
  const add = (p, q) => {
    const list = from.get(key(p));
    if (list) list.push([p, q]);
    else from.set(key(p), [[p, q]]);
  };
  for (let y = -1; y < h; y++) {
    for (let x = -1; x < w; x++) {
      const [a, b, c, d] = [value(x, y), value(x + 1, y), value(x + 1, y + 1), value(x, y + 1)];
      const corners = (a < level ? 8 : 0) | (b < level ? 4 : 0) | (c < level ? 2 : 0) | (d < level ? 1 : 0);
      if (corners === 0 || corners === 15) continue;
      const cut = (m, n) => (level - m) / (n - m);
      const up = [x + cut(a, b), y];
      const right = [x + 1, y + cut(b, c)];
      const down = [x + cut(d, c), y + 1];
      const left = [x, y + cut(a, d)];
      // prettier-ignore
      switch (corners) {
        case 1: add(down, left); break;
        case 2: add(right, down); break;
        case 3: add(right, left); break;
        case 4: add(up, right); break;
        case 5: add(up, left); add(down, right); break;
        case 6: add(up, down); break;
        case 7: add(up, left); break;
        case 8: add(left, up); break;
        case 9: add(down, up); break;
        case 10: add(left, down); add(right, up); break;
        case 11: add(right, up); break;
        case 12: add(left, right); break;
        case 13: add(down, right); break;
        case 14: add(left, down); break;
      }
    }
  }
  const rings = [];
  while (from.size) {
    let at = from.keys().next().value;
    const ring = [];
    while (from.has(at)) {
      const list = from.get(at);
      const [p, q] = list.pop();
      if (list.length === 0) from.delete(at);
      ring.push(p);
      at = key(q);
    }
    if (ring.length > 2) rings.push(ring);
  }
  return rings;
}

function drawWash(reefs) {
  const w = Math.ceil(WIDTH * GRID);
  const h = HEIGHT * GRID;
  const inGrid = reefs.map((polygon) => polygon.map((ring) => ring.map((p) => project(p).map((n) => n * GRID))));
  const field = blur(distances(rasterize(inGrid, w, h), w, h), w, h, 2 * GRID);
  return BANDS.map(({ reach, opacity }) => {
    let d = "";
    for (const ring of contours(field, w, h, reach * GRID)) {
      const points = simplify(
        ring.map(([x, y]) => [(x + 0.5) / GRID, (y + 0.5) / GRID]),
        0.4,
      );
      if (points.length >= 4 && area(points) >= 30) d += smooth(points);
    }
    return { d, opacity };
  });
}

// --- output ---

/** The box around a smooth path (every pair of numbers in it is an absolute position), and its easternmost point. */
function extent(d) {
  let [left, up, right, down] = [Infinity, Infinity, -Infinity, -Infinity];
  let east = [0, 0];
  for (const [, x, y] of d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
    if (+x > right) east = [+x, +y];
    [left, up, right, down] = [Math.min(left, +x), Math.min(up, +y), Math.max(right, +x), Math.max(down, +y)];
  }
  return { left, up, right, down, east };
}

const ink = drawReefs(reefs);
const wash = drawWash(reefs);

// Crop to the wash, which reaches furthest, with a unit to spare.
const { left, up, right, down, east: tip } = extent(wash[0].d);
const view = [Math.floor(left) - 1, Math.floor(up) - 1, Math.ceil(right - left) + 2, Math.ceil(down - up) + 2];
const fraction = (n) => Math.round(n * 1e4) / 1e4;
const open = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.join(" ")}" width="${view[2]}" height="${view[3]}">`;

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  `${OUT_DIR}/ink.svg`,
  `${open}<path d="${ink.shapes}" fill-rule="evenodd"/>${ink.dots
    .map(({ radius, d }) => `<path d="${d}" fill="none" stroke="#000" stroke-width="${radius * 2}" stroke-linecap="round"/>`)
    .join("")}</svg>\n`,
);
await writeFile(
  `${OUT_DIR}/wash.svg`,
  `${open}${wash.map(({ d, opacity }) => `<path d="${d}" fill-opacity="${opacity}"/>`).join("")}</svg>\n`,
);
await writeFile(
  `${OUT_DIR}/frame.json`,
  `${JSON.stringify(
    {
      bounds: BOUNDS,
      height: HEIGHT,
      view,
      // Where the wash reaches furthest east, as fractions of the drawing: a line to the whole chain starts here.
      east: [fraction((tip[0] - view[0]) / view[2]), fraction((tip[1] - view[1]) / view[3])],
    },
    null,
    2,
  )}\n`,
);

console.log(`Map: ${view[2]} by ${view[3]} units, ${reefs.length} shapes, in ${OUT_DIR}`);

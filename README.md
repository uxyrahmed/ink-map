# ink-map

A map drawn in ink, with pins. A small React component: the drawing is two SVG masks, so it takes any colours and sits straight on your page with nothing painted behind it. It comes with the Maldives, and a tool to draw any other place.

No map library, no tiles, no API key. A few KB of JavaScript plus the drawing.

## Install

```sh
npm install github:uxyrahmed/ink-map
```

It needs React 18 or newer.

## Use

```tsx
"use client";

import { InkMap, InkCredit, maldives } from "@uxyrahmed/ink-map";
import "@uxyrahmed/ink-map/styles.css";
import "@uxyrahmed/ink-map/maldives.css"; // the Maldives drawing

const pins = [
  { id: "male", label: "Malé", lngLat: [73.509, 4.175] },
  { id: "addu", label: "Addu City", lngLat: [73.158, -0.63] },
];

export function Places() {
  return (
    <div style={{ width: 160 }}>
      <InkMap drawing={maldives} pins={pins} onPick={(id, how) => console.log(id, how)} />
      <InkCredit drawing={maldives} />
    </div>
  );
}
```

Give the map a width (or a height) and it keeps the drawing's shape.

In Next.js the stylesheets can be imported in any component or in the root layout. With no bundler, link `styles.css` and `maldives.css` from the package folder.

## Props

| Prop | What it does |
| --- | --- |
| `drawing` | The map to draw: `maldives`, or your own (below). |
| `pins` | `{ id, label, lngLat }[]`. `lngLat` is `[longitude, latitude]`. Or give `spot`, a place on the drawing as fractions `[x, y]`, if you worked it out ahead with `locate()`. A pin can have its own `color` (any CSS colour) and `size` (its dot's width in pixels). |
| `active` | The picked pin's id. Leave it out and the map keeps track itself, from `defaultActive`. |
| `onPick(id, how)` | Called when someone picks a pin. `how` is `"point"` (the mouse came near), `"tap"` (tap or click) or `"focus"` (keyboard). |
| `pickOnHover` | Pick the pin the mouse comes near without a click. On by default. |
| `reach` | How near a pin counts, in pixels: `{ mouse: 30, touch: 44 }`. |
| `theme` | Colours: `{ ink, wash, accent, ground }`. |
| `highlight` | Draws the whole map in the accent colour and dims the pins, for something that covers the whole area. |
| `label` | What screen readers call the map. |
| `className`, `chartClassName`, `style` | For your own layout. The outer box can be wider than the drawing: pins are picked from anywhere inside it. |
| `children` | Anything to add inside the outer box, such as a line from the picked pin. |

Pins are small, so the one nearest the pointer is picked, not the one under it. Each pin is still a real button for the keyboard and screen readers.

## Colours

Pass a theme, or one of the ready ones:

```tsx
import { InkMap, themes } from "@uxyrahmed/ink-map";

<InkMap theme={themes.night} … />
<InkMap theme={{ ink: "#234", wash: "#9cf", accent: "tomato", ground: "white" }} … />
<InkMap theme={{ ink: "var(--brand-dark)", accent: "var(--brand)" }} … />
```

- `themes.reef`: sea teal ink, lagoon wash, red pins, on warm paper. The look the map was designed with (CDE Consulting), and the default.
- `themes.mono`: black on white.
- `themes.night`: pale ink for a dark page.

`ground` is the colour of your page. It is only used for the thin ring that lifts a pin off the drawing.

The same colours are CSS variables, if you would rather set them in a stylesheet: `--inkmap-ink`, `--inkmap-wash`, `--inkmap-accent`, `--inkmap-ground`, and for timing `--inkmap-duration`, `--inkmap-ease-out`, `--inkmap-ease-in-out`.

## Just the drawing

`InkChart` is the drawing with no pins and no JavaScript, so it works in a server component. Lay your own things over it as children.

```tsx
import { InkChart, locate, maldives } from "@uxyrahmed/ink-map";

const [x, y] = locate(maldives.frame, [73.509, 4.175]);

<InkChart drawing={maldives} label="Map of the Maldives" style={{ height: 400 }}>
  <span style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%` }}>●</span>
</InkChart>
```

`ratio(frame)` gives a drawing's width over its height.

## Zooming the map in to its pins

When the pins sit in one part of the map, show that part. `fit()` gives the area that holds a set of points, and `crop()` zooms a drawing in to it. The result is a drawing like any other, so `InkMap`, `InkChart`, `locate` and `ratio` take it as it is, and it follows the points: add a pin further out and the map opens up to hold it.

```tsx
import { InkMap, InkChart, crop, fit, shown, maldives } from "@uxyrahmed/ink-map";

const zoomed = crop(maldives, fit(pins.map((p) => p.lngLat), { padding: 0.12, ratio: 0.5 }));

<InkMap drawing={zoomed} pins={pins} />
```

- `padding` is the room round the points, as a share of the longer side they span.
- `ratio` is the shape to fill, width over height. The area grows to match it.
- `minSpan` is the least it shows from north to south, in degrees of latitude, so one pin is not a blank patch of sea.

The part in view slides back inside the drawing where it would run off an edge (`crop(drawing, bounds, { inside: false })` turns that off). Pins outside the part in view are left out.

For a small map of the whole with a box round the part in view, `shown(zoomed.frame)` gives that part as fractions of the whole: left, top, width, height.

```tsx
const [left, top, width, height] = shown(zoomed.frame);

<InkChart drawing={maldives} style={{ width: 32 }}>
  <span style={{ position: "absolute", left: `${left * 100}%`, top: `${top * 100}%`, width: `${width * 100}%`, height: `${height * 100}%`, border: "1px solid" }} />
</InkChart>
```

The country drawing is made for its whole height, so it holds up to a zoom of about three times. For closer, draw the area itself (next).

## A close-up of an area, with points

`InkArea` is a still picture of any rectangle: the land in ink, the reef flats outlined with a pale wash round them, and a dot on each point, each in its own colour. No JavaScript, so it works in a server component and a page can show dozens.

```tsx
import { InkArea, fit } from "@uxyrahmed/ink-map";
import { maldivesArea } from "@uxyrahmed/ink-map/maldives-closeup";

// In a server component, or at build time:
const stations = [
  { lngLat: [73.4328, 4.1684], label: "MTL-01" },
  { lngLat: [73.5004, 4.1822], label: "MTL-02", color: "#d26a1e" },
  { lngLat: [73.46, 4.175], label: "AQ-1", shape: "diamond", size: 10 },
];
const area = await maldivesArea(fit(stations.map((s) => s.lngLat), { ratio: 2.4, padding: 0.2 }), { size: 180 });

<InkArea area={area} points={stations} label="Stations on the Malé to Thilafushi link" />
```

- `size` is the picture's height in pixels at its usual size, which sets how much detail the outlines keep. Draw it larger for a map people zoom into.
- A point has `lngLat`, and optionally `color`, `size` (its width in pixels), `shape` (`"dot"` or `"diamond"`) and `label` (a tooltip). Points are drawn in order, so put the ones that matter last.
- The picture keeps the area's shape. Give its box another shape in your own CSS (a fixed height, say) and the picture fills it, cut at the sides, so draw the area a little wider than the points need.

For your own map on top (zoom and pan, labels), the area is plain data: `width`, `height`, two SVG paths (`land`, `shallows`) and its `bounds`. `place(area, lngLat)` gives a point's place on it as fractions, and `grow(bounds, 3)` gives a larger rectangle to draw so there is something to pan to.

For another place, `drawArea(bounds, { land, shallows }, { size })` draws from your own outlines, as `drawCloseUp` does.

## Zooming in on one place

`InkLocator` shows the whole map with a pin, and beside it a close-up of that place through a round glass: the islands in ink, the reef flats around them.

```tsx
import { InkLocator, maldives } from "@uxyrahmed/ink-map";
import { maldivesCloseUp } from "@uxyrahmed/ink-map/maldives-closeup";

// In a server component, or at build time:
const at = [73.4203, 3.8662]; // longitude, latitude
const closeUp = await maldivesCloseUp(at);

<InkLocator drawing={maldives} at={at} closeUp={closeUp} label="Ithaafushi, South Malé Atoll" />
```

`maldivesCloseUp` works for any point in the Maldives: the package carries detailed outlines of every island and reef. How far it zooms is the `span`, in degrees of latitude:

```ts
await maldivesCloseUp(at, { span: 0.5 });  // a whole atoll
await maldivesCloseUp(at, { span: 0.14 }); // an island and its reefs (the default)
await maldivesCloseUp(at, { span: 0.03 }); // one island, close
```

The outlines are about 1.7 MB, so draw the close-up on the server or at build time and pass the result down. It is a small object of SVG paths.

For another place, draw the close-up from your own detailed GeoJSON:

```ts
import { drawCloseUp, polygons } from "@uxyrahmed/ink-map";

const closeUp = drawCloseUp(at, { land: polygons(islandsGeoJson), shallows: polygons(reefsGeoJson) }, { span: 0.2 });
```

`polygons(geojson, ["kind", "island"])` takes only the features with that property. `shallows` is optional.

## Another place

Any area works: draw it once from a GeoJSON file of outlines (Polygons and MultiPolygons, in longitude and latitude).

```sh
npx ink-map-draw shapes.geojson --out public/map
```

That writes `ink.svg`, `wash.svg` and `frame.json`. Then:

```tsx
import frame from "./public/map/frame.json";

const drawing = {
  frame,
  ink: "/map/ink.svg",
  wash: "/map/wash.svg",
  credit: { label: "© OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" },
};

<InkMap drawing={drawing} pins={pins} />
```

Options:

- `--bounds west,south,east,north` sets the area in degrees. Without it, the shapes with some sea around them.
- `--height 760` sets the detail: units from north to south, about one pixel each at the size you will show it.
- `--where key=value` uses only the features with that property, for example `--where kind=reef`.

Shapes too small to see at that size become round dots. Outlines can come from OpenStreetMap (for example through [Overpass Turbo](https://overpass-turbo.eu), exported as GeoJSON) or Natural Earth.

## Credit

The Maldives drawing is made from OpenStreetMap data, © OpenStreetMap contributors, under the [ODbL](https://www.openstreetmap.org/copyright). Show the credit wherever the drawing shows: `<InkCredit drawing={maldives} />` prints the link. For your own drawings, credit the source of your outlines the same way.

## Working on the package

```sh
npm install
npm run build   # src/ to dist/
```

`dist/` is committed, so the package installs straight from GitHub with no build step. Build before you commit, then tag a version (`git tag v0.2.0 && git push --tags`). A project can pin one with `npm install github:uxyrahmed/ink-map#v0.2.0`.

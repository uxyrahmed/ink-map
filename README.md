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
| `pins` | `{ id, label, lngLat }[]`. `lngLat` is `[longitude, latitude]`. Or give `spot`, a place on the drawing as fractions `[x, y]`, if you worked it out ahead with `locate()`. |
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

import { drawArea, drawCloseUp, polygons, type Area, type AreaOptions, type CloseUp, type CloseUpOptions, type Shapes } from "./closeup.js";
import type { Bounds, LngLat } from "./frame.js";

/** Detailed reef and island outlines, one file per degree of latitude (maldives/detail). © OpenStreetMap contributors, ODbL. */
const bands: Record<number, () => Promise<{ default: unknown }>> = {
  [-1]: () => import("../maldives/detail/-1.json", { with: { type: "json" } }),
  0: () => import("../maldives/detail/0.json", { with: { type: "json" } }),
  1: () => import("../maldives/detail/1.json", { with: { type: "json" } }),
  2: () => import("../maldives/detail/2.json", { with: { type: "json" } }),
  3: () => import("../maldives/detail/3.json", { with: { type: "json" } }),
  4: () => import("../maldives/detail/4.json", { with: { type: "json" } }),
  5: () => import("../maldives/detail/5.json", { with: { type: "json" } }),
  6: () => import("../maldives/detail/6.json", { with: { type: "json" } }),
  7: () => import("../maldives/detail/7.json", { with: { type: "json" } }),
};

/** The outlines between two latitudes, a band at a time. Each band is read once and kept. */
async function outlines(south: number, north: number) {
  const wanted = Object.keys(bands)
    .map(Number)
    .filter((band) => band >= Math.floor(south) && band <= Math.floor(north));
  const shapes = await Promise.all(wanted.map(async (band) => (await bands[band]()).default as Shapes));
  return { land: polygons(shapes, ["kind", "island"]), shallows: polygons(shapes, ["kind", "reef"]) };
}

/**
 * The close-up of any place in the Maldives, for InkLocator: its islands in
 * ink and the reef flats around them. The outlines are about 1.7 MB, loaded a
 * band at a time, so call this on the server or at build time and pass the
 * result down.
 */
export async function maldivesCloseUp(at: LngLat, options: CloseUpOptions = {}): Promise<CloseUp> {
  const half = (options.span ?? 0.14) / 2;
  return drawCloseUp(at, await outlines(at[1] - half - 0.1, at[1] + half + 0.1), options);
}

/**
 * Any rectangle of the Maldives, for InkArea: `fit()` gives the rectangle
 * that holds a set of points. Like `maldivesCloseUp`, call it on the server
 * or at build time and pass the result down.
 */
export async function maldivesArea(bounds: Bounds, options: AreaOptions = {}): Promise<Area> {
  const [[, south], [, north]] = bounds;
  const margin = (north - south) * 0.1 + 0.02;
  return drawArea(bounds, await outlines(south - margin, north + margin), options);
}

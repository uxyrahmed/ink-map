import { drawCloseUp, polygons } from "./closeup.js";
/** Detailed reef and island outlines, one file per degree of latitude (maldives/detail). © OpenStreetMap contributors, ODbL. */
const bands = {
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
/**
 * The close-up of any place in the Maldives, for InkLocator: its islands in
 * ink and the reef flats around them. The outlines are about 1.7 MB, loaded a
 * band at a time, so call this on the server or at build time and pass the
 * result down.
 */
export async function maldivesCloseUp(at, options = {}) {
    const half = (options.span ?? 0.14) / 2;
    const wanted = Object.keys(bands)
        .map(Number)
        .filter((band) => band >= Math.floor(at[1] - half - 0.1) && band <= Math.floor(at[1] + half + 0.1));
    const shapes = await Promise.all(wanted.map(async (band) => (await bands[band]()).default));
    return drawCloseUp(at, { land: polygons(shapes, ["kind", "island"]), shallows: polygons(shapes, ["kind", "reef"]) }, options);
}

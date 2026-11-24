import { type Area, type AreaOptions, type CloseUp, type CloseUpOptions } from "./closeup.js";
import type { Bounds, LngLat } from "./frame.js";
/**
 * The close-up of any place in the Maldives, for InkLocator: its islands in
 * ink and the reef flats around them. The outlines are about 1.7 MB, loaded a
 * band at a time, so call this on the server or at build time and pass the
 * result down.
 */
export declare function maldivesCloseUp(at: LngLat, options?: CloseUpOptions): Promise<CloseUp>;
/**
 * Any rectangle of the Maldives, for InkArea: `fit()` gives the rectangle
 * that holds a set of points. Like `maldivesCloseUp`, call it on the server
 * or at build time and pass the result down.
 */
export declare function maldivesArea(bounds: Bounds, options?: AreaOptions): Promise<Area>;

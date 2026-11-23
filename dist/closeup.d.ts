import { type LngLat } from "./frame.js";
/** A polygon as GeoJSON has it: an outline, then any holes, each a ring of [longitude, latitude]. */
export type Polygon = number[][][];
/** Anything GeoJSON that holds Polygons or MultiPolygons. */
export type Shapes = {
    type?: string;
    features?: {
        properties?: Record<string, unknown> | null;
        geometry?: {
            type: string;
            coordinates: unknown;
        } | null;
    }[];
    geometry?: {
        type: string;
        coordinates: unknown;
    } | null;
    coordinates?: unknown;
};
/** A close-up of one place, ready for InkLocator: SVG path data in a box of `width` by `height`. */
export type CloseUp = {
    width: number;
    height: number;
    /** Solid ink: the land. */
    land: string;
    /** Outlined and lightly filled, with a soft wash around: reef flats, shallows. May be empty. */
    shallows: string;
};
export type CloseUpOptions = {
    /** Degrees of latitude the close-up shows. 0.14 is an island with the reefs around it. */
    span?: number;
    /** Its size in pixels at its usual size, which sets how much detail the outlines keep. */
    size?: number;
};
/** The polygons in a GeoJSON object, optionally only from features with a property, as `["kind", "reef"]`. */
export declare function polygons(shapes: Shapes | Shapes[], where?: [key: string, value: unknown]): Polygon[];
/**
 * Draws the close-up of a place from detailed outlines (use `polygons()` to
 * take them out of GeoJSON). Plain arithmetic: run it on the server, at build
 * time, or in the browser.
 */
export declare function drawCloseUp(at: LngLat, outlines: {
    land: Polygon[];
    shallows?: Polygon[];
}, { span, size }?: CloseUpOptions): CloseUp;

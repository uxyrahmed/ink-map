import { type Bounds, type LngLat, type Spot } from "./frame.js";
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
/**
 * A close-up of any rectangle of the earth, ready for InkArea: the same paths as a
 * CloseUp, with the area they show so points can be placed on it (`place`).
 */
export type Area = CloseUp & {
    /** The area drawn: south-west corner, then north-east. */
    bounds: Bounds;
};
export type AreaOptions = {
    /** Its height in pixels at its usual size, which sets how much detail the outlines keep. Draw it larger for a map people zoom into. */
    size?: number;
};
export type FitOptions = {
    /** Room around the points, as a share of the longer side they span. 0.15 by default. */
    padding?: number;
    /** The shape to fill, width over height: the area grows on one side or the other to match it. */
    ratio?: number;
    /** The least the area shows from north to south, in degrees of latitude, so one point is not a blank patch of sea. 0.015 (about 1.6 km) by default. */
    minSpan?: number;
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
 * The area that holds a set of points with room around them, optionally grown to a
 * shape (`ratio`, width over height). Measured on the map, not in degrees, so the
 * shape is the shape it is drawn in.
 */
export declare function fit(points: LngLat[], { padding, ratio, minSpan }?: FitOptions): Bounds;
/** An area made `times` larger about its middle: what to draw so a map fitted to the area has something to pan to. */
export declare function grow([[west, south], [east, north]]: Bounds, times: number): Bounds;
/** Where a point on the earth falls on an area, as fractions of its width and height. */
export declare function place({ bounds: [[west, south], [east, north]] }: Pick<Area, "bounds">, [longitude, latitude]: LngLat): Spot;
/**
 * Draws any rectangle of the earth from detailed outlines (use `polygons()` to take
 * them out of GeoJSON, and `fit()` for the rectangle that holds your points). Plain
 * arithmetic: run it on the server, at build time, or in the browser.
 */
export declare function drawArea(bounds: Bounds, outlines: {
    land: Polygon[];
    shallows?: Polygon[];
}, { size }?: AreaOptions): Area;
/**
 * Draws the close-up of a place from detailed outlines (use `polygons()` to
 * take them out of GeoJSON). Plain arithmetic: run it on the server, at build
 * time, or in the browser.
 */
export declare function drawCloseUp(at: LngLat, outlines: {
    land: Polygon[];
    shallows?: Polygon[];
}, { span, size }?: CloseUpOptions): CloseUp;

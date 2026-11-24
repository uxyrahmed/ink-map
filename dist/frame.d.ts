/** A point on the earth: longitude, then latitude. */
export type LngLat = [longitude: number, latitude: number];
/** A point on a drawing, as fractions of its width and height: [0, 0] is its top left corner. */
export type Spot = [x: number, y: number];
/** A rectangle of the earth: its south-west corner, then its north-east. */
export type Bounds = [southWest: LngLat, northEast: LngLat];
/**
 * The area and size of a drawing, so points can be placed on it. Written by
 * `ink-map-draw` (frame.json) together with the drawing's two SVGs.
 */
export type Frame = {
    /** The area the drawing was made from: south-west corner, then north-east. */
    bounds: [southWest: LngLat, northEast: LngLat];
    /** How many units that area is from north to south. */
    height: number;
    /** The part of it the drawing shows: left, top, width, height, in the same units (the SVGs' viewBox). */
    view: [left: number, top: number, width: number, height: number];
    /** Where the drawing reaches furthest east. */
    east?: Spot;
    /** On a drawing zoomed in with `crop`: the whole of it, as `view` was, so the SVGs can be placed behind the part that shows. */
    full?: [left: number, top: number, width: number, height: number];
};
/** A map drawn in two layers, each an SVG used as a mask so it takes any colour. */
export type Drawing = {
    frame: Frame;
    /** A drawing that comes with its own stylesheet (as `maldives` with maldives.css) is found by this name. */
    id?: string;
    /** URL of the ink layer: the land, or the reefs. Leave out when a stylesheet sets it. */
    ink?: string;
    /** URL of the wash layer: the pale water around the ink. Optional. */
    wash?: string;
    /** Who to credit wherever the drawing shows. */
    credit?: {
        label: string;
        href: string;
    };
};
/** Web Mercator y for a latitude, in radians. */
export declare function mercatorY(latitude: number): number;
/** The latitude at a Web Mercator y: `mercatorY` backwards. */
export declare function latitudeAt(y: number): number;
/** The drawing's width over its height. */
export declare function ratio(frame: Frame): number;
/** Where a point on the earth falls on the drawing. */
export declare function locate(frame: Frame, [longitude, latitude]: LngLat): Spot;
export type CropOptions = {
    /** Slide the part shown back inside the drawing where it would run off an edge, so no side of the map is blank. On by default. */
    inside?: boolean;
};
/**
 * A drawing zoomed in to part of itself: the same two SVGs, showing only `bounds`
 * (from `fit()`, say, so it follows the pins). `locate` and `ratio` work on the
 * result as on any drawing, and InkMap and InkChart draw it as it is.
 */
export declare function crop<D extends Drawing>(drawing: D, bounds: Bounds, { inside }?: CropOptions): D;
/**
 * Where the part of a zoomed drawing that shows sits on the whole of it, as fractions:
 * left, top, width, height. For a small map of the whole with a box round the part in view.
 */
export declare function shown(frame: Frame): [left: number, top: number, width: number, height: number];

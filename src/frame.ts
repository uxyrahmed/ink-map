/** A point on the earth: longitude, then latitude. */
export type LngLat = [longitude: number, latitude: number];

/** A point on a drawing, as fractions of its width and height: [0, 0] is its top left corner. */
export type Spot = [x: number, y: number];

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
  credit?: { label: string; href: string };
};

const RADIANS = Math.PI / 180;

/** Web Mercator y for a latitude, in radians. */
export function mercatorY(latitude: number) {
  return Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
}

/** The drawing's width over its height. */
export function ratio(frame: Frame) {
  return frame.view[2] / frame.view[3];
}

/** Where a point on the earth falls on the drawing. */
export function locate(frame: Frame, [longitude, latitude]: LngLat): Spot {
  const [[west, south], [, north]] = frame.bounds;
  const [left, top, width, height] = frame.view;
  const scale = frame.height / (mercatorY(north) - mercatorY(south));
  const x = (longitude - west) * RADIANS * scale;
  const y = (mercatorY(north) - mercatorY(latitude)) * scale;
  return [(x - left) / width, (y - top) / height];
}

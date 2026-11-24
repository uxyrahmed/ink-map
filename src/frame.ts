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
  credit?: { label: string; href: string };
};

const RADIANS = Math.PI / 180;

/** Web Mercator y for a latitude, in radians. */
export function mercatorY(latitude: number) {
  return Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
}

/** The latitude at a Web Mercator y: `mercatorY` backwards. */
export function latitudeAt(y: number) {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
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

export type CropOptions = {
  /** Slide the part shown back inside the drawing where it would run off an edge, so no side of the map is blank. On by default. */
  inside?: boolean;
};

/**
 * A drawing zoomed in to part of itself: the same two SVGs, showing only `bounds`
 * (from `fit()`, say, so it follows the pins). `locate` and `ratio` work on the
 * result as on any drawing, and InkMap and InkChart draw it as it is.
 */
export function crop<D extends Drawing>(drawing: D, bounds: Bounds, { inside = true }: CropOptions = {}): D {
  const { frame } = drawing;
  const [L, T, W, H] = frame.full ?? frame.view;
  const [[west, south], [east, north]] = bounds;
  const whole: Frame = { ...frame, view: [0, 0, 1, 1] };
  const [x0, y0] = locate(whole, [west, north]);
  const [x1, y1] = locate(whole, [east, south]);
  let [left, top, width, height] = [x0, y0, x1 - x0, y1 - y0];
  if (inside) {
    left = width >= W ? L + (W - width) / 2 : Math.min(Math.max(left, L), L + W - width);
    top = height >= H ? T + (H - height) / 2 : Math.min(Math.max(top, T), T + H - height);
  }
  const was = frame.view;
  const east_ = frame.east && ([(was[0] + frame.east[0] * was[2] - left) / width, (was[1] + frame.east[1] * was[3] - top) / height] as Spot);
  return { ...drawing, frame: { ...frame, view: [left, top, width, height], east: east_, full: [L, T, W, H] } };
}

/**
 * Where the part of a zoomed drawing that shows sits on the whole of it, as fractions:
 * left, top, width, height. For a small map of the whole with a box round the part in view.
 */
export function shown(frame: Frame): [left: number, top: number, width: number, height: number] {
  const [L, T, W, H] = frame.full ?? frame.view;
  const [left, top, width, height] = frame.view;
  return [(left - L) / W, (top - T) / H, width / W, height / H];
}

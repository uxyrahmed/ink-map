const RADIANS = Math.PI / 180;
/** Web Mercator y for a latitude, in radians. */
export function mercatorY(latitude) {
    return Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
}
/** The latitude at a Web Mercator y: `mercatorY` backwards. */
export function latitudeAt(y) {
    return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}
/** The drawing's width over its height. */
export function ratio(frame) {
    return frame.view[2] / frame.view[3];
}
/** Where a point on the earth falls on the drawing. */
export function locate(frame, [longitude, latitude]) {
    const [[west, south], [, north]] = frame.bounds;
    const [left, top, width, height] = frame.view;
    const scale = frame.height / (mercatorY(north) - mercatorY(south));
    const x = (longitude - west) * RADIANS * scale;
    const y = (mercatorY(north) - mercatorY(latitude)) * scale;
    return [(x - left) / width, (y - top) / height];
}
/**
 * A drawing zoomed in to part of itself: the same two SVGs, showing only `bounds`
 * (from `fit()`, say, so it follows the pins). `locate` and `ratio` work on the
 * result as on any drawing, and InkMap and InkChart draw it as it is.
 */
export function crop(drawing, bounds, { inside = true } = {}) {
    const { frame } = drawing;
    const [L, T, W, H] = frame.full ?? frame.view;
    const [[west, south], [east, north]] = bounds;
    const whole = { ...frame, view: [0, 0, 1, 1] };
    const [x0, y0] = locate(whole, [west, north]);
    const [x1, y1] = locate(whole, [east, south]);
    let [left, top, width, height] = [x0, y0, x1 - x0, y1 - y0];
    if (inside) {
        left = width >= W ? L + (W - width) / 2 : Math.min(Math.max(left, L), L + W - width);
        top = height >= H ? T + (H - height) / 2 : Math.min(Math.max(top, T), T + H - height);
    }
    const was = frame.view;
    const east_ = frame.east && [(was[0] + frame.east[0] * was[2] - left) / width, (was[1] + frame.east[1] * was[3] - top) / height];
    return { ...drawing, frame: { ...frame, view: [left, top, width, height], east: east_, full: [L, T, W, H] } };
}
/**
 * Where the part of a zoomed drawing that shows sits on the whole of it, as fractions:
 * left, top, width, height. For a small map of the whole with a box round the part in view.
 */
export function shown(frame) {
    const [L, T, W, H] = frame.full ?? frame.view;
    const [left, top, width, height] = frame.view;
    return [(left - L) / W, (top - T) / H, width / W, height / H];
}

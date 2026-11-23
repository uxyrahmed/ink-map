const RADIANS = Math.PI / 180;
/** Web Mercator y for a latitude, in radians. */
export function mercatorY(latitude) {
    return Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
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

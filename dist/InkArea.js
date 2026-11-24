import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { place } from "./closeup.js";
import { mercatorY } from "./frame.js";
import { themeVars } from "./themes.js";
/** How wide the shallow water round a reef is drawn, in metres on the ground. */
const WASH_METRES = 800;
const EARTH_METRES = 6378137;
/**
 * A close-up of an area as a still picture: the land in ink, the reef flats
 * outlined with a pale wash round them, and a dot on each point, in any
 * colour. No JavaScript, so it works in a server component and costs the
 * browser nothing: a page can show dozens.
 *
 * It keeps the area's shape. Give its box another shape in your own CSS
 * (a fixed height, say) and the picture fills it, cut at the sides, so draw
 * the area a little wider than the points need.
 */
export function InkArea({ area, points = [], theme, label, className, style, children }) {
    const [[, south], [, north]] = area.bounds;
    const perMetre = area.height / ((mercatorY(north) - mercatorY(south)) * EARTH_METRES);
    const wash = Math.max(5, Math.min(WASH_METRES * perMetre, area.height * 0.16));
    return (_jsxs("div", { className: className ? `inkmap-area ${className}` : "inkmap-area", role: label ? "img" : undefined, "aria-label": label, style: { "--inkmap-ratio": area.width / area.height, ...themeVars(theme), ...style }, children: [_jsxs("svg", { viewBox: `0 0 ${area.width.toFixed(1)} ${area.height.toFixed(1)}`, preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true", focusable: "false", children: [area.shallows && (_jsxs(_Fragment, { children: [_jsxs("g", { className: "inkmap-area-wash", children: [_jsx("path", { d: area.shallows, strokeWidth: wash.toFixed(1) }), _jsx("path", { d: area.shallows, strokeWidth: (wash * 0.45).toFixed(1) })] }), _jsx("path", { className: "inkmap-area-shallows", d: area.shallows, fillRule: "evenodd", vectorEffect: "non-scaling-stroke" })] })), _jsx("path", { className: "inkmap-area-land", d: area.land, fillRule: "evenodd" }), points.map((point, i) => {
                        const [fx, fy] = place(area, point.lngLat);
                        const [x, y] = [fx * area.width, fy * area.height];
                        const r = (point.size ?? 8) / 2;
                        const fill = point.color ? { fill: point.color } : undefined;
                        return point.shape === "diamond" ? (_jsx("rect", { className: "inkmap-area-point", x: (x - r * 0.9).toFixed(1), y: (y - r * 0.9).toFixed(1), width: (r * 1.8).toFixed(1), height: (r * 1.8).toFixed(1), rx: (r * 0.2).toFixed(1), transform: `rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})`, style: fill, children: point.label && _jsx("title", { children: point.label }) }, point.id ?? i)) : (_jsx("circle", { className: "inkmap-area-point", cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), style: fill, children: point.label && _jsx("title", { children: point.label }) }, point.id ?? i));
                    })] }), children] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { locate, ratio } from "./frame.js";
import { InkChart } from "./InkChart.js";
import { themeVars } from "./themes.js";
/** The figure's box, in its own units: the drawing is HEIGHT tall, the close-up a circle of RADIUS on its right. */
const HEIGHT = 100;
const WIDTH = 142;
const RADIUS = 45;
const CENTRE = [WIDTH - RADIUS - 1, HEIGHT / 2];
const pct = (n, of) => `${((n / of) * 100).toFixed(3)}%`;
/** Where the two lines from a point touch the close-up's rim (its tangents). */
function tangents([px, py]) {
    const [cx, cy] = CENTRE;
    const toPoint = Math.atan2(py - cy, px - cx);
    const spread = Math.acos(RADIUS / Math.hypot(px - cx, py - cy));
    return [toPoint - spread, toPoint + spread].map((angle) => [cx + RADIUS * Math.cos(angle), cy + RADIUS * Math.sin(angle)]);
}
/**
 * Where one place is: the whole map in ink with a pin on the place, and
 * beside it a close-up of the place through a round glass, with two fine
 * lines running from the pin to its rim. Everything is placed in the figure's
 * own units, so it keeps its shape at any width. No JavaScript, so it works
 * in a server component.
 */
export function InkLocator({ drawing, at, closeUp, theme, label, className, style }) {
    const chainWidth = HEIGHT * ratio(drawing.frame);
    const [x, y] = locate(drawing.frame, at);
    const pin = [x * chainWidth, y * HEIGHT];
    const [first, second] = tangents(pin);
    const point = (p) => p.map((n) => n.toFixed(2)).join(" ");
    return (_jsxs("div", { className: className ? `inkmap-locator ${className}` : "inkmap-locator", role: "img", "aria-label": label, style: { aspectRatio: `${WIDTH} / ${HEIGHT}`, ...themeVars(theme), ...style }, children: [_jsx(InkChart, { drawing: drawing, className: "inkmap-locator-whole", style: { width: pct(chainWidth, WIDTH) } }), _jsx("svg", { className: "inkmap-locator-lines", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, preserveAspectRatio: "none", "aria-hidden": "true", focusable: "false", children: _jsx("path", { d: `M${point(first)}L${point(pin)}L${point(second)}`, vectorEffect: "non-scaling-stroke" }) }), _jsx("span", { className: "inkmap-locator-dot", style: { left: pct(pin[0], WIDTH), top: pct(pin[1], HEIGHT) } }), _jsxs("div", { className: "inkmap-locator-glass", style: { left: pct(CENTRE[0] - RADIUS, WIDTH), top: pct(CENTRE[1] - RADIUS, HEIGHT), width: pct(RADIUS * 2, WIDTH) }, children: [_jsxs("svg", { viewBox: `0 0 ${closeUp.width.toFixed(1)} ${closeUp.height.toFixed(1)}`, preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true", focusable: "false", children: [_jsxs("g", { className: "inkmap-locator-wash", children: [_jsx("path", { d: closeUp.shallows, strokeWidth: "26" }), _jsx("path", { d: closeUp.shallows, strokeWidth: "12" })] }), _jsx("path", { className: "inkmap-locator-shallows", d: closeUp.shallows, fillRule: "evenodd", vectorEffect: "non-scaling-stroke" }), _jsx("path", { className: "inkmap-locator-land", d: closeUp.land, fillRule: "evenodd" })] }), _jsx("span", { className: "inkmap-locator-site" })] })] }));
}

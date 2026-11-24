import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { ratio } from "./frame.js";
import { themeVars } from "./themes.js";
/**
 * A layer's mask: its SVG, where the drawing names one, and on a drawing zoomed in
 * with `crop`, the size and place that put the part in view behind the box.
 */
function mask(url, { view, full }) {
    const style = url ? { maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")` } : {};
    if (full) {
        const [l, t, w, h] = view;
        const [L, T, W, H] = full;
        // As background-position: a percentage of the room left over, which is less than none here.
        const at = (from, whole, part) => (Math.abs(whole - part) < 1e-9 ? 50 : ((from) / (whole - part)) * 100);
        const size = `${((W / w) * 100).toFixed(3)}% ${((H / h) * 100).toFixed(3)}%`;
        const position = `${at(l - L, W, w).toFixed(3)}% ${at(t - T, H, h).toFixed(3)}%`;
        Object.assign(style, { maskSize: size, WebkitMaskSize: size, maskPosition: position, WebkitMaskPosition: position });
    }
    return url || full ? style : undefined;
}
/**
 * The drawing alone: two masks, coloured by the theme, with nothing painted
 * behind them so the page shows through. No JavaScript, so it also works in a
 * server component. Give it a width or a height and it keeps the drawing's
 * shape. For pins and picking, use InkMap.
 */
export const InkChart = forwardRef(function InkChart({ drawing, theme, highlight = false, label, className, style, children }, ref) {
    return (_jsxs("div", { ref: ref, className: className ? `inkmap-chart ${className}` : "inkmap-chart", "data-drawing": drawing.id, "data-highlight": highlight ? "" : undefined, style: { "--inkmap-ratio": ratio(drawing.frame), ...themeVars(theme), ...style }, children: [(drawing.wash || drawing.id) && _jsx("span", { className: "inkmap-wash", "aria-hidden": "true", style: mask(drawing.wash, drawing.frame) }), _jsx("span", { className: "inkmap-ink", role: label ? "img" : undefined, "aria-label": label, "aria-hidden": label ? undefined : true, style: mask(drawing.ink, drawing.frame) }), children] }));
});

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { ratio } from "./frame.js";
import { themeVars } from "./themes.js";
const mask = (url) => (url ? { maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")` } : undefined);
/**
 * The drawing alone: two masks, coloured by the theme, with nothing painted
 * behind them so the page shows through. No JavaScript, so it also works in a
 * server component. Give it a width or a height and it keeps the drawing's
 * shape. For pins and picking, use InkMap.
 */
export const InkChart = forwardRef(function InkChart({ drawing, theme, highlight = false, label, className, style, children }, ref) {
    return (_jsxs("div", { ref: ref, className: className ? `inkmap-chart ${className}` : "inkmap-chart", "data-drawing": drawing.id, "data-highlight": highlight ? "" : undefined, style: { "--inkmap-ratio": ratio(drawing.frame), ...themeVars(theme), ...style }, children: [(drawing.wash || drawing.id) && _jsx("span", { className: "inkmap-wash", "aria-hidden": "true", style: mask(drawing.wash) }), _jsx("span", { className: "inkmap-ink", role: label ? "img" : undefined, "aria-label": label, "aria-hidden": label ? undefined : true, style: mask(drawing.ink) }), children] }));
});

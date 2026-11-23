"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { locate } from "./frame.js";
import { InkChart } from "./InkChart.js";
import { themeVars } from "./themes.js";
/**
 * The drawing with a pin on each place. Pins are small, so the one nearest
 * the pointer is picked rather than the one under it. Each pin is still a
 * button, for the keyboard and screen readers.
 */
export function InkMap({ drawing, pins, active, defaultActive, onPick, pickOnHover = true, reach, theme, highlight = false, label, className, chartClassName, style, children, }) {
    const [own, setOwn] = useState(defaultActive);
    const picked = active === undefined ? own : active;
    const [near, setNear] = useState(false);
    const chart = useRef(null);
    const placed = pins.flatMap((pin) => {
        const spot = pin.spot ?? (pin.lngLat && locate(drawing.frame, pin.lngLat));
        return spot ? [{ ...pin, spot }] : [];
    });
    function pick(id, how) {
        if (active === undefined)
            setOwn(id);
        onPick?.(id, how);
    }
    function nearest(event, within) {
        const box = chart.current?.getBoundingClientRect();
        if (!box)
            return undefined;
        let found;
        let distance = within;
        for (const { id, spot } of placed) {
            const d = Math.hypot(box.left + spot[0] * box.width - event.clientX, box.top + spot[1] * box.height - event.clientY);
            if (d < distance)
                [found, distance] = [id, d];
        }
        return found;
    }
    function point(event) {
        if (event.pointerType !== "mouse")
            return;
        const found = nearest(event, reach?.mouse ?? 30);
        setNear(found !== undefined);
        if (pickOnHover && found !== undefined && found !== picked)
            pick(found, "point");
    }
    /** A tap or click near a pin picks it. A click from the keyboard (detail 0) is the pin's own. */
    function tap(event) {
        if (event.detail === 0)
            return;
        const found = nearest(event, reach?.touch ?? 44);
        if (found !== undefined)
            pick(found, "tap");
    }
    return (_jsxs("div", { className: className ? `inkmap ${className}` : "inkmap", "data-near": near ? "" : undefined, "data-highlight": highlight ? "" : undefined, style: { ...themeVars(theme), ...style }, onPointerMove: point, onPointerLeave: () => setNear(false), onClick: tap, children: [_jsx(InkChart, { ref: chart, drawing: drawing, highlight: highlight, label: label, className: chartClassName, children: _jsx("ul", { className: "inkmap-pins", children: placed.map((pin) => (_jsx("li", { children: _jsx("button", { type: "button", className: "inkmap-pin", style: { left: `${pin.spot[0] * 100}%`, top: `${pin.spot[1] * 100}%` }, "aria-pressed": pin.id === picked, "aria-label": pin.label, onFocus: () => pin.id !== picked && pick(pin.id, "focus"), onClick: (event) => event.detail === 0 && pick(pin.id, "tap") }) }, pin.id))) }) }), children] }));
}

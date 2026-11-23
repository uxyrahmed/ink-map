import { type CSSProperties, type ReactNode } from "react";
import { type Drawing } from "./frame.js";
import { type Theme } from "./themes.js";
export type InkChartProps = {
    /** The map to draw: `maldives`, or your own from `ink-map-draw`. */
    drawing: Drawing;
    /** Colours. Leave out for the `reef` look, or set the --inkmap-* variables in your own CSS. */
    theme?: Theme;
    /** Draw the whole map in the accent colour. */
    highlight?: boolean;
    /** What a screen reader calls the map. */
    label?: string;
    className?: string;
    style?: CSSProperties;
    /** Anything to lay over the drawing. It is positioned against the drawing's box. */
    children?: ReactNode;
};
/**
 * The drawing alone: two masks, coloured by the theme, with nothing painted
 * behind them so the page shows through. No JavaScript, so it also works in a
 * server component. Give it a width or a height and it keeps the drawing's
 * shape. For pins and picking, use InkMap.
 */
export declare const InkChart: import("react").ForwardRefExoticComponent<InkChartProps & import("react").RefAttributes<HTMLDivElement>>;

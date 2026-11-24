import type { CSSProperties, ReactNode } from "react";
import { type Area } from "./closeup.js";
import { type LngLat } from "./frame.js";
import { type Theme } from "./themes.js";
export type AreaPoint = {
    id?: string;
    /** Where it is on the earth. */
    lngLat: LngLat;
    /** Any CSS colour. Leave out for the accent. */
    color?: string;
    /** Its width in pixels, at the size the area was drawn for. 8 by default. */
    size?: number;
    /** A round dot, or a diamond for a second kind of point. */
    shape?: "dot" | "diamond";
    /** Shown as a tooltip, and read by screen readers. */
    label?: string;
};
export type InkAreaProps = {
    /** The close-up to show, from `drawArea` or `maldivesArea`. */
    area: Area;
    /** Points to mark on it, drawn in order: put the ones that matter last. */
    points?: AreaPoint[];
    /** Colours. Leave out for the `reef` look, or set the --inkmap-* variables in your own CSS. */
    theme?: Theme;
    /** What a screen reader calls the picture. */
    label?: string;
    className?: string;
    style?: CSSProperties;
    /** Anything to lay over the picture. It is positioned against the picture's box. */
    children?: ReactNode;
};
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
export declare function InkArea({ area, points, theme, label, className, style, children }: InkAreaProps): import("react").JSX.Element;

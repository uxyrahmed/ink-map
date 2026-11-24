import { type CSSProperties, type ReactNode } from "react";
import { type Drawing, type LngLat, type Spot } from "./frame.js";
import { type Theme } from "./themes.js";
export type Pin = {
    id: string;
    /** What a screen reader calls the pin, for example "Malé: Harbour survey". */
    label: string;
    /** Where it is on the earth. */
    lngLat?: LngLat;
    /** Or where it is on the drawing, as fractions of its width and height (from `locate`, worked out ahead of time). */
    spot?: Spot;
    /** Its own colour, any CSS colour. Leave out for the accent. */
    color?: string;
    /** Its dot's width in pixels. 10 by default. */
    size?: number;
};
/** How a pin was picked: the mouse came near it, it was tapped or clicked, or it was reached with the keyboard. */
export type PickHow = "point" | "tap" | "focus";
export type InkMapProps = {
    /** The map to draw: `maldives`, or your own from `ink-map-draw`. */
    drawing: Drawing;
    pins: Pin[];
    /** The picked pin's id. Leave it out and the map keeps track itself (starting from `defaultActive`). */
    active?: string | null;
    defaultActive?: string;
    /** Told each time someone picks a pin. */
    onPick?: (id: string, how: PickHow) => void;
    /** Pick the pin the mouse comes near, without a click. On by default. */
    pickOnHover?: boolean;
    /** How near a pin the mouse or a finger has to come to pick it, in pixels. */
    reach?: {
        mouse?: number;
        touch?: number;
    };
    /** Colours. Leave out for the `reef` look, or set the --inkmap-* variables in your own CSS. */
    theme?: Theme;
    /** Draw the whole map in the accent colour and dim the pins: for something that covers the whole area. */
    highlight?: boolean;
    /** What a screen reader calls the map. */
    label?: string;
    /** On the outer box. Pins are picked from anywhere inside it, so it can be wider than the drawing. */
    className?: string;
    /** On the drawing's own box. */
    chartClassName?: string;
    style?: CSSProperties;
    /** Anything to add inside the outer box, after the drawing: a line to the picked pin, a label. */
    children?: ReactNode;
};
/**
 * The drawing with a pin on each place. Pins are small, so the one nearest
 * the pointer is picked rather than the one under it. Each pin is still a
 * button, for the keyboard and screen readers.
 */
export declare function InkMap({ drawing, pins, active, defaultActive, onPick, pickOnHover, reach, theme, highlight, label, className, chartClassName, style, children, }: InkMapProps): import("react").JSX.Element;

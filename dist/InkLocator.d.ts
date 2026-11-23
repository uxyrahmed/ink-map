import type { CSSProperties } from "react";
import type { CloseUp } from "./closeup.js";
import { type Drawing, type LngLat } from "./frame.js";
import { type Theme } from "./themes.js";
export type InkLocatorProps = {
    /** The whole map: `maldives`, or your own from `ink-map-draw`. */
    drawing: Drawing;
    /** The place to show. */
    at: LngLat;
    /** The view through the glass, from `drawCloseUp` or `maldivesCloseUp`. */
    closeUp: CloseUp;
    /** Colours. Leave out for the `reef` look, or set the --inkmap-* variables in your own CSS. */
    theme?: Theme;
    /** What a screen reader calls the figure, for example "Ithaafushi, South Malé Atoll". */
    label: string;
    className?: string;
    style?: CSSProperties;
};
/**
 * Where one place is: the whole map in ink with a pin on the place, and
 * beside it a close-up of the place through a round glass, with two fine
 * lines running from the pin to its rim. Everything is placed in the figure's
 * own units, so it keeps its shape at any width. No JavaScript, so it works
 * in a server component.
 */
export declare function InkLocator({ drawing, at, closeUp, theme, label, className, style }: InkLocatorProps): import("react").JSX.Element;

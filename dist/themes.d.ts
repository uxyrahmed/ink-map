import type { CSSProperties } from "react";
/** The map's colours. Any CSS colour, including `var(--your-token)`. */
export type Theme = {
    /** The land or reefs. */
    ink?: string;
    /** The pale water around them. */
    wash?: string;
    /** Pins, and the whole drawing while `highlight` is on. */
    accent?: string;
    /** The colour behind the map, for the ring that lifts a pin off the drawing. Nothing is painted with it otherwise. */
    ground?: string;
};
/** The look the map was designed with (CDE Consulting): sea teal ink, lagoon wash, red pins, on warm paper. Also the default. */
export declare const reef: Theme;
/** Black ink on white. */
export declare const mono: Theme;
/** Pale ink for a dark page. */
export declare const night: Theme;
export declare const themes: {
    reef: Theme;
    mono: Theme;
    night: Theme;
};
/** A theme as the CSS variables the stylesheet reads. */
export declare function themeVars(theme?: Theme): CSSProperties;

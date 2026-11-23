import type { Drawing } from "./frame.js";
/** A link crediting the drawing's source. Unstyled: it takes the look of the text around it. */
export declare function InkCredit({ drawing, className }: {
    drawing: Drawing;
    className?: string;
}): import("react").JSX.Element | null;

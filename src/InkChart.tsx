import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { ratio, type Drawing } from "./frame.js";
import { themeVars, type Theme } from "./themes.js";

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

const mask = (url?: string): CSSProperties | undefined => (url ? { maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")` } : undefined);

/**
 * The drawing alone: two masks, coloured by the theme, with nothing painted
 * behind them so the page shows through. No JavaScript, so it also works in a
 * server component. Give it a width or a height and it keeps the drawing's
 * shape. For pins and picking, use InkMap.
 */
export const InkChart = forwardRef<HTMLDivElement, InkChartProps>(function InkChart(
  { drawing, theme, highlight = false, label, className, style, children },
  ref,
) {
  return (
    <div
      ref={ref}
      className={className ? `inkmap-chart ${className}` : "inkmap-chart"}
      data-drawing={drawing.id}
      data-highlight={highlight ? "" : undefined}
      style={{ "--inkmap-ratio": ratio(drawing.frame), ...themeVars(theme), ...style } as CSSProperties}
    >
      {(drawing.wash || drawing.id) && <span className="inkmap-wash" aria-hidden="true" style={mask(drawing.wash)} />}
      <span className="inkmap-ink" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={mask(drawing.ink)} />
      {children}
    </div>
  );
});

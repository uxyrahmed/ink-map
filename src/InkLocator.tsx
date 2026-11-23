import type { CSSProperties } from "react";
import type { CloseUp } from "./closeup.js";
import { locate, ratio, type Drawing, type LngLat } from "./frame.js";
import { InkChart } from "./InkChart.js";
import { themeVars, type Theme } from "./themes.js";

/** The figure's box, in its own units: the drawing is HEIGHT tall, the close-up a circle of RADIUS on its right. */
const HEIGHT = 100;
const WIDTH = 142;
const RADIUS = 45;
const CENTRE: [number, number] = [WIDTH - RADIUS - 1, HEIGHT / 2];

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

/** Where the two lines from a point touch the close-up's rim (its tangents). */
function tangents([px, py]: [number, number]) {
  const [cx, cy] = CENTRE;
  const toPoint = Math.atan2(py - cy, px - cx);
  const spread = Math.acos(RADIUS / Math.hypot(px - cx, py - cy));
  return [toPoint - spread, toPoint + spread].map((angle) => [cx + RADIUS * Math.cos(angle), cy + RADIUS * Math.sin(angle)]);
}

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
export function InkLocator({ drawing, at, closeUp, theme, label, className, style }: InkLocatorProps) {
  const chainWidth = HEIGHT * ratio(drawing.frame);
  const [x, y] = locate(drawing.frame, at);
  const pin: [number, number] = [x * chainWidth, y * HEIGHT];
  const [first, second] = tangents(pin);
  const point = (p: number[]) => p.map((n) => n.toFixed(2)).join(" ");

  return (
    <div
      className={className ? `inkmap-locator ${className}` : "inkmap-locator"}
      role="img"
      aria-label={label}
      style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, ...themeVars(theme), ...style }}
    >
      <InkChart drawing={drawing} className="inkmap-locator-whole" style={{ width: pct(chainWidth, WIDTH) }} />

      {/* From the pin to the glass */}
      <svg className="inkmap-locator-lines" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={`M${point(first)}L${point(pin)}L${point(second)}`} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="inkmap-locator-dot" style={{ left: pct(pin[0], WIDTH), top: pct(pin[1], HEIGHT) }} />

      <div
        className="inkmap-locator-glass"
        style={{ left: pct(CENTRE[0] - RADIUS, WIDTH), top: pct(CENTRE[1] - RADIUS, HEIGHT), width: pct(RADIUS * 2, WIDTH) }}
      >
        <svg viewBox={`0 0 ${closeUp.width.toFixed(1)} ${closeUp.height.toFixed(1)}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          {/* Shallow water around the reefs, then the reef flats, then the land in full ink. */}
          <g className="inkmap-locator-wash">
            <path d={closeUp.shallows} strokeWidth="26" />
            <path d={closeUp.shallows} strokeWidth="12" />
          </g>
          <path className="inkmap-locator-shallows" d={closeUp.shallows} fillRule="evenodd" vectorEffect="non-scaling-stroke" />
          <path className="inkmap-locator-land" d={closeUp.land} fillRule="evenodd" />
        </svg>
        <span className="inkmap-locator-site" />
      </div>
    </div>
  );
}

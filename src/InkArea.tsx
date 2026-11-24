import type { CSSProperties, ReactNode } from "react";
import { place, type Area } from "./closeup.js";
import { mercatorY, type LngLat } from "./frame.js";
import { themeVars, type Theme } from "./themes.js";

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

/** How wide the shallow water round a reef is drawn, in metres on the ground. */
const WASH_METRES = 800;
const EARTH_METRES = 6378137;

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
export function InkArea({ area, points = [], theme, label, className, style, children }: InkAreaProps) {
  const [[, south], [, north]] = area.bounds;
  const perMetre = area.height / ((mercatorY(north) - mercatorY(south)) * EARTH_METRES);
  const wash = Math.max(5, Math.min(WASH_METRES * perMetre, area.height * 0.16));
  return (
    <div
      className={className ? `inkmap-area ${className}` : "inkmap-area"}
      role={label ? "img" : undefined}
      aria-label={label}
      style={{ "--inkmap-ratio": area.width / area.height, ...themeVars(theme), ...style } as CSSProperties}
    >
      <svg viewBox={`0 0 ${area.width.toFixed(1)} ${area.height.toFixed(1)}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {area.shallows && (
          <>
            <g className="inkmap-area-wash">
              <path d={area.shallows} strokeWidth={wash.toFixed(1)} />
              <path d={area.shallows} strokeWidth={(wash * 0.45).toFixed(1)} />
            </g>
            <path className="inkmap-area-shallows" d={area.shallows} fillRule="evenodd" vectorEffect="non-scaling-stroke" />
          </>
        )}
        <path className="inkmap-area-land" d={area.land} fillRule="evenodd" />
        {points.map((point, i) => {
          const [fx, fy] = place(area, point.lngLat);
          const [x, y] = [fx * area.width, fy * area.height];
          const r = (point.size ?? 8) / 2;
          const fill = point.color ? { fill: point.color } : undefined;
          return point.shape === "diamond" ? (
            <rect
              key={point.id ?? i}
              className="inkmap-area-point"
              x={(x - r * 0.9).toFixed(1)}
              y={(y - r * 0.9).toFixed(1)}
              width={(r * 1.8).toFixed(1)}
              height={(r * 1.8).toFixed(1)}
              rx={(r * 0.2).toFixed(1)}
              transform={`rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})`}
              style={fill}
            >
              {point.label && <title>{point.label}</title>}
            </rect>
          ) : (
            <circle key={point.id ?? i} className="inkmap-area-point" cx={x.toFixed(1)} cy={y.toFixed(1)} r={r.toFixed(1)} style={fill}>
              {point.label && <title>{point.label}</title>}
            </circle>
          );
        })}
      </svg>
      {children}
    </div>
  );
}

"use client";

import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { locate, type Drawing, type LngLat, type Spot } from "./frame.js";
import { InkChart } from "./InkChart.js";
import { themeVars, type Theme } from "./themes.js";

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
  reach?: { mouse?: number; touch?: number };
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
export function InkMap({
  drawing,
  pins,
  active,
  defaultActive,
  onPick,
  pickOnHover = true,
  reach,
  theme,
  highlight = false,
  label,
  className,
  chartClassName,
  style,
  children,
}: InkMapProps) {
  const [own, setOwn] = useState<string | undefined>(defaultActive);
  const picked = active === undefined ? own : active;
  const [near, setNear] = useState(false);
  const chart = useRef<HTMLDivElement>(null);

  // On a drawing zoomed in with `crop`, a pin outside the part in view is left out.
  const zoomed = drawing.frame.full !== undefined;
  const placed = pins.flatMap((pin) => {
    const spot = pin.spot ?? (pin.lngLat && locate(drawing.frame, pin.lngLat));
    if (!spot || (zoomed && (spot[0] < 0 || spot[0] > 1 || spot[1] < 0 || spot[1] > 1))) return [];
    return [{ ...pin, spot }];
  });

  function pick(id: string, how: PickHow) {
    if (active === undefined) setOwn(id);
    onPick?.(id, how);
  }

  function nearest(event: { clientX: number; clientY: number }, within: number) {
    const box = chart.current?.getBoundingClientRect();
    if (!box) return undefined;
    let found: string | undefined;
    let distance = within;
    for (const { id, spot } of placed) {
      const d = Math.hypot(box.left + spot[0] * box.width - event.clientX, box.top + spot[1] * box.height - event.clientY);
      if (d < distance) [found, distance] = [id, d];
    }
    return found;
  }

  function point(event: PointerEvent) {
    if (event.pointerType !== "mouse") return;
    const found = nearest(event, reach?.mouse ?? 30);
    setNear(found !== undefined);
    if (pickOnHover && found !== undefined && found !== picked) pick(found, "point");
  }

  /** A tap or click near a pin picks it. A click from the keyboard (detail 0) is the pin's own. */
  function tap(event: MouseEvent) {
    if (event.detail === 0) return;
    const found = nearest(event, reach?.touch ?? 44);
    if (found !== undefined) pick(found, "tap");
  }

  return (
    <div
      className={className ? `inkmap ${className}` : "inkmap"}
      data-near={near ? "" : undefined}
      data-highlight={highlight ? "" : undefined}
      style={{ ...themeVars(theme), ...style }}
      onPointerMove={point}
      onPointerLeave={() => setNear(false)}
      onClick={tap}
    >
      <InkChart ref={chart} drawing={drawing} highlight={highlight} label={label} className={chartClassName}>
        <ul className="inkmap-pins">
          {placed.map((pin) => (
            <li key={pin.id}>
              <button
                type="button"
                className="inkmap-pin"
                style={
                  {
                    left: `${pin.spot[0] * 100}%`,
                    top: `${pin.spot[1] * 100}%`,
                    ...(pin.color ? { "--inkmap-accent": pin.color } : null),
                    ...(pin.size ? { "--inkmap-pin": `${pin.size}px` } : null),
                  } as CSSProperties
                }
                aria-pressed={pin.id === picked}
                aria-label={pin.label}
                onFocus={() => pin.id !== picked && pick(pin.id, "focus")}
                onClick={(event) => event.detail === 0 && pick(pin.id, "tap")}
              />
            </li>
          ))}
        </ul>
      </InkChart>
      {children}
    </div>
  );
}

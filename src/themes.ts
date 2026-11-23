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
export const reef: Theme = { ink: "#0d5c69", wash: "#3fb8b2", accent: "#bc1b23", ground: "#f4f2ee" };

/** Black ink on white. */
export const mono: Theme = { ink: "#1a1a1a", wash: "#8a8a8a", accent: "#d92d20", ground: "#ffffff" };

/** Pale ink for a dark page. */
export const night: Theme = { ink: "#d8e6e8", wash: "#5fa8b0", accent: "#ff6b5e", ground: "#0b1f24" };

export const themes = { reef, mono, night };

/** A theme as the CSS variables the stylesheet reads. */
export function themeVars(theme?: Theme): CSSProperties {
  const vars: Record<string, string> = {};
  if (theme?.ink) vars["--inkmap-ink"] = theme.ink;
  if (theme?.wash) vars["--inkmap-wash"] = theme.wash;
  if (theme?.accent) vars["--inkmap-accent"] = theme.accent;
  if (theme?.ground) vars["--inkmap-ground"] = theme.ground;
  return vars as CSSProperties;
}

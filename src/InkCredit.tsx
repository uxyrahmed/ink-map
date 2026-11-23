import type { Drawing } from "./frame.js";

/** A link crediting the drawing's source. Unstyled: it takes the look of the text around it. */
export function InkCredit({ drawing, className }: { drawing: Drawing; className?: string }) {
  if (!drawing.credit) return null;
  return (
    <a href={drawing.credit.href} target="_blank" rel="noreferrer" className={className}>
      {drawing.credit.label}
    </a>
  );
}

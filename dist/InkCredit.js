import { jsx as _jsx } from "react/jsx-runtime";
/** A link crediting the drawing's source. Unstyled: it takes the look of the text around it. */
export function InkCredit({ drawing, className }) {
    if (!drawing.credit)
        return null;
    return (_jsx("a", { href: drawing.credit.href, target: "_blank", rel: "noreferrer", className: className, children: drawing.credit.label }));
}

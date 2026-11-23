/**
 * The Maldives, Ihavandhippolhu to Addu: every reef in ink over three pale
 * bands of shallow water. Its two SVGs are set by maldives.css, so import
 * that stylesheet with it:
 *
 *   import "@uxyrahmed/ink-map/maldives.css";
 *
 * Reef outlines © OpenStreetMap contributors (ODbL): show `maldives.credit`
 * wherever the drawing shows (InkCredit does it).
 */
export const maldives = {
    id: "maldives",
    // maldives/frame.json
    frame: {
        bounds: [
            [72.2, -1.05],
            [74.1, 7.45],
        ],
        height: 760,
        view: [8, 8, 155, 745],
        east: [0.9935, 0.4707],
    },
    credit: { label: "© OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" },
};

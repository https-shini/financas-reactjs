// Gera os arquivos SVG oficiais da marca VELDORA a partir de src/brand/geometry.js.
// Uso: node scripts/generate-brand-assets.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import {
    APP_ICON_RADIUS, APP_ICON_SYMBOL_TRANSFORM, APP_ICON_VIEWBOX, BRAND_COLORS, HORIZONTAL_VIEWBOX, SYMBOL_BODY, SYMBOL_FACET,
    SYMBOL_VIEWBOX, WORDMARK_HEIGHT, WORDMARK_LETTERS, WORDMARK_OFFSET, WORDMARK_STROKE, WORDMARK_WIDTH,
} from "../src/brand/geometry.js";

const out = new URL("../public/brand/", import.meta.url);
mkdirSync(out, { recursive: true });

const glyphs = (body, facet, facetOpacity = 1) =>
    `<path d="${SYMBOL_BODY}" fill="${body}"/><path d="${SYMBOL_FACET}" fill="${facet}"${facetOpacity < 1 ? ` opacity="${facetOpacity}"` : ""}/>`;
const letters = (color) =>
    `<g fill="none" stroke="${color}" stroke-width="${WORDMARK_STROKE}" stroke-miterlimit="10">${WORDMARK_LETTERS.map((l) => `<path d="${l.d}" stroke-linejoin="${l.join}"/>`).join("")}</g>`;
const svg = (viewBox, title, body, extra = "") =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img"${extra}><title>${title}</title>${body}</svg>\n`;

const { blue, violet, deepBlack, iceWhite, ink } = BRAND_COLORS;
const files = {
    "veldora-symbol.svg": svg(SYMBOL_VIEWBOX, "VELDORA", glyphs(blue, violet)),
    "veldora-symbol-mono-dark.svg": svg(SYMBOL_VIEWBOX, "VELDORA", glyphs(ink, ink, 0.55)),
    "veldora-symbol-mono-light.svg": svg(SYMBOL_VIEWBOX, "VELDORA", glyphs(iceWhite, iceWhite, 0.55)),
    "veldora-logo-on-dark.svg": svg(HORIZONTAL_VIEWBOX, "VELDORA", `${glyphs(blue, violet)}<g transform="translate(${WORDMARK_OFFSET.x} ${WORDMARK_OFFSET.y})">${letters(iceWhite)}</g>`),
    "veldora-logo-on-light.svg": svg(HORIZONTAL_VIEWBOX, "VELDORA", `${glyphs(blue, violet)}<g transform="translate(${WORDMARK_OFFSET.x} ${WORDMARK_OFFSET.y})">${letters(ink)}</g>`),
    "veldora-logo-mono.svg": svg(HORIZONTAL_VIEWBOX, "VELDORA", `${glyphs(ink, ink, 0.55)}<g transform="translate(${WORDMARK_OFFSET.x} ${WORDMARK_OFFSET.y})">${letters(ink)}</g>`),
    "veldora-wordmark.svg": svg(`${-WORDMARK_STROKE / 2} ${-WORDMARK_STROKE / 2} ${WORDMARK_WIDTH + WORDMARK_STROKE} ${WORDMARK_HEIGHT + WORDMARK_STROKE}`, "VELDORA", letters(ink)),
    "veldora-app-icon.svg": svg(APP_ICON_VIEWBOX, "VELDORA", `<rect width="64" height="64" rx="${APP_ICON_RADIUS}" fill="${deepBlack}"/><g transform="${APP_ICON_SYMBOL_TRANSFORM}">${glyphs(blue, violet)}</g>`),
};
for (const [name, content] of Object.entries(files)) writeFileSync(new URL(name, out), content);
// Favicon vetorial na raiz (mesmo desenho do ícone do app).
writeFileSync(new URL("../public/favicon.svg", import.meta.url), files["veldora-app-icon.svg"]);
console.log(`Gerados ${Object.keys(files).length + 1} arquivos SVG da marca.`);

// Gera os arquivos SVG oficiais da marca Finanças by GCruz.DEV a partir de src/brand/geometry.js.
// Uso: node scripts/generate-brand-assets.mjs  (os PNG/ICO são exportados a partir do favicon.svg)
import { mkdirSync, writeFileSync } from "node:fs";
import { BRAND_COLORS, PRODUCT_NAME, SIGNATURE, SYMBOL_GLYPH, SYMBOL_TILE, SYMBOL_VIEWBOX } from "../src/brand/geometry.js";

const out = new URL("../public/brand/", import.meta.url);
mkdirSync(out, { recursive: true });

const svg = (viewBox, title, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img"><title>${title}</title>${body}</svg>\n`;
const mark = `<path d="${SYMBOL_TILE}" fill="${BRAND_COLORS.tile}"/><path d="${SYMBOL_GLYPH}" fill="${BRAND_COLORS.glyph}"/>`;
const mono = (color) => `<path d="${SYMBOL_TILE}${SYMBOL_GLYPH}" fill="${color}" fill-rule="evenodd"/>`;
// Lockup: o texto usa as fontes da marca (IBM Plex Sans / JetBrains Mono) com fallback do sistema.
const lockup = (nameColor, suffixColor) =>
    `${mark}<text x="60" y="24" font-family="'IBM Plex Sans','Segoe UI',system-ui,sans-serif" font-size="24" font-weight="600" fill="${nameColor}">${PRODUCT_NAME}</text>` +
    `<text x="61" y="41" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="10.5" font-weight="600" letter-spacing="1.3" fill="${BRAND_COLORS.muted}">${SIGNATURE.prefix}<tspan fill="${suffixColor}">${SIGNATURE.suffix}</tspan></text>`;

const T = `${PRODUCT_NAME} by GCruz.DEV`;
const files = {
    "financas-mark.svg": svg(SYMBOL_VIEWBOX, T, mark),
    "financas-mark-mono-dark.svg": svg(SYMBOL_VIEWBOX, T, mono(BRAND_COLORS.ink)),
    "financas-mark-mono-light.svg": svg(SYMBOL_VIEWBOX, T, mono(BRAND_COLORS.mist)),
    "financas-lockup-on-dark.svg": svg("0 0 210 48", T, lockup(BRAND_COLORS.mist, BRAND_COLORS.gcruzIndigo)),
    "financas-lockup-on-light.svg": svg("0 0 210 48", T, lockup(BRAND_COLORS.ink, BRAND_COLORS.gcruzIndigoLight)),
};
for (const [name, content] of Object.entries(files)) writeFileSync(new URL(name, out), content);
// Favicon vetorial na raiz (o próprio símbolo).
writeFileSync(new URL("../public/favicon.svg", import.meta.url), files["financas-mark.svg"]);
console.log(`Gerados ${Object.keys(files).length + 1} arquivos SVG da marca.`);

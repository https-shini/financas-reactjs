// Finanças by GCruz.DEV — geometria oficial da marca (fonte única para os componentes React e os SVG gerados).
// Símbolo: um "F" modular — haste vertical e dois braços com pontas inclinadas para a frente
// (movimento, crescimento), sobre uma placa em gradiente violeta. Construído em grade de 48 × 48.

export const BRAND_COLORS = {
    tile: "#6D4CFF", // início do gradiente da placa (violeta)
    tileEnd: "#B388FF", // fim do gradiente da placa
    glyph: "#FFFFFF",
    ink: "#0A0A0B", // texto sobre fundo claro
    mist: "#EDEDEE", // texto sobre fundo escuro
    muted: "#8B8B93",
    gcruzIndigo: "#818CF8", // ".DEV" — vínculo com a assinatura institucional GCruz
    gcruzIndigoLight: "#4F46E5",
    gcruzBracket: "#F43F5E", // colchetes da assinatura <gcruz.dev/> (escuro)
    gcruzBracketLight: "#BE123C",
};

export const SYMBOL_VIEWBOX = "0 0 48 48";
export const SYMBOL_RADIUS = 11;
/** Placa arredondada (usada também para o recorte da versão monocromática). */
export const SYMBOL_TILE = "M11 0h26a11 11 0 0 1 11 11v26a11 11 0 0 1-11 11H11A11 11 0 0 1 0 37V11A11 11 0 0 1 11 0z";
/** O "F": haste + braço superior + braço do meio (pontas inclinadas). */
export const SYMBOL_GLYPH = "M13 11h6v26h-6zM21 11h15l-3 6H21zM21 21h10l-3 6h-7z";

export const PRODUCT_NAME = "Finanças";
/** Assinatura institucional no formato da marca GCruz: "by <gcruz.dev/>". */
export const SIGNATURE = { by: "by", open: "<", name: "gcruz", suffix: ".dev", close: "/>", text: "by <gcruz.dev/>" };
export const TAGLINE = "Tenha clareza sobre seu dinheiro.";
export const CATEGORY = "Personal Finance Management Platform";

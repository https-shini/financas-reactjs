// VELDORA — geometria oficial da marca (fonte única para componentes React e arquivos SVG gerados).
// Símbolo: um "V" angular cujo braço direito sobe acima do esquerdo (movimento, evolução),
// com uma faceta violeta (inteligência). Construído em grade de 48 × 48.

export const BRAND_COLORS = {
    blue: "#397BFF",
    violet: "#9277F5",
    deepBlack: "#10131C",
    iceWhite: "#F5F7FF",
    ink: "#151B29",
};

export const SYMBOL_VIEWBOX = "0 0 48 48";
/** Corpo do V. */
export const SYMBOL_BODY = "M3 8h9.5L24 33.5 36.5 4H46L29 44h-9.6z";
/** Faceta do braço direito (acento violeta). */
export const SYMBOL_FACET = "M36.5 4H46L33.6 33.2l-4.9-11.5z";

/**
 * Logotipo (wordmark) desenhado com traços geométricos — não depende de fonte instalada.
 * Altura das letras: 20 unidades; espessura 3,2. Cantos chanfrados ecoam o corte do símbolo.
 */
export const WORDMARK_STROKE = 3.2;
export const WORDMARK_WIDTH = 145;
export const WORDMARK_HEIGHT = 20;
export const WORDMARK_LETTERS = [
    { letter: "V", d: "M0 0 6.5 20 13 0", join: "bevel" },
    { letter: "E", d: "M33 1.6H21.6V18.4H33M21.6 10H31", join: "miter" },
    { letter: "L", d: "M42.6 0V18.4H54", join: "miter" },
    { letter: "D", d: "M63.6 1.6H71L76 6.6V13.4L71 18.4H63.6Z", join: "miter" },
    { letter: "O", d: "M89.6 1.6H96.4L100.4 5.6V14.4L96.4 18.4H89.6L85.6 14.4V5.6Z", join: "miter" },
    { letter: "R", d: "M110.6 20V1.6H119.4L123 5.2V7.8L119.4 11.4H110.6M117 11.4 123.4 20", join: "miter" },
    { letter: "A", d: "M131 20 137.5 0 144 20M133.4 13.4H141.6", join: "bevel" },
];

/** Logo horizontal: símbolo (48) + espaço (12) + wordmark. */
export const HORIZONTAL_VIEWBOX = "0 0 208 48";
export const WORDMARK_OFFSET = { x: 60, y: 14 };

/** Ícone do app: símbolo centralizado em um quadrado arredondado Deep Black. */
export const APP_ICON_VIEWBOX = "0 0 64 64";
export const APP_ICON_RADIUS = 15;
export const APP_ICON_SYMBOL_TRANSFORM = "translate(9 10) scale(0.96)";

export const SLOGAN = { en: "Your money. Your vision. Your future.", pt: "Seu dinheiro. Sua visão. Seu futuro." };
export const TAGLINE = "Smart Financial Platform";

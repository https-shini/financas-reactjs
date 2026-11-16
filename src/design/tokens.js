// VELDORA — Design Tokens primitivos.
// Única fonte de valores visuais brutos. Componentes NÃO usam estes valores diretamente:
// consomem os tokens semânticos dos temas (src/design/themes.js) via styled-components ou CSS variables.

/** Paleta oficial da marca (valores de referência). */
export const brand = {
    electricBlue: "#397BFF", // Primary — assinatura da marca
    deepBlack: "#10131C", // Background (dark)
    darkNavy: "#171E2B", // Surface (dark)
    iceWhite: "#F5F7FF", // Text Primary (dark) / Background (light)
    slateGray: "#8792A5", // Text Secondary
    violet: "#9277F5", // Accent — inteligência, análises, recursos especiais
    emerald: "#21C98B", // Success
    softRed: "#F06B78", // Danger
    amber: "#E9B45B", // Warning
};

/**
 * Escalas derivadas. Variações "600/700" existem para garantir contraste WCAG AA
 * (ex.: texto branco sobre azul exige #2F6BF0; textos verdes/vermelhos no tema claro exigem tons mais escuros).
 */
export const palette = {
    blue: { 50: "#E8F0FF", 100: "#D6E4FF", 300: "#6F9DFF", 500: "#397BFF", 600: "#2F6BF0", 700: "#2A63E3", 800: "#2459D2", 850: "#1D58D6", 950: "#18264A" },
    violet: { 50: "#EFEBFE", 300: "#A996F8", 500: "#9277F5", 700: "#5F45D6", 950: "#241F45" },
    emerald: { 50: "#E3F8F0", 500: "#21C98B", 600: "#12A672", 800: "#067A52", 950: "#12302A" },
    red: { 50: "#FDECEE", 500: "#F06B78", 600: "#E04F5E", 800: "#B8303F", 950: "#36202A" },
    amber: { 50: "#FCF3E2", 500: "#E9B45B", 600: "#D29A3C", 800: "#80530A", 950: "#34291A" },
    ink: {
        0: "#FFFFFF",
        25: "#F5F7FF",
        50: "#EEF2F8",
        75: "#E7ECF5",
        100: "#E1E6F0",
        200: "#C8D0DE",
        400: "#8792A5",
        500: "#5A6478",
        600: "#475166",
        800: "#222C3E",
        850: "#252F42",
        870: "#34405A",
        880: "#1D2636",
        900: "#171E2B",
        950: "#10131C",
        975: "#151B29",
    },
};

export const typography = {
    fontFamily: {
        sans: "'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        display: "'Manrope Variable', Manrope, 'Inter Variable', system-ui, sans-serif",
        mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    /** Escala (rem). */
    fontSize: { xs: "0.75rem", sm: "0.8125rem", md: "0.9375rem", base: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem", "3xl": "2rem", "4xl": "2.5rem" },
    fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
    lineHeight: { tight: 1.15, snug: 1.3, normal: 1.5 },
    letterSpacing: { tight: "-0.02em", snug: "-0.01em", normal: "0", wide: "0.04em", brand: "0.14em" },
    /** Papéis tipográficos (hierarquia). */
    roles: {
        display: { family: "display", size: "4xl", weight: "extrabold", lineHeight: "tight", letterSpacing: "tight" },
        h1: { family: "display", size: "2xl", weight: "bold", lineHeight: "tight", letterSpacing: "tight" },
        h2: { family: "display", size: "lg", weight: "bold", lineHeight: "snug", letterSpacing: "snug" },
        h3: { family: "sans", size: "md", weight: "semibold", lineHeight: "snug", letterSpacing: "normal" },
        body: { family: "sans", size: "md", weight: "regular", lineHeight: "normal", letterSpacing: "normal" },
        caption: { family: "sans", size: "sm", weight: "regular", lineHeight: "normal", letterSpacing: "normal" },
        overline: { family: "sans", size: "xs", weight: "semibold", lineHeight: "normal", letterSpacing: "wide" },
        numeric: { family: "display", size: "3xl", weight: "bold", lineHeight: "tight", letterSpacing: "tight" },
    },
};

/** Espaçamento em múltiplos de 4 px. space(4) => "16px". */
export const spaceUnit = 4;
export const space = (...n) => n.map((x) => `${x * spaceUnit}px`).join(" ");

export const radius = { sm: "6px", md: "10px", lg: "16px", xl: "22px", full: "999px" };

export const borderWidth = { thin: "1px", strong: "2px" };

export const opacity = { disabled: 0.5, muted: 0.72, subtle: 0.12, hover: 0.06 };

export const motion = {
    fast: "150ms",
    base: "220ms",
    slow: "320ms",
    easing: "cubic-bezier(0.2, 0, 0, 1)",
    easingOut: "cubic-bezier(0.16, 1, 0.3, 1)",
};

export const breakpoints = { mobile: 640, desktop: 1024, wide: 1280 };

export const media = {
    mobile: `@media (max-width: ${breakpoints.mobile - 0.02}px)`,
    tablet: `@media (min-width: ${breakpoints.mobile}px)`,
    belowDesktop: `@media (max-width: ${breakpoints.desktop - 0.02}px)`,
    desktop: `@media (min-width: ${breakpoints.desktop}px)`,
    wide: `@media (min-width: ${breakpoints.wide}px)`,
    coarse: "@media (pointer: coarse)",
};

export const layout = { sidebar: "264px", sidebarCollapsed: "76px", topbar: "64px", bottomNav: "64px", content: "1320px", touchTarget: "44px" };

export const zIndex = { sticky: 10, nav: 20, dropdown: 30, overlay: 50, toast: 60, tooltip: 70 };

/** Cor neutra para itens sem categoria/cor definida. */
export const NEUTRAL_COLOR = palette.ink[400];

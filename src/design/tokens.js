// VELDORA — Design Tokens primitivos.
// Única fonte de valores visuais brutos. Componentes NÃO usam estes valores diretamente:
// consomem os tokens semânticos dos temas (src/design/themes.js) via styled-components ou CSS variables.

/**
 * Paleta oficial — direção "Nocturne" (2026).
 * Noite com matiz índigo, índigo elétrico para ação e ouro "Aurum" para destaque e inteligência.
 */
export const brand = {
    indigo: "#625DF5", // Primary — assinatura da marca, ações, foco
    aurum: "#F2C35B", // Highlight — destaques, item ativo, insights e previsões
    night: "#0B0B14", // Fundo (escuro)
    dusk: "#13141F", // Superfícies/cards (escuro)
    twilight: "#1B1C2B", // Cards secundários (escuro)
    mist: "#F6F6FB", // Fundo (claro) e texto (escuro)
    haze: "#9396B2", // Texto mudo (escuro)
    emerald: "#2BD49A", // Sucesso, receitas
    coral: "#FB7185", // Perigo, despesas
    ember: "#FFB067", // Alerta
};

/**
 * Escalas derivadas. Tons 600–850 garantem contraste WCAG AA (texto branco sobre índigo,
 * textos coloridos no tema claro). Ver src/design/contrast.test.js.
 */
export const palette = {
    indigo: { 50: "#EEEEFF", 100: "#E0E0FF", 300: "#A5A8FF", 500: "#625DF5", 600: "#544FE6", 700: "#4B46DB", 800: "#433FCF", 850: "#3F3CC4", 900: "#2B288C", 950: "#1E1F45" },
    aurum: { 50: "#FDF4DD", 100: "#FAE7B5", 300: "#F7D88B", 500: "#F2C35B", 700: "#AD7212", 800: "#8A5600", 950: "#2A2416" },
    emerald: { 50: "#E3F7EE", 500: "#2BD49A", 600: "#0F9F6E", 800: "#087A55", 950: "#0F2A22" },
    coral: { 50: "#FDECEF", 500: "#FB7185", 600: "#E5485F", 800: "#B8243F", 950: "#33161E" },
    ember: { 50: "#FFF1E0", 500: "#FFB067", 800: "#8F4A00", 950: "#33230F" },
    violet: { 50: "#F1EDFF", 300: "#C4B5FD", 500: "#A78BFA", 700: "#5B3FD0", 950: "#2A2147" },
    ink: {
        0: "#FFFFFF",
        25: "#F6F6FB",
        50: "#EEEEF6",
        75: "#E6E6F1",
        100: "#DEDFEC",
        200: "#C7C9DB",
        300: "#B4B6CC",
        400: "#9396B2",
        500: "#5A5D7C",
        600: "#4A4C66",
        800: "#22233A",
        850: "#262840",
        870: "#34365A",
        880: "#1B1C2B",
        900: "#13141F",
        950: "#0B0B14",
        975: "#11121D",
    },
};

export const typography = {
    fontFamily: {
        sans: "'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        display: "'Space Grotesk Variable', 'Space Grotesk', 'Inter Variable', system-ui, sans-serif",
        mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    /** Escala (rem). */
    fontSize: { xs: "0.75rem", sm: "0.8125rem", md: "0.9375rem", base: "1rem", lg: "1.125rem", xl: "1.3125rem", "2xl": "1.75rem", "3xl": "2.125rem", "4xl": "2.75rem" },
    fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
    lineHeight: { tight: 1.1, snug: 1.3, normal: 1.55 },
    letterSpacing: { tighter: "-0.035em", tight: "-0.025em", snug: "-0.01em", normal: "0", wide: "0.08em", brand: "0.14em" },
    /** Papéis tipográficos (hierarquia). */
    roles: {
        display: { family: "display", size: "4xl", weight: "bold", lineHeight: "tight", letterSpacing: "tighter" },
        h1: { family: "display", size: "2xl", weight: "bold", lineHeight: "tight", letterSpacing: "tight" },
        h2: { family: "display", size: "lg", weight: "semibold", lineHeight: "snug", letterSpacing: "snug" },
        h3: { family: "sans", size: "md", weight: "semibold", lineHeight: "snug", letterSpacing: "normal" },
        body: { family: "sans", size: "md", weight: "regular", lineHeight: "normal", letterSpacing: "normal" },
        caption: { family: "sans", size: "sm", weight: "regular", lineHeight: "normal", letterSpacing: "normal" },
        overline: { family: "sans", size: "xs", weight: "bold", lineHeight: "normal", letterSpacing: "wide" },
        numeric: { family: "display", size: "3xl", weight: "bold", lineHeight: "tight", letterSpacing: "tight" },
    },
};

/** Espaçamento em múltiplos de 4 px. space(4) => "16px". */
export const spaceUnit = 4;
export const space = (...n) => n.map((x) => `${x * spaceUnit}px`).join(" ");

export const radius = { xs: "6px", sm: "8px", md: "11px", lg: "18px", xl: "24px", full: "999px" };

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

export const layout = { sidebar: "268px", sidebarCollapsed: "80px", topbar: "68px", bottomNav: "68px", content: "1320px", touchTarget: "44px" };

export const zIndex = { sticky: 10, nav: 20, dropdown: 30, overlay: 50, toast: 60, tooltip: 70 };

/** Cor neutra para itens sem categoria/cor definida. */
export const NEUTRAL_COLOR = palette.ink[400];

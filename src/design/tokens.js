// Finanças by GCruz.DEV — Design Tokens primitivos (paleta "Emerald Finance").
// Única fonte de valores visuais brutos. Componentes NÃO usam estes valores diretamente:
// consomem os tokens semânticos dos temas (src/design/themes.js) via styled-components ou CSS variables.

/** Cores oficiais da marca (valores de referência da especificação). */
export const brand = {
    emerald: "#10B981", // Emerald 500 — marca
    emeraldBright: "#34D399", // Emerald 400 — destaque no tema escuro
    emeraldDeep: "#047857", // Emerald 700 — ações (WCAG AA com texto branco)
    darkBackground: "#07110F",
    lightBackground: "#F7FAF8",
    gcruzIndigo: "#818CF8", // sufixo ".dev" da assinatura institucional GCruz
};

/**
 * Escalas. `emerald` segue a especificação. `pine` são os neutros com matiz verde
 * (superfícies, bordas e textos nos dois temas). Tons marcados "AA" substituem valores
 * da especificação que não atingiam WCAG AA (ver read-model/BRAND.md › Acessibilidade).
 */
export const palette = {
    emerald: { 50: "#ECFDF5", 100: "#D1FAE5", 300: "#6EE7B7", 400: "#34D399", 500: "#10B981", 600: "#059669", 700: "#047857", 800: "#065F46", 900: "#064E3B", 950: "#022C22" },
    pine: {
        0: "#FFFFFF",
        25: "#F7FAF8", // fundo claro
        50: "#EFF5F1", // superfície 2 clara
        75: "#E4EEE8", // superfície 3 clara
        100: "#DCE7E0", // borda clara
        300: "#78907F", // borda forte clara (campos, ≥ 3:1)
        400: "#839D8F", // texto auxiliar escuro (AA; spec #718A7D)
        450: "#A7C9B7", // texto secundário escuro
        500: "#5E7166", // texto auxiliar claro (AA; spec #75877C)
        600: "#52665A", // texto secundário claro
        700: "#56786A", // borda forte escura (campos, ≥ 3:1)
        800: "#263B32", // borda escura
        850: "#1C3229", // hover escuro
        870: "#193027", // superfície 3 escura
        880: "#12221C", // superfície 2 escura (cards)
        900: "#0D1915", // superfície 1 escura (sidebar)
        950: "#07110F", // fundo escuro
        975: "#10251B", // texto claro
        990: "#F0FDF4", // texto escuro
    },
    red: { 50: "#FEF2F2", 400: "#F87171", 600: "#DC2626", 700: "#B91C1C", 950: "#3B1618" },
    amber: { 50: "#FFFBEB", 400: "#FBBF24", 700: "#B45309", 950: "#352A0E" },
    indigo: { 50: "#EEF2FF", 400: "#818CF8", 600: "#4F46E5", 950: "#1E1E45" },
};

export const typography = {
    fontFamily: {
        sans: "'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        display: "'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        mono: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    /** Escala (rem) — Caption 11 · Small 12 · Body 14 · H4 16 · H3 20 · H2 24 · H1 30 · Display 36. */
    fontSize: { xs: "0.6875rem", sm: "0.75rem", md: "0.875rem", base: "1rem", lg: "1.25rem", xl: "1.5rem", "2xl": "1.875rem", "3xl": "2.25rem", "4xl": "2.25rem" },
    fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 600, extrabold: 700 },
    lineHeight: { tight: 1.15, snug: 1.35, normal: 1.55 },
    letterSpacing: { tighter: "-0.025em", tight: "-0.02em", snug: "-0.01em", normal: "0", wide: "0.08em", brand: "0.12em" },
    /** Papéis tipográficos (hierarquia). Valores financeiros usam a família mono. */
    roles: {
        display: { family: "display", size: "3xl", weight: "semibold", lineHeight: "tight", letterSpacing: "tighter" },
        h1: { family: "display", size: "2xl", weight: "semibold", lineHeight: "tight", letterSpacing: "tight" },
        h2: { family: "display", size: "xl", weight: "semibold", lineHeight: "snug", letterSpacing: "snug" },
        h3: { family: "display", size: "lg", weight: "semibold", lineHeight: "snug", letterSpacing: "snug" },
        h4: { family: "sans", size: "base", weight: "semibold", lineHeight: "snug", letterSpacing: "normal" },
        body: { family: "sans", size: "md", weight: "regular", lineHeight: "normal", letterSpacing: "normal" },
        caption: { family: "sans", size: "sm", weight: "regular", lineHeight: "normal", letterSpacing: "normal" },
        overline: { family: "sans", size: "xs", weight: "semibold", lineHeight: "normal", letterSpacing: "wide" },
        numeric: { family: "mono", size: "2xl", weight: "semibold", lineHeight: "tight", letterSpacing: "snug" },
    },
};

/** Espaçamento em múltiplos de 4 px. space(4) => "16px". */
export const spaceUnit = 4;
export const space = (...n) => n.map((x) => `${x * spaceUnit}px`).join(" ");

export const radius = { xs: "4px", sm: "6px", md: "10px", lg: "14px", xl: "18px", "2xl": "24px", full: "9999px" };

export const borderWidth = { thin: "1px", strong: "2px" };

export const opacity = { disabled: 0.5, muted: 0.72, subtle: 0.12, hover: 0.06 };

export const motion = {
    fast: "120ms", // hover
    base: "180ms", // microinterações e transições
    slow: "240ms", // dialogs e drawers
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

export const layout = { sidebar: "220px", sidebarCollapsed: "64px", topbar: "58px", bottomNav: "64px", content: "1320px", touchTarget: "44px" };

export const zIndex = { sticky: 10, nav: 20, dropdown: 30, overlay: 50, toast: 60, tooltip: 70 };

/** Cor neutra para itens sem categoria/cor definida. */
export const NEUTRAL_COLOR = palette.pine[400];

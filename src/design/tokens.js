// Finanças by GCruz.DEV — Design Tokens primitivos (linguagem visual "Nexus").
// Neutros zinco, um único acento violeta e botão primário invertido (preto no claro, branco no escuro).
// Única fonte de valores visuais brutos: os componentes consomem os tokens semânticos (src/design/themes.js).

/** Cores de referência da marca (modelo Nexus). */
export const brand = {
    violet: "#6D4CFF", // acento (claro)
    violetBright: "#8B6BFF", // acento (escuro)
    violetLight: "#B388FF", // ponta do gradiente do símbolo
    darkBackground: "#0A0A0C",
    lightBackground: "#FAFAF9",
    gcruzIndigo: "#818CF8", // sufixo ".dev" da assinatura institucional GCruz
};

/**
 * Escalas. `zinc` são os neutros do modelo; `violet` o acento; `green`/`red`/`amber`/`blue` as semânticas.
 * Tons marcados "AA" substituem valores do modelo que não atingiam WCAG AA como texto.
 */
export const palette = {
    zinc: {
        0: "#FFFFFF",
        25: "#FAFAF9", // fundo claro
        50: "#F5F5F4", // surface-2 clara
        75: "#F0F0EE", // hover claro
        100: "#EBEBE9", // surface-3 clara
        150: "#E7E7E4", // borda clara
        400: "#8A8A92", // borda forte clara (campos ≥ 3:1)
        500: "#6B6B73", // texto auxiliar claro (AA; modelo #9999A1)
        600: "#5B5B63", // texto secundário claro
        700: "#66666F", // borda forte escura (campos ≥ 3:1)
        750: "#8B8B93", // texto auxiliar escuro (AA; modelo #6E6E76)
        800: "#A1A1AA", // texto secundário escuro
        850: "#25252B", // borda escura
        870: "#1F1F25", // hover escuro (surface-3)
        880: "#18181D", // surface-2 escura
        900: "#131317", // cards escuros (surface)
        930: "#111114", // sidebar escura (bg-elev)
        950: "#0A0A0C", // fundo escuro
        990: "#0A0A0B", // texto claro / botão primário claro
        995: "#EDEDEE", // texto escuro
    },
    violet: { 50: "#EFEAFF", 300: "#A48BFF", 400: "#8B6BFF", 500: "#6D4CFF", 600: "#5B3DF0", 700: "#4C2FD9", soft: "#221D3A" },
    green: { 50: "#EDF7F1", 400: "#34D39A", 500: "#0F9D58", 700: "#0A7F48", soft: "#10261E" },
    red: { 50: "#FCE8EB", 400: "#FB7185", 500: "#D6334A", 700: "#B3263A", soft: "#2A1519" },
    amber: { 50: "#FFF1D6", 400: "#F5B65B", 500: "#B07B1A", 700: "#8A5E0E", soft: "#2A2113" },
    blue: { 50: "#E6F0FC", 400: "#60A5FA", 500: "#1F76E0", 700: "#1A62BD", soft: "#14213A" },
};

export const typography = {
    fontFamily: {
        sans: "'Geist Variable', Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        display: "'Geist Variable', Geist, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        mono: "'Geist Mono Variable', 'Geist Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    },
    /** Escala (rem) — 11 · 12 · 14 · 16 · 18 · 22 · 28 · 32. */
    fontSize: { xs: "0.6875rem", sm: "0.75rem", md: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.375rem", "2xl": "1.75rem", "3xl": "2rem", "4xl": "2rem" },
    fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 600, extrabold: 700 },
    lineHeight: { tight: 1.15, snug: 1.35, normal: 1.5 },
    letterSpacing: { tighter: "-0.03em", tight: "-0.02em", snug: "-0.01em", normal: "0", wide: "0.08em", brand: "0.12em" },
    /** Papéis tipográficos (hierarquia). Valores financeiros usam a família mono. */
    roles: {
        display: { family: "display", size: "3xl", weight: "semibold", lineHeight: "tight", letterSpacing: "tighter" },
        h1: { family: "display", size: "2xl", weight: "semibold", lineHeight: "tight", letterSpacing: "tight" },
        h2: { family: "display", size: "xl", weight: "semibold", lineHeight: "snug", letterSpacing: "tight" },
        h3: { family: "display", size: "lg", weight: "semibold", lineHeight: "snug", letterSpacing: "snug" },
        h4: { family: "sans", size: "md", weight: "semibold", lineHeight: "snug", letterSpacing: "snug" },
        body: { family: "sans", size: "md", weight: "regular", lineHeight: "normal", letterSpacing: "normal" },
        caption: { family: "sans", size: "sm", weight: "regular", lineHeight: "normal", letterSpacing: "normal" },
        overline: { family: "sans", size: "xs", weight: "medium", lineHeight: "normal", letterSpacing: "wide" },
        numeric: { family: "mono", size: "2xl", weight: "semibold", lineHeight: "tight", letterSpacing: "tight" },
    },
};

/** Espaçamento em múltiplos de 4 px. space(4) => "16px". */
export const spaceUnit = 4;
export const space = (...n) => n.map((x) => `${x * spaceUnit}px`).join(" ");

export const radius = { xs: "4px", sm: "6px", md: "10px", lg: "14px", xl: "20px", "2xl": "24px", full: "9999px" };

export const borderWidth = { thin: "1px", strong: "2px" };

export const opacity = { disabled: 0.5, muted: 0.72, subtle: 0.12, hover: 0.06 };

export const motion = {
    fast: "120ms", // hover
    base: "220ms", // tema e transições
    slow: "260ms", // dialogs e drawers
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

/**
 * Tokens de layout em duas camadas (inspirado no Fluxer: escala → layout → componente).
 * 1) Estrutura: larguras e alturas das regiões fixas (sidebar, header, navegação inferior, conteúdo).
 * 2) Componente: medidas internas de Sidebar e Header, sempre derivadas da escala `space`.
 * Sidebar e Header compartilham `header` como altura da primeira faixa, para que a borda inferior
 * das duas regiões forme uma linha contínua; Header e conteúdo compartilham o recuo horizontal.
 */
export const layout = {
    // Estrutura
    sidebar: "248px",
    sidebarCollapsed: "64px",
    header: "64px",
    topbar: "64px", // alias legado de `header`
    bottomNav: "64px",
    content: "1680px",
    contentPaddingInline: "clamp(32px, 3.4vw, 64px)", // desktop: cresce com a tela, como na referência
    headerPaddingInline: space(8), // 32px
    contentPaddingInlineTablet: space(6), // 24px
    contentPaddingInlineMobile: space(4), // 16px
    contentPaddingBlock: space(7), // 28px
    // Controles
    control: "34px", // altura única dos controles compactos (header, ações de card)
    controlIcon: "16px",
    touchTarget: "44px",
    // Sidebar
    sidebarPaddingInline: space(3), // 12px
    sidebarItemHeight: "40px",
    sidebarItemGap: "2px",
    sidebarItemPaddingInline: space(3), // 12px
    sidebarIcon: "18px",
    sidebarSectionLabelInset: space(3), // rótulos das seções alinhados ao texto dos itens
    sidebarSectionGap: space(5), // 20px entre seções
    sidebarFooterMinHeight: "64px", // = header: as duas faixas fixas da sidebar têm a mesma altura
    // Header
    headerGap: space(3), // 12px
    headerActionsGap: space(1), // 4px
    headerSearchWidth: "300px",
};

export const zIndex = { sticky: 10, nav: 20, dropdown: 30, overlay: 50, toast: 60, tooltip: 70 };

/** Cor neutra para itens sem categoria/cor definida. */
export const NEUTRAL_COLOR = palette.zinc[750];

// Finanças by GCruz.DEV — temas escuro e claro (tokens semânticos, paleta "Emerald Finance").
// Componentes usam apenas estes nomes (theme.colors.text, theme.colors.primary...), nunca hex diretos.
// Todas as combinações de texto foram verificadas para WCAG AA (ver src/design/contrast.test.js).
import { brand, palette as p, typography, space, radius, borderWidth, opacity, motion, breakpoints, media, layout, zIndex } from "./tokens";

const shared = {
    brand,
    space,
    radius,
    borderWidth,
    opacity,
    motion,
    breakpoints,
    media,
    layout,
    z: zIndex,
    fonts: typography.fontFamily,
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    lineHeight: typography.lineHeight,
    letterSpacing: typography.letterSpacing,
    typeRoles: typography.roles,
};

export const darkTheme = {
    ...shared,
    mode: "dark",
    colors: {
        bg: p.pine[950], // #07110F — Background
        bgSidebar: p.pine[900], // #0D1915 — Surface 1 (sidebar, header, navegação)
        bgElevated: p.pine[880], // #12221C — Surface 2 (cards)
        bgSurface: p.pine[870], // #193027 — Surface 3 (elementos elevados, áreas internas)
        bgHover: p.pine[850],
        bgGlass: "rgba(13, 25, 21, 0.86)",
        bgInput: p.pine[900],
        border: p.pine[800], // #263B32
        borderStrong: p.pine[700], // contorno de campos (≥ 3:1)
        text: p.pine[990], // #F0FDF4
        textSecondary: p.pine[450], // #A7C9B7
        textMuted: p.pine[400], // #839D8F (AA)
        brand: p.emerald[400], // #34D399 — marca e destaques
        primary: p.emerald[700], // botões (branco 5,48:1; spec #059669 = 3,77:1)
        primaryHover: p.emerald[800],
        primaryActive: p.emerald[900],
        primaryText: p.emerald[400], // links e textos de destaque
        primarySoft: "#0F2E24", // Emerald Surface — item ativo da navegação, badges
        onPrimary: "#FFFFFF",
        accent: p.indigo[400], // índigo — informação e visualizações complementares
        accentText: p.indigo[400],
        accentSoft: p.indigo[950],
        onAccent: p.pine[950],
        accentLedge: p.indigo[600],
        indicator: p.emerald[400], // indicador do item ativo
        income: p.emerald[400],
        incomeSoft: "#0F2E24",
        expense: p.red[400],
        expenseSoft: p.red[950],
        warning: p.amber[400],
        warningSoft: p.amber[950],
        info: p.indigo[400],
        infoSoft: p.indigo[950],
        success: p.emerald[400],
        error: p.red[400],
        focus: p.emerald[400],
        overlay: "rgba(2, 8, 6, 0.72)",
        chartGrid: "#1B2E26",
        chartAxis: p.pine[400],
        transfer: p.pine[450],
        chart: { income: p.emerald[400], expense: p.red[400], primary: p.emerald[400], accent: p.indigo[400], neutral: p.pine[400], area: "rgba(52, 211, 153, 0.14)" },
        ambient: "radial-gradient(1100px 560px at 18% -14%, rgba(16, 185, 129, 0.09), transparent 62%)",
    },
    shadows: {
        sm: "none",
        card: "none", // cards se separam por superfície e borda, sem sombra
        md: "0 10px 28px rgba(0, 0, 0, 0.45)",
        lg: "0 16px 40px rgba(0, 0, 0, 0.5)",
        overlay: "0 24px 64px rgba(0, 0, 0, 0.6)",
        base: "none",
        focus: "0 0 0 3px rgba(52, 211, 153, 0.35)",
        brand: "0 8px 20px rgba(4, 120, 87, 0.45)",
        ledge: "none",
        ledgePressed: "none",
        ledgeNeutral: "none",
        tile: "none",
    },
};

export const lightTheme = {
    ...shared,
    mode: "light",
    colors: {
        bg: p.pine[25], // #F7FAF8
        bgSidebar: p.pine[0],
        bgElevated: p.pine[0], // cards
        bgSurface: p.pine[50], // #EFF5F1
        bgHover: p.pine[75], // #E4EEE8
        bgGlass: "rgba(255, 255, 255, 0.9)",
        bgInput: p.pine[0],
        border: p.pine[100], // #DCE7E0
        borderStrong: p.pine[300],
        text: p.pine[975], // #10251B
        textSecondary: p.pine[600], // #52665A
        textMuted: p.pine[500], // #5E7166 (AA)
        brand: p.emerald[600],
        primary: p.emerald[700], // #047857
        primaryHover: p.emerald[800],
        primaryActive: p.emerald[900],
        primaryText: p.emerald[700],
        primarySoft: "#E3F6EC",
        onPrimary: "#FFFFFF",
        accent: p.indigo[600],
        accentText: p.indigo[600],
        accentSoft: p.indigo[50],
        onAccent: "#FFFFFF",
        accentLedge: p.indigo[600],
        indicator: p.emerald[700],
        income: p.emerald[700],
        incomeSoft: "#E3F6EC",
        expense: p.red[700], // #B91C1C (AA; spec #DC2626 = 4,37:1 em superfícies)
        expenseSoft: p.red[50],
        warning: p.amber[700],
        warningSoft: p.amber[50],
        info: p.indigo[600],
        infoSoft: p.indigo[50],
        success: p.emerald[700],
        error: p.red[700],
        focus: p.emerald[700],
        overlay: "rgba(16, 37, 27, 0.4)",
        chartGrid: "#E3ECE6",
        chartAxis: p.pine[500],
        transfer: p.pine[600],
        chart: { income: p.emerald[600], expense: p.red[600], primary: p.emerald[700], accent: p.indigo[600], neutral: p.pine[500], area: "rgba(4, 120, 87, 0.1)" },
        ambient: "radial-gradient(1100px 560px at 18% -14%, rgba(16, 185, 129, 0.07), transparent 62%)",
    },
    shadows: {
        sm: "none",
        card: "none",
        md: "0 8px 20px rgba(16, 37, 27, 0.08)",
        lg: "0 14px 32px rgba(16, 37, 27, 0.12)",
        overlay: "0 24px 64px rgba(16, 37, 27, 0.18)",
        base: "none",
        focus: "0 0 0 3px rgba(4, 120, 87, 0.28)",
        brand: "0 8px 20px rgba(4, 120, 87, 0.3)",
        ledge: "none",
        ledgePressed: "none",
        ledgeNeutral: "none",
        tile: "none",
    },
};

/** Gera CSS custom properties (--v-*) a partir de um tema. */
export function themeToCssVars(theme) {
    const vars = {};
    const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    for (const [k, v] of Object.entries(theme.colors)) {
        if (typeof v === "string") vars[`--v-color-${kebab(k)}`] = v;
        else for (const [k2, v2] of Object.entries(v)) vars[`--v-${kebab(k)}-${kebab(k2)}`] = v2;
    }
    for (const [k, v] of Object.entries(theme.radius)) vars[`--v-radius-${k}`] = v;
    for (const [k, v] of Object.entries(theme.shadows)) vars[`--v-shadow-${k}`] = v;
    for (const [k, v] of Object.entries(theme.motion)) vars[`--v-motion-${kebab(k)}`] = v;
    for (const [k, v] of Object.entries(theme.fontSize)) vars[`--v-font-size-${k}`] = v;
    vars["--v-font-sans"] = theme.fonts.sans;
    vars["--v-font-display"] = theme.fonts.display;
    return vars;
}

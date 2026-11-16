// VELDORA — temas claro e escuro (tokens semânticos).
// Componentes usam apenas estes nomes (theme.colors.text, theme.colors.primary...).
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
        bg: p.ink[950], // #10131C
        bgElevated: p.ink[900], // #171E2B — superfícies/cards
        bgSurface: p.ink[880], // #1D2636 — cards secundários, áreas internas
        bgHover: p.ink[800],
        border: p.ink[850],
        borderStrong: p.ink[870],
        text: p.ink[25], // #F5F7FF
        textSecondary: "#A9B2C3",
        textMuted: p.ink[400], // #8792A5
        brand: p.blue[500], // #397BFF
        primary: p.blue[600], // preenchimento de botões (branco 4,69:1)
        primaryHover: p.blue[700],
        primaryActive: p.blue[800],
        primaryText: p.blue[300], // links e textos azuis
        primarySoft: p.blue[950],
        onPrimary: "#FFFFFF",
        accent: p.violet[500],
        accentText: p.violet[300],
        accentSoft: p.violet[950],
        income: p.emerald[500],
        incomeSoft: p.emerald[950],
        expense: p.red[500],
        expenseSoft: p.red[950],
        warning: p.amber[500],
        warningSoft: p.amber[950],
        info: p.blue[300],
        infoSoft: p.blue[950],
        success: p.emerald[500],
        error: p.red[500],
        focus: p.blue[500],
        overlay: "rgba(5, 7, 12, 0.72)",
        chartGrid: "#222B3B",
        chartAxis: p.ink[400],
        transfer: "#A9B2C3",
        chart: { income: p.emerald[500], expense: p.red[500], primary: p.blue[500], accent: p.violet[500], neutral: p.ink[400], area: "rgba(57, 123, 255, 0.16)" },
    },
    shadows: {
        sm: "0 1px 0 rgba(255, 255, 255, 0.03) inset",
        md: "0 8px 24px rgba(0, 0, 0, 0.35)",
        lg: "0 12px 32px rgba(0, 0, 0, 0.4)",
        overlay: "0 24px 64px rgba(0, 0, 0, 0.55)",
        base: "none",
        focus: `0 0 0 3px rgba(57, 123, 255, 0.35)`,
        brand: "0 8px 20px rgba(47, 107, 240, 0.35)",
    },
};

export const lightTheme = {
    ...shared,
    mode: "light",
    colors: {
        bg: p.ink[25], // #F5F7FF
        bgElevated: p.ink[0], // #FFFFFF
        bgSurface: p.ink[50], // #EEF2F8
        bgHover: p.ink[75],
        border: p.ink[100],
        borderStrong: p.ink[200],
        text: p.ink[975], // #151B29
        textSecondary: p.ink[600],
        textMuted: p.ink[500],
        brand: p.blue[500],
        primary: p.blue[600],
        primaryHover: p.blue[700],
        primaryActive: p.blue[800],
        primaryText: p.blue[850],
        primarySoft: p.blue[50],
        onPrimary: "#FFFFFF",
        accent: p.violet[500],
        accentText: p.violet[700],
        accentSoft: p.violet[50],
        income: p.emerald[800],
        incomeSoft: p.emerald[50],
        expense: p.red[800],
        expenseSoft: p.red[50],
        warning: p.amber[800],
        warningSoft: p.amber[50],
        info: p.blue[850],
        infoSoft: p.blue[50],
        success: p.emerald[800],
        error: p.red[800],
        focus: p.blue[500],
        overlay: "rgba(16, 19, 28, 0.45)",
        chartGrid: "#E4E9F2",
        chartAxis: p.ink[500],
        transfer: p.ink[600],
        chart: { income: p.emerald[600], expense: p.red[600], primary: p.blue[500], accent: p.violet[500], neutral: p.ink[500], area: "rgba(57, 123, 255, 0.12)" },
    },
    shadows: {
        sm: "0 1px 2px rgba(21, 27, 41, 0.05)",
        md: "0 6px 16px rgba(21, 27, 41, 0.08)",
        lg: "0 12px 28px rgba(21, 27, 41, 0.1)",
        overlay: "0 24px 64px rgba(21, 27, 41, 0.2)",
        base: "0 1px 2px rgba(21, 27, 41, 0.05)",
        focus: `0 0 0 3px rgba(57, 123, 255, 0.28)`,
        brand: "0 8px 20px rgba(47, 107, 240, 0.3)",
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

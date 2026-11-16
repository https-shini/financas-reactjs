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
        bg: p.ink[950], // #0B0B14 — noite com matiz índigo
        bgElevated: p.ink[900], // #13141F — cards
        bgSurface: p.ink[880], // #1B1C2B — áreas internas, cards secundários
        bgHover: p.ink[800],
        bgGlass: "rgba(19, 20, 31, 0.72)", // barras flutuantes (topbar, navegação inferior)
        bgInput: "rgba(246, 246, 251, 0.035)",
        border: p.ink[850],
        borderStrong: p.ink[870],
        text: p.ink[25],
        textSecondary: p.ink[300],
        textMuted: p.ink[400],
        brand: p.indigo[500], // #625DF5
        primary: p.indigo[600], // preenchimento de botões (branco ≥ 5,5:1)
        primaryHover: p.indigo[700],
        primaryActive: p.indigo[800],
        primaryLedge: p.indigo[900], // "degrau" inferior dos botões táteis
        primaryText: p.indigo[300],
        primarySoft: p.indigo[950],
        onPrimary: "#FFFFFF",
        accent: p.aurum[500], // ouro Aurum — destaque/inteligência
        accentText: p.aurum[500],
        accentSoft: p.aurum[950],
        onAccent: p.ink[975],
        accentLedge: p.aurum[700], // "degrau" sob botões/abas preenchidos em ouro
        indicator: p.aurum[500], // item ativo (navegação, abas)
        income: p.emerald[500],
        incomeSoft: p.emerald[950],
        expense: p.coral[500],
        expenseSoft: p.coral[950],
        warning: p.ember[500],
        warningSoft: p.ember[950],
        info: p.indigo[300],
        infoSoft: p.indigo[950],
        success: p.emerald[500],
        error: p.coral[500],
        focus: p.indigo[300],
        overlay: "rgba(5, 5, 12, 0.66)",
        chartGrid: "#20223A",
        chartAxis: p.ink[400],
        transfer: p.ink[300],
        chart: { income: p.emerald[500], expense: p.coral[500], primary: p.indigo[500], accent: p.aurum[500], neutral: p.ink[400], area: "rgba(98, 93, 245, 0.18)" },
        ambient:
            "radial-gradient(1100px 620px at 8% -12%, rgba(98, 93, 245, 0.16), transparent 62%), radial-gradient(900px 520px at 105% -6%, rgba(242, 195, 91, 0.06), transparent 60%)",
    },
    shadows: {
        sm: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
        card: "inset 0 1px 0 rgba(255, 255, 255, 0.045), 0 1px 0 rgba(0, 0, 0, 0.5), 0 18px 40px -28px rgba(0, 0, 0, 0.9)",
        md: "0 10px 28px rgba(0, 0, 0, 0.45)",
        lg: "0 16px 40px rgba(0, 0, 0, 0.5)",
        overlay: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 30px 80px rgba(0, 0, 0, 0.6)",
        base: "none",
        focus: "0 0 0 3px rgba(165, 168, 255, 0.45)",
        brand: "inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 4px 0 #2B288C, 0 14px 28px -10px rgba(98, 93, 245, 0.6)",
        ledge: "inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 3px 0 #2B288C",
        ledgePressed: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 1px 0 #2B288C",
        ledgeNeutral: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 2px 0 rgba(0, 0, 0, 0.55)",
        tile: "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 0 rgba(0, 0, 0, 0.45)",
    },
};

export const lightTheme = {
    ...shared,
    mode: "light",
    colors: {
        bg: p.ink[25], // #F6F6FB
        bgElevated: p.ink[0],
        bgSurface: p.ink[50], // #EEEEF6
        bgHover: p.ink[75],
        bgGlass: "rgba(255, 255, 255, 0.78)",
        bgInput: p.ink[0],
        border: p.ink[100],
        borderStrong: p.ink[200],
        text: p.ink[975],
        textSecondary: p.ink[600],
        textMuted: p.ink[500],
        brand: p.indigo[500],
        primary: p.indigo[600],
        primaryHover: p.indigo[700],
        primaryActive: p.indigo[800],
        primaryLedge: p.indigo[900],
        primaryText: p.indigo[850],
        primarySoft: p.indigo[50],
        onPrimary: "#FFFFFF",
        accent: p.aurum[500],
        accentText: p.aurum[800],
        accentSoft: p.aurum[50],
        onAccent: p.ink[975],
        accentLedge: p.aurum[700],
        indicator: p.aurum[700],
        income: p.emerald[800],
        incomeSoft: p.emerald[50],
        expense: p.coral[800],
        expenseSoft: p.coral[50],
        warning: p.ember[800],
        warningSoft: p.ember[50],
        info: p.indigo[850],
        infoSoft: p.indigo[50],
        success: p.emerald[800],
        error: p.coral[800],
        focus: p.indigo[600],
        overlay: "rgba(17, 18, 29, 0.42)",
        chartGrid: "#E7E7F2",
        chartAxis: p.ink[500],
        transfer: p.ink[600],
        chart: { income: p.emerald[600], expense: p.coral[600], primary: p.indigo[600], accent: p.aurum[700], neutral: p.ink[500], area: "rgba(98, 93, 245, 0.12)" },
        ambient: "radial-gradient(1100px 620px at 8% -12%, rgba(98, 93, 245, 0.09), transparent 62%), radial-gradient(900px 520px at 105% -6%, rgba(242, 195, 91, 0.10), transparent 60%)",
    },
    shadows: {
        sm: "0 1px 0 rgba(17, 18, 29, 0.04)",
        card: "0 1px 0 rgba(17, 18, 29, 0.03), 0 3px 0 #E4E4F0",
        md: "0 8px 20px rgba(17, 18, 29, 0.08)",
        lg: "0 14px 32px rgba(17, 18, 29, 0.12)",
        overlay: "0 30px 80px rgba(17, 18, 29, 0.22)",
        base: "0 1px 0 rgba(17, 18, 29, 0.04)",
        focus: "0 0 0 3px rgba(84, 79, 230, 0.32)",
        brand: "inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 4px 0 #2B288C, 0 14px 28px -12px rgba(84, 79, 230, 0.55)",
        ledge: "inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 3px 0 #2B288C",
        ledgePressed: "inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 1px 0 #2B288C",
        ledgeNeutral: "0 2px 0 #DEDFEC",
        tile: "inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 0 rgba(17, 18, 29, 0.08)",
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

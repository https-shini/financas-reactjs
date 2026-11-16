// Finanças by GCruz.DEV — temas escuro e claro (tokens semânticos, linguagem visual "Nexus").
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
        bg: p.zinc[950], // #0A0A0C
        bgSidebar: p.zinc[930], // #111114 — sidebar e header
        bgElevated: p.zinc[900], // #131317 — cards
        bgSurface: p.zinc[880], // #18181D — áreas internas, item ativo
        bgHover: p.zinc[870], // #1F1F25
        bgGlass: "rgba(10, 10, 12, 0.82)",
        bgInput: p.zinc[930],
        border: p.zinc[850], // #25252B
        borderStrong: p.zinc[700], // contorno de campos (≥ 3:1)
        text: p.zinc[995], // #EDEDEE
        textSecondary: p.zinc[800], // #A1A1AA
        textMuted: p.zinc[750], // #8B8B93 (AA)
        brand: p.violet[400], // #8B6BFF
        primary: "#FFFFFF", // botão primário invertido
        primaryHover: "#E7E7E7",
        primaryActive: "#D4D4D4",
        primaryText: p.violet[300], // links e destaques violeta
        primarySoft: p.violet.soft, // fundo violeta suave
        onPrimary: p.zinc[990],
        accent: p.violet[400],
        accentText: p.violet[300],
        accentSoft: p.violet.soft,
        onAccent: p.zinc[990],
        accentLedge: p.violet[500],
        indicator: p.violet[400], // ícone do item ativo
        income: p.green[400],
        incomeSoft: p.green.soft,
        expense: p.red[400],
        expenseSoft: p.red.soft,
        warning: p.amber[400],
        warningSoft: p.amber.soft,
        info: p.blue[400],
        infoSoft: p.blue.soft,
        success: p.green[400],
        error: p.red[400],
        focus: p.violet[400],
        overlay: "rgba(0, 0, 0, 0.55)",
        chartGrid: "#222228",
        chartAxis: p.zinc[750],
        transfer: p.zinc[800],
        chart: { income: p.green[400], expense: p.red[400], primary: p.violet[400], accent: p.violet[400], neutral: "#6E6E76", area: "rgba(139, 107, 255, 0.16)" },
        ambient: "none",
    },
    shadows: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
        card: "0 1px 2px rgba(0, 0, 0, 0.4)",
        md: "0 6px 16px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)",
        lg: "0 20px 48px rgba(0, 0, 0, 0.55), 0 6px 14px rgba(0, 0, 0, 0.35)",
        overlay: "0 20px 48px rgba(0, 0, 0, 0.55), 0 6px 14px rgba(0, 0, 0, 0.35)",
        base: "none",
        focus: "0 0 0 3px rgba(139, 107, 255, 0.3)",
        brand: "0 6px 16px rgba(0, 0, 0, 0.45)",
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
        bg: p.zinc[25], // #FAFAF9
        bgSidebar: p.zinc[0],
        bgElevated: p.zinc[0], // cards
        bgSurface: p.zinc[50], // #F5F5F4
        bgHover: p.zinc[75],
        bgGlass: "rgba(250, 250, 249, 0.85)",
        bgInput: p.zinc[0],
        border: p.zinc[150], // #E7E7E4
        borderStrong: p.zinc[400],
        text: p.zinc[990], // #0A0A0B
        textSecondary: p.zinc[600], // #5B5B63
        textMuted: p.zinc[500], // #6B6B73 (AA)
        brand: p.violet[500], // #6D4CFF
        primary: p.zinc[990], // botão primário invertido (preto)
        primaryHover: "#1F1F23",
        primaryActive: "#2A2A30",
        primaryText: p.violet[600], // #5B3DF0
        primarySoft: p.violet[50],
        onPrimary: "#FAFAFA",
        accent: p.violet[500],
        accentText: p.violet[600],
        accentSoft: p.violet[50],
        onAccent: "#FFFFFF",
        accentLedge: p.violet[600],
        indicator: p.violet[500],
        income: p.green[700], // AA (modelo #0F9D58 = 3,5:1)
        incomeSoft: p.green[50],
        expense: p.red[700],
        expenseSoft: p.red[50],
        warning: p.amber[700], // AA (modelo #B07B1A = 3,7:1)
        warningSoft: p.amber[50],
        info: p.blue[700], // AA (modelo #1F76E0 = 4,4:1)
        infoSoft: p.blue[50],
        success: p.green[700],
        error: p.red[700],
        focus: p.violet[500],
        overlay: "rgba(15, 15, 17, 0.35)",
        chartGrid: "#EDEDEB",
        chartAxis: p.zinc[500],
        transfer: p.zinc[600],
        chart: { income: p.green[500], expense: p.red[500], primary: p.violet[500], accent: p.violet[500], neutral: "#9999A1", area: "rgba(109, 76, 255, 0.12)" },
        ambient: "none",
    },
    shadows: {
        sm: "0 1px 2px rgba(15, 15, 17, 0.04), 0 1px 1px rgba(15, 15, 17, 0.03)",
        card: "0 1px 2px rgba(15, 15, 17, 0.04), 0 1px 1px rgba(15, 15, 17, 0.03)",
        md: "0 4px 12px rgba(15, 15, 17, 0.06), 0 1px 3px rgba(15, 15, 17, 0.04)",
        lg: "0 12px 32px rgba(15, 15, 17, 0.1), 0 4px 12px rgba(15, 15, 17, 0.06)",
        overlay: "0 12px 32px rgba(15, 15, 17, 0.1), 0 4px 12px rgba(15, 15, 17, 0.06)",
        base: "none",
        focus: "0 0 0 3px rgba(109, 76, 255, 0.2)",
        brand: "0 4px 12px rgba(15, 15, 17, 0.15)",
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

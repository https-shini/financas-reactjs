// Garante que os tokens VELDORA mantêm contraste WCAG AA nos dois temas.
import { describe, expect, it } from "vitest";
import { darkTheme, lightTheme, themeToCssVars } from "./themes";

function luminance(hex) {
    const h = hex.replace("#", "");
    const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
    const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
}

describe.each([
    ["escuro", darkTheme],
    ["claro", lightTheme],
])("tema %s", (_name, theme) => {
    const c = theme.colors;
    const surfaces = { bg: c.bg, bgElevated: c.bgElevated, bgSurface: c.bgSurface };
    const textTokens = ["text", "textSecondary", "textMuted", "primaryText", "accentText", "income", "expense", "warning", "info", "transfer"];

    it.each(textTokens)("%s tem contraste >= 4,5:1 em todas as superfícies", (token) => {
        for (const [s, bg] of Object.entries(surfaces)) {
            expect(contrast(c[token], bg), `${token} sobre ${s}`).toBeGreaterThanOrEqual(4.5);
        }
    });

    it("texto do botão primário >= 4,5:1 em todos os estados", () => {
        for (const st of ["primary", "primaryHover", "primaryActive"]) expect(contrast(c.onPrimary, c[st]), st).toBeGreaterThanOrEqual(4.5);
    });

    it("badges (texto sobre fundo suave) >= 4,5:1", () => {
        const pairs = [["income", "incomeSoft"], ["expense", "expenseSoft"], ["warning", "warningSoft"], ["primaryText", "primarySoft"], ["accentText", "accentSoft"], ["info", "infoSoft"]];
        for (const [fg, bg] of pairs) expect(contrast(c[fg], c[bg]), `${fg}/${bg}`).toBeGreaterThanOrEqual(4.5);
    });

    it("indicador de foco e séries de gráfico >= 3:1 (elementos gráficos)", () => {
        expect(contrast(c.focus, c.bg)).toBeGreaterThanOrEqual(3);
        for (const k of ["income", "expense", "primary", "accent"]) expect(contrast(c.chart[k], c.bgElevated), `chart.${k}`).toBeGreaterThanOrEqual(3);
    });

    it("indicador de item ativo (ouro) >= 3:1 sobre as superfícies", () => {
        for (const bg of [c.bg, c.bgElevated, c.bgSurface]) expect(contrast(c.indicator, bg)).toBeGreaterThanOrEqual(3);
    });

    it("texto sobre o destaque Aurum >= 4,5:1", () => {
        expect(contrast(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
    });

    it("exporta CSS variables para cores, raios e movimento", () => {
        const vars = themeToCssVars(theme);
        expect(vars["--v-color-brand"]).toBe("#625DF5");
        expect(vars["--v-color-bg"]).toBe(c.bg);
        expect(vars["--v-radius-lg"]).toBe("18px");
        expect(vars["--v-chart-income"]).toBe(c.chart.income);
    });
});

describe("paleta oficial", () => {
    it("tema escuro usa exatamente as cores da marca", () => {
        expect(darkTheme.colors).toMatchObject({ bg: "#0B0B14", bgElevated: "#13141F", bgSurface: "#1B1C2B", text: "#F6F6FB", textMuted: "#9396B2", brand: "#625DF5", accent: "#F2C35B", income: "#2BD49A", expense: "#FB7185", warning: "#FFB067" });
    });
    it("tema claro usa as superfícies e o texto definidos", () => {
        expect(lightTheme.colors).toMatchObject({ bg: "#F6F6FB", bgElevated: "#FFFFFF", bgSurface: "#EEEEF6", text: "#11121D", brand: "#625DF5" });
    });
});

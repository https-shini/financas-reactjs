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
    const surfaces = { bg: c.bg, bgSidebar: c.bgSidebar, bgElevated: c.bgElevated, bgSurface: c.bgSurface };
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

    it("indicador de item ativo (ouro) >= 3:1 sobre as superfícies, inclusive no hover", () => {
        for (const [name, bg] of Object.entries({ bg: c.bg, bgElevated: c.bgElevated, bgSurface: c.bgSurface, bgHover: c.bgHover })) {
            expect(contrast(c.indicator, bg), `indicator sobre ${name}`).toBeGreaterThanOrEqual(3);
        }
    });

    it("ouro em texto e gráfico (accentText, chart.accent) mantém AA nas superfícies", () => {
        for (const bg of [c.bg, c.bgElevated, c.bgSurface, c.bgHover]) expect(contrast(c.accentText, bg)).toBeGreaterThanOrEqual(4.5);
        for (const bg of [c.bg, c.bgElevated, c.bgSurface]) expect(contrast(c.chart.accent, bg)).toBeGreaterThanOrEqual(3);
    });

    it("contorno de campos (borderStrong) >= 3:1 contra as superfícies (WCAG 1.4.11)", () => {
        for (const bg of [c.bg, c.bgElevated, c.bgInput]) expect(contrast(c.borderStrong, bg)).toBeGreaterThanOrEqual(3);
    });

    it("item ativo da navegação: texto e indicador legíveis sobre o Emerald Surface", () => {
        expect(contrast(c.text, c.primarySoft)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(c.indicator, c.primarySoft)).toBeGreaterThanOrEqual(3);
    });

    it("texto sobre o destaque Aurum >= 4,5:1", () => {
        expect(contrast(c.onAccent, c.accent)).toBeGreaterThanOrEqual(4.5);
    });

    it("exporta CSS variables para cores, raios e movimento", () => {
        const vars = themeToCssVars(theme);
        expect(vars["--v-color-brand"]).toBe(c.brand);
        expect(vars["--v-color-bg"]).toBe(c.bg);
        expect(vars["--v-radius-lg"]).toBe("14px");
        expect(vars["--v-chart-income"]).toBe(c.chart.income);
    });
});

describe("paleta Emerald Finance", () => {
    it("tema escuro usa as superfícies e textos da especificação", () => {
        expect(darkTheme.colors).toMatchObject({ bg: "#07110F", bgSidebar: "#0D1915", bgElevated: "#12221C", bgSurface: "#193027", border: "#263B32", text: "#F0FDF4", textSecondary: "#A7C9B7", brand: "#34D399", income: "#34D399", expense: "#F87171", warning: "#FBBF24", info: "#818CF8" });
    });
    it("tema claro usa as superfícies e textos da especificação", () => {
        expect(lightTheme.colors).toMatchObject({ bg: "#F7FAF8", bgElevated: "#FFFFFF", bgSurface: "#EFF5F1", bgHover: "#E4EEE8", border: "#DCE7E0", text: "#10251B", textSecondary: "#52665A", primary: "#047857", warning: "#B45309", info: "#4F46E5" });
    });
    it("ações principais usam Emerald 700 com texto branco nos dois temas", () => {
        for (const t of [darkTheme, lightTheme]) expect(t.colors).toMatchObject({ primary: "#047857", onPrimary: "#FFFFFF" });
    });
});

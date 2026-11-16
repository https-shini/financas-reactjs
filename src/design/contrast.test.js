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
        for (const k of ["income", "expense", "primary"]) expect(contrast(c.chart[k], c.bgElevated), `chart.${k}`).toBeGreaterThanOrEqual(3);
    });

    it("exporta CSS variables para cores, raios e movimento", () => {
        const vars = themeToCssVars(theme);
        expect(vars["--v-color-brand"]).toBe("#397BFF");
        expect(vars["--v-color-bg"]).toBe(c.bg);
        expect(vars["--v-radius-lg"]).toBe("16px");
        expect(vars["--v-chart-income"]).toBe(c.chart.income);
    });
});

describe("paleta oficial", () => {
    it("tema escuro usa exatamente as cores da marca", () => {
        expect(darkTheme.colors).toMatchObject({ bg: "#10131C", bgElevated: "#171E2B", bgSurface: "#1D2636", text: "#F5F7FF", textMuted: "#8792A5", brand: "#397BFF", accent: "#9277F5", income: "#21C98B", expense: "#F06B78", warning: "#E9B45B" });
    });
    it("tema claro usa as superfícies e o texto definidos", () => {
        expect(lightTheme.colors).toMatchObject({ bg: "#F5F7FF", bgElevated: "#FFFFFF", bgSurface: "#EEF2F8", text: "#151B29", brand: "#397BFF" });
    });
});

import { describe, expect, it } from "vitest";
import { activeNavId, navContext, NAV_GROUPS, ALL_NAV_ITEMS } from "./navigation";

describe("navegação VELDORA", () => {
    it("tem os cinco grupos e ids únicos", () => {
        expect(NAV_GROUPS.map((g) => g.label)).toEqual(["Visão geral", "Financeiro", "Planejamento", "Análises", "Sistema"]);
        const ids = ALL_NAV_ITEMS.map((i) => i.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const item of ALL_NAV_ITEMS) expect(item.to).toMatch(/^\//);
    });

    it.each([
        [{ pathname: "/" }, "dashboard"],
        [{ pathname: "/movimentacoes" }, "transactions"],
        [{ pathname: "/movimentacoes", search: "?tipo=income&periodo=tudo" }, "income"],
        [{ pathname: "/movimentacoes", search: "?tipo=expense" }, "expenses"],
        [{ pathname: "/configuracoes/contas" }, "accounts"],
        [{ pathname: "/configuracoes/dados", hash: "#backup" }, "backup"],
        [{ pathname: "/configuracoes/dados", hash: "#importar" }, "data"],
        [{ pathname: "/configuracoes/aparencia" }, "settings"],
        [{ pathname: "/planejamento/cartoes" }, "cards"],
        [{ pathname: "/planejamento/metas" }, "goals"],
        [{ pathname: "/planejamento" }, "bills"],
        [{ pathname: "/relatorios/anual" }, "reports"],
        [{ pathname: "/relatorios/saude" }, "health"],
        [{ pathname: "/design-system" }, null],
    ])("activeNavId(%o) = %s", (loc, id) => {
        expect(activeNavId(loc)).toBe(id);
    });

    it("cada item é alcançável pelo seu próprio link", () => {
        for (const item of ALL_NAV_ITEMS) {
            const url = new URL(item.to, "http://x");
            expect(activeNavId({ pathname: url.pathname, search: url.search, hash: url.hash })).toBe(item.id);
        }
    });

    it("navContext retorna grupo e item", () => {
        const ctx = navContext({ pathname: "/planejamento/metas" });
        expect(ctx.group.label).toBe("Planejamento");
        expect(ctx.item.label).toBe("Metas");
        expect(navContext({ pathname: "/design-system" })).toBeNull();
    });
});

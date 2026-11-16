import { describe, expect, it } from "vitest";
import { activeNavId, navContext, breadcrumbItems, NAV_GROUPS, ALL_NAV_ITEMS } from "./navigation";

describe("navegação do Finanças", () => {
    it("segue os grupos e itens da especificação, com ids únicos", () => {
        expect(NAV_GROUPS.map((g) => g.label)).toEqual(["Financeiro", "Planejamento", "Sistema"]);
        expect(NAV_GROUPS.map((g) => g.items.map((i) => i.label))).toEqual([
            ["Visão geral", "Transações", "Contas e cartões", "Categorias", "Orçamentos"],
            ["Planejamento", "Relatórios", "Metas financeiras"],
            ["Configurações", "Ajuda"],
        ]);
        const ids = ALL_NAV_ITEMS.map((i) => i.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const item of ALL_NAV_ITEMS) expect(item.to).toMatch(/^\//);
    });

    it.each([
        [{ pathname: "/" }, "dashboard"],
        [{ pathname: "/movimentacoes" }, "transactions"],
        [{ pathname: "/movimentacoes", search: "?tipo=income&periodo=tudo" }, "transactions"],
        [{ pathname: "/configuracoes/contas" }, "accounts"],
        [{ pathname: "/planejamento/cartoes" }, "accounts"],
        [{ pathname: "/configuracoes/categorias" }, "categories"],
        [{ pathname: "/planejamento/orcamentos" }, "budgets"],
        [{ pathname: "/planejamento/vencimentos" }, "planning"],
        [{ pathname: "/planejamento/recorrencias" }, "planning"],
        [{ pathname: "/planejamento/simulador" }, "planning"],
        [{ pathname: "/planejamento" }, "planning"],
        [{ pathname: "/relatorios/anual" }, "reports"],
        [{ pathname: "/relatorios/saude" }, "reports"],
        [{ pathname: "/planejamento/metas" }, "goals"],
        [{ pathname: "/configuracoes/aparencia" }, "settings"],
        [{ pathname: "/configuracoes/dados", hash: "#backup" }, "settings"],
        [{ pathname: "/configuracoes/sobre" }, "help"],
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
        expect(ctx.item.label).toBe("Metas financeiras");
        expect(navContext({ pathname: "/design-system" })).toBeNull();
    });

    it("breadcrumbs: Finanças / <página>", () => {
        expect(breadcrumbItems({ pathname: "/" })).toEqual([{ label: "Finanças", to: "/" }, { label: "Visão geral" }]);
        expect(breadcrumbItems({ pathname: "/movimentacoes" }).map((i) => i.label)).toEqual(["Finanças", "Transações"]);
        expect(breadcrumbItems({ pathname: "/configuracoes/regional" }).map((i) => i.label)).toEqual(["Finanças", "Configurações"]);
        expect(breadcrumbItems({ pathname: "/design-system" })).toEqual([{ label: "Finanças" }]);
    });
});

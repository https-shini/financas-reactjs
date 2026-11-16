import { describe, expect, it } from "vitest";
import { activeNavId, navContext, breadcrumbItems, NAV_GROUPS, ALL_NAV_ITEMS } from "./navigation";

describe("navegação do Finanças (padrão Nexus)", () => {
    it("segue as seções do modelo (Análise, Financeiro, Operações, Ajuda), com ids únicos", () => {
        expect(NAV_GROUPS.map((g) => g.label)).toEqual(["Análise", "Financeiro", "Operações", "Ajuda"]);
        expect(NAV_GROUPS.map((g) => g.items.map((i) => i.label))).toEqual([
            ["Visão geral", "Relatórios"],
            ["Transações", "Contas e cartões", "A pagar e receber", "Orçamentos", "Metas financeiras"],
            ["Recorrências", "Simulador", "Categorias", "Importar", "Exportar"],
            ["Manual e atalhos", "Configurações"],
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
        [{ pathname: "/planejamento/vencimentos" }, "bills"],
        [{ pathname: "/planejamento/recorrencias" }, "recurrences"],
        [{ pathname: "/planejamento/simulador" }, "simulator"],
        [{ pathname: "/planejamento" }, "bills"],
        [{ pathname: "/configuracoes/dados", hash: "#importar" }, "import"],
        [{ pathname: "/configuracoes/dados", hash: "#exportar" }, "export"],
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
        expect(ctx.group.label).toBe("Financeiro");
        expect(ctx.item.label).toBe("Metas financeiras");
        expect(navContext({ pathname: "/design-system" })).toBeNull();
    });

    it("breadcrumbs: Finanças › <página>", () => {
        expect(breadcrumbItems({ pathname: "/" })).toEqual([{ label: "Finanças", to: "/" }, { label: "Visão geral" }]);
        expect(breadcrumbItems({ pathname: "/movimentacoes" }).map((i) => i.label)).toEqual(["Finanças", "Transações"]);
        expect(breadcrumbItems({ pathname: "/configuracoes/regional" }).map((i) => i.label)).toEqual(["Finanças", "Configurações"]);
        expect(breadcrumbItems({ pathname: "/design-system" })).toEqual([{ label: "Finanças" }]);
    });
});

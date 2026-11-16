import { describe, expect, it } from "vitest";
import { applyGroupEdit, buildInstallments } from "./installments";
import { budgetHistory, budgetStatus, buildBudget, validateBudgetInput } from "./budgets";
import { buildGoal, goalProgress, goalsReserveThisMonth } from "./goals";
import { storeWith, tx } from "../test/helpers";
import { DEFAULT_ACCOUNT_ID } from "./defaults";
import { sumCents } from "./money";

describe("parcelamento", () => {
    const input = { type: "expense", amountCents: 100000, description: "Sofá", date: "2026-10-10", accountId: DEFAULT_ACCOUNT_ID, categoryId: null, status: "paid" };

    it("gera N parcelas que somam o total, com datas mensais", () => {
        const p = buildInstallments(input, 3, { today: "2026-11-16", isCardAccount: false });
        expect(p.map((x) => x.amountCents)).toEqual([33334, 33333, 33333]);
        expect(sumCents(p.map((x) => x.amountCents))).toBe(100000);
        expect(p.map((x) => x.date)).toEqual(["2026-10-10", "2026-11-10", "2026-12-10"]);
        expect(p.map((x) => x.status)).toEqual(["paid", "paid", "pending"]);
        expect(new Set(p.map((x) => x.installment.group)).size).toBe(1);
        expect(p[2].installment).toMatchObject({ n: 3, of: 3, totalCents: 100000 });
    });

    it("edição do grupo não altera parcelas já pagas", () => {
        const p = buildInstallments(input, 3, { today: "2026-11-16", isCardAccount: false });
        const locked = (x) => x.status === "paid" && x.date <= "2026-11-16";
        const edited = applyGroupEdit(p, { totalCents: 120000, description: "Sofá novo" }, locked);
        expect(edited.map((x) => x.amountCents)).toEqual([33334, 33333, 53333]);
        expect(edited.every((x) => x.description === "Sofá novo")).toBe(true);
        expect(() => applyGroupEdit(p, { totalCents: 1000 }, locked)).toThrow();
    });

    it("limita a quantidade de parcelas", () => {
        expect(() => buildInstallments(input, 1, { today: "2026-11-16" })).toThrow();
        expect(() => buildInstallments(input, 121, { today: "2026-11-16" })).toThrow();
    });
});

describe("orçamentos", () => {
    const store = storeWith({
        budgets: [buildBudget({ categoryId: "cat-mercado", limitCents: 100000 }, { id: "b1" }), buildBudget({ categoryId: "cat-lazer", limitCents: 20000, overrides: { "2026-11": 10000 } }, { id: "b2" })],
        transactions: [
            tx({ categoryId: "cat-mercado", amountCents: 85000, date: "2026-11-03" }),
            tx({ categoryId: "cat-lazer", amountCents: 12000, date: "2026-11-04" }),
            tx({ categoryId: "cat-lazer", amountCents: 5000, date: "2026-11-25", status: "pending" }),
            tx({ categoryId: "cat-mercado", amountCents: 50000, date: "2026-10-03" }),
        ],
    });

    it("calcula gasto, restante e alertas 80%/100%", () => {
        const rows = budgetStatus(store, "2026-11");
        const lazer = rows.find((r) => r.category.id === "cat-lazer");
        const mercado = rows.find((r) => r.category.id === "cat-mercado");
        expect(lazer.limitCents).toBe(10000); // override do mês
        expect(lazer.spentCents).toBe(17000);
        expect(lazer.level).toBe("exceeded");
        expect(mercado.level).toBe("warning");
        expect(mercado.remainingCents).toBe(15000);
    });

    it("histórico mensal", () => {
        const h = budgetHistory(store, store.budgets[0], "2026-11", 2);
        expect(h.map((r) => r.spentCents)).toEqual([50000, 85000]);
    });

    it("não permite dois orçamentos para a mesma categoria", () => {
        expect(validateBudgetInput({ categoryId: "cat-mercado", limitCents: 100 }, store).ok).toBe(false);
    });
});

describe("metas", () => {
    it("progresso e aporte mensal sugerido", () => {
        const g = buildGoal({ name: "Viagem", kind: "travel", targetCents: 600000, deadline: "2027-04-30", contributions: [{ id: "c1", date: "2026-10-01", amountCents: 100000 }] });
        const p = goalProgress(g, "2026-11-16");
        expect(p.savedCents).toBe(100000);
        expect(p.monthsLeft).toBe(6); // nov..abr
        expect(p.suggestedMonthlyCents).toBe(83334);
        expect(p.pendingThisMonthCents).toBe(83334);
        expect(goalsReserveThisMonth(storeWith({ goals: [g] }), "2026-11-16")).toBe(83334);
    });
    it("meta sem prazo não reserva valor e meta concluída", () => {
        const g = buildGoal({ name: "Reserva", kind: "emergency", targetCents: 1000, contributions: [{ id: "c", date: "2026-11-01", amountCents: 1500 }] });
        const p = goalProgress(g, "2026-11-16");
        expect(p.completed).toBe(true);
        expect(p.pct).toBe(100);
        expect(p.pendingThisMonthCents).toBe(0);
    });
});

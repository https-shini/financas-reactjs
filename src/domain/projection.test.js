import { describe, expect, it } from "vitest";
import { forecastEndOfMonth, projectCashBalance, spendableToday } from "./projection";
import { generateInsights } from "./insights";
import { buildRecurrence } from "./recurrence";
import { buildGoal } from "./goals";
import { buildBudget } from "./budgets";
import { card, storeWith, tx } from "../test/helpers";
import { DEFAULT_ACCOUNT_ID } from "./defaults";
import * as ops from "../state/operations";

const today = "2026-11-16";

describe("projeção de saldo", () => {
    it("considera pendentes, atrasados, recorrências virtuais e faturas", () => {
        let store = storeWith({
            accounts: [...storeWith().accounts, card({ closingDay: 5, dueDay: 25 })],
            transactions: [
                tx({ type: "income", amountCents: 500000, date: "2026-11-01" }),
                tx({ amountCents: 30000, date: "2026-11-10", status: "pending", description: "Atrasada" }),
                tx({ amountCents: 20000, date: "2026-11-20", status: "pending", description: "Luz" }),
                tx({ accountId: "card-1", amountCents: 40000, date: "2026-11-03", description: "Compra" }),
            ],
            recurrences: [
                buildRecurrence({ type: "expense", amountCents: 10000, description: "Academia", accountId: DEFAULT_ACCOUNT_ID, categoryId: null, frequency: "monthly", startDate: "2027-01-10" }, { id: "r" }),
            ],
        });
        store = ops.generateRecurrences(store, today); // nada a gerar antes de 2027-01-10? horizonte = fim de dezembro
        const p = projectCashBalance(store, today, 60);
        expect(p.startCents).toBe(500000);
        // hoje: -300 (atrasada); 20/11: -200; 25/11: -400 (fatura); 10/01: -100 (recorrência virtual)
        expect(p.series.find((d) => d.date === today).balanceCents).toBe(470000);
        expect(p.series.find((d) => d.date === "2026-11-25").balanceCents).toBe(410000);
        expect(p.endBalanceCents).toBe(400000);
        expect(p.firstNegativeDate).toBeNull();
        expect(forecastEndOfMonth(store, today).endBalanceCents).toBe(410000);
    });

    it("detecta a primeira data de saldo negativo", () => {
        const store = storeWith({ transactions: [tx({ type: "income", amountCents: 10000, date: "2026-11-01" }), tx({ amountCents: 50000, date: "2026-11-28", status: "pending" })] });
        expect(projectCashBalance(store, today, 30).firstNegativeDate).toBe("2026-11-28");
    });

    it("transferências entre contas não alteram a projeção consolidada", () => {
        const store = storeWith({
            accounts: [...storeWith().accounts, { ...storeWith().accounts[0], id: "acc-2", name: "Poupança" }],
            transactions: [tx({ type: "income", amountCents: 10000, date: "2026-11-01" }), tx({ type: "transfer", toAccountId: "acc-2", amountCents: 5000, date: "2026-11-20", status: "pending" })],
        });
        expect(projectCashBalance(store, today, 30).endBalanceCents).toBe(10000);
    });

    it("quanto posso gastar hoje desconta a reserva das metas", () => {
        const store = storeWith({
            transactions: [tx({ type: "income", amountCents: 450000, date: "2026-11-01" })],
            goals: [buildGoal({ name: "Viagem", kind: "travel", targetCents: 150000, deadline: "2026-11-30" })],
        });
        const s = spendableToday(store, today);
        expect(s.daysLeft).toBe(15);
        expect(s.reserveCents).toBe(150000);
        expect(s.dailyCents).toBe(20000);
    });
});

describe("insights", () => {
    it("não gera comparações sem histórico suficiente", () => {
        const store = storeWith({ transactions: [tx({ categoryId: "cat-mercado", amountCents: 90000, date: "2026-11-02" })] });
        const ids = generateInsights(store, "2026-11", today).map((i) => i.id);
        expect(ids.some((id) => id.startsWith("category-"))).toBe(false);
    });

    it("aponta aumento de categoria, orçamento e despesas acima da receita", () => {
        const months = ["2026-08", "2026-09", "2026-10"];
        const store = storeWith({
            transactions: [
                ...months.map((m) => tx({ categoryId: "cat-mercado", amountCents: 50000, date: `${m}-05` })),
                ...months.map((m) => tx({ type: "income", categoryId: "cat-salario", amountCents: 300000, date: `${m}-01` })),
                tx({ categoryId: "cat-mercado", amountCents: 90000, date: "2026-11-05" }),
                tx({ type: "income", amountCents: 50000, date: "2026-11-01" }),
            ],
            budgets: [buildBudget({ categoryId: "cat-mercado", limitCents: 100000 })],
        });
        const ids = generateInsights(store, "2026-11", today).map((i) => i.id);
        expect(ids).toContain("negative-result");
        expect(ids).toContain("category-up-cat-mercado");
        expect(ids.some((id) => id.startsWith("budget-"))).toBe(true);
    });
});

import { describe, expect, it } from "vitest";
import {
    accountBalance,
    categoryBreakdown,
    consolidatedBalance,
    filterTransactions,
    groupByDay,
    monthComparison,
    monthlySeries,
    monthSummary,
    netWorthSeries,
    upcomingItems,
} from "./selectors";
import { account, card, storeWith, tx } from "../test/helpers";
import { DEFAULT_ACCOUNT_ID } from "./defaults";

const today = "2026-11-16";

function sample() {
    const accounts = [...storeWith().accounts, account({ initialBalanceCents: 10000 })];
    return storeWith({
        accounts,
        transactions: [
            tx({ type: "income", amountCents: 500000, description: "Salário", date: "2026-11-05", categoryId: "cat-salario" }),
            tx({ amountCents: 180000, description: "Aluguel", date: "2026-11-06", categoryId: "cat-moradia" }),
            tx({ amountCents: 20000, description: "Mercado", date: "2026-11-10", categoryId: "cat-mercado" }),
            tx({ amountCents: 30000, description: "Conta de luz", date: "2026-11-20", categoryId: "cat-moradia", status: "pending" }),
            tx({ type: "transfer", amountCents: 50000, description: "Guardar", date: "2026-11-07", toAccountId: "acc-2" }),
            tx({ type: "income", amountCents: 100000, description: "Freela", date: "2026-10-15", categoryId: "cat-freelance" }),
            tx({ amountCents: 40000, description: "Mercado", date: "2026-10-20", categoryId: "cat-mercado" }),
        ],
    });
}

describe("saldos", () => {
    it("saldo realizado ignora pendentes e soma transferências corretamente", () => {
        const s = sample();
        // principal: +1000 +5000 -1800 -200 -500(transferência) -400 = 3100,00
        expect(accountBalance(s, DEFAULT_ACCOUNT_ID, today)).toBe(310000);
        expect(accountBalance(s, "acc-2", today)).toBe(60000);
    });
    it("transferências não alteram o consolidado", () => {
        const s = sample();
        const without = { ...s, transactions: s.transactions.filter((t) => t.type !== "transfer") };
        expect(consolidatedBalance(s, today).cashCents).toBe(consolidatedBalance(without, today).cashCents);
    });
    it("compras no cartão viram dívida, não reduzem o dinheiro em conta", () => {
        const s = storeWith({ accounts: [...storeWith().accounts, card()], transactions: [tx({ accountId: "card-1", amountCents: 9000, date: "2026-11-02" })] });
        const c = consolidatedBalance(s, today);
        expect(c.cashCents).toBe(0);
        expect(c.cardDebtCents).toBe(9000);
        expect(c.netWorthCents).toBe(-9000);
    });
});

describe("resumo mensal", () => {
    it("soma receitas e despesas do mês (inclui pendentes) e ignora transferências", () => {
        const m = monthSummary(sample(), "2026-11");
        expect(m.incomeCents).toBe(500000);
        expect(m.expenseCents).toBe(230000);
        expect(m.pendingExpenseCents).toBe(30000);
        expect(m.resultCents).toBe(270000);
    });
    it("compara com o mês anterior", () => {
        const c = monthComparison(sample(), "2026-11");
        expect(c.previous.expenseCents).toBe(40000);
        expect(c.expenseVariation).toBeCloseTo(475);
    });
    it("série mensal e patrimônio", () => {
        const series = monthlySeries(sample(), "2026-11", 3);
        expect(series.map((r) => r.month)).toEqual(["2026-09", "2026-10", "2026-11"]);
        expect(series[1].resultCents).toBe(60000);
        const nw = netWorthSeries(sample(), "2026-11", 2, today);
        expect(nw[0].balanceCents).toBe(10000 + 60000);
        expect(nw[1].balanceCents).toBe(70000 + 500000 - 180000 - 20000);
    });
});

describe("categorias", () => {
    it("ordena despesas por categoria com percentual", () => {
        const rows = categoryBreakdown(sample(), "2026-11-01", "2026-11-30");
        expect(rows[0].category.id).toBe("cat-moradia");
        expect(rows[0].totalCents).toBe(210000);
        expect(Math.round(rows.reduce((s, r) => s + r.pct, 0))).toBe(100);
    });
});

describe("filtros e agrupamento", () => {
    it("filtra por texto (sem acento), tipo, status e período", () => {
        const s = sample();
        expect(filterTransactions(s, { q: "salario" })).toHaveLength(1);
        expect(filterTransactions(s, { types: ["transfer"] })).toHaveLength(1);
        expect(filterTransactions(s, { status: "pending" })).toHaveLength(1);
        expect(filterTransactions(s, { start: "2026-11-01", end: "2026-11-30" })).toHaveLength(5);
        expect(filterTransactions(s, { categoryIds: ["cat-mercado"] })).toHaveLength(2);
        expect(filterTransactions(s, { accountIds: ["acc-2"] })).toHaveLength(1);
    });
    it("agrupa por dia com saldo líquido", () => {
        const groups = groupByDay(filterTransactions(sample(), { start: "2026-11-05", end: "2026-11-06" }));
        expect(groups).toHaveLength(2);
    });
});

describe("vencimentos", () => {
    it("lista pendentes até o horizonte e marca atrasados", () => {
        const s = sample();
        s.transactions.push(tx({ amountCents: 1000, date: "2026-11-01", status: "pending", description: "Atrasada" }));
        const items = upcomingItems(s, today, 30);
        expect(items.map((i) => i.description)).toEqual(["Atrasada", "Conta de luz"]);
        expect(items[0].overdue).toBe(true);
    });
    it("inclui faturas de cartão em aberto", () => {
        const s = storeWith({ accounts: [...storeWith().accounts, card()], transactions: [tx({ accountId: "card-1", amountCents: 9000, date: "2026-11-02" })] });
        const items = upcomingItems(s, today, 30);
        expect(items).toHaveLength(1);
        expect(items[0].kind).toBe("invoice");
        expect(items[0].date).toBe("2026-11-15");
        expect(items[0].overdue).toBe(true);
    });
});

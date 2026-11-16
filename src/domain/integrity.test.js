// Auditoria de integridade financeira: casos extremos e invariantes que garantem
// que nenhuma operação cria, perde ou duplica dinheiro.
import { describe, expect, it } from "vitest";
import { parseMoneyString, splitCents, sumCents, MAX_CENTS } from "./money";
import {
    accountBalance, balancesByAccount, categoryBreakdown, consolidatedBalance, monthlySeries, monthSummary, netWorthSeries, periodSummary,
} from "./selectors";
import { buildTransaction, updateTransaction, validateTransactionInput } from "./transactions";
import { cardInvoices, cardSummary } from "./cards";
import { buildInstallments } from "./installments";
import { buildRecurrence, generateOccurrences } from "./recurrence";
import { projectCashBalance } from "./projection";
import { budgetStatus, buildBudget } from "./budgets";
import { buildGoal, goalProgress } from "./goals";
import { addDaysISO, lastMonths, monthEnd, monthStart } from "./dates";
import { account, card, storeWith, tx } from "../test/helpers";
import { DEFAULT_ACCOUNT_ID } from "./defaults";
import * as ops from "../state/operations";

const today = "2026-11-16";

/** Gerador pseudoaleatório determinístico (testes reprodutíveis). */
function rng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 2 ** 32;
    };
}

describe("valores monetários", () => {
    it("arredondamento half-up na terceira casa e sem float", () => {
        expect(parseMoneyString("0,005")).toBe(1);
        expect(parseMoneyString("0,004")).toBe(0);
        expect(parseMoneyString("2,675")).toBe(268); // 2.675 em float vira 2.67499...
        expect(parseMoneyString("1.000.000,99")).toBe(100000099);
    });
    it("rejeita valores acima do limite e zero não é válido para lançamento", () => {
        expect(parseMoneyString("1.000.000.000,00")).toBeNull();
        expect(MAX_CENTS).toBe(99999999999);
        const store = storeWith();
        const base = { type: "expense", description: "x", date: today, accountId: DEFAULT_ACCOUNT_ID, status: "paid" };
        expect(validateTransactionInput({ ...base, amountCents: 0 }, store).ok).toBe(false);
        expect(validateTransactionInput({ ...base, amountCents: -100 }, store).ok).toBe(false);
        expect(validateTransactionInput({ ...base, amountCents: 1.5 }, store).ok).toBe(false);
        expect(validateTransactionInput({ ...base, amountCents: MAX_CENTS + 1 }, store).ok).toBe(false);
    });
    it("soma de 10 lançamentos de R$ 0,10 é exatamente R$ 1,00", () => {
        const store = storeWith({ transactions: Array.from({ length: 10 }, () => tx({ amountCents: 10, date: "2026-11-02" })) });
        expect(monthSummary(store, "2026-11").expenseCents).toBe(100);
    });
    it("divisão em parcelas nunca perde nem cria centavos", () => {
        for (const [total, n] of [[1, 2], [100001, 3], [99999999999, 120], [7, 7], [120000, 12]]) {
            const parts = splitCents(total, n);
            expect(sumCents(parts)).toBe(total);
            expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1);
        }
    });
});

describe("invariante: o patrimônio só muda por receitas e despesas realizadas", () => {
    it("2.000 operações aleatórias (contas, cartão, transferências, pagamentos de fatura, pendentes, futuros)", () => {
        const r = rng(42);
        const accounts = [...storeWith().accounts, account({ id: "acc-2", initialBalanceCents: 50000 }), account({ id: "acc-3", type: "cash", initialBalanceCents: 1234 }), card({ id: "card-1" })];
        const ids = accounts.map((a) => a.id);
        const txs = [];
        for (let i = 0; i < 2000; i += 1) {
            const type = r() < 0.3 ? "income" : r() < 0.75 ? "expense" : "transfer";
            const from = ids[Math.floor(r() * ids.length)];
            let to = ids[Math.floor(r() * ids.length)];
            if (to === from) to = ids[(ids.indexOf(from) + 1) % ids.length];
            const day = 1 + Math.floor(r() * 28);
            const month = 1 + Math.floor(r() * 12);
            txs.push(
                buildTransaction({
                    type,
                    amountCents: 1 + Math.floor(r() * 500000),
                    description: `op ${i}`,
                    date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
                    accountId: from,
                    toAccountId: type === "transfer" ? to : undefined,
                    categoryId: null,
                    status: r() < 0.2 ? "pending" : "paid",
                    invoiceRef: type === "transfer" && to === "card-1" ? { cardId: "card-1", month: `2026-${String(month).padStart(2, "0")}` } : undefined,
                })
            );
        }
        const store = storeWith({ accounts, transactions: txs });
        const initial = accounts.reduce((s, a) => s + a.initialBalanceCents, 0);
        const realized = txs.filter((t) => t.status === "paid" && t.date <= today);
        const inc = realized.filter((t) => t.type === "income").reduce((s, t) => s + t.amountCents, 0);
        const exp = realized.filter((t) => t.type === "expense").reduce((s, t) => s + t.amountCents, 0);

        // Soma dos saldos de todas as contas = saldo inicial + receitas − despesas realizadas (transferências se anulam).
        const sumBalances = balancesByAccount(store, today).reduce((s, b) => s + b.balanceCents, 0);
        expect(sumBalances).toBe(initial + inc - exp);
        expect(consolidatedBalance(store, today).netWorthCents).toBe(initial + inc - exp);
        for (const id of ids) expect(Number.isInteger(accountBalance(store, id, today))).toBe(true);

        // Relatórios: soma mensal = soma anual = soma das categorias; transferências nunca entram.
        const year = periodSummary(store, "2026-01-01", "2026-12-31");
        const series = monthlySeries(store, "2026-12", 12);
        expect(series.reduce((s, m) => s + m.incomeCents, 0)).toBe(year.incomeCents);
        expect(series.reduce((s, m) => s + m.expenseCents, 0)).toBe(year.expenseCents);
        const allIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amountCents, 0);
        const allExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amountCents, 0);
        expect(year.incomeCents).toBe(allIncome);
        expect(year.expenseCents).toBe(allExpense);
        expect(categoryBreakdown(store, "2026-01-01", "2026-12-31").reduce((s, c) => s + c.totalCents, 0)).toBe(allExpense);
        for (const m of lastMonths("2026-12", 12)) expect(monthSummary(store, m).expenseCents).toBe(series.find((x) => x.month === m).expenseCents);

        // Evolução do patrimônio: último ponto (até hoje) = patrimônio realizado.
        const nw = netWorthSeries(store, "2026-11", 1, today);
        expect(nw[0].balanceCents).toBe(initial + inc - exp);
    });
});

describe("cartões e faturas", () => {
    const c = card({ closingDay: 31, dueDay: 10 });
    it("fechamento no dia 31 em meses curtos e virada de ano", () => {
        const store = storeWith({
            accounts: [...storeWith().accounts, c],
            transactions: [tx({ accountId: "card-1", amountCents: 1000, date: "2026-02-28" }), tx({ accountId: "card-1", amountCents: 2000, date: "2026-12-31" })],
        });
        const inv = cardInvoices(store, c, today);
        expect(inv.map((i) => [i.month, i.closingDate, i.dueDate, i.totalCents])).toEqual([
            ["2026-02", "2026-02-28", "2026-03-10", 1000],
            ["2026-12", "2026-12-31", "2027-01-10", 2000],
        ]);
    });

    it("estorno abate a fatura; pagamento parcial e excedente viram crédito, sem alterar despesas", () => {
        const k = card({ closingDay: 5, dueDay: 15 });
        const store = storeWith({
            accounts: [...storeWith().accounts, k],
            transactions: [
                tx({ accountId: "card-1", amountCents: 50000, date: "2026-10-02" }),
                tx({ type: "income", accountId: "card-1", amountCents: 10000, date: "2026-10-03", description: "Estorno" }),
                tx({ type: "transfer", toAccountId: "card-1", amountCents: 30000, date: "2026-10-15" }),
                tx({ type: "transfer", toAccountId: "card-1", amountCents: 25000, date: "2026-10-20" }),
                tx({ accountId: "card-1", amountCents: 20000, date: "2026-11-02" }),
            ],
        });
        const [oct, nov] = cardInvoices(store, k, today);
        expect(oct).toMatchObject({ totalCents: 40000, remainingCents: 0, status: "paid" });
        expect(nov.totalCents).toBe(20000);
        expect(nov.remainingCents).toBe(5000); // 15.000 de crédito do pagamento excedente
        expect(cardSummary(store, k, today).usedCents).toBe(5000);
        // Pagamentos de fatura são transferências: despesas do mês = só as compras.
        expect(monthSummary(store, "2026-10").expenseCents).toBe(50000);
        expect(monthSummary(store, "2026-10").incomeCents).toBe(10000);
    });

    it("pagamento agendado não é descontado duas vezes na projeção", () => {
        const k = card({ closingDay: 5, dueDay: 25 });
        const store = storeWith({
            accounts: [...storeWith().accounts, k],
            transactions: [
                tx({ type: "income", amountCents: 100000, date: "2026-11-01" }),
                tx({ accountId: "card-1", amountCents: 30000, date: "2026-11-03" }),
                tx({ type: "transfer", toAccountId: "card-1", amountCents: 30000, date: "2026-11-25", status: "pending", invoiceRef: { cardId: "card-1", month: "2026-11" } }),
            ],
        });
        expect(projectCashBalance(store, today, 30).endBalanceCents).toBe(70000);
    });
});

describe("parcelas", () => {
    it("parcelamento no cartão iniciado em dezembro atravessa o ano e soma exatamente o total", () => {
        const parcels = buildInstallments({ type: "expense", amountCents: 100001, description: "TV", date: "2026-12-31", accountId: "card-1", categoryId: null, status: "paid" }, 3, { today, isCardAccount: true });
        expect(parcels.map((p) => p.date)).toEqual(["2026-12-31", "2027-01-31", "2027-02-28"]);
        expect(sumCents(parcels.map((p) => p.amountCents))).toBe(100001);
        const store = storeWith({ accounts: [...storeWith().accounts, card()], transactions: parcels });
        expect(periodSummary(store, "2026-01-01", "2027-12-31").expenseCents).toBe(100001);
    });
});

describe("recorrências", () => {
    it("dois anos de recorrência diária: geração repetida é idempotente", () => {
        const rec = buildRecurrence({ type: "expense", amountCents: 100, description: "Café", accountId: DEFAULT_ACCOUNT_ID, categoryId: null, frequency: "daily", startDate: "2025-01-01" }, { id: "r" });
        let store = storeWith({ recurrences: [rec] });
        store = ops.generateRecurrences(store, today);
        const n = store.transactions.length;
        expect(n).toBe(730); // 2025-01-01 .. 2026-12-31
        for (let i = 0; i < 3; i += 1) store = ops.generateRecurrences(store, addDaysISO(today, i));
        expect(store.transactions).toHaveLength(n);
        expect(new Set(store.transactions.map((t) => t.occurrenceDate)).size).toBe(n);
    });

    it("projeção não conta ocorrências geradas e virtuais em duplicidade", () => {
        const rec = buildRecurrence({ type: "expense", amountCents: 10000, description: "Aluguel", accountId: DEFAULT_ACCOUNT_ID, categoryId: null, frequency: "monthly", startDate: "2026-11-20" }, { id: "r" });
        let store = storeWith({ recurrences: [rec], transactions: [tx({ type: "income", amountCents: 1000000, date: "2026-11-01" })] });
        store = ops.generateRecurrences(store, today); // gera 20/11 e 20/12
        const p = projectCashBalance(store, today, 90); // até 14/02: 20/11, 20/12, 20/01
        expect(p.events.filter((e) => e.label === "Aluguel").map((e) => e.date)).toEqual(["2026-11-20", "2026-12-20", "2027-01-20"]);
        expect(p.endBalanceCents).toBe(1000000 - 30000);
    });

    it("excluir a regra mantém lançamentos pagos e remove só pendentes futuros", () => {
        const rec = buildRecurrence({ type: "income", amountCents: 500000, description: "Salário", accountId: DEFAULT_ACCOUNT_ID, categoryId: null, frequency: "monthly", startDate: "2026-10-05" }, { id: "r" });
        let store = ops.generateRecurrences(storeWith({ recurrences: [rec] }), today);
        store = ops.setTransactionsStatus(store, store.transactions.filter((t) => t.date < today).map((t) => t.id), "paid");
        store = ops.deleteRecurrence(store, "r", today);
        expect(store.transactions.map((t) => [t.date, t.status, t.recurrenceId])).toEqual([
            ["2026-10-05", "paid", undefined],
            ["2026-11-05", "paid", undefined],
        ]);
        expect(generateOccurrences(store, "2027-12-31")).toHaveLength(0);
    });
});

describe("edição de transações", () => {
    it("transformar transferência em despesa remove o destino; despesa em transferência perde a categoria", () => {
        const t = tx({ type: "transfer", toAccountId: "acc-2", categoryId: null });
        const asExpense = updateTransaction(t, { type: "expense", categoryId: "cat-mercado" });
        expect(asExpense.toAccountId).toBeUndefined();
        expect(asExpense.categoryId).toBe("cat-mercado");
        const back = updateTransaction(asExpense, { type: "transfer", toAccountId: "acc-2" });
        expect(back.categoryId).toBeNull();
        expect(back.id).toBe(t.id);
        expect(back.createdAt).toBe(t.createdAt);
    });
});

describe("orçamentos e metas", () => {
    it("limite zero com gasto é considerado estourado", () => {
        const b = buildBudget({ categoryId: "cat-lazer", limitCents: 1000, overrides: { "2026-11": 0 } });
        const store = storeWith({ budgets: [b], transactions: [tx({ categoryId: "cat-lazer", amountCents: 500, date: "2026-11-02" })] });
        const [row] = budgetStatus(store, "2026-11");
        expect(row.limitCents).toBe(0);
        expect(row.level).toBe("exceeded");
        expect(row.remainingCents).toBe(-500);
    });
    it("orçamento considera despesas no cartão e ignora transferências e receitas", () => {
        const b = buildBudget({ categoryId: "cat-mercado", limitCents: 10000 });
        const store = storeWith({
            accounts: [...storeWith().accounts, card()],
            budgets: [b],
            transactions: [
                tx({ categoryId: "cat-mercado", amountCents: 3000, date: "2026-11-02", accountId: "card-1" }),
                tx({ categoryId: "cat-mercado", amountCents: 2000, date: "2026-11-03", type: "income" }),
                tx({ type: "transfer", toAccountId: "card-1", amountCents: 3000, date: "2026-11-15" }),
            ],
        });
        expect(budgetStatus(store, "2026-11")[0].spentCents).toBe(3000);
    });
    it("meta com resgates não fica com progresso negativo e prazo vencido sugere o restante", () => {
        const g = buildGoal({ name: "X", kind: "other", targetCents: 10000, deadline: "2026-10-31", contributions: [{ id: "a", date: "2026-09-01", amountCents: 3000 }] });
        const p = goalProgress(g, today);
        expect(p.overdue).toBe(true);
        expect(p.suggestedMonthlyCents).toBe(7000);
        const withdrawn = goalProgress({ ...g, contributions: [...g.contributions, { id: "b", date: "2026-09-02", amountCents: -5000 }] }, today);
        expect(withdrawn.pct).toBeGreaterThanOrEqual(0);
    });
});

describe("comparação de períodos", () => {
    it("limites do período são inclusivos e não sobrepõem meses vizinhos", () => {
        const store = storeWith({
            transactions: [tx({ amountCents: 1, date: "2026-10-31" }), tx({ amountCents: 10, date: "2026-11-01" }), tx({ amountCents: 100, date: "2026-11-30" }), tx({ amountCents: 1000, date: "2026-12-01" })],
        });
        expect(periodSummary(store, monthStart("2026-11"), monthEnd("2026-11")).expenseCents).toBe(110);
        expect(periodSummary(store, "2026-10-31", "2026-10-31").expenseCents).toBe(1);
    });
});

import { describe, expect, it } from "vitest";
import { detectSubscriptions, healthScore, simulate, simulatorBaseline, suggestionKey } from "./intelligence";
import { buildRecurrence } from "./recurrence";
import { buildBudget } from "./budgets";
import { storeWith, tx } from "../test/helpers";
import { DEFAULT_ACCOUNT_ID } from "./defaults";
import { buildInstallments } from "./installments";

const today = "2026-11-16";

describe("detector de assinaturas", () => {
    const netflix = ["2026-08-10", "2026-09-10", "2026-10-10", "2026-11-10"].map((d) => tx({ description: "Netflix", amountCents: 5590, date: d, categoryId: "cat-assinaturas" }));

    it("sugere despesas mensais regulares", () => {
        const s = detectSubscriptions(storeWith({ transactions: netflix }), today);
        expect(s).toHaveLength(1);
        expect(s[0]).toMatchObject({ frequency: "monthly", amountCents: 5590, nextDate: "2026-12-10", count: 4, categoryId: "cat-assinaturas" });
    });

    it("ignora irregulares, dispensadas e já recorrentes", () => {
        const irregular = ["2026-08-01", "2026-08-20", "2026-10-30"].map((d) => tx({ description: "Restaurante", date: d }));
        expect(detectSubscriptions(storeWith({ transactions: irregular }), today)).toHaveLength(0);
        const dismissed = storeWith({ transactions: netflix });
        dismissed.settings = { ...dismissed.settings, dismissedSuggestions: [suggestionKey("Netflix")] };
        expect(detectSubscriptions(dismissed, today)).toHaveLength(0);
        const rec = buildRecurrence({ type: "expense", amountCents: 5590, description: "Netflix", accountId: DEFAULT_ACCOUNT_ID, frequency: "monthly", startDate: "2026-12-10" });
        expect(detectSubscriptions(storeWith({ transactions: netflix, recurrences: [rec] }), today)).toHaveLength(0);
    });

    it("não sugere quando o valor varia muito", () => {
        const varying = ["2026-08-10", "2026-09-10", "2026-10-10"].map((d, i) => tx({ description: "Conta de luz", amountCents: 10000 + i * 5000, date: d }));
        expect(detectSubscriptions(storeWith({ transactions: varying }), today)).toHaveLength(0);
    });
});

describe("saúde financeira", () => {
    it("sem histórico não calcula", () => {
        expect(healthScore(storeWith(), today).score).toBeNull();
    });

    it("calcula com critérios transparentes e ignora os não avaliáveis", () => {
        const months = ["2026-08", "2026-09", "2026-10"];
        const store = storeWith({
            transactions: [
                ...months.map((m) => tx({ type: "income", amountCents: 1000000, date: `${m}-05` })),
                ...months.map((m) => tx({ amountCents: 800000, date: `${m}-10`, categoryId: "cat-mercado" })),
            ],
        });
        const h = healthScore(store, today);
        // poupança 20% => 25/25; reserva: saldo 6.000 / despesa 8.000 = 0,75 mês => 3,1/25; orçamento e fixas não avaliados.
        expect(h.criteria.find((c) => c.key === "savings").points).toBe(25);
        expect(h.criteria.filter((c) => c.evaluated)).toHaveLength(2);
        expect(h.score).toBe(Math.round(((25 + 25 * (600000 / 800000 / 6)) / 50) * 100));
        const withBudget = { ...store, budgets: [buildBudget({ categoryId: "cat-mercado", limitCents: 700000 })] };
        expect(healthScore(withBudget, today).criteria.find((c) => c.key === "budgets")).toMatchObject({ evaluated: true, points: 0 });
    });
});

describe("simulador", () => {
    const store = storeWith({
        transactions: [
            ...["2026-08", "2026-09", "2026-10"].map((m) => tx({ type: "income", amountCents: 500000, date: `${m}-05` })),
            ...["2026-08", "2026-09", "2026-10"].map((m) => tx({ amountCents: 100000, date: `${m}-10`, categoryId: "cat-lazer" })),
            ...["2026-08", "2026-09", "2026-10"].map((m) => tx({ amountCents: 300000, date: `${m}-11`, categoryId: "cat-moradia" })),
        ],
    });

    it("cenário base mantém a média e cenário com corte economiza", () => {
        const base = simulatorBaseline(store, today);
        expect(base.incomeCents).toBe(500000);
        expect(base.expenseCents).toBe(400000);
        const r = simulate(base, { cuts: { "cat-lazer": 50 }, extraIncomeCents: 10000 }, today);
        expect(r.monthlySavingCents).toBe(60000);
        expect(r.at6.baseCents - base.startCents).toBe(600000);
        expect(r.at12.simCents - r.at12.baseCents).toBe(720000);
    });

    it("aporte reduz o caixa mas soma no investido; antecipar parcelas desloca o pagamento", () => {
        const parcels = buildInstallments({ type: "expense", amountCents: 120000, description: "TV", date: "2026-12-01", accountId: DEFAULT_ACCOUNT_ID, categoryId: null, status: "pending" }, 4, { today, isCardAccount: false });
        const s2 = { ...store, transactions: [...store.transactions, ...parcels] };
        const base = simulatorBaseline(s2, today);
        expect(base.futureInstallments).toHaveLength(4);
        const r = simulate(base, { contributionCents: 50000, anticipateInstallments: true }, today);
        expect(r.at12.investedCents).toBe(600000);
        expect(r.at12.simTotalCents).toBe(r.at12.baseCents);
    });
});

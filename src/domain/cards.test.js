import { describe, expect, it } from "vitest";
import { cardInvoices, cardSummary, invoiceDates, invoiceMonthOf } from "./cards";
import { monthSummary } from "./selectors";
import { buildInstallments } from "./installments";
import { card, storeWith, tx } from "../test/helpers";
import { DEFAULT_ACCOUNT_ID } from "./defaults";

const c = card({ closingDay: 5, dueDay: 15 });

describe("ciclo da fatura", () => {
    it("compras após o fechamento vão para a próxima fatura", () => {
        expect(invoiceMonthOf("2026-11-05", 5)).toBe("2026-11");
        expect(invoiceMonthOf("2026-11-06", 5)).toBe("2026-12");
        expect(invoiceMonthOf("2026-12-28", 25)).toBe("2027-01");
    });
    it("vencimento antes do fechamento cai no mês seguinte", () => {
        expect(invoiceDates(card({ closingDay: 25, dueDay: 5 }), "2026-11")).toEqual({ closingDate: "2026-11-25", dueDate: "2026-12-05" });
        expect(invoiceDates(card({ closingDay: 31, dueDay: 10 }), "2026-02").closingDate).toBe("2026-02-28");
    });
});

describe("pagamento de fatura não duplica despesas", () => {
    const store = storeWith({
        accounts: [...storeWith().accounts, c],
        transactions: [
            tx({ type: "income", amountCents: 500000, date: "2026-11-01", description: "Salário" }),
            tx({ accountId: "card-1", amountCents: 30000, date: "2026-11-02", description: "Restaurante" }),
            tx({ accountId: "card-1", amountCents: 20000, date: "2026-11-03", description: "Farmácia" }),
            tx({ type: "transfer", accountId: DEFAULT_ACCOUNT_ID, toAccountId: "card-1", amountCents: 50000, date: "2026-11-15", description: "Pagamento fatura", invoiceRef: { cardId: "card-1", month: "2026-11" } }),
        ],
    });

    it("despesas do mês contam as compras uma única vez", () => {
        expect(monthSummary(store, "2026-11").expenseCents).toBe(50000);
    });
    it("fatura fica paga e limite é liberado", () => {
        const [inv] = cardInvoices(store, c, "2026-11-16");
        expect(inv.totalCents).toBe(50000);
        expect(inv.status).toBe("paid");
        const s = cardSummary(store, c, "2026-11-16");
        expect(s.usedCents).toBe(0);
        expect(s.availableCents).toBe(500000);
    });
    it("pagamento sem referência abate a fatura mais antiga", () => {
        const s2 = { ...store, transactions: store.transactions.map((t) => (t.type === "transfer" ? { ...t, invoiceRef: undefined, amountCents: 30000 } : t)) };
        const [inv] = cardInvoices(s2, c, "2026-11-16");
        expect(inv.remainingCents).toBe(20000);
        expect(inv.status).toBe("overdue");
    });
});

describe("parcelas no cartão", () => {
    it("parcelas ocupam o limite e caem em faturas sucessivas", () => {
        const parcels = buildInstallments(
            { type: "expense", amountCents: 120000, description: "Notebook", date: "2026-11-03", accountId: "card-1", categoryId: null, status: "paid" },
            12,
            { today: "2026-11-16", isCardAccount: true }
        );
        const store = storeWith({ accounts: [...storeWith().accounts, c], transactions: parcels });
        const invoices = cardInvoices(store, c, "2026-11-16");
        expect(invoices).toHaveLength(12);
        expect(invoices.every((i) => i.totalCents === 10000)).toBe(true);
        expect(cardSummary(store, c, "2026-11-16").usedCents).toBe(120000);
        // Competência: cada parcela é despesa no mês de sua data.
        expect(monthSummary(store, "2026-11").expenseCents).toBe(10000);
    });
});

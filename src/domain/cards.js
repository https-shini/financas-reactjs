// Cartões de crédito são contas do tipo "credit".
// - Compra no cartão = despesa (type "expense") com accountId = cartão. Conta como despesa na data da compra.
// - Estorno = receita (type "income") no cartão; abate a fatura.
// - Pagamento de fatura = transferência (type "transfer") da conta pagadora para o cartão.
//   Transferências nunca contam como receita/despesa, então a fatura paga não duplica gastos.
import { addMonthsToKey, dateInMonth, monthKeyOf } from "./dates";

export const isCard = (account) => account?.type === "credit";

/** Mês da fatura em que uma compra cai. Compras após o dia de fechamento vão para a fatura seguinte. */
export function invoiceMonthOf(dateISO, closingDay) {
    const key = monthKeyOf(dateISO);
    const closing = dateInMonth(key, closingDay);
    return dateISO <= closing ? key : addMonthsToKey(key, 1);
}

/** Datas de fechamento e vencimento de uma fatura (identificada pelo mês de fechamento). */
export function invoiceDates(card, month) {
    const closingDate = dateInMonth(month, card.closingDay);
    const dueMonth = card.dueDay > card.closingDay ? month : addMonthsToKey(month, 1);
    const dueDate = dateInMonth(dueMonth, card.dueDay);
    return { closingDate, dueDate };
}

/**
 * Faturas de um cartão, em ordem cronológica.
 * paidCents: pagamentos efetivados; scheduledCents: pagamentos agendados (pendentes).
 */
export function cardInvoices(store, card, today) {
    const byMonth = new Map();
    const ensure = (month) => {
        if (!byMonth.has(month)) {
            const { closingDate, dueDate } = invoiceDates(card, month);
            byMonth.set(month, {
                cardId: card.id,
                month,
                closingDate,
                dueDate,
                chargesCents: 0,
                creditsCents: 0,
                paidCents: 0,
                scheduledCents: 0,
                transactions: [],
            });
        }
        return byMonth.get(month);
    };

    const payments = [];
    for (const tx of store.transactions) {
        if (tx.accountId === card.id && (tx.type === "expense" || tx.type === "income")) {
            const inv = ensure(invoiceMonthOf(tx.date, card.closingDay));
            if (tx.type === "expense") inv.chargesCents += tx.amountCents;
            else inv.creditsCents += tx.amountCents;
            inv.transactions.push(tx);
        } else if (tx.type === "transfer" && tx.toAccountId === card.id) {
            payments.push(tx);
        }
    }

    // Pagamentos com referência explícita vão para a fatura indicada; os demais, para a fatura em aberto mais antiga.
    payments.sort((a, b) => a.date.localeCompare(b.date));
    const unref = [];
    for (const p of payments) {
        if (p.invoiceRef?.month) {
            const inv = ensure(p.invoiceRef.month);
            if (p.status === "paid") inv.paidCents += p.amountCents;
            else inv.scheduledCents += p.amountCents;
        } else unref.push(p);
    }
    const ordered = () => [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
    for (const p of unref) {
        let left = p.amountCents;
        for (const inv of ordered()) {
            const remaining = inv.chargesCents - inv.creditsCents - inv.paidCents - inv.scheduledCents;
            if (remaining <= 0) continue;
            const use = Math.min(remaining, left);
            if (p.status === "paid") inv.paidCents += use;
            else inv.scheduledCents += use;
            left -= use;
            if (left <= 0) break;
        }
        if (left > 0) {
            // Pagamento acima do devido vira crédito na próxima fatura.
            const next = ensure(invoiceMonthOf(p.date, card.closingDay));
            if (p.status === "paid") next.paidCents += left;
            else next.scheduledCents += left;
        }
    }

    return ordered().map((inv) => {
        const totalCents = inv.chargesCents - inv.creditsCents;
        const remainingCents = Math.max(0, totalCents - inv.paidCents);
        let status;
        if (totalCents <= 0 && inv.paidCents === 0) status = today > inv.closingDate ? "closed" : "open";
        else if (remainingCents === 0) status = "paid";
        else if (today > inv.dueDate) status = "overdue";
        else if (today > inv.closingDate) status = "closed";
        else status = "open";
        return { ...inv, totalCents, remainingCents, status };
    });
}

export const INVOICE_STATUS_LABEL = {
    open: "Aberta",
    closed: "Fechada",
    paid: "Paga",
    overdue: "Vencida",
};

/** Resumo do cartão: limite usado inclui parcelas futuras (compromisso), menos pagamentos efetivados. */
export function cardSummary(store, card, today) {
    const invoices = cardInvoices(store, card, today);
    let charges = 0;
    let credits = 0;
    let paid = 0;
    for (const inv of invoices) {
        charges += inv.chargesCents;
        credits += inv.creditsCents;
        paid += inv.paidCents;
    }
    const usedCents = Math.max(0, charges - credits - paid);
    const limitCents = card.limitCents ?? 0;
    const currentMonth = invoiceMonthOf(today, card.closingDay);
    const current = invoices.find((i) => i.month === currentMonth) ?? {
        ...invoiceDates(card, currentMonth),
        month: currentMonth,
        totalCents: 0,
        remainingCents: 0,
        paidCents: 0,
        status: "open",
        transactions: [],
    };
    const openToPay = invoices.filter((i) => i.remainingCents > 0 && today > i.closingDate);
    return {
        card,
        invoices,
        usedCents,
        limitCents,
        availableCents: limitCents - usedCents,
        currentInvoice: current,
        payableInvoices: openToPay,
    };
}

// Projeção do dinheiro em contas (exceto cartões) considerando:
// saldo realizado + lançamentos pendentes/futuros + recorrências ainda não geradas + faturas de cartão a vencer.
import { addDaysISO, diffDays, monthEnd, monthKeyOf } from "./dates";
import { effectOnAccount, isRealized } from "./transactions";
import { consolidatedBalance } from "./selectors";
import { cardInvoices, invoiceDates, invoiceMonthOf, isCard } from "./cards";
import { virtualOccurrences } from "./recurrence";
import { goalsReserveThisMonth } from "./goals";

export function projectCashBalance(store, today, days) {
    const end = addDaysISO(today, days);
    const accounts = new Map(store.accounts.map((a) => [a.id, a]));
    const cashIds = store.accounts.filter((a) => !isCard(a)).map((a) => a.id);
    const startCents = consolidatedBalance(store, today).cashCents;
    const events = [];
    const push = (date, cents, label, kind) => {
        if (!cents) return;
        events.push({ date: date < today ? today : date, cents, label, kind, overdue: date < today });
    };

    for (const tx of store.transactions) {
        if (isRealized(tx, today) || tx.date > end) continue;
        let effect = 0;
        for (const id of cashIds) effect += effectOnAccount(tx, id);
        push(tx.date, effect, tx.description, tx.status === "pending" ? "pending" : "scheduled");
    }

    const extraCardCharges = new Map(); // cardId|month -> cents (recorrências futuras no cartão)
    for (const occ of virtualOccurrences(store, addDaysISO(today, 1), end)) {
        const acc = accounts.get(occ.accountId);
        if (!acc) continue;
        if (isCard(acc)) {
            if (occ.type !== "expense") continue;
            const key = `${acc.id}|${invoiceMonthOf(occ.date, acc.closingDay)}`;
            extraCardCharges.set(key, (extraCardCharges.get(key) ?? 0) + occ.amountCents);
            continue;
        }
        push(occ.date, occ.type === "income" ? occ.amountCents : -occ.amountCents, occ.description, "recurrence");
    }

    for (const card of store.accounts.filter((a) => isCard(a) && !a.archived)) {
        const seen = new Set();
        for (const inv of cardInvoices(store, card, today)) {
            seen.add(inv.month);
            const extra = extraCardCharges.get(`${card.id}|${inv.month}`) ?? 0;
            const due = inv.remainingCents + extra - inv.scheduledCents;
            if (due > 0 && inv.dueDate <= end) push(inv.dueDate, -due, `Fatura ${card.name}`, "invoice");
        }
        for (const [key, cents] of extraCardCharges) {
            const [cardId, month] = key.split("|");
            if (cardId !== card.id || seen.has(month)) continue;
            const { dueDate } = invoiceDates(card, month);
            if (dueDate <= end) push(dueDate, -cents, `Fatura ${card.name}`, "invoice");
        }
    }

    events.sort((a, b) => a.date.localeCompare(b.date));
    const series = [];
    let balance = startCents;
    let k = 0;
    let min = startCents;
    let minDate = today;
    let firstNegativeDate = startCents < 0 ? today : null;
    for (let i = 0; i <= days; i += 1) {
        const date = addDaysISO(today, i);
        while (k < events.length && events[k].date === date) {
            balance += events[k].cents;
            k += 1;
        }
        if (balance < min) {
            min = balance;
            minDate = date;
        }
        if (balance < 0 && !firstNegativeDate) firstNegativeDate = date;
        series.push({ date, balanceCents: balance });
    }
    return {
        startCents,
        endBalanceCents: balance,
        minBalanceCents: min,
        minDate,
        firstNegativeDate,
        series,
        events,
        inflowCents: events.filter((e) => e.cents > 0).reduce((s, e) => s + e.cents, 0),
        outflowCents: events.filter((e) => e.cents < 0).reduce((s, e) => s - e.cents, 0),
    };
}

/** Saldo previsto ao fim do mês corrente. */
export function forecastEndOfMonth(store, today) {
    const end = monthEnd(monthKeyOf(today));
    return { ...projectCashBalance(store, today, diffDays(end, today)), endDate: end };
}

/**
 * "Quanto posso gastar hoje": (saldo previsto no fim do mês − reserva para metas do mês) ÷ dias restantes.
 * É uma referência: considera apenas o que já está lançado, agendado ou recorrente.
 */
export function spendableToday(store, today) {
    const forecast = forecastEndOfMonth(store, today);
    const reserveCents = goalsReserveThisMonth(store, today);
    const daysLeft = diffDays(forecast.endDate, today) + 1;
    const available = forecast.endBalanceCents - reserveCents;
    return {
        forecastCents: forecast.endBalanceCents,
        reserveCents,
        daysLeft,
        availableCents: available,
        dailyCents: available > 0 ? Math.floor(available / daysLeft) : 0,
        shortfall: available < 0,
    };
}

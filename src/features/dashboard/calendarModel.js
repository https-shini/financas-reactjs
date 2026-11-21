import { addDaysISO, diffDays, fromISODate, monthEnd, monthStart } from "../../domain/dates";
import { upcomingItems } from "../../domain/selectors";

/**
 * Modelo do calendário da Visão geral (somente leitura; nenhuma regra financeira nova).
 * Para cada dia exibido (semanas de segunda a domingo cobrindo o mês):
 *  - incomeCents / expenseCents: receitas e despesas do dia (competência, inclui pendentes; transferências não entram,
 *    igual ao resumo mensal);
 *  - pendingCount / overdueCount: lançamentos pendentes (atrasados = pendentes com data anterior a hoje);
 *  - invoices: faturas de cartão com vencimento no dia (via upcomingItems);
 *  - transactions: lançamentos do dia (para o painel de detalhes).
 */
export function buildCalendar(store, month, today) {
    const first = monthStart(month);
    const last = monthEnd(month);
    // Segunda-feira = início da semana (getDay: 0 = domingo).
    const lead = (fromISODate(first).getDay() + 6) % 7;
    const gridStart = addDaysISO(first, -lead);
    const trail = (7 - ((fromISODate(last).getDay() + 6) % 7) - 1) % 7;
    const gridEnd = addDaysISO(last, trail);

    const days = new Map();
    for (let d = gridStart; d <= gridEnd; d = addDaysISO(d, 1)) {
        days.set(d, { date: d, inMonth: d >= first && d <= last, isToday: d === today, incomeCents: 0, expenseCents: 0, pendingCount: 0, overdueCount: 0, invoices: [], transactions: [] });
    }

    for (const tx of store.transactions) {
        const day = days.get(tx.date);
        if (!day) continue;
        day.transactions.push(tx);
        if (tx.type === "income") day.incomeCents += tx.amountCents;
        else if (tx.type === "expense") day.expenseCents += tx.amountCents;
        if (tx.status === "pending") {
            day.pendingCount += 1;
            if (tx.date < today) day.overdueCount += 1;
        }
    }

    // Faturas de cartão com vencimento dentro da grade (upcomingItems inclui as atrasadas).
    const horizon = Math.max(0, diffDays(gridEnd, today));
    for (const it of upcomingItems(store, today, horizon)) {
        if (it.kind !== "invoice") continue;
        const day = days.get(it.date);
        if (day) day.invoices.push(it);
    }

    const list = [...days.values()];
    const weeks = [];
    for (let i = 0; i < list.length; i += 7) weeks.push(list.slice(i, i + 7));
    return { weeks, days };
}

/** Data padrão selecionada ao abrir um mês: hoje (se estiver no mês) ou o dia 1. */
export function defaultSelectedDate(month, today) {
    return today.slice(0, 7) === month ? today : monthStart(month);
}

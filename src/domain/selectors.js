// Cálculos financeiros compartilhados por dashboard, movimentações e relatórios.
// Regras: receitas somam, despesas subtraem, transferências não alteram o total consolidado,
// pendentes e lançamentos futuros não entram no saldo realizado.
import { addDaysISO, diffDays, lastMonths, monthEnd, monthStart, addMonthsToKey } from "./dates";
import { effectOnAccount, isRealized, normalizeForMatch, signedAmount } from "./transactions";
import { cardInvoices, isCard } from "./cards";
import { percentOf, variation } from "./money";

export const UNCATEGORIZED = { id: null, name: "Sem categoria", icon: "Tag", color: "#94a3b8", kind: "both" };

export function indexById(list) {
    const m = new Map();
    for (const item of list) m.set(item.id, item);
    return m;
}

export const activeAccounts = (store) => store.accounts.filter((a) => !a.archived);
export const cashAccounts = (store) => store.accounts.filter((a) => !isCard(a));
export const cardAccounts = (store) => store.accounts.filter((a) => isCard(a));

/** Saldo realizado de uma conta até `today` (inclusive). */
export function accountBalance(store, accountId, today) {
    const acc = store.accounts.find((a) => a.id === accountId);
    let total = acc?.initialBalanceCents ?? 0;
    for (const tx of store.transactions) {
        if (isRealized(tx, today)) total += effectOnAccount(tx, accountId);
    }
    return total;
}

/** Saldo considerando todos os lançamentos (pagos e pendentes) até `untilDate`. */
export function accountProjected(store, accountId, untilDate) {
    const acc = store.accounts.find((a) => a.id === accountId);
    let total = acc?.initialBalanceCents ?? 0;
    for (const tx of store.transactions) {
        if (tx.date <= untilDate) total += effectOnAccount(tx, accountId);
    }
    return total;
}

export function balancesByAccount(store, today) {
    return store.accounts.map((account) => {
        let pendingIn = 0;
        let pendingOut = 0;
        for (const tx of store.transactions) {
            if (isRealized(tx, today)) continue;
            const e = effectOnAccount(tx, account.id);
            if (e > 0) pendingIn += e;
            else pendingOut -= e;
        }
        return {
            account,
            balanceCents: accountBalance(store, account.id, today),
            pendingInCents: pendingIn,
            pendingOutCents: pendingOut,
        };
    });
}

/**
 * Saldo consolidado: dinheiro em contas (exceto cartões), dívida de cartões e patrimônio líquido.
 * Transferências entre contas se anulam no consolidado.
 */
export function consolidatedBalance(store, today) {
    let cash = 0;
    let cardBalance = 0;
    for (const { account, balanceCents } of balancesByAccount(store, today)) {
        if (isCard(account)) cardBalance += balanceCents;
        else cash += balanceCents;
    }
    return { cashCents: cash, cardDebtCents: Math.max(0, -cardBalance), netWorthCents: cash + cardBalance };
}

/** Resumo de um período por competência (data do lançamento). Transferências não entram. */
export function periodSummary(store, start, end) {
    let income = 0;
    let expense = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;
    let count = 0;
    for (const tx of store.transactions) {
        if (tx.date < start || tx.date > end || tx.type === "transfer") continue;
        count += 1;
        if (tx.type === "income") {
            income += tx.amountCents;
            if (tx.status === "pending") pendingIncome += tx.amountCents;
        } else {
            expense += tx.amountCents;
            if (tx.status === "pending") pendingExpense += tx.amountCents;
        }
    }
    return {
        incomeCents: income,
        expenseCents: expense,
        resultCents: income - expense,
        pendingIncomeCents: pendingIncome,
        pendingExpenseCents: pendingExpense,
        count,
    };
}

export function monthSummary(store, month) {
    return { month, ...periodSummary(store, monthStart(month), monthEnd(month)) };
}

export function monthComparison(store, month) {
    const current = monthSummary(store, month);
    const previous = monthSummary(store, addMonthsToKey(month, -1));
    return {
        current,
        previous,
        incomeVariation: variation(current.incomeCents, previous.incomeCents),
        expenseVariation: variation(current.expenseCents, previous.expenseCents),
        resultVariation: variation(current.resultCents, previous.resultCents),
    };
}

/** Totais por categoria em um período, ordenados do maior para o menor. */
export function categoryBreakdown(store, start, end, type = "expense") {
    const cats = indexById(store.categories);
    const totals = new Map();
    let grand = 0;
    for (const tx of store.transactions) {
        if (tx.type !== type || tx.date < start || tx.date > end) continue;
        const key = tx.categoryId && cats.has(tx.categoryId) ? tx.categoryId : null;
        const cur = totals.get(key) ?? { totalCents: 0, count: 0 };
        cur.totalCents += tx.amountCents;
        cur.count += 1;
        totals.set(key, cur);
        grand += tx.amountCents;
    }
    return [...totals.entries()]
        .map(([id, v]) => ({
            category: id ? cats.get(id) : UNCATEGORIZED,
            totalCents: v.totalCents,
            count: v.count,
            pct: percentOf(v.totalCents, grand),
        }))
        .sort((a, b) => b.totalCents - a.totalCents);
}

/** Série mensal de receitas, despesas e resultado. */
export function monthlySeries(store, endMonth, count) {
    const months = lastMonths(endMonth, count);
    const idx = new Map(months.map((m) => [m, { month: m, incomeCents: 0, expenseCents: 0 }]));
    const first = monthStart(months[0]);
    const last = monthEnd(months[months.length - 1]);
    for (const tx of store.transactions) {
        if (tx.type === "transfer" || tx.date < first || tx.date > last) continue;
        const row = idx.get(tx.date.slice(0, 7));
        if (!row) continue;
        if (tx.type === "income") row.incomeCents += tx.amountCents;
        else row.expenseCents += tx.amountCents;
    }
    return months.map((m) => {
        const r = idx.get(m);
        return { ...r, resultCents: r.incomeCents - r.expenseCents };
    });
}

/** Evolução do patrimônio (saldo realizado de todas as contas ao fim de cada mês). */
export function netWorthSeries(store, endMonth, count, today) {
    const months = lastMonths(endMonth, count);
    const initial = store.accounts.reduce((s, a) => s + (a.initialBalanceCents ?? 0), 0);
    const sorted = [...store.transactions].filter((t) => t.status === "paid").sort((a, b) => a.date.localeCompare(b.date));
    const out = [];
    let i = 0;
    let running = initial;
    for (const m of months) {
        const cutoff = monthEnd(m) < today ? monthEnd(m) : today;
        while (i < sorted.length && sorted[i].date <= cutoff) {
            running += signedAmount(sorted[i]); // transferências têm efeito líquido zero
            i += 1;
        }
        out.push({ month: m, balanceCents: running, partial: monthEnd(m) > today });
    }
    return out;
}

export function topExpenses(store, start, end, limit = 10) {
    return store.transactions
        .filter((t) => t.type === "expense" && t.date >= start && t.date <= end)
        .sort((a, b) => b.amountCents - a.amountCents)
        .slice(0, limit);
}

// ---------------- Filtros, ordenação e agrupamento ----------------

export const EMPTY_FILTERS = {
    q: "",
    start: "",
    end: "",
    types: [],
    categoryIds: [],
    accountIds: [],
    status: "",
};

export function filterTransactions(store, filters) {
    const f = { ...EMPTY_FILTERS, ...filters };
    const q = normalizeForMatch(f.q);
    const cats = indexById(store.categories);
    return store.transactions.filter((tx) => {
        if (f.start && tx.date < f.start) return false;
        if (f.end && tx.date > f.end) return false;
        if (f.types.length && !f.types.includes(tx.type)) return false;
        if (f.status && tx.status !== f.status) return false;
        if (f.categoryIds.length) {
            const key = tx.categoryId ?? "none";
            if (!f.categoryIds.includes(key)) return false;
        }
        if (f.accountIds.length && !f.accountIds.includes(tx.accountId) && !f.accountIds.includes(tx.toAccountId)) return false;
        if (q) {
            const hay = normalizeForMatch(`${tx.description} ${tx.notes ?? ""} ${cats.get(tx.categoryId)?.name ?? ""}`);
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}

export const SORTS = {
    "date-desc": { label: "Mais recentes", fn: (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) },
    "date-asc": { label: "Mais antigas", fn: (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) },
    "amount-desc": { label: "Maior valor", fn: (a, b) => b.amountCents - a.amountCents },
    "amount-asc": { label: "Menor valor", fn: (a, b) => a.amountCents - b.amountCents },
    description: { label: "Descrição (A–Z)", fn: (a, b) => a.description.localeCompare(b.description, "pt-BR") },
};

export function sortTransactions(list, sortKey = "date-desc") {
    const sorter = SORTS[sortKey]?.fn ?? SORTS["date-desc"].fn;
    return [...list].sort(sorter);
}

export function groupByDay(list) {
    const groups = [];
    const map = new Map();
    for (const tx of list) {
        let g = map.get(tx.date);
        if (!g) {
            g = { date: tx.date, items: [], netCents: 0 };
            map.set(tx.date, g);
            groups.push(g);
        }
        g.items.push(tx);
        g.netCents += signedAmount(tx);
    }
    return groups;
}

export function totalsOf(list) {
    let income = 0;
    let expense = 0;
    let transfers = 0;
    for (const tx of list) {
        if (tx.type === "income") income += tx.amountCents;
        else if (tx.type === "expense") expense += tx.amountCents;
        else transfers += tx.amountCents;
    }
    return { incomeCents: income, expenseCents: expense, netCents: income - expense, transferCents: transfers, count: list.length };
}

// ---------------- Vencimentos ----------------

/**
 * Contas a pagar/receber: lançamentos pendentes (inclusive atrasados) até o horizonte,
 * e faturas de cartão com saldo em aberto. Despesas no cartão não aparecem individualmente.
 */
export function upcomingItems(store, today, horizonDays = 30) {
    const limit = addDaysISO(today, horizonDays);
    const accounts = indexById(store.accounts);
    const items = [];
    for (const tx of store.transactions) {
        if (tx.status !== "pending" || tx.date > limit) continue;
        if (isCard(accounts.get(tx.accountId)) && tx.type !== "transfer") continue;
        items.push({
            kind: "transaction",
            id: tx.id,
            tx,
            date: tx.date,
            amountCents: tx.amountCents,
            direction: tx.type === "income" ? "in" : tx.type === "expense" ? "out" : "transfer",
            description: tx.description,
            overdue: tx.date < today,
            daysUntil: diffDays(tx.date, today),
        });
    }
    for (const card of cardAccounts(store)) {
        if (card.archived) continue;
        for (const inv of cardInvoices(store, card, today)) {
            const due = inv.remainingCents - inv.scheduledCents;
            if (due <= 0 || inv.dueDate > limit) continue;
            items.push({
                kind: "invoice",
                id: `${card.id}:${inv.month}`,
                card,
                invoice: inv,
                date: inv.dueDate,
                amountCents: due,
                direction: "out",
                description: `Fatura ${card.name}`,
                overdue: inv.dueDate < today,
                daysUntil: diffDays(inv.dueDate, today),
            });
        }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function categoryTotalsForMonth(store, month, categoryId) {
    const start = monthStart(month);
    const end = monthEnd(month);
    let total = 0;
    for (const tx of store.transactions) {
        if (tx.type === "expense" && tx.categoryId === categoryId && tx.date >= start && tx.date <= end) total += tx.amountCents;
    }
    return total;
}

export function categoryUsage(store) {
    const counts = new Map();
    for (const tx of store.transactions) {
        if (!tx.categoryId) continue;
        const c = counts.get(tx.categoryId) ?? { count: 0, expenseCents: 0, incomeCents: 0 };
        c.count += 1;
        if (tx.type === "expense") c.expenseCents += tx.amountCents;
        if (tx.type === "income") c.incomeCents += tx.amountCents;
        counts.set(tx.categoryId, c);
    }
    return counts;
}

/** Primeiro mês com lançamentos (para limitar históricos). */
export function firstMonthWithData(store) {
    let min = null;
    for (const tx of store.transactions) if (!min || tx.date < min) min = tx.date;
    return min ? min.slice(0, 7) : null;
}

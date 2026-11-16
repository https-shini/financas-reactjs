import { lastMonths, monthEnd, monthStart } from "./dates";
import { indexById } from "./selectors";
import { MAX_CENTS, percentOf } from "./money";
import { newId } from "./ids";

export const WARNING_PCT = 80;

export function validateBudgetInput(input, store) {
    const errors = {};
    if (!store.categories.some((c) => c.id === input.categoryId)) errors.categoryId = "Escolha uma categoria.";
    else if (store.budgets.some((b) => b.categoryId === input.categoryId && b.id !== input.id)) errors.categoryId = "Já existe um orçamento para esta categoria.";
    if (!Number.isInteger(input.limitCents) || input.limitCents <= 0 || input.limitCents > MAX_CENTS) errors.limitCents = "Informe um limite maior que zero.";
    return { ok: Object.keys(errors).length === 0, errors };
}

export function buildBudget(input, { now = new Date().toISOString(), id } = {}) {
    return {
        id: id ?? input.id ?? newId(),
        categoryId: input.categoryId,
        limitCents: input.limitCents,
        overrides: { ...(input.overrides ?? {}) },
        createdAt: input.createdAt ?? now,
        updatedAt: now,
    };
}

/** Limite vigente no mês: valor específico do mês (override) ou o limite padrão. */
export function limitFor(budget, month) {
    const o = budget.overrides?.[month];
    return Number.isInteger(o) ? o : budget.limitCents;
}

function spentByCategory(store, month) {
    const start = monthStart(month);
    const end = monthEnd(month);
    const map = new Map();
    for (const tx of store.transactions) {
        if (tx.type !== "expense" || !tx.categoryId || tx.date < start || tx.date > end) continue;
        map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amountCents);
    }
    return map;
}

/** Percentual usado. Limite zero com gasto conta como 100% (estourado), evitando divisão por zero. */
export function usagePct(spent, limit) {
    if (limit > 0) return percentOf(spent, limit);
    return spent > 0 ? 100 : 0;
}

export function levelOf(pct) {
    if (pct >= 100) return "exceeded";
    if (pct >= WARNING_PCT) return "warning";
    return "ok";
}

/** Situação de cada orçamento no mês (gastos pagos + pendentes, por competência). */
export function budgetStatus(store, month) {
    const cats = indexById(store.categories);
    const spent = spentByCategory(store, month);
    return store.budgets
        .map((budget) => {
            const limit = limitFor(budget, month);
            const s = spent.get(budget.categoryId) ?? 0;
            const pct = usagePct(s, limit);
            return {
                budget,
                category: cats.get(budget.categoryId),
                limitCents: limit,
                spentCents: s,
                remainingCents: limit - s,
                pct,
                level: levelOf(pct),
            };
        })
        .filter((r) => r.category)
        .sort((a, b) => b.pct - a.pct);
}

export function budgetTotals(rows) {
    const limit = rows.reduce((s, r) => s + r.limitCents, 0);
    const spent = rows.reduce((s, r) => s + r.spentCents, 0);
    return { limitCents: limit, spentCents: spent, remainingCents: limit - spent, pct: usagePct(spent, limit) };
}

/** Histórico mensal de um orçamento. */
export function budgetHistory(store, budget, endMonth, count = 6) {
    return lastMonths(endMonth, count).map((month) => {
        const spent = spentByCategory(store, month).get(budget.categoryId) ?? 0;
        const limit = limitFor(budget, month);
        const pct = usagePct(spent, limit);
        return { month, limitCents: limit, spentCents: spent, pct, level: levelOf(pct) };
    });
}

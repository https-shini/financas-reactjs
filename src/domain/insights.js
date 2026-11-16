// Insights por regras explícitas. Cada regra só gera mensagem quando há dados suficientes.
import { addMonthsToKey, monthKeyOf } from "./dates";
import { categoryBreakdown, indexById, monthSummary } from "./selectors";
import { budgetStatus } from "./budgets";
import { monthlyEquivalent } from "./recurrence";
import { formatMoney, percentOf } from "./money";
import { monthEnd, monthStart } from "./dates";

export const MIN_HISTORY_MONTHS = 3;

/** Meses anteriores a `month` que têm ao menos um lançamento. */
export function monthsWithData(store, month, lookback = 12) {
    const set = new Set(store.transactions.map((t) => monthKeyOf(t.date)));
    const out = [];
    for (let i = 1; i <= lookback; i += 1) {
        const m = addMonthsToKey(month, -i);
        if (set.has(m)) out.push(m);
    }
    return out;
}

function categorySpend(store, month) {
    const map = new Map();
    for (const row of categoryBreakdown(store, monthStart(month), monthEnd(month), "expense")) {
        map.set(row.category.id ?? "none", row.totalCents);
    }
    return map;
}

export function averageMonthlyIncome(store, month, months = 3) {
    const prev = monthsWithData(store, month).slice(0, months);
    if (prev.length < months) return null;
    return Math.round(prev.reduce((s, m) => s + monthSummary(store, m).incomeCents, 0) / prev.length);
}

export function fixedExpensesMonthly(store) {
    return store.recurrences.filter((r) => r.active && r.type === "expense").reduce((s, r) => s + monthlyEquivalent(r), 0);
}

/**
 * Gera insights para o mês. today define se o mês está completo.
 * Retorna [{ id, tone: "info"|"warning"|"good", title, detail }]
 */
export function generateInsights(store, month, today, { locale = "pt-BR", currency = "BRL" } = {}) {
    const fmt = (c) => formatMoney(c, { locale, currency });
    const out = [];
    const cats = indexById(store.categories);
    const current = monthSummary(store, month);
    const complete = monthEnd(month) < today;
    const history = monthsWithData(store, month).slice(0, MIN_HISTORY_MONTHS);
    const enoughHistory = history.length >= MIN_HISTORY_MONTHS;

    // 1. Resultado negativo no mês
    if (current.incomeCents > 0 && current.expenseCents > current.incomeCents) {
        out.push({
            id: "negative-result",
            tone: "warning",
            title: "Despesas acima das receitas",
            detail: `As despesas de ${fmt(current.expenseCents)} superam as receitas em ${fmt(current.expenseCents - current.incomeCents)} neste mês.`,
        });
    }

    // 2. Variação por categoria vs. média dos últimos 3 meses com dados
    if (enoughHistory) {
        const now = categorySpend(store, month);
        const prevMaps = history.map((m) => categorySpend(store, m));
        const candidates = [];
        const keys = new Set([...now.keys(), ...prevMaps.flatMap((m) => [...m.keys()])]);
        for (const key of keys) {
            const avg = prevMaps.reduce((s, m) => s + (m.get(key) ?? 0), 0) / prevMaps.length;
            const cur = now.get(key) ?? 0;
            if (avg < 5000) continue; // ignora categorias com média abaixo de R$ 50
            const diff = cur - avg;
            const pct = percentOf(diff, avg);
            const name = key === "none" ? "Sem categoria" : cats.get(key)?.name ?? "Categoria";
            if (pct >= 20 && diff >= 5000) candidates.push({ key, name, pct, cur, avg, up: true });
            else if (complete && pct <= -20 && -diff >= 5000) candidates.push({ key, name, pct, cur, avg, up: false });
        }
        candidates.sort((a, b) => Math.abs(b.cur - b.avg) - Math.abs(a.cur - a.avg));
        for (const c of candidates.slice(0, 2)) {
            out.push({
                id: `category-${c.up ? "up" : "down"}-${c.key}`,
                tone: c.up ? "warning" : "good",
                title: c.up ? `Gastos com ${c.name} aumentaram` : `Gastos com ${c.name} diminuíram`,
                detail: `${fmt(c.cur)} neste mês, ${Math.abs(Math.round(c.pct))}% ${c.up ? "acima" : "abaixo"} da média de ${fmt(Math.round(c.avg))} dos últimos ${MIN_HISTORY_MONTHS} meses com lançamentos.`,
            });
        }
    }

    // 3. Assinaturas recorrentes
    const subs = store.recurrences.filter((r) => r.active && r.type === "expense" && r.categoryId === "cat-assinaturas");
    if (subs.length) {
        const total = subs.reduce((s, r) => s + monthlyEquivalent(r), 0);
        out.push({
            id: "subscriptions",
            tone: "info",
            title: "Assinaturas",
            detail: `${subs.length} assinatura(s) recorrente(s) somam ${fmt(total)} por mês.`,
        });
    }

    // 4. Orçamentos no limite
    const budgets = budgetStatus(store, month).filter((b) => b.level !== "ok");
    for (const b of budgets.slice(0, 2)) {
        out.push({
            id: `budget-${b.budget.id}`,
            tone: "warning",
            title: b.level === "exceeded" ? `Orçamento de ${b.category.name} estourado` : `Orçamento de ${b.category.name} perto do limite`,
            detail: `${Math.round(b.pct)}% utilizado: ${fmt(b.spentCents)} de ${fmt(b.limitCents)}.`,
        });
    }

    // 5. Peso das despesas fixas na renda
    const fixed = fixedExpensesMonthly(store);
    const avgIncome = averageMonthlyIncome(store, month);
    if (fixed > 0 && avgIncome) {
        const share = percentOf(fixed, avgIncome);
        out.push({
            id: "fixed-share",
            tone: share > 50 ? "warning" : "info",
            title: "Despesas fixas",
            detail: `Despesas recorrentes (${fmt(fixed)}/mês) comprometem ${Math.round(share)}% da renda média dos últimos ${MIN_HISTORY_MONTHS} meses.`,
        });
    }

    // 6. Maior categoria do mês
    const top = categoryBreakdown(store, monthStart(month), monthEnd(month), "expense")[0];
    if (top && current.expenseCents > 0 && top.pct >= 30) {
        out.push({
            id: "top-category",
            tone: "info",
            title: `${top.category.name} lidera os gastos`,
            detail: `${Math.round(top.pct)}% das despesas do mês (${fmt(top.totalCents)}).`,
        });
    }

    return out;
}

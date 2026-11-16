// Inteligência financeira por regras transparentes: detector de assinaturas, saúde financeira e simulador.
import { addDaysISO, addMonthsISO, addWeeksISO, addYearsISO, addMonthsToKey, diffDays, monthKeyOf, monthEnd, monthStart } from "./dates";
import { categoryBreakdown, consolidatedBalance, monthSummary } from "./selectors";
import { budgetStatus } from "./budgets";
import { monthsWithData, fixedExpensesMonthly } from "./insights";
import { normalizeForMatch } from "./transactions";
import { percentOf } from "./money";

// ---------------- Detector de assinaturas ----------------

const PATTERNS = [
    { frequency: "weekly", min: 6, max: 8, step: addWeeksISO },
    { frequency: "monthly", min: 26, max: 35, step: addMonthsISO },
    { frequency: "yearly", min: 350, max: 380, step: addYearsISO },
];

export const suggestionKey = (description) => `sub:${normalizeForMatch(description).replace(/\d+/g, "").trim()}`;

/**
 * Procura despesas que se repetem com intervalo regular e valor parecido e ainda não são recorrências.
 * Exige pelo menos 3 ocorrências (2 para anuais) para evitar sugestões frágeis.
 */
export function detectSubscriptions(store, today) {
    const dismissed = new Set(store.settings.dismissedSuggestions ?? []);
    const existing = new Set(store.recurrences.filter((r) => r.active).map((r) => suggestionKey(r.description)));
    const groups = new Map();
    for (const tx of store.transactions) {
        if (tx.type !== "expense" || tx.recurrenceId || tx.installment || tx.date > today || diffDays(today, tx.date) > 800) continue;
        const key = suggestionKey(tx.description);
        if (key.length < 6) continue;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(tx);
    }
    const out = [];
    for (const [key, list] of groups) {
        if (dismissed.has(key) || existing.has(key)) continue;
        list.sort((a, b) => a.date.localeCompare(b.date));
        const intervals = list.slice(1).map((t, i) => diffDays(t.date, list[i].date));
        const pattern = PATTERNS.find((p) => intervals.length > 0 && intervals.every((d) => d >= p.min && d <= p.max));
        if (!pattern) continue;
        if (list.length < (pattern.frequency === "yearly" ? 2 : 3)) continue;
        const amounts = list.map((t) => t.amountCents);
        if (Math.max(...amounts) > Math.min(...amounts) * 1.15) continue;
        const last = list[list.length - 1];
        const next = pattern.step(last.date, 1);
        if (diffDays(today, next) > pattern.max) continue; // parou de acontecer
        const catCount = new Map();
        for (const t of list) if (t.categoryId) catCount.set(t.categoryId, (catCount.get(t.categoryId) ?? 0) + 1);
        const categoryId = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        out.push({
            key,
            description: last.description,
            frequency: pattern.frequency,
            amountCents: last.amountCents,
            categoryId,
            accountId: last.accountId,
            lastDate: last.date,
            nextDate: next < today ? addDaysISO(today, 0) : next,
            count: list.length,
            txIds: list.map((t) => t.id),
        });
    }
    return out.sort((a, b) => b.amountCents - a.amountCents);
}

// ---------------- Saúde financeira ----------------

const lerp = (v, lo, hi) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

export const HEALTH_LEVELS = [
    { min: 80, label: "Excelente", tone: "income" },
    { min: 60, label: "Boa", tone: "income" },
    { min: 40, label: "Atenção", tone: "warning" },
    { min: 0, label: "Crítica", tone: "expense" },
];

/**
 * Indicador 0–100 com critérios transparentes (25 pontos cada). Critérios sem dados não são avaliados
 * e a nota é proporcional aos avaliados. Usa os últimos 3 meses completos com lançamentos.
 */
export function healthScore(store, today) {
    const current = monthKeyOf(today);
    const months = monthsWithData(store, current).slice(0, 3);
    if (!months.length) return { score: null, months, criteria: [], reason: "Registre ao menos um mês completo de lançamentos para calcular o indicador." };

    const sums = months.map((m) => monthSummary(store, m));
    const income = sums.reduce((s, m) => s + m.incomeCents, 0) / months.length;
    const expense = sums.reduce((s, m) => s + m.expenseCents, 0) / months.length;
    const criteria = [];

    // 1. Taxa de poupança: 20% ou mais = nota máxima.
    if (income > 0) {
        const rate = percentOf(income - expense, income);
        criteria.push({ key: "savings", label: "Taxa de poupança", value: `${Math.round(rate)}% da renda`, points: 25 * lerp(rate, 0, 20), max: 25, evaluated: true, explanation: "Quanto da renda sobra após as despesas. 20% ou mais = 25 pontos; 0% ou negativo = 0." });
    } else criteria.push({ key: "savings", label: "Taxa de poupança", value: "sem receitas no período", points: 0, max: 25, evaluated: false, explanation: "Necessário ter receitas registradas." });

    // 2. Respeito aos orçamentos
    if (store.budgets.length) {
        let ok = 0;
        let total = 0;
        for (const m of months) {
            for (const b of budgetStatus(store, m)) {
                total += 1;
                if (b.level !== "exceeded") ok += 1;
            }
        }
        const ratio = total ? ok / total : 0;
        criteria.push({ key: "budgets", label: "Respeito aos orçamentos", value: `${ok} de ${total} dentro do limite`, points: 25 * ratio, max: 25, evaluated: total > 0, explanation: "Proporção de orçamentos mensais que não estouraram nos últimos meses." });
    } else criteria.push({ key: "budgets", label: "Respeito aos orçamentos", value: "nenhum orçamento definido", points: 0, max: 25, evaluated: false, explanation: "Crie orçamentos por categoria para avaliar este critério." });

    // 3. Reserva financeira: meses de despesas cobertos pelo dinheiro em contas.
    const cash = consolidatedBalance(store, today).cashCents;
    if (expense > 0) {
        const monthsCovered = cash / expense;
        criteria.push({ key: "reserve", label: "Reserva financeira", value: `${Math.max(0, monthsCovered).toFixed(1).replace(".", ",")} mês(es) de despesas`, points: 25 * lerp(monthsCovered, 0, 6), max: 25, evaluated: true, explanation: "Saldo em contas dividido pela despesa média mensal. 6 meses ou mais = 25 pontos." });
    } else criteria.push({ key: "reserve", label: "Reserva financeira", value: "sem despesas no período", points: 0, max: 25, evaluated: false, explanation: "Necessário ter despesas registradas." });

    // 4. Peso das despesas fixas (recorrências) na renda.
    const fixed = fixedExpensesMonthly(store);
    if (income > 0 && store.recurrences.some((r) => r.active && r.type === "expense")) {
        const share = percentOf(fixed, income);
        criteria.push({ key: "fixed", label: "Peso das despesas fixas", value: `${Math.round(share)}% da renda`, points: 25 * (1 - lerp(share, 30, 70)), max: 25, evaluated: true, explanation: "Despesas recorrentes em relação à renda média. Até 30% = 25 pontos; 70% ou mais = 0." });
    } else criteria.push({ key: "fixed", label: "Peso das despesas fixas", value: "sem recorrências cadastradas", points: 0, max: 25, evaluated: false, explanation: "Cadastre despesas recorrentes (aluguel, assinaturas) para avaliar." });

    const evaluated = criteria.filter((c) => c.evaluated);
    if (!evaluated.length) return { score: null, months, criteria, reason: "Dados insuficientes para avaliar os critérios." };
    const score = Math.round((evaluated.reduce((s, c) => s + c.points, 0) / evaluated.reduce((s, c) => s + c.max, 0)) * 100);
    const level = HEALTH_LEVELS.find((l) => score >= l.min);
    return { score, level, months, criteria: criteria.map((c) => ({ ...c, points: Math.round(c.points * 10) / 10 })), averageIncomeCents: Math.round(income), averageExpenseCents: Math.round(expense) };
}

// ---------------- Simulador ----------------

/**
 * Base do simulador: médias dos últimos 3 meses com lançamentos (despesas por categoria).
 */
export function simulatorBaseline(store, today) {
    const months = monthsWithData(store, monthKeyOf(today)).slice(0, 3);
    if (!months.length) return null;
    const income = months.reduce((s, m) => s + monthSummary(store, m).incomeCents, 0) / months.length;
    const byCat = new Map();
    for (const m of months) {
        for (const r of categoryBreakdown(store, monthStart(m), monthEnd(m), "expense")) {
            const k = r.category.id ?? "none";
            const cur = byCat.get(k) ?? { category: r.category, totalCents: 0 };
            cur.totalCents += r.totalCents;
            byCat.set(k, cur);
        }
    }
    const categories = [...byCat.entries()].map(([id, v]) => ({ id, category: v.category, monthlyCents: Math.round(v.totalCents / months.length) })).sort((a, b) => b.monthlyCents - a.monthlyCents);
    const futureInstallments = store.transactions
        .filter((t) => t.installment && t.type === "expense" && t.date > today && !(t.status === "paid" && t.date <= today))
        .map((t) => ({ month: monthKeyOf(t.date), cents: t.amountCents }));
    return {
        months,
        startCents: consolidatedBalance(store, today).cashCents,
        incomeCents: Math.round(income),
        expenseCents: categories.reduce((s, c) => s + c.monthlyCents, 0),
        categories,
        futureInstallments,
    };
}

/**
 * Projeta 12 meses comparando cenário base e simulado. Não altera dados reais.
 * scenario: { cuts: {catId: pct}, budgets: {catId: capCents}, extraIncomeCents, contributionCents, anticipateInstallments }
 */
export function simulate(baseline, scenario, today, horizon = 12) {
    const startMonth = monthKeyOf(today);
    const cuts = scenario.cuts ?? {};
    const caps = scenario.budgets ?? {};
    const scenarioExpense = baseline.categories.reduce((s, c) => {
        let v = c.monthlyCents * (1 - Math.min(100, Math.max(0, cuts[c.id] ?? 0)) / 100);
        if (Number.isInteger(caps[c.id])) v = Math.min(v, caps[c.id]);
        return s + Math.round(v);
    }, 0);
    const extraIncome = scenario.extraIncomeCents ?? 0;
    const contribution = scenario.contributionCents ?? 0;
    const installmentsByMonth = new Map();
    let installmentsTotal = 0;
    for (const i of baseline.futureInstallments) {
        installmentsByMonth.set(i.month, (installmentsByMonth.get(i.month) ?? 0) + i.cents);
        installmentsTotal += i.cents;
    }

    let base = baseline.startCents;
    let sim = baseline.startCents - (scenario.anticipateInstallments ? installmentsTotal : 0);
    let invested = 0;
    const series = [];
    for (let i = 1; i <= horizon; i += 1) {
        const month = addMonthsToKey(startMonth, i);
        const inst = installmentsByMonth.get(month) ?? 0;
        base += baseline.incomeCents - baseline.expenseCents - inst;
        sim += baseline.incomeCents + extraIncome - scenarioExpense - contribution - (scenario.anticipateInstallments ? 0 : inst);
        invested += contribution;
        series.push({ month, baseCents: base, simCents: sim, investedCents: invested, simTotalCents: sim + invested });
    }
    const at = (n) => series[n - 1];
    return {
        series,
        monthlySavingCents: baseline.expenseCents - scenarioExpense + extraIncome,
        scenarioExpenseCents: scenarioExpense,
        installmentsTotalCents: installmentsTotal,
        at6: at(Math.min(6, horizon)),
        at12: at(horizon),
    };
}

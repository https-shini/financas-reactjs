import { diffMonths, isValidISODate, monthKeyOf } from "./dates";
import { MAX_CENTS, percentOf } from "./money";
import { cleanText } from "./transactions";
import { newId } from "./ids";
import { GOAL_KINDS } from "./defaults";

export function validateGoalInput(input) {
    const errors = {};
    if (!cleanText(input.name)) errors.name = "Dê um nome à meta.";
    if (!GOAL_KINDS[input.kind]) errors.kind = "Escolha o tipo.";
    if (!Number.isInteger(input.targetCents) || input.targetCents <= 0 || input.targetCents > MAX_CENTS) errors.targetCents = "Informe o valor desejado.";
    if (input.deadline && !isValidISODate(input.deadline)) errors.deadline = "Prazo inválido.";
    return { ok: Object.keys(errors).length === 0, errors };
}

export function buildGoal(input, { now = new Date().toISOString(), id } = {}) {
    return {
        id: id ?? input.id ?? newId(),
        name: cleanText(input.name, 80),
        kind: input.kind,
        targetCents: input.targetCents,
        deadline: input.deadline || null,
        color: input.color ?? "#6366f1",
        contributions: input.contributions ?? [],
        archived: input.archived ?? false,
        createdAt: input.createdAt ?? now,
        updatedAt: now,
    };
}

export function buildContribution({ date, amountCents, note }) {
    return { id: newId(), date, amountCents, note: cleanText(note, 120) || undefined };
}

/**
 * Progresso de uma meta. Aportes podem ser negativos (resgates).
 * Aporte mensal sugerido = valor restante ÷ meses até o prazo (incluindo o mês atual).
 */
export function goalProgress(goal, today) {
    const saved = goal.contributions.reduce((s, c) => s + c.amountCents, 0);
    const remaining = Math.max(0, goal.targetCents - saved);
    const month = monthKeyOf(today);
    const contributedThisMonth = goal.contributions
        .filter((c) => monthKeyOf(c.date) === month)
        .reduce((s, c) => s + c.amountCents, 0);
    let monthsLeft = null;
    let suggestedMonthlyCents = null;
    let overdue = false;
    if (goal.deadline) {
        monthsLeft = diffMonths(goal.deadline, today) + 1;
        if (monthsLeft < 1) {
            overdue = remaining > 0;
            monthsLeft = 0;
            suggestedMonthlyCents = remaining;
        } else {
            suggestedMonthlyCents = Math.ceil(remaining / monthsLeft);
        }
    }
    // Quanto falta aportar neste mês para seguir o plano.
    const pendingThisMonthCents =
        suggestedMonthlyCents === null ? 0 : Math.max(0, Math.min(remaining, suggestedMonthlyCents - Math.max(0, contributedThisMonth)));
    return {
        savedCents: saved,
        remainingCents: remaining,
        pct: Math.max(0, Math.min(100, percentOf(saved, goal.targetCents))),
        completed: saved >= goal.targetCents,
        monthsLeft,
        suggestedMonthlyCents,
        contributedThisMonthCents: contributedThisMonth,
        pendingThisMonthCents,
        overdue,
    };
}

/** Valor reservado para metas neste mês (usado no "quanto posso gastar hoje"). */
export function goalsReserveThisMonth(store, today) {
    return store.goals
        .filter((g) => !g.archived)
        .reduce((s, g) => s + goalProgress(g, today).pendingThisMonthCents, 0);
}

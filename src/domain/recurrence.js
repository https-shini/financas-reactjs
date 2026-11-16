// Recorrências geram lançamentos pendentes de forma idempotente.
// Chave de uma ocorrência: (recurrenceId, occurrenceDate). Uma ocorrência já gerada, editada ou
// excluída (registrada em skippedDates) nunca é gerada de novo.
import { addDaysISO, addMonthsISO, addWeeksISO, addYearsISO, addMonthsToKey, isValidISODate, monthEnd, monthKeyOf } from "./dates";
import { buildTransaction, cleanText, DESCRIPTION_MAX } from "./transactions";
import { newId } from "./ids";
import { MAX_CENTS } from "./money";

const STEP = {
    daily: addDaysISO,
    weekly: addWeeksISO,
    monthly: addMonthsISO,
    yearly: addYearsISO,
};

const MAX_ITERATIONS = 5000;

export function validateRecurrenceInput(input, store) {
    const errors = {};
    if (!["income", "expense"].includes(input.type)) errors.type = "Escolha receita ou despesa.";
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0 || input.amountCents > MAX_CENTS) errors.amountCents = "Informe um valor maior que zero.";
    if (!cleanText(input.description)) errors.description = "Informe uma descrição.";
    if (!STEP[input.frequency]) errors.frequency = "Escolha a frequência.";
    const interval = input.interval ?? 1;
    if (!Number.isInteger(interval) || interval < 1 || interval > 365) errors.interval = "Intervalo inválido.";
    if (!isValidISODate(input.startDate)) errors.startDate = "Data inicial inválida.";
    if (input.endDate && (!isValidISODate(input.endDate) || input.endDate < input.startDate)) errors.endDate = "A data final deve ser posterior à inicial.";
    if (!store.accounts.some((a) => a.id === input.accountId)) errors.accountId = "Escolha uma conta.";
    return { ok: Object.keys(errors).length === 0, errors };
}

export function buildRecurrence(input, { now = new Date().toISOString(), id } = {}) {
    return {
        id: id ?? newId(),
        type: input.type,
        amountCents: input.amountCents,
        description: cleanText(input.description, DESCRIPTION_MAX),
        categoryId: input.categoryId ?? null,
        accountId: input.accountId,
        frequency: input.frequency,
        interval: input.interval ?? 1,
        startDate: input.startDate,
        endDate: input.endDate || null,
        active: input.active ?? true,
        skippedDates: input.skippedDates ?? [],
        createdAt: input.createdAt ?? now,
        updatedAt: now,
    };
}

/** Datas de ocorrência entre from e to (inclusive). Calculadas a partir do início para não acumular desvios (31 → 28 → 31). */
export function occurrenceDates(rec, from, to) {
    const step = STEP[rec.frequency];
    if (!step) return [];
    const out = [];
    const end = rec.endDate && rec.endDate < to ? rec.endDate : to;
    for (let i = 0; i < MAX_ITERATIONS; i += 1) {
        const d = step(rec.startDate, i * (rec.interval ?? 1));
        if (d > end) break;
        if (d >= from) out.push(d);
    }
    return out;
}

/** Horizonte padrão de geração: fim do mês seguinte. */
export function generationHorizon(today) {
    return monthEnd(addMonthsToKey(monthKeyOf(today), 1));
}

/**
 * Gera as ocorrências que faltam até `until`. Retorna apenas as novas transações (não altera o store).
 * Ocorrências passadas são criadas como pendentes para que o usuário confirme o pagamento.
 */
export function generateOccurrences(store, until, { now = new Date().toISOString() } = {}) {
    const existing = new Set();
    for (const tx of store.transactions) {
        if (tx.recurrenceId) existing.add(`${tx.recurrenceId}|${tx.occurrenceDate ?? tx.date}`);
    }
    const created = [];
    for (const rec of store.recurrences) {
        if (!rec.active) continue;
        const skipped = new Set(rec.skippedDates ?? []);
        for (const date of occurrenceDates(rec, rec.startDate, until)) {
            const key = `${rec.id}|${date}`;
            if (existing.has(key) || skipped.has(date)) continue;
            existing.add(key);
            created.push(
                buildTransaction(
                    {
                        type: rec.type,
                        amountCents: rec.amountCents,
                        description: rec.description,
                        date,
                        categoryId: rec.categoryId,
                        accountId: rec.accountId,
                        status: "pending",
                        recurrenceId: rec.id,
                        occurrenceDate: date,
                    },
                    { now }
                )
            );
        }
    }
    return created;
}

/** Ocorrências virtuais (não geradas ainda) entre from e to — usadas nas projeções. */
export function virtualOccurrences(store, from, to) {
    const existing = new Set();
    for (const tx of store.transactions) {
        if (tx.recurrenceId) existing.add(`${tx.recurrenceId}|${tx.occurrenceDate ?? tx.date}`);
    }
    const out = [];
    for (const rec of store.recurrences) {
        if (!rec.active) continue;
        const skipped = new Set(rec.skippedDates ?? []);
        for (const date of occurrenceDates(rec, from, to)) {
            if (existing.has(`${rec.id}|${date}`) || skipped.has(date)) continue;
            out.push({ recurrenceId: rec.id, date, type: rec.type, amountCents: rec.amountCents, accountId: rec.accountId, categoryId: rec.categoryId, description: rec.description });
        }
    }
    return out;
}

/** Valor mensal equivalente (para estimar peso de despesas fixas). */
export function monthlyEquivalent(rec) {
    const i = rec.interval ?? 1;
    switch (rec.frequency) {
        case "daily":
            return Math.round((rec.amountCents * 30.4375) / i);
        case "weekly":
            return Math.round((rec.amountCents * 4.348) / i);
        case "monthly":
            return Math.round(rec.amountCents / i);
        case "yearly":
            return Math.round(rec.amountCents / (12 * i));
        default:
            return 0;
    }
}

export function describeFrequency(rec) {
    const i = rec.interval ?? 1;
    const unit = { daily: ["dia", "dias"], weekly: ["semana", "semanas"], monthly: ["mês", "meses"], yearly: ["ano", "anos"] }[rec.frequency];
    if (!unit) return "";
    return i === 1 ? `A cada ${unit[0]}` : `A cada ${i} ${unit[1]}`;
}

import { z } from "zod";
import { isValidISODate, isValidMonthKey } from "../domain/dates";
import { MAX_CENTS } from "../domain/money";
import { SCHEMA_VERSION } from "../domain/defaults";

// Sem compilação JIT: o Zod não tenta usar `new Function`, compatível com a CSP sem 'unsafe-eval'.
z.config({ jitless: true });

const isoDate = z.string().refine(isValidISODate, { message: "Data inválida (esperado AAAA-MM-DD)" });
const monthKey = z.string().refine(isValidMonthKey, { message: "Mês inválido (esperado AAAA-MM)" });
const id = z.string().min(1).max(100);
const positiveCents = z.number().int().positive().max(MAX_CENTS);
const signedCents = z.number().int().min(-MAX_CENTS).max(MAX_CENTS);
const timestamp = z.string().min(1);

export const transactionSchema = z
    .object({
        id,
        type: z.enum(["income", "expense", "transfer"]),
        amountCents: positiveCents,
        description: z.string().min(1).max(200),
        date: isoDate,
        categoryId: id.nullable(),
        accountId: id,
        toAccountId: id.optional(),
        status: z.enum(["paid", "pending"]),
        notes: z.string().max(1000).optional(),
        recurrenceId: id.optional(),
        occurrenceDate: isoDate.optional(),
        installment: z
            .object({ group: id, n: z.number().int().min(1), of: z.number().int().min(2).max(120), totalCents: positiveCents.optional() })
            .optional(),
        invoiceRef: z.object({ cardId: id.optional(), month: monthKey }).optional(),
        createdAt: timestamp,
        updatedAt: timestamp,
    })
    .superRefine((tx, ctx) => {
        if (tx.type === "transfer" && !tx.toAccountId) ctx.addIssue({ code: "custom", message: "Transferência sem conta de destino", path: ["toAccountId"] });
        if (tx.type === "transfer" && tx.toAccountId === tx.accountId) ctx.addIssue({ code: "custom", message: "Transferência para a mesma conta", path: ["toAccountId"] });
        if (tx.installment && tx.installment.n > tx.installment.of) ctx.addIssue({ code: "custom", message: "Parcela fora do intervalo", path: ["installment"] });
    });

export const categorySchema = z.object({
    id,
    name: z.string().min(1).max(60),
    kind: z.enum(["income", "expense", "both"]),
    icon: z.string().min(1).max(40),
    color: z.string().min(1).max(20),
    keywords: z.array(z.string().max(60)).max(100).default([]),
    archived: z.boolean().default(false),
    createdAt: timestamp,
    updatedAt: timestamp,
});

export const accountSchema = z.object({
    id,
    name: z.string().min(1).max(60),
    type: z.enum(["checking", "savings", "cash", "investment", "other", "credit"]),
    color: z.string().min(1).max(20),
    initialBalanceCents: signedCents.default(0),
    archived: z.boolean().default(false),
    // Somente cartões:
    limitCents: z.number().int().min(0).max(MAX_CENTS).optional(),
    closingDay: z.number().int().min(1).max(31).optional(),
    dueDay: z.number().int().min(1).max(31).optional(),
    paymentAccountId: id.nullable().optional(),
    createdAt: timestamp,
    updatedAt: timestamp,
});

export const budgetSchema = z.object({
    id,
    categoryId: id,
    limitCents: positiveCents,
    overrides: z.record(z.string(), z.number().int().min(0).max(MAX_CENTS)).default({}),
    createdAt: timestamp,
    updatedAt: timestamp,
});

export const goalSchema = z.object({
    id,
    name: z.string().min(1).max(80),
    kind: z.string().min(1).max(30),
    targetCents: positiveCents,
    deadline: isoDate.nullable(),
    color: z.string().max(20).default("#6366f1"),
    contributions: z
        .array(z.object({ id, date: isoDate, amountCents: signedCents, note: z.string().max(200).optional() }))
        .default([]),
    archived: z.boolean().default(false),
    createdAt: timestamp,
    updatedAt: timestamp,
});

export const recurrenceSchema = z.object({
    id,
    type: z.enum(["income", "expense"]),
    amountCents: positiveCents,
    description: z.string().min(1).max(200),
    categoryId: id.nullable(),
    accountId: id,
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    interval: z.number().int().min(1).max(365).default(1),
    startDate: isoDate,
    endDate: isoDate.nullable(),
    active: z.boolean().default(true),
    skippedDates: z.array(isoDate).default([]),
    createdAt: timestamp,
    updatedAt: timestamp,
});

export const settingsSchema = z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    locale: z.string().min(2).max(10).default("pt-BR"),
    currency: z.string().length(3).default("BRL"),
    onboardingDone: z.boolean().default(false),
    lastBackupAt: z.string().nullable().default(null),
    sidebarCollapsed: z.boolean().default(false),
    hideBalances: z.boolean().default(false),
    aiConsent: z.boolean().default(false),
    dismissedSuggestions: z.array(z.string().max(200)).max(500).default([]),
});

export const storeSchema = z.object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    transactions: z.array(transactionSchema),
    categories: z.array(categorySchema),
    accounts: z.array(accountSchema).min(1),
    budgets: z.array(budgetSchema).default([]),
    goals: z.array(goalSchema).default([]),
    recurrences: z.array(recurrenceSchema).default([]),
    settings: settingsSchema.default({}),
    meta: z
        .object({
            migrations: z.array(z.record(z.string(), z.unknown())).default([]),
            legacyRejected: z.array(z.unknown()).optional(),
        })
        .default({ migrations: [] }),
});

/** Mensagens legíveis a partir de um erro do Zod (máximo `limit`). */
export function describeIssues(error, limit = 8) {
    return (error?.issues ?? []).slice(0, limit).map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`);
}

/**
 * Validação de integridade referencial (além do formato).
 * Retorna lista de problemas encontrados.
 */
export function integrityIssues(store) {
    const issues = [];
    const accountIds = new Set(store.accounts.map((a) => a.id));
    const categoryIds = new Set(store.categories.map((c) => c.id));
    const seen = new Set();
    for (const tx of store.transactions) {
        if (seen.has(tx.id)) issues.push(`ID de transação duplicado: ${tx.id}`);
        seen.add(tx.id);
        if (!accountIds.has(tx.accountId)) issues.push(`Transação ${tx.id} aponta para conta inexistente`);
        if (tx.toAccountId && !accountIds.has(tx.toAccountId)) issues.push(`Transação ${tx.id} aponta para conta de destino inexistente`);
        if (tx.categoryId && !categoryIds.has(tx.categoryId)) issues.push(`Transação ${tx.id} aponta para categoria inexistente`);
    }
    return issues;
}

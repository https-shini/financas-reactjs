import { newId } from "./ids";
import { isValidISODate, todayISO } from "./dates";
import { MAX_CENTS } from "./money";

export const TX_TYPES = ["income", "expense", "transfer"];
export const TX_STATUS = ["paid", "pending"];
export const DESCRIPTION_MAX = 120;
export const NOTES_MAX = 500;

export const TYPE_LABEL = { income: "Receita", expense: "Despesa", transfer: "Transferência" };

/** Normaliza texto: remove espaços duplicados e caracteres de controle. NÃO faz escape HTML (React já escapa). */
export function cleanText(value, max) {
    const s = String(value ?? "")
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return max ? s.slice(0, max) : s;
}

/**
 * Valida a entrada de uma transação (usado no formulário em tempo real e antes de salvar).
 * Retorna { ok, errors: { campo: mensagem } }.
 */
export function validateTransactionInput(input, store) {
    const errors = {};
    if (!TX_TYPES.includes(input.type)) errors.type = "Escolha o tipo.";
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) errors.amountCents = "Informe um valor maior que zero.";
    else if (input.amountCents > MAX_CENTS) errors.amountCents = "Valor acima do limite permitido.";

    const desc = cleanText(input.description);
    if (!desc) errors.description = "Informe uma descrição.";
    else if (desc.length > DESCRIPTION_MAX) errors.description = `Use até ${DESCRIPTION_MAX} caracteres.`;

    if (!isValidISODate(input.date)) errors.date = "Data inválida.";

    const accounts = store?.accounts ?? [];
    const from = accounts.find((a) => a.id === input.accountId);
    if (!from) errors.accountId = "Escolha uma conta.";

    if (input.type === "transfer") {
        const to = accounts.find((a) => a.id === input.toAccountId);
        if (!to) errors.toAccountId = "Escolha a conta de destino.";
        else if (input.toAccountId === input.accountId) errors.toAccountId = "Origem e destino devem ser diferentes.";
    } else if (input.categoryId) {
        const cat = (store?.categories ?? []).find((c) => c.id === input.categoryId);
        if (!cat) errors.categoryId = "Categoria não encontrada.";
    }

    if (input.notes && String(input.notes).length > NOTES_MAX) errors.notes = `Use até ${NOTES_MAX} caracteres.`;
    if (input.status && !TX_STATUS.includes(input.status)) errors.status = "Status inválido.";

    return { ok: Object.keys(errors).length === 0, errors };
}

/** Cria uma transação completa a partir de uma entrada validada. */
export function buildTransaction(input, { now = new Date().toISOString(), id } = {}) {
    const isTransfer = input.type === "transfer";
    const tx = {
        id: id ?? newId(),
        type: input.type,
        amountCents: input.amountCents,
        description: cleanText(input.description, DESCRIPTION_MAX),
        date: input.date,
        categoryId: isTransfer ? null : input.categoryId ?? null,
        accountId: input.accountId,
        status: input.status === "pending" ? "pending" : "paid",
        createdAt: input.createdAt ?? now,
        updatedAt: now,
    };
    if (isTransfer) tx.toAccountId = input.toAccountId;
    const notes = cleanText(input.notes, NOTES_MAX);
    if (notes) tx.notes = notes;
    if (input.recurrenceId) tx.recurrenceId = input.recurrenceId;
    if (input.occurrenceDate) tx.occurrenceDate = input.occurrenceDate;
    if (input.installment) tx.installment = { ...input.installment };
    if (input.invoiceRef) tx.invoiceRef = { ...input.invoiceRef };
    return tx;
}

/** Aplica alterações a uma transação existente preservando id e createdAt. */
export function updateTransaction(existing, changes, { now = new Date().toISOString() } = {}) {
    const merged = { ...existing, ...changes };
    const rebuilt = buildTransaction({ ...merged, createdAt: existing.createdAt }, { now, id: existing.id });
    return rebuilt;
}

/** Cópia para duplicação: novo id, data de hoje, sem vínculos de recorrência/parcela/fatura. */
export function duplicateInput(tx, today = todayISO()) {
    // eslint-disable-next-line no-unused-vars
    const { id, createdAt, updatedAt, recurrenceId, occurrenceDate, installment, invoiceRef, ...rest } = tx;
    return { ...rest, date: today, status: "paid" };
}

/** Efeito (em centavos) de uma transação no saldo de uma conta. */
export function effectOnAccount(tx, accountId) {
    if (tx.type === "income") return tx.accountId === accountId ? tx.amountCents : 0;
    if (tx.type === "expense") return tx.accountId === accountId ? -tx.amountCents : 0;
    if (tx.type === "transfer") {
        let e = 0;
        if (tx.accountId === accountId) e -= tx.amountCents;
        if (tx.toAccountId === accountId) e += tx.amountCents;
        return e;
    }
    return 0;
}

/** Realizado = pago e com data até hoje. Pendentes e lançamentos futuros não entram no saldo realizado. */
export function isRealized(tx, today = todayISO()) {
    return tx.status === "paid" && tx.date <= today;
}

/** Valor com sinal para exibição: receita +, despesa −, transferência 0 (neutra). */
export function signedAmount(tx) {
    if (tx.type === "income") return tx.amountCents;
    if (tx.type === "expense") return -tx.amountCents;
    return 0;
}

export function normalizeForMatch(text) {
    return String(text ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\(\d+\/\d+\)/g, "")
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/** Impressão digital usada para detectar duplicidade em importações. */
export function fingerprint(tx) {
    return `${tx.date}|${tx.type}|${tx.amountCents}|${normalizeForMatch(tx.description)}`;
}

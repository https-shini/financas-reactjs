// Parcelamento: uma compra vira N transações ligadas por installment.group.
// No cartão, todas as parcelas são lançadas como "paid" (são cobranças nas faturas futuras).
// Em contas comuns, parcelas futuras ficam "pending" até serem pagas.
import { addMonthsISO } from "./dates";
import { splitCents } from "./money";
import { buildTransaction } from "./transactions";
import { newId } from "./ids";

export const MAX_INSTALLMENTS = 120;

export function buildInstallments(input, count, { today, isCardAccount, now = new Date().toISOString(), group = newId() }) {
    if (!Number.isInteger(count) || count < 2 || count > MAX_INSTALLMENTS) {
        throw new Error(`Número de parcelas deve estar entre 2 e ${MAX_INSTALLMENTS}.`);
    }
    const amounts = splitCents(input.amountCents, count);
    return amounts.map((amountCents, i) => {
        const date = addMonthsISO(input.date, i);
        let status;
        if (isCardAccount) status = "paid";
        else if (date > today) status = "pending";
        else status = input.status === "pending" ? "pending" : "paid";
        return buildTransaction(
            {
                ...input,
                amountCents,
                date,
                status,
                installment: { group, n: i + 1, of: count, totalCents: input.amountCents },
            },
            { now }
        );
    });
}

/** Parcelas do grupo em ordem. */
export function installmentGroup(store, group) {
    return store.transactions.filter((t) => t.installment?.group === group).sort((a, b) => a.installment.n - b.installment.n);
}

/**
 * Uma parcela está "travada" se já foi efetivamente paga: em conta comum, status paid com data passada;
 * no cartão, se a fatura dela já foi paga. Parcelas travadas não têm o valor alterado em edições de grupo.
 */
export function isInstallmentLocked(tx, { today, paidInvoiceMonths, isCardAccount, invoiceMonthOf }) {
    if (isCardAccount) return paidInvoiceMonths.has(invoiceMonthOf(tx.date));
    return tx.status === "paid" && tx.date <= today;
}

/**
 * Aplica uma edição ao grupo. Descrição, categoria e observações valem para todas as parcelas;
 * novo valor total é redistribuído apenas entre as parcelas não travadas.
 */
export function applyGroupEdit(parcels, changes, isLocked, { now = new Date().toISOString() } = {}) {
    const unlocked = parcels.filter((p) => !isLocked(p));
    let newAmounts = null;
    if (Number.isInteger(changes.totalCents)) {
        const lockedSum = parcels.filter(isLocked).reduce((s, p) => s + p.amountCents, 0);
        const rest = changes.totalCents - lockedSum;
        if (unlocked.length === 0 || rest < unlocked.length) {
            throw new Error("O novo total não cobre as parcelas ainda não pagas.");
        }
        newAmounts = splitCents(rest, unlocked.length);
    }
    let k = 0;
    return parcels.map((p) => {
        const next = { ...p, updatedAt: now };
        if (changes.description !== undefined) next.description = changes.description;
        if (changes.categoryId !== undefined) next.categoryId = changes.categoryId;
        if (changes.notes !== undefined) next.notes = changes.notes || undefined;
        if (newAmounts && !isLocked(p)) {
            next.amountCents = newAmounts[k];
            k += 1;
        }
        if (Number.isInteger(changes.totalCents)) next.installment = { ...p.installment, totalCents: changes.totalCents };
        return next;
    });
}

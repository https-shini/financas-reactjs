// Operações puras sobre o store: (store, ...args) => novo store. Lançam Error com mensagem legível
// quando a operação viola uma regra de negócio. O provider aplica, persiste e notifica.
import { updateTransaction as updateTx } from "../domain/transactions";
import { buildRecurrence, generateOccurrences, generationHorizon } from "../domain/recurrence";
import { newId } from "../domain/ids";

const nowISO = () => new Date().toISOString();

// ---------------- Transações ----------------

export function addTransactions(store, txs) {
    const ids = new Set(store.transactions.map((t) => t.id));
    for (const t of txs) if (ids.has(t.id)) throw new Error("ID de transação duplicado.");
    return { ...store, transactions: [...store.transactions, ...txs] };
}

export function updateTransaction(store, id, changes, now = nowISO()) {
    const existing = store.transactions.find((t) => t.id === id);
    if (!existing) throw new Error("Transação não encontrada.");
    const updated = updateTx(existing, changes, { now });
    return { ...store, transactions: store.transactions.map((t) => (t.id === id ? updated : t)) };
}

/** Substitui várias transações pelo id (edição em grupo, ex.: parcelas). */
export function replaceTransactions(store, txs) {
    const map = new Map(txs.map((t) => [t.id, t]));
    return { ...store, transactions: store.transactions.map((t) => map.get(t.id) ?? t) };
}

/**
 * Remove transações. Ocorrências de recorrência excluídas são registradas em skippedDates
 * para não serem geradas novamente.
 */
export function deleteTransactions(store, ids) {
    const set = new Set(ids);
    const removed = store.transactions.filter((t) => set.has(t.id));
    const skips = new Map();
    for (const t of removed) {
        if (t.recurrenceId) {
            const list = skips.get(t.recurrenceId) ?? [];
            list.push(t.occurrenceDate ?? t.date);
            skips.set(t.recurrenceId, list);
        }
    }
    const recurrences = skips.size
        ? store.recurrences.map((r) =>
              skips.has(r.id) ? { ...r, skippedDates: [...new Set([...(r.skippedDates ?? []), ...skips.get(r.id)])] } : r
          )
        : store.recurrences;
    return { store: { ...store, transactions: store.transactions.filter((t) => !set.has(t.id)), recurrences }, removed };
}

/** Desfaz uma exclusão. */
export function restoreTransactions(store, removed) {
    const existing = new Set(store.transactions.map((t) => t.id));
    const toAdd = removed.filter((t) => !existing.has(t.id));
    const unskip = new Map();
    for (const t of toAdd) {
        if (!t.recurrenceId) continue;
        const list = unskip.get(t.recurrenceId) ?? new Set();
        list.add(t.occurrenceDate ?? t.date);
        unskip.set(t.recurrenceId, list);
    }
    const recurrences = store.recurrences.map((r) =>
        unskip.has(r.id) ? { ...r, skippedDates: (r.skippedDates ?? []).filter((d) => !unskip.get(r.id).has(d)) } : r
    );
    return { ...store, transactions: [...store.transactions, ...toAdd], recurrences };
}

export function setTransactionsStatus(store, ids, status, now = nowISO()) {
    const set = new Set(ids);
    return {
        ...store,
        transactions: store.transactions.map((t) => (set.has(t.id) ? { ...t, status, updatedAt: now } : t)),
    };
}

export function setTransactionsCategory(store, ids, categoryId, now = nowISO()) {
    const set = new Set(ids);
    return {
        ...store,
        transactions: store.transactions.map((t) =>
            set.has(t.id) && t.type !== "transfer" ? { ...t, categoryId, updatedAt: now } : t
        ),
    };
}

// ---------------- Categorias ----------------

export function upsertCategory(store, category) {
    const name = category.name.trim().toLowerCase();
    const clash = store.categories.find((c) => c.id !== category.id && c.name.trim().toLowerCase() === name && !c.archived);
    if (clash) throw new Error("Já existe uma categoria com esse nome.");
    const exists = store.categories.some((c) => c.id === category.id);
    return {
        ...store,
        categories: exists ? store.categories.map((c) => (c.id === category.id ? category : c)) : [...store.categories, category],
    };
}

export function setCategoryArchived(store, id, archived, now = nowISO()) {
    return { ...store, categories: store.categories.map((c) => (c.id === id ? { ...c, archived, updatedAt: now } : c)) };
}

/**
 * Exclui uma categoria. Se houver referências (transações, orçamentos, recorrências), exige
 * reassignTo (outra categoria ou null = "sem categoria") para tratá-las antes.
 */
export function deleteCategory(store, id, { reassignTo } = {}) {
    const refs =
        store.transactions.some((t) => t.categoryId === id) ||
        store.recurrences.some((r) => r.categoryId === id) ||
        store.budgets.some((b) => b.categoryId === id);
    if (refs && reassignTo === undefined) {
        throw new Error("Esta categoria possui movimentações. Escolha para onde movê-las antes de excluir.");
    }
    if (reassignTo === id) throw new Error("Escolha uma categoria diferente.");
    const target = reassignTo ?? null;
    const now = nowISO();
    return {
        ...store,
        categories: store.categories.filter((c) => c.id !== id),
        transactions: store.transactions.map((t) => (t.categoryId === id ? { ...t, categoryId: target, updatedAt: now } : t)),
        recurrences: store.recurrences.map((r) => (r.categoryId === id ? { ...r, categoryId: target, updatedAt: now } : r)),
        // Orçamento da categoria removida é descartado (não faz sentido migrar o limite).
        budgets: store.budgets.filter((b) => b.categoryId !== id),
    };
}

// ---------------- Contas e cartões ----------------

export function upsertAccount(store, account) {
    const exists = store.accounts.some((a) => a.id === account.id);
    if (!exists) return { ...store, accounts: [...store.accounts, account] };
    const prev = store.accounts.find((a) => a.id === account.id);
    if (prev.type === "credit" && account.type !== "credit" && store.transactions.some((t) => t.accountId === account.id || t.toAccountId === account.id)) {
        throw new Error("Não é possível transformar um cartão com lançamentos em conta comum.");
    }
    return { ...store, accounts: store.accounts.map((a) => (a.id === account.id ? account : a)) };
}

export function setAccountArchived(store, id, archived, now = nowISO()) {
    const active = store.accounts.filter((a) => !a.archived && a.type !== "credit" && a.id !== id);
    const target = store.accounts.find((a) => a.id === id);
    if (archived && target?.type !== "credit" && active.length === 0) throw new Error("Mantenha pelo menos uma conta ativa.");
    if (archived && store.recurrences.some((r) => r.active && r.accountId === id)) {
        throw new Error("Há recorrências ativas usando esta conta. Altere-as antes de arquivar.");
    }
    return { ...store, accounts: store.accounts.map((a) => (a.id === id ? { ...a, archived, updatedAt: now } : a)) };
}

export function deleteAccount(store, id) {
    if (store.transactions.some((t) => t.accountId === id || t.toAccountId === id)) {
        throw new Error("Esta conta possui movimentações. Arquive-a em vez de excluir.");
    }
    if (store.recurrences.some((r) => r.accountId === id)) throw new Error("Há recorrências usando esta conta.");
    const remaining = store.accounts.filter((a) => a.id !== id);
    if (!remaining.some((a) => a.type !== "credit")) throw new Error("Mantenha pelo menos uma conta.");
    return {
        ...store,
        accounts: remaining.map((a) => (a.paymentAccountId === id ? { ...a, paymentAccountId: null } : a)),
    };
}

// ---------------- Orçamentos ----------------

export function upsertBudget(store, budget) {
    const exists = store.budgets.some((b) => b.id === budget.id);
    return { ...store, budgets: exists ? store.budgets.map((b) => (b.id === budget.id ? budget : b)) : [...store.budgets, budget] };
}

export function deleteBudget(store, id) {
    return { ...store, budgets: store.budgets.filter((b) => b.id !== id) };
}

export function setBudgetOverride(store, id, month, cents, now = nowISO()) {
    return {
        ...store,
        budgets: store.budgets.map((b) => {
            if (b.id !== id) return b;
            const overrides = { ...(b.overrides ?? {}) };
            if (cents === null || cents === undefined) delete overrides[month];
            else overrides[month] = cents;
            return { ...b, overrides, updatedAt: now };
        }),
    };
}

// ---------------- Metas ----------------

export function upsertGoal(store, goal) {
    const exists = store.goals.some((g) => g.id === goal.id);
    return { ...store, goals: exists ? store.goals.map((g) => (g.id === goal.id ? goal : g)) : [...store.goals, goal] };
}

export function deleteGoal(store, id) {
    return { ...store, goals: store.goals.filter((g) => g.id !== id) };
}

export function addContribution(store, goalId, contribution, now = nowISO()) {
    return {
        ...store,
        goals: store.goals.map((g) => (g.id === goalId ? { ...g, contributions: [...g.contributions, contribution], updatedAt: now } : g)),
    };
}

export function deleteContribution(store, goalId, contributionId, now = nowISO()) {
    return {
        ...store,
        goals: store.goals.map((g) =>
            g.id === goalId ? { ...g, contributions: g.contributions.filter((c) => c.id !== contributionId), updatedAt: now } : g
        ),
    };
}

// ---------------- Recorrências ----------------

export function generateRecurrences(store, today, now = nowISO()) {
    const created = generateOccurrences(store, generationHorizon(today), { now });
    if (!created.length) return store;
    return { ...store, transactions: [...store.transactions, ...created] };
}

/**
 * Cria ou altera uma recorrência (a série).
 * Ao alterar: lançamentos pendentes a partir de hoje são atualizados; se a periodicidade mudar,
 * os pendentes futuros são removidos e regenerados com as novas datas. Lançamentos pagos não mudam.
 */
export function saveRecurrence(store, input, today, now = nowISO()) {
    const prev = store.recurrences.find((r) => r.id === input.id);
    const rec = buildRecurrence({ ...prev, ...input, createdAt: prev?.createdAt }, { now, id: prev?.id ?? input.id ?? newId() });
    let transactions = store.transactions;
    if (prev) {
        const timingChanged =
            prev.frequency !== rec.frequency || prev.interval !== rec.interval || prev.startDate !== rec.startDate || prev.endDate !== rec.endDate;
        const isFuturePending = (t) => t.recurrenceId === rec.id && t.status === "pending" && t.date >= today;
        if (timingChanged) {
            transactions = transactions.filter((t) => !isFuturePending(t));
        } else {
            transactions = transactions.map((t) =>
                isFuturePending(t)
                    ? {
                          ...t,
                          type: rec.type,
                          amountCents: rec.amountCents,
                          description: rec.description,
                          categoryId: rec.categoryId,
                          accountId: rec.accountId,
                          updatedAt: now,
                      }
                    : t
            );
        }
    }
    const recurrences = prev ? store.recurrences.map((r) => (r.id === rec.id ? rec : r)) : [...store.recurrences, rec];
    const next = generateRecurrences({ ...store, transactions, recurrences }, today, now);
    return { store: next, recurrence: rec };
}

/** Encerra a série: não gera novas ocorrências e remove pendentes futuros (após hoje). */
export function cancelRecurrence(store, id, today, now = nowISO()) {
    return {
        ...store,
        recurrences: store.recurrences.map((r) => (r.id === id ? { ...r, active: false, endDate: r.endDate && r.endDate < today ? r.endDate : today, updatedAt: now } : r)),
        transactions: store.transactions.filter((t) => !(t.recurrenceId === id && t.status === "pending" && t.date > today)),
    };
}

/** Exclui a regra. Pendentes futuros são removidos; lançamentos existentes perdem o vínculo. */
export function deleteRecurrence(store, id, today) {
    return {
        ...store,
        recurrences: store.recurrences.filter((r) => r.id !== id),
        transactions: store.transactions
            .filter((t) => !(t.recurrenceId === id && t.status === "pending" && t.date > today))
            .map((t) => {
                if (t.recurrenceId !== id) return t;
                // eslint-disable-next-line no-unused-vars
                const { recurrenceId, occurrenceDate, ...rest } = t;
                return rest;
            }),
    };
}

// ---------------- Configurações ----------------

export function updateSettings(store, patch) {
    return { ...store, settings: { ...store.settings, ...patch } };
}

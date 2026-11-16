import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FinanceActionsContext, FinanceStateContext } from "./contexts";
import * as ops from "./operations";
import { createRepository, STORE_KEY } from "../storage/repository";
import { todayISO } from "../domain/dates";

function useToday() {
    const [today, setToday] = useState(() => todayISO());
    useEffect(() => {
        const id = setInterval(() => {
            const t = todayISO();
            setToday((prev) => (prev === t ? prev : t));
        }, 60_000);
        return () => clearInterval(id);
    }, []);
    return today;
}

/**
 * Provider principal. `repository` pode ser injetado em testes.
 */
export function FinanceProvider({ children, repository }) {
    const repo = useMemo(() => repository ?? createRepository(), [repository]);
    const [initial] = useState(() => repo.load());
    const today = useToday();

    const [status, setStatus] = useState(initial.status === "recovery" ? "recovery" : "ready");
    const [recovery, setRecovery] = useState(initial.status === "recovery" ? initial : null);
    const [migrationReport, setMigrationReport] = useState(initial.status === "migrated" ? initial.report : null);
    const [repairNotes] = useState(initial.fixes?.length ? initial.fixes : []);
    const [persistError, setPersistError] = useState(null);
    const [lastSavedAt, setLastSavedAt] = useState(null);

    const [store, setStore] = useState(() =>
        initial.status === "recovery" ? initial.store : ops.generateRecurrences(initial.store, todayISO())
    );
    const storeRef = useRef(store);
    const skipNextSave = useRef(false);

    const apply = useCallback((fn) => {
        const next = fn(storeRef.current);
        if (next === storeRef.current) return next;
        storeRef.current = next;
        setStore(next);
        return next;
    }, []);

    // Persistência: grava a cada alteração. Erros ficam visíveis (nunca silenciosos).
    useEffect(() => {
        if (status !== "ready") return;
        if (skipNextSave.current) {
            skipNextSave.current = false;
            return;
        }
        try {
            repo.save(store);
            setPersistError(null);
            setLastSavedAt(new Date().toISOString());
        } catch (e) {
            setPersistError({ code: e.code ?? "write", message: e.message });
        }
    }, [store, status, repo]);

    // Gera ocorrências de recorrências quando o dia muda.
    useEffect(() => {
        if (status === "ready") apply((s) => ops.generateRecurrences(s, today));
    }, [today, status, apply]);

    // Sincroniza alterações feitas em outra aba.
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key !== STORE_KEY || e.newValue === null) return;
            const result = repo.load();
            if (result.status === "ok") {
                skipNextSave.current = true;
                storeRef.current = result.store;
                setStore(result.store);
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [repo]);

    const replaceStore = useCallback(
        (next, { backupReason } = {}) => {
            if (backupReason && status === "ready") {
                try {
                    repo.saveLocalBackup(backupReason, storeRef.current);
                } catch (e) {
                    throw new Error(`Não foi possível criar a cópia de segurança antes de substituir os dados: ${e.message}`);
                }
            }
            const withRecurrences = ops.generateRecurrences(next, todayISO());
            storeRef.current = withRecurrences;
            setStore(withRecurrences);
            setRecovery(null);
            setStatus("ready");
        },
        [repo, status]
    );

    const actions = useMemo(() => {
        const a = {
            apply,
            addTransactions: (txs) => apply((s) => ops.addTransactions(s, txs)),
            updateTransaction: (id, changes) => apply((s) => ops.updateTransaction(s, id, changes)),
            replaceTransactions: (txs) => apply((s) => ops.replaceTransactions(s, txs)),
            deleteTransactions: (ids) => {
                let removed = [];
                apply((s) => {
                    const r = ops.deleteTransactions(s, ids);
                    removed = r.removed;
                    return r.store;
                });
                return removed;
            },
            restoreTransactions: (removed) => apply((s) => ops.restoreTransactions(s, removed)),
            setTransactionsStatus: (ids, st) => apply((s) => ops.setTransactionsStatus(s, ids, st)),
            setTransactionsCategory: (ids, cat) => apply((s) => ops.setTransactionsCategory(s, ids, cat)),
            upsertCategory: (c) => apply((s) => ops.upsertCategory(s, c)),
            setCategoryArchived: (id, v) => apply((s) => ops.setCategoryArchived(s, id, v)),
            deleteCategory: (id, opts) => apply((s) => ops.deleteCategory(s, id, opts)),
            upsertAccount: (acc) => apply((s) => ops.upsertAccount(s, acc)),
            setAccountArchived: (id, v) => apply((s) => ops.setAccountArchived(s, id, v)),
            deleteAccount: (id) => apply((s) => ops.deleteAccount(s, id)),
            upsertBudget: (b) => apply((s) => ops.upsertBudget(s, b)),
            deleteBudget: (id) => apply((s) => ops.deleteBudget(s, id)),
            setBudgetOverride: (id, month, cents) => apply((s) => ops.setBudgetOverride(s, id, month, cents)),
            upsertGoal: (g) => apply((s) => ops.upsertGoal(s, g)),
            deleteGoal: (id) => apply((s) => ops.deleteGoal(s, id)),
            addContribution: (goalId, c) => apply((s) => ops.addContribution(s, goalId, c)),
            deleteContribution: (goalId, cid) => apply((s) => ops.deleteContribution(s, goalId, cid)),
            saveRecurrence: (input) => {
                let rec = null;
                apply((s) => {
                    const r = ops.saveRecurrence(s, input, todayISO());
                    rec = r.recurrence;
                    return r.store;
                });
                return rec;
            },
            cancelRecurrence: (id) => apply((s) => ops.cancelRecurrence(s, id, todayISO())),
            deleteRecurrence: (id) => apply((s) => ops.deleteRecurrence(s, id, todayISO())),
            updateSettings: (patch) => apply((s) => ops.updateSettings(s, patch)),
            replaceStore,
            createLocalBackup: (reason) => repo.saveLocalBackup(reason, storeRef.current),
            listLocalBackups: () => repo.listLocalBackups(),
            dismissMigrationReport: () => setMigrationReport(null),
            retrySave: () => {
                try {
                    repo.save(storeRef.current);
                    setPersistError(null);
                    setLastSavedAt(new Date().toISOString());
                    return true;
                } catch (e) {
                    setPersistError({ code: e.code ?? "write", message: e.message });
                    return false;
                }
            },
            getStore: () => storeRef.current,
        };
        return a;
    }, [apply, replaceStore, repo]);

    const state = useMemo(
        () => ({
            store,
            today,
            status,
            recovery,
            migrationReport,
            repairNotes,
            persistError,
            lastSavedAt,
            storageBytes: repo.estimateUsageBytes(),
        }),
        // storageBytes recalculado junto com o store
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [store, today, status, recovery, migrationReport, repairNotes, persistError, lastSavedAt]
    );

    return (
        <FinanceActionsContext.Provider value={actions}>
            <FinanceStateContext.Provider value={state}>{children}</FinanceStateContext.Provider>
        </FinanceActionsContext.Provider>
    );
}

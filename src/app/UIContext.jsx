import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { currentMonthKey } from "../domain/dates";
import { useFinanceActions } from "../state/contexts";
import { TransactionSheet } from "../features/transactions/TransactionSheet";
import { QuickCaptureDialog } from "../features/transactions/QuickCaptureDialog";

const UIContext = createContext(null);

function UndoToast({ message, onUndo, closeToast }) {
    return (
        <span style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", width: "100%" }}>
            <span>{message}</span>
            <button
                type="button"
                onClick={() => {
                    onUndo();
                    closeToast?.();
                }}
                style={{ fontWeight: 700, textDecoration: "underline", minHeight: 36, padding: "0 4px" }}
            >
                Desfazer
            </button>
        </span>
    );
}

export function UIProvider({ children }) {
    const actions = useFinanceActions();
    const [month, setMonth] = useState(() => currentMonthKey());
    const [sheet, setSheet] = useState(null);
    const [quickOpen, setQuickOpen] = useState(false);

    const openTransaction = useCallback((opts = {}) => setSheet({ mode: "create", ...opts, key: Date.now() }), []);
    const closeTransaction = useCallback(() => setSheet(null), []);

    /** Exclui com possibilidade de desfazer (regra: toda exclusão é recuperável ou confirmada). */
    const deleteWithUndo = useCallback(
        (ids, message) => {
            const removed = actions.deleteTransactions(ids);
            if (!removed.length) return;
            toast(<UndoToast message={message ?? (removed.length === 1 ? "Transação excluída." : `${removed.length} transações excluídas.`)} onUndo={() => actions.restoreTransactions(removed)} />, {
                autoClose: 7000,
                closeOnClick: false,
            });
        },
        [actions]
    );

    const value = useMemo(
        () => ({
            month,
            setMonth,
            resetMonth: () => setMonth(currentMonthKey()),
            openTransaction,
            closeTransaction,
            openQuickCapture: () => setQuickOpen(true),
            deleteWithUndo,
        }),
        [month, openTransaction, closeTransaction, deleteWithUndo]
    );

    return (
        <UIContext.Provider value={value}>
            {children}
            {sheet && <TransactionSheet key={sheet.key} mode={sheet.mode} tx={sheet.tx} defaults={sheet.defaults} open onClose={closeTransaction} />}
            {quickOpen && <QuickCaptureDialog open onClose={() => setQuickOpen(false)} />}
        </UIContext.Provider>
    );
}

export function useUI() {
    const ctx = useContext(UIContext);
    if (!ctx) throw new Error("useUI deve ser usado dentro de UIProvider");
    return ctx;
}

import { createContext, useContext } from "react";

export const FinanceStateContext = createContext(null);
export const FinanceActionsContext = createContext(null);

export function useFinance() {
    const ctx = useContext(FinanceStateContext);
    if (!ctx) throw new Error("useFinance deve ser usado dentro de FinanceProvider");
    return ctx;
}

export function useFinanceActions() {
    const ctx = useContext(FinanceActionsContext);
    if (!ctx) throw new Error("useFinanceActions deve ser usado dentro de FinanceProvider");
    return ctx;
}

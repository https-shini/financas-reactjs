import { useCallback, useMemo } from "react";
import { useFinance } from "../state/contexts";
import { formatMoney } from "../domain/money";

/** Formatação de moeda conforme as preferências regionais do usuário. */
export function useFormat() {
    const { store } = useFinance();
    const { locale, currency, hideBalances } = store.settings;
    const money = useCallback((cents, opts = {}) => formatMoney(cents, { locale, currency, ...opts }), [locale, currency]);
    return useMemo(() => ({ money, locale, currency, hideBalances }), [money, locale, currency, hideBalances]);
}

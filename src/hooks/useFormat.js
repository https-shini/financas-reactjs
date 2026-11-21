import { useCallback, useMemo } from "react";
import { useFinance } from "../state/contexts";
import { formatMoney } from "../domain/money";

/** Formatação de moeda conforme as preferências regionais do usuário. */
export function useFormat() {
    const { store } = useFinance();
    const { locale, currency, hideBalances } = store.settings;
    const money = useCallback((cents, opts = {}) => formatMoney(cents, { locale, currency, ...opts }), [locale, currency]);
    /** Para textos de valores pessoais (inclusive só para leitores de tela): respeita "Ocultar valores". */
    const privateMoney = useCallback((cents, opts) => (hideBalances ? "valor oculto" : money(cents, opts)), [hideBalances, money]);
    return useMemo(() => ({ money, privateMoney, locale, currency, hideBalances }), [money, privateMoney, locale, currency, hideBalances]);
}

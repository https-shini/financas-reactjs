// Monta um store válido no próprio navegador, usando os módulos do app servidos pelo Vite.
async function buildStore(page, spec = {}) {
    return page.evaluate(async (spec) => {
        const { createEmptyStore, DEFAULT_ACCOUNT_ID } = await import("/src/domain/defaults.js");
        const { buildTransaction } = await import("/src/domain/transactions.js");
        const { todayISO, addDaysISO } = await import("/src/domain/dates.js");
        const today = todayISO();
        const s = createEmptyStore();
        const now = new Date().toISOString();
        s.settings.onboardingDone = true;
        for (const a of spec.accounts || []) s.accounts.push({ initialBalanceCents: 0, archived: false, color: "#0ea5e9", createdAt: now, updatedAt: now, ...a });
        if (spec.initialBalanceCents != null) s.accounts[0].initialBalanceCents = spec.initialBalanceCents;
        let i = 0;
        for (const t of spec.transactions || []) {
            const date = t.date ?? addDaysISO(today, t.days ?? 0);
            s.transactions.push(buildTransaction({ accountId: DEFAULT_ACCOUNT_ID, categoryId: null, status: "paid", ...t, date }, { id: t.id ?? `fx-${++i}` }));
        }
        Object.assign(s, spec.extra || {});
        return { store: s, today };
    }, spec);
}
module.exports = { buildStore };

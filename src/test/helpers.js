import { createEmptyStore, DEFAULT_ACCOUNT_ID } from "../domain/defaults";
import { buildTransaction } from "../domain/transactions";

/** Storage em memória compatível com a API do localStorage, com cota opcional. */
export function memoryStorage(initial = {}, { quotaBytes = Infinity } = {}) {
    const data = new Map(Object.entries(initial));
    const size = () => [...data.entries()].reduce((s, [k, v]) => s + k.length + v.length, 0);
    return {
        get length() {
            return data.size;
        },
        key: (i) => [...data.keys()][i] ?? null,
        getItem: (k) => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => {
            const prev = data.get(k);
            data.set(k, String(v));
            if (size() > quotaBytes) {
                if (prev === undefined) data.delete(k);
                else data.set(k, prev);
                const err = new Error("quota");
                err.name = "QuotaExceededError";
                throw err;
            }
        },
        removeItem: (k) => data.delete(k),
        clear: () => data.clear(),
        dump: () => Object.fromEntries(data),
    };
}

let seq = 0;
export function tx(overrides = {}) {
    seq += 1;
    return buildTransaction(
        {
            type: "expense",
            amountCents: 1000,
            description: `Lançamento ${seq}`,
            date: "2026-11-10",
            categoryId: null,
            accountId: DEFAULT_ACCOUNT_ID,
            status: "paid",
            ...overrides,
        },
        { now: `2026-11-10T10:00:${String(seq % 60).padStart(2, "0")}.000Z` }
    );
}

export function storeWith(partial = {}) {
    return { ...createEmptyStore(), ...partial };
}

export function card(overrides = {}) {
    return {
        id: "card-1",
        name: "Cartão",
        type: "credit",
        color: "#000000",
        initialBalanceCents: 0,
        archived: false,
        limitCents: 500000,
        closingDay: 5,
        dueDay: 15,
        paymentAccountId: DEFAULT_ACCOUNT_ID,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

export function account(overrides = {}) {
    return {
        id: "acc-2",
        name: "Poupança",
        type: "savings",
        color: "#22c55e",
        initialBalanceCents: 0,
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

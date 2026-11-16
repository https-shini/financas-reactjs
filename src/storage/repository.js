// Camada única de acesso ao armazenamento local. Nenhum componente lê/grava localStorage diretamente.
import {
    storeSchema,
    describeIssues,
    integrityIssues,
    transactionSchema,
    categorySchema,
    accountSchema,
    budgetSchema,
    goalSchema,
    recurrenceSchema,
    settingsSchema,
} from "./schema";

const ITEM_SCHEMAS = {
    transactions: transactionSchema,
    categories: categorySchema,
    accounts: accountSchema,
    budgets: budgetSchema,
    goals: goalSchema,
    recurrences: recurrenceSchema,
};
import { migrateToLatest } from "./migrations";
import { createEmptyStore, DEFAULT_ACCOUNTS, DEFAULT_ACCOUNT_ID, SCHEMA_VERSION } from "../domain/defaults";
import { newId } from "../domain/ids";

export const STORE_KEY = "financas:store";
export const LEGACY_KEY = "transactions";
export const LEGACY_THEME_KEY = "theme";
export const BACKUP_PREFIX = "financas:backup:";
export const CORRUPTED_PREFIX = "financas:corrupted:";
export const MAX_LOCAL_BACKUPS = 3;

export class StorageError extends Error {
    constructor(code, message, cause) {
        super(message);
        this.code = code; // "quota" | "unavailable" | "write"
        this.cause = cause;
    }
}

function isQuotaError(e) {
    return (
        e &&
        (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22 || e.code === 1014)
    );
}

function stamp(now = new Date()) {
    return now.toISOString().replace(/[:.]/g, "-");
}

/**
 * Corrige problemas de integridade recuperáveis sem perder dados:
 * IDs duplicados recebem novos IDs; referências a contas/categorias inexistentes
 * apontam para a conta principal / ficam sem categoria.
 */
export function repairStore(store) {
    const fixes = [];
    if (!store.accounts.some((a) => a.id === DEFAULT_ACCOUNT_ID) && store.accounts.length === 0) {
        store.accounts.push({ ...DEFAULT_ACCOUNTS[0] });
        fixes.push("Conta principal recriada");
    }
    const accountIds = new Set(store.accounts.map((a) => a.id));
    const fallbackAccount = store.accounts.find((a) => a.type !== "credit")?.id ?? store.accounts[0].id;
    const categoryIds = new Set(store.categories.map((c) => c.id));
    const seen = new Set();
    store.transactions = store.transactions.map((tx) => {
        let next = tx;
        if (seen.has(tx.id)) {
            next = { ...next, id: newId() };
            fixes.push("ID duplicado regenerado");
        }
        seen.add(next.id);
        if (!accountIds.has(next.accountId)) {
            next = { ...next, accountId: fallbackAccount };
            fixes.push("Conta inexistente substituída pela principal");
        }
        if (next.toAccountId && !accountIds.has(next.toAccountId)) {
            next = { ...next, toAccountId: fallbackAccount === next.accountId ? store.accounts.find((a) => a.id !== next.accountId)?.id : fallbackAccount };
            if (!next.toAccountId) next = { ...next, type: "expense", toAccountId: undefined };
            fixes.push("Conta de destino inexistente corrigida");
        }
        if (next.categoryId && !categoryIds.has(next.categoryId)) {
            next = { ...next, categoryId: null };
            fixes.push("Categoria inexistente removida da transação");
        }
        return next;
    });
    return fixes;
}

/** Valida e normaliza um store. Retorna { ok, store, errors, fixes }. */
export function validateStore(candidate) {
    const parsed = storeSchema.safeParse(candidate);
    if (!parsed.success) return { ok: false, errors: describeIssues(parsed.error) };
    const store = parsed.data;
    const fixes = integrityIssues(store).length ? repairStore(store) : [];
    return { ok: true, store, fixes };
}

/**
 * Tenta aproveitar o máximo de um store inválido: valida item a item e separa os inválidos.
 */
export function salvageStore(candidate) {
    const base = createEmptyStore();
    const dropped = { transactions: 0, categories: 0, accounts: 0, budgets: 0, goals: 0, recurrences: 0 };
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return { store: base, dropped, kept: 0 };
    let kept = 0;
    for (const [key, schema] of Object.entries(ITEM_SCHEMAS)) {
        const list = Array.isArray(candidate[key]) ? candidate[key] : [];
        const ok = [];
        for (const item of list) {
            const r = schema.safeParse(item);
            if (r.success) ok.push(r.data);
            else dropped[key] += 1;
        }
        kept += ok.length;
        // Sem contas/categorias válidas, mantém os padrões para o app continuar utilizável.
        if ((key === "accounts" || key === "categories") && ok.length === 0) continue;
        base[key] = ok;
    }
    const settings = settingsSchema.safeParse(candidate.settings ?? {});
    if (settings.success) base.settings = settings.data;
    repairStore(base);
    return { store: base, dropped, kept };
}

export function createRepository(storage = globalThis.localStorage, { now = () => new Date() } = {}) {
    function safeGet(key) {
        try {
            return storage.getItem(key);
        } catch (e) {
            throw new StorageError("unavailable", "O armazenamento do navegador não está disponível.", e);
        }
    }

    function write(key, value) {
        try {
            storage.setItem(key, value);
        } catch (e) {
            if (isQuotaError(e)) throw new StorageError("quota", "Espaço de armazenamento do navegador esgotado.", e);
            throw new StorageError("write", "Não foi possível gravar os dados no navegador.", e);
        }
    }

    function listKeys(prefix) {
        const keys = [];
        try {
            for (let i = 0; i < storage.length; i += 1) {
                const k = storage.key(i);
                if (k && k.startsWith(prefix)) keys.push(k);
            }
        } catch {
            return [];
        }
        return keys.sort();
    }

    /** Guarda uma cópia local (preventiva). Mantém as últimas MAX_LOCAL_BACKUPS. */
    function saveLocalBackup(reason, payload) {
        const key = `${BACKUP_PREFIX}${stamp(now())}:${reason}`;
        const body = JSON.stringify({ reason, createdAt: now().toISOString(), payload });
        try {
            write(key, body);
        } catch (e) {
            // Sem espaço: remove a cópia mais antiga e tenta uma vez mais.
            const keys = listKeys(BACKUP_PREFIX);
            if (keys.length) {
                storage.removeItem(keys[0]);
                write(key, body);
            } else throw e;
        }
        const keys = listKeys(BACKUP_PREFIX);
        while (keys.length > MAX_LOCAL_BACKUPS) storage.removeItem(keys.shift());
        return key;
    }

    function listLocalBackups() {
        return listKeys(BACKUP_PREFIX)
            .map((key) => {
                try {
                    const parsed = JSON.parse(safeGet(key));
                    return { key, reason: parsed.reason, createdAt: parsed.createdAt, payload: parsed.payload };
                } catch {
                    return { key, reason: "ilegível", createdAt: null, payload: null };
                }
            })
            .reverse();
    }

    /**
     * Carrega os dados. Nunca lança erro para o app: retorna um estado descritivo.
     * status: "ok" | "new" | "migrated" | "recovery"
     */
    function load() {
        let raw;
        try {
            raw = safeGet(STORE_KEY);
        } catch (e) {
            return { status: "recovery", reason: "unavailable", message: e.message, store: createEmptyStore(), persist: false };
        }

        if (raw === null) {
            const legacyRaw = safeGet(LEGACY_KEY);
            const legacyTheme = safeGet(LEGACY_THEME_KEY);
            if (legacyRaw === null) {
                const store = createEmptyStore();
                if (legacyTheme === "light" || legacyTheme === "dark") store.settings.theme = legacyTheme;
                return { status: "new", store };
            }
            // Migração v1 -> v2 com backup preventivo. A chave antiga é mantida intacta.
            let legacy;
            try {
                legacy = JSON.parse(legacyRaw);
            } catch {
                const corruptedKey = `${CORRUPTED_PREFIX}${stamp(now())}:legacy`;
                try {
                    write(corruptedKey, legacyRaw);
                } catch {
                    /* a chave antiga continua preservada */
                }
                return {
                    status: "recovery",
                    reason: "legacy-corrupted",
                    message: "Os dados da versão anterior estão corrompidos e não puderam ser lidos.",
                    raw: legacyRaw,
                    salvage: { store: createEmptyStore(), dropped: { transactions: 0 }, kept: 0 },
                    store: createEmptyStore(),
                };
            }
            let backupKey = null;
            try {
                backupKey = saveLocalBackup("pre-migracao-v1", { [LEGACY_KEY]: legacy, [LEGACY_THEME_KEY]: legacyTheme });
            } catch {
                backupKey = null; // a chave "transactions" original permanece como cópia de segurança
            }
            const { store, report } = migrateToLatest(legacy, { now: now(), legacyTheme, backupKey });
            const v = validateStore(store);
            if (!v.ok) {
                return { status: "recovery", reason: "migration-invalid", message: v.errors.join("; "), raw: legacyRaw, salvage: salvageStore(store), store: createEmptyStore() };
            }
            return { status: "migrated", store: v.store, report };
        }

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            const corruptedKey = `${CORRUPTED_PREFIX}${stamp(now())}`;
            try {
                write(corruptedKey, raw);
            } catch {
                /* mantém o original em STORE_KEY; nada é sobrescrito até o usuário decidir */
            }
            return {
                status: "recovery",
                reason: "invalid-json",
                message: "Os dados salvos estão corrompidos (JSON inválido).",
                raw,
                corruptedKey,
                salvage: { store: createEmptyStore(), dropped: {}, kept: 0 },
                store: createEmptyStore(),
            };
        }

        let migrated;
        try {
            migrated = migrateToLatest(data, { now: now() });
        } catch (e) {
            return { status: "recovery", reason: "version", message: e.message, raw, salvage: salvageStore(data), store: createEmptyStore() };
        }
        const v = validateStore(migrated.store);
        if (!v.ok) {
            const corruptedKey = `${CORRUPTED_PREFIX}${stamp(now())}`;
            try {
                write(corruptedKey, raw);
            } catch {
                /* original permanece em STORE_KEY */
            }
            return {
                status: "recovery",
                reason: "invalid-schema",
                message: `Alguns dados salvos não passaram na validação: ${v.errors.join("; ")}`,
                raw,
                corruptedKey,
                salvage: salvageStore(data),
                store: createEmptyStore(),
            };
        }
        return { status: "ok", store: v.store, fixes: v.fixes, report: migrated.report };
    }

    /** Grava o store. Lança StorageError (quota/write) para a camada de estado tratar. */
    function save(store) {
        if (store.schemaVersion !== SCHEMA_VERSION) throw new StorageError("write", "Versão de schema inesperada ao salvar.");
        write(STORE_KEY, JSON.stringify(store));
    }

    function readRaw(key) {
        return safeGet(key);
    }

    function estimateUsageBytes() {
        let total = 0;
        try {
            for (let i = 0; i < storage.length; i += 1) {
                const k = storage.key(i);
                total += (k.length + (storage.getItem(k)?.length ?? 0)) * 2;
            }
        } catch {
            return null;
        }
        return total;
    }

    return { load, save, saveLocalBackup, listLocalBackups, readRaw, estimateUsageBytes };
}

import { validateStore } from "./repository";
import { migrateToLatest } from "./migrations";
import { SCHEMA_VERSION } from "../domain/defaults";

export const BACKUP_APP_ID = "financas-reactjs";
export const BACKUP_FORMAT_VERSION = 1;
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

export function createBackup(store, now = new Date()) {
    return {
        app: BACKUP_APP_ID,
        kind: "backup",
        backupVersion: BACKUP_FORMAT_VERSION,
        schemaVersion: SCHEMA_VERSION,
        exportedAt: now.toISOString(),
        data: store,
    };
}

export function backupFileName(now = new Date()) {
    const d = now.toISOString().slice(0, 10);
    return `financas-backup-${d}.json`;
}

export function summarizeStore(store) {
    const dates = store.transactions.map((t) => t.date).sort();
    return {
        transactions: store.transactions.length,
        categories: store.categories.length,
        accounts: store.accounts.filter((a) => a.type !== "credit").length,
        cards: store.accounts.filter((a) => a.type === "credit").length,
        budgets: store.budgets.length,
        goals: store.goals.length,
        recurrences: store.recurrences.length,
        firstDate: dates[0] ?? null,
        lastDate: dates[dates.length - 1] ?? null,
    };
}

/**
 * Lê e valida um arquivo de backup. Aceita:
 *  - backup v2 deste app (envelope { app, kind, data })
 *  - store v2 "cru"
 *  - lista de transações da v1 (array) — migrada na hora
 * Nunca altera os dados atuais: apenas devolve uma prévia validada.
 */
export function parseBackupText(text, { now = new Date() } = {}) {
    if (typeof text !== "string" || !text.trim()) return { ok: false, errors: ["Arquivo vazio."] };
    if (text.length > MAX_BACKUP_BYTES) return { ok: false, errors: ["Arquivo grande demais para um backup (limite de 20 MB)."] };
    let json;
    try {
        json = JSON.parse(text);
    } catch {
        return { ok: false, errors: ["O arquivo não é um JSON válido."] };
    }
    let payload = json;
    let meta = { exportedAt: null, source: "store" };
    if (json && typeof json === "object" && !Array.isArray(json) && json.kind === "backup") {
        if (json.app !== BACKUP_APP_ID) return { ok: false, errors: ["Este backup não foi gerado por este aplicativo."] };
        payload = json.data;
        meta = { exportedAt: json.exportedAt ?? null, source: "backup" };
    } else if (Array.isArray(json)) {
        meta = { exportedAt: null, source: "legacy-v1" };
    }
    let migrated;
    try {
        migrated = migrateToLatest(payload, { now });
    } catch (e) {
        return { ok: false, errors: [e.message] };
    }
    const v = validateStore(migrated.store);
    if (!v.ok) return { ok: false, errors: ["O backup contém dados inválidos:", ...v.errors] };
    return { ok: true, store: v.store, summary: summarizeStore(v.store), meta, fixes: v.fixes ?? [], report: migrated.report };
}

/** Dispara o download de um arquivo no navegador. */
export function downloadText(content, filename, mime = "application/json") {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBackup(store, now = new Date()) {
    downloadText(JSON.stringify(createBackup(store, now), null, 2), backupFileName(now));
}

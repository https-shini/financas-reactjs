// Histórico de migrações do armazenamento.
// v1 (até a versão 1.x do app): chave "transactions" com [{ id, desc, amount, expense }], sem data.
// v2: chave "financas:store" com o modelo completo (centavos, datas, contas, categorias...).
import { createEmptyStore, DEFAULT_ACCOUNT_ID, SCHEMA_VERSION } from "../domain/defaults";
import { numberToCents, parseMoneyString } from "../domain/money";
import { cleanText, DESCRIPTION_MAX } from "../domain/transactions";
import { newId } from "../domain/ids";
import { todayISO } from "../domain/dates";

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&#x2F;": "/", "&nbsp;": " " };

/**
 * Desfaz o escape HTML que o DOMPurify aplicava indevidamente às descrições na v1
 * ("Pão &amp; café" => "Pão & café"). Decodifica repetidamente para casos duplamente escapados.
 */
export function decodeHtmlEntities(text) {
    let s = String(text ?? "");
    for (let i = 0; i < 3; i += 1) {
        const next = s.replace(/&(amp|lt|gt|quot|nbsp|#39|#x27|#x2F);/g, (m) => ENTITIES[m] ?? m);
        if (next === s) break;
        s = next;
    }
    return s;
}

function legacyAmountToCents(amount) {
    if (typeof amount === "number") return numberToCents(Math.abs(amount));
    if (typeof amount === "string") {
        // O formulário v1 usava <input type="number">: separador decimal sempre ".".
        const c = parseMoneyString(amount.trim(), { decimal: amount.includes(",") && !amount.includes(".") ? "," : "." });
        return c === null ? null : Math.abs(c);
    }
    return null;
}

/**
 * Migra a lista de transações v1 para um store v2.
 * Itens inválidos (sem valor numérico ou valor zero) NÃO são descartados em silêncio:
 * ficam preservados em meta.legacyRejected e são listados no relatório.
 */
export function migrateV1ToV2(legacyList, { now = new Date(), legacyTheme = null, backupKey = null } = {}) {
    const store = createEmptyStore();
    const migratedAt = now.toISOString();
    const date = todayISO(now);
    const rejected = [];
    let decoded = 0;

    const list = Array.isArray(legacyList) ? legacyList : [];
    list.forEach((item, index) => {
        if (!item || typeof item !== "object") {
            rejected.push({ index, item, reason: "Registro em formato desconhecido" });
            return;
        }
        const cents = legacyAmountToCents(item.amount);
        if (cents === null || cents <= 0) {
            rejected.push({ index, item, reason: "Valor ausente, inválido ou zero" });
            return;
        }
        const rawDesc = String(item.desc ?? "");
        const fixed = decodeHtmlEntities(rawDesc);
        if (fixed !== rawDesc) decoded += 1;
        const description = cleanText(fixed, DESCRIPTION_MAX) || "Sem descrição";
        const isExpense = item.expense === true || item.expense === "true";
        // createdAt crescente preserva a ordem original de inserção.
        const createdAt = new Date(now.getTime() + index).toISOString();
        store.transactions.push({
            id: newId(),
            type: isExpense ? "expense" : "income",
            amountCents: cents,
            description,
            date,
            categoryId: null,
            accountId: DEFAULT_ACCOUNT_ID,
            status: "paid",
            createdAt,
            updatedAt: createdAt,
        });
    });

    if (legacyTheme === "light" || legacyTheme === "dark") store.settings.theme = legacyTheme;
    // Quem já usava o app não precisa do onboarding.
    if (list.length > 0) store.settings.onboardingDone = true;
    if (rejected.length) store.meta.legacyRejected = rejected.map((r) => ({ ...r }));

    const report = {
        from: 1,
        to: SCHEMA_VERSION,
        at: migratedAt,
        total: list.length,
        migrated: store.transactions.length,
        rejected: rejected.length,
        descriptionsRepaired: decoded,
        assignedDate: date,
        backupKey,
    };
    store.meta.migrations.push(report);
    return { store, report, rejected };
}

/**
 * Leva um objeto de qualquer versão conhecida para a versão atual.
 * Retorna { store, report } ou lança erro para versões desconhecidas/futuras.
 */
export function migrateToLatest(data, opts = {}) {
    if (Array.isArray(data)) return migrateV1ToV2(data, opts);
    if (!data || typeof data !== "object") throw new Error("Formato de dados não reconhecido.");
    const version = data.schemaVersion;
    if (version === SCHEMA_VERSION) return { store: data, report: null };
    if (typeof version === "number" && version > SCHEMA_VERSION) {
        throw new Error(`Os dados são de uma versão mais nova do aplicativo (schema ${version}). Atualize o aplicativo.`);
    }
    throw new Error(`Versão de dados desconhecida: ${String(version)}`);
}

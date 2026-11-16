import { describe, expect, it } from "vitest";
import { createRepository, STORE_KEY, LEGACY_KEY, BACKUP_PREFIX, CORRUPTED_PREFIX } from "./repository";
import { decodeHtmlEntities, migrateV1ToV2 } from "./migrations";
import { createBackup, parseBackupText } from "./backup";
import { memoryStorage, tx } from "../test/helpers";
import { createEmptyStore } from "../domain/defaults";

const fixedNow = () => new Date(2026, 10, 16, 10, 0, 0);

const legacy = [
    { id: 120, desc: "Salário", amount: "5000", expense: false },
    { id: 120, desc: "Pão &amp; café &lt;3", amount: "10.5", expense: false }, // id colidindo + texto corrompido pelo DOMPurify
    { id: 7, desc: "Freela", amount: 1200, expense: false },
    { id: 8, desc: "Mercado", amount: "742.35", expense: true },
    { id: 9, desc: "Inválido", amount: "abc", expense: true },
    { id: 10, desc: "Zero", amount: "0", expense: true },
];

describe("migração v1 → v2", () => {
    it("converte valores para centavos, corrige texto e gera ids únicos", () => {
        const { store, report } = migrateV1ToV2(legacy, { now: fixedNow(), legacyTheme: "light" });
        expect(store.transactions.map((t) => t.amountCents)).toEqual([500000, 1050, 120000, 74235]);
        expect(store.transactions[1].description).toBe("Pão & café <3");
        expect(new Set(store.transactions.map((t) => t.id)).size).toBe(4);
        expect(store.transactions.every((t) => t.date === "2026-11-16" && t.status === "paid")).toBe(true);
        expect(store.transactions[3].type).toBe("expense");
        expect(store.settings.theme).toBe("light");
        expect(report).toMatchObject({ total: 6, migrated: 4, rejected: 2, descriptionsRepaired: 1 });
        // Registros rejeitados são preservados, não descartados em silêncio.
        expect(store.meta.legacyRejected).toHaveLength(2);
    });

    it("decodifica entidades HTML duplamente escapadas", () => {
        expect(decodeHtmlEntities("A &amp;amp; B")).toBe("A & B");
        expect(decodeHtmlEntities("sem entidades")).toBe("sem entidades");
    });
});

describe("repositório", () => {
    it("primeiro acesso cria store vazio", () => {
        const r = createRepository(memoryStorage(), { now: fixedNow }).load();
        expect(r.status).toBe("new");
        expect(r.store.categories.length).toBeGreaterThan(10);
    });

    it("migra dados antigos com backup preventivo e mantém a chave antiga intacta", () => {
        const raw = JSON.stringify(legacy);
        const storage = memoryStorage({ [LEGACY_KEY]: raw, theme: "dark" });
        const repo = createRepository(storage, { now: fixedNow });
        const r = repo.load();
        expect(r.status).toBe("migrated");
        expect(r.report.backupKey).toMatch(/^financas:backup:/);
        expect(storage.getItem(LEGACY_KEY)).toBe(raw);
        const backups = repo.listLocalBackups();
        expect(backups[0].payload[LEGACY_KEY]).toEqual(legacy);
        repo.save(r.store);
        // Recarregar não migra de novo.
        const again = repo.load();
        expect(again.status).toBe("ok");
        expect(again.store.transactions).toHaveLength(4);
    });

    it("JSON corrompido entra em modo de recuperação sem sobrescrever e guarda cópia", () => {
        const storage = memoryStorage({ [STORE_KEY]: "{broken" });
        const r = createRepository(storage, { now: fixedNow }).load();
        expect(r.status).toBe("recovery");
        expect(r.reason).toBe("invalid-json");
        expect(storage.getItem(STORE_KEY)).toBe("{broken");
        expect(Object.keys(storage.dump()).some((k) => k.startsWith(CORRUPTED_PREFIX))).toBe(true);
    });

    it("dados parcialmente inválidos oferecem recuperação item a item", () => {
        const store = createEmptyStore();
        store.transactions = [tx(), { ...tx(), amountCents: -5 }, tx()];
        const storage = memoryStorage({ [STORE_KEY]: JSON.stringify(store) });
        const r = createRepository(storage, { now: fixedNow }).load();
        expect(r.status).toBe("recovery");
        expect(r.salvage.store.transactions).toHaveLength(2);
        expect(r.salvage.dropped.transactions).toBe(1);
    });

    it("dados de versão futura não são sobrescritos", () => {
        const storage = memoryStorage({ [STORE_KEY]: JSON.stringify({ schemaVersion: 99 }) });
        const r = createRepository(storage).load();
        expect(r.status).toBe("recovery");
        expect(r.reason).toBe("version");
    });

    it("corrige ids duplicados e referências quebradas", () => {
        const store = createEmptyStore();
        const a = tx();
        store.transactions = [a, { ...a }, { ...tx(), accountId: "nao-existe", categoryId: "cat-x" }];
        const r = createRepository(memoryStorage({ [STORE_KEY]: JSON.stringify(store) })).load();
        expect(r.status).toBe("ok");
        expect(new Set(r.store.transactions.map((t) => t.id)).size).toBe(3);
        expect(r.store.transactions[2].accountId).toBe("acc-principal");
        expect(r.store.transactions[2].categoryId).toBeNull();
        expect(r.fixes.length).toBeGreaterThan(0);
    });

    it("erro de cota é reportado (não silencioso)", () => {
        const repo = createRepository(memoryStorage({}, { quotaBytes: 200 }));
        const store = createEmptyStore();
        expect(() => repo.save(store)).toThrowError(expect.objectContaining({ code: "quota" }));
    });

    it("mantém apenas as últimas cópias locais", () => {
        let t = 0;
        const storage = memoryStorage();
        const repo = createRepository(storage, { now: () => new Date(2026, 0, 1, 0, 0, t++) });
        for (let i = 0; i < 5; i += 1) repo.saveLocalBackup("teste", { i });
        expect(Object.keys(storage.dump()).filter((k) => k.startsWith(BACKUP_PREFIX))).toHaveLength(3);
    });
});

describe("backup e restauração", () => {
    it("ida e volta preserva todos os dados", () => {
        const store = createEmptyStore();
        store.transactions = [tx({ description: "Café & pão" }), tx({ type: "income" })];
        const text = JSON.stringify(createBackup(store, fixedNow()));
        const r = parseBackupText(text);
        expect(r.ok).toBe(true);
        expect(r.store).toEqual(store);
        expect(r.summary.transactions).toBe(2);
        expect(r.meta.source).toBe("backup");
    });

    it("rejeita arquivos inválidos com mensagem clara", () => {
        expect(parseBackupText("não é json").errors[0]).toMatch(/JSON/);
        expect(parseBackupText(JSON.stringify({ kind: "backup", app: "outro", data: {} })).ok).toBe(false);
        const bad = createBackup({ ...createEmptyStore(), transactions: [{ id: 1 }] });
        const r = parseBackupText(JSON.stringify(bad));
        expect(r.ok).toBe(false);
        expect(r.errors.length).toBeGreaterThan(1);
    });

    it("aceita a lista exportada pela versão antiga", () => {
        const r = parseBackupText(JSON.stringify(legacy.slice(0, 2)), { now: fixedNow() });
        expect(r.ok).toBe(true);
        expect(r.meta.source).toBe("legacy-v1");
        expect(r.store.transactions).toHaveLength(2);
    });
});

// Backup, restauração e persistência em condições adversas (cota cheia, arquivos inválidos,
// dados corrompidos). Usa armazenamento em memória: nenhum dado real é tocado.
import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { createRepository, STORE_KEY, LEGACY_KEY, BACKUP_PREFIX, CORRUPTED_PREFIX } from "./repository";
import { createBackup, parseBackupText, MAX_BACKUP_BYTES } from "./backup";
import { createEmptyStore } from "../domain/defaults";
import { buildRecurrence } from "../domain/recurrence";
import { buildBudget } from "../domain/budgets";
import { buildGoal } from "../domain/goals";
import { buildInstallments } from "../domain/installments";
import { memoryStorage, tx, card, account } from "../test/helpers";
import { FinanceProvider } from "../state/FinanceProvider";
import { useFinance, useFinanceActions } from "../state/contexts";
import * as ops from "../state/operations";

function fullStore() {
    const s = createEmptyStore();
    s.accounts.push(account(), card());
    s.transactions = [
        tx({ description: "Pão & café <3 \"aspas\"", notes: "linha 1\nlinha 2" }),
        tx({ type: "income", amountCents: 500000 }),
        tx({ type: "transfer", toAccountId: "acc-2", amountCents: 1000 }),
        tx({ type: "transfer", toAccountId: "card-1", amountCents: 2000, invoiceRef: { cardId: "card-1", month: "2026-11" } }),
        ...buildInstallments({ type: "expense", amountCents: 30000, description: "Parcelado", date: "2026-11-02", accountId: "card-1", categoryId: "cat-compras", status: "paid" }, 3, { today: "2026-11-16", isCardAccount: true }),
    ];
    s.recurrences = [buildRecurrence({ type: "expense", amountCents: 100, description: "Café", accountId: "acc-principal", categoryId: null, frequency: "weekly", startDate: "2026-11-01" }, { id: "r1" })];
    s.budgets = [buildBudget({ categoryId: "cat-mercado", limitCents: 1000, overrides: { "2026-11": 500 } })];
    s.goals = [buildGoal({ name: "Meta", kind: "travel", targetCents: 100000, deadline: "2027-01-31", contributions: [{ id: "c", date: "2026-11-01", amountCents: 100 }] })];
    s.settings = { ...s.settings, theme: "dark", currency: "EUR", hideBalances: true, dismissedSuggestions: ["sub:x"] };
    return ops.generateRecurrences(s, "2026-11-16");
}

function mount(repository) {
    const ref = {};
    function Probe() {
        ref.state = useFinance();
        ref.actions = useFinanceActions();
        return null;
    }
    render(
        <FinanceProvider repository={repository}>
            <Probe />
        </FinanceProvider>
    );
    return ref;
}

describe("backup completo", () => {
    it("ida e volta preserva todos os dados, inclusive texto especial, cartões, parcelas, recorrências, metas e preferências", () => {
        const store = fullStore();
        const r = parseBackupText(JSON.stringify(createBackup(store)));
        expect(r.ok).toBe(true);
        expect(r.store).toEqual(store);
        expect(r.summary).toMatchObject({ cards: 1, accounts: 2, budgets: 1, goals: 1, recurrences: 1 });
    });

    it("rejeita: JSON truncado, app diferente, versão futura, arquivo vazio, gigante e dados inválidos", () => {
        const text = JSON.stringify(createBackup(fullStore()));
        expect(parseBackupText(text.slice(0, text.length - 10)).ok).toBe(false);
        expect(parseBackupText(JSON.stringify({ ...createBackup(fullStore()), app: "outro" })).ok).toBe(false);
        expect(parseBackupText(JSON.stringify({ kind: "backup", app: "financas-reactjs", data: { schemaVersion: 99 } })).errors[0]).toMatch(/versão mais nova/);
        expect(parseBackupText("").ok).toBe(false);
        expect(parseBackupText("x".repeat(MAX_BACKUP_BYTES + 1)).errors[0]).toMatch(/grande/);
        const bad = fullStore();
        bad.transactions[0] = { ...bad.transactions[0], date: "2026-02-30" };
        const r = parseBackupText(JSON.stringify(createBackup(bad)));
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/Data inválida/);
    });

    it("backup com referências quebradas é reparado, não rejeitado", () => {
        const s = fullStore();
        s.transactions.push({ ...s.transactions[0] }); // id duplicado
        s.transactions.push({ ...tx(), categoryId: "cat-removida" });
        const r = parseBackupText(JSON.stringify(createBackup(s)));
        expect(r.ok).toBe(true);
        expect(new Set(r.store.transactions.map((t) => t.id)).size).toBe(r.store.transactions.length);
        expect(r.fixes.length).toBeGreaterThan(0);
    });
});

describe("persistência", () => {
    it("salvar e recarregar devolve exatamente o mesmo store", () => {
        const storage = memoryStorage();
        const store = fullStore();
        createRepository(storage).save(store);
        const loaded = createRepository(storage).load();
        expect(loaded.status).toBe("ok");
        expect(loaded.store).toEqual(store);
    });

    it("provider grava cada alteração; após 'recarregar', os dados continuam lá", () => {
        const storage = memoryStorage();
        const a = mount(createRepository(storage));
        act(() => {
            a.actions.addTransactions([tx({ description: "Persistida" })]);
        });
        expect(JSON.parse(storage.getItem(STORE_KEY)).transactions.map((t) => t.description)).toContain("Persistida");
        const b = createRepository(storage).load();
        expect(b.store.transactions.some((t) => t.description === "Persistida")).toBe(true);
    });

    it("armazenamento cheio: erro visível, dados em memória preservados e último estado salvo intacto", () => {
        const storage = memoryStorage({}, { quotaBytes: 40000 });
        const a = mount(createRepository(storage));
        const savedBefore = storage.getItem(STORE_KEY);
        expect(a.state.persistError).toBeNull();
        act(() => {
            a.actions.addTransactions(Array.from({ length: 200 }, (_, i) => tx({ description: `Item ${i} ${"x".repeat(80)}` })));
        });
        expect(a.state.persistError?.code).toBe("quota");
        expect(a.state.store.transactions).toHaveLength(200); // nada se perde da sessão
        expect(storage.getItem(STORE_KEY)).toBe(savedBefore); // versão anterior não foi corrompida
        let ok;
        act(() => {
            a.actions.deleteTransactions(a.state.store.transactions.slice(0, 190).map((t) => t.id));
        });
        act(() => {
            ok = a.actions.retrySave();
        });
        expect(ok).toBe(true);
        expect(a.state.persistError).toBeNull();
        expect(JSON.parse(storage.getItem(STORE_KEY)).transactions).toHaveLength(10);
    });

    it("restauração: se não houver espaço para a cópia de segurança, nada é substituído", () => {
        const storage = memoryStorage({}, { quotaBytes: 30000 });
        const repo = createRepository(storage);
        const a = mount(repo);
        act(() => {
            a.actions.addTransactions([tx({ description: "Original" })]);
        });
        const big = createEmptyStore();
        big.transactions = Array.from({ length: 150 }, () => tx({ description: "y".repeat(100) }));
        // Ocupa o espaço restante para a cópia de segurança falhar.
        let filler = 0;
        try {
            for (;;) storage.setItem(`ocupado-${filler++}`, "z".repeat(500));
        } catch {
            /* cota atingida */
        }
        expect(() => act(() => a.actions.replaceStore(big, { backupReason: "antes-restauracao" }))).toThrow(/cópia de segurança/);
        expect(a.state.store.transactions.map((t) => t.description)).toEqual(["Original"]);
    });

    it("restauração bem-sucedida guarda cópia dos dados anteriores e mantém só as 3 mais recentes", () => {
        const storage = memoryStorage();
        let t = 0;
        const repo = createRepository(storage, { now: () => new Date(2026, 10, 16, 10, 0, t++) });
        const a = mount(repo);
        act(() => {
            a.actions.addTransactions([tx({ description: "Antes" })]);
        });
        for (let i = 0; i < 4; i += 1) {
            act(() => a.actions.replaceStore(fullStore(), { backupReason: `restauracao-${i}` }));
        }
        const backups = Object.keys(storage.dump()).filter((k) => k.startsWith(BACKUP_PREFIX));
        expect(backups).toHaveLength(3);
        expect(a.state.store.transactions.length).toBe(fullStore().transactions.length);
        const firstCopy = repo.listLocalBackups().at(-1);
        expect(firstCopy.reason).toBe("restauracao-1");
    });

    it("dados corrompidos: modo de recuperação não grava nada até o usuário decidir", () => {
        const storage = memoryStorage({ [STORE_KEY]: '{"schemaVersion":2,"transactions":[' });
        const a = mount(createRepository(storage));
        expect(a.state.status).toBe("recovery");
        expect(storage.getItem(STORE_KEY)).toBe('{"schemaVersion":2,"transactions":[');
        expect(Object.keys(storage.dump()).some((k) => k.startsWith(CORRUPTED_PREFIX))).toBe(true);
        act(() => a.actions.replaceStore(createEmptyStore()));
        expect(a.state.status).toBe("ready");
        expect(JSON.parse(storage.getItem(STORE_KEY)).schemaVersion).toBe(2);
        // A cópia do conteúdo corrompido continua disponível.
        expect(Object.values(storage.dump()).includes('{"schemaVersion":2,"transactions":[')).toBe(true);
    });

    it("migração v1 com JSON ilegível preserva a chave antiga e entra em recuperação", () => {
        const storage = memoryStorage({ [LEGACY_KEY]: "[{quebrado" });
        const r = createRepository(storage).load();
        expect(r.status).toBe("recovery");
        expect(r.reason).toBe("legacy-corrupted");
        expect(storage.getItem(LEGACY_KEY)).toBe("[{quebrado");
    });

    it("migração v1 não roda duas vezes e mantém a chave antiga como cópia", () => {
        const legacy = JSON.stringify([{ id: 1, desc: "A", amount: "10", expense: true }]);
        const storage = memoryStorage({ [LEGACY_KEY]: legacy });
        const a = mount(createRepository(storage));
        expect(a.state.migrationReport.migrated).toBe(1);
        const second = createRepository(storage).load();
        expect(second.status).toBe("ok");
        expect(second.store.transactions).toHaveLength(1);
        expect(storage.getItem(LEGACY_KEY)).toBe(legacy);
    });
});

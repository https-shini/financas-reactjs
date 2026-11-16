import { describe, expect, it } from "vitest";
import * as ops from "./operations";
import { account, card, storeWith, tx } from "../test/helpers";

describe("exclusão e desfazer", () => {
    it("exclui apenas os ids informados (mesmo com descrições iguais)", () => {
        const a = tx({ description: "Café" });
        const b = tx({ description: "Café" });
        const { store, removed } = ops.deleteTransactions(storeWith({ transactions: [a, b] }), [a.id]);
        expect(store.transactions.map((t) => t.id)).toEqual([b.id]);
        expect(ops.restoreTransactions(store, removed).transactions).toHaveLength(2);
    });
    it("rejeita inserção de id duplicado", () => {
        const a = tx();
        expect(() => ops.addTransactions(storeWith({ transactions: [a] }), [a])).toThrow();
    });
});

describe("categorias", () => {
    it("exige tratar movimentações antes de excluir", () => {
        const s = storeWith({ transactions: [tx({ categoryId: "cat-lazer" })] });
        expect(() => ops.deleteCategory(s, "cat-lazer")).toThrow(/movimentações/);
        const next = ops.deleteCategory(s, "cat-lazer", { reassignTo: "cat-outros" });
        expect(next.transactions[0].categoryId).toBe("cat-outros");
        expect(next.categories.some((c) => c.id === "cat-lazer")).toBe(false);
    });
    it("impede nomes duplicados", () => {
        const s = storeWith();
        expect(() => ops.upsertCategory(s, { ...s.categories[0], id: "novo" })).toThrow();
    });
});

describe("contas", () => {
    it("não exclui conta com movimentações", () => {
        const s = storeWith({ accounts: [...storeWith().accounts, account()], transactions: [tx({ accountId: "acc-2" })] });
        expect(() => ops.deleteAccount(s, "acc-2")).toThrow(/Arquive/);
    });
    it("mantém ao menos uma conta ativa", () => {
        const s = storeWith({ accounts: [...storeWith().accounts, card()] });
        expect(() => ops.setAccountArchived(s, "acc-principal", true)).toThrow();
    });
});

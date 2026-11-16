import { describe, expect, it } from "vitest";
import { buildTransaction, cleanText, duplicateInput, effectOnAccount, fingerprint, isRealized, validateTransactionInput } from "./transactions";
import { createEmptyStore, DEFAULT_ACCOUNT_ID } from "./defaults";
import { account } from "../test/helpers";

const store = { ...createEmptyStore(), accounts: [...createEmptyStore().accounts, account()] };
const base = { type: "expense", amountCents: 8590, description: "Mercado", date: "2026-11-16", accountId: DEFAULT_ACCOUNT_ID, categoryId: "cat-mercado", status: "paid" };

describe("validação de transações", () => {
    it("aceita entrada válida", () => {
        expect(validateTransactionInput(base, store).ok).toBe(true);
    });
    it("rejeita valor zero, descrição vazia e data inválida", () => {
        const r = validateTransactionInput({ ...base, amountCents: 0, description: "  ", date: "2026-02-30" }, store);
        expect(r.ok).toBe(false);
        expect(Object.keys(r.errors).sort()).toEqual(["amountCents", "date", "description"]);
    });
    it("transferência exige destino diferente da origem", () => {
        const r = validateTransactionInput({ ...base, type: "transfer", toAccountId: DEFAULT_ACCOUNT_ID }, store);
        expect(r.errors.toAccountId).toBeDefined();
        expect(validateTransactionInput({ ...base, type: "transfer", toAccountId: "acc-2" }, store).ok).toBe(true);
    });
});

describe("texto", () => {
    it("preserva caracteres especiais (sem escape HTML)", () => {
        const t = buildTransaction({ ...base, description: "Pão & café <3" });
        expect(t.description).toBe("Pão & café <3");
    });
    it("remove espaços extras e caracteres de controle", () => {
        expect(cleanText("  a \u0007 b  ")).toBe("a b");
    });
});

describe("efeitos no saldo", () => {
    it("receita soma, despesa subtrai, transferência move entre contas", () => {
        const inc = buildTransaction({ ...base, type: "income" });
        const exp = buildTransaction(base);
        const tr = buildTransaction({ ...base, type: "transfer", toAccountId: "acc-2" });
        expect(effectOnAccount(inc, DEFAULT_ACCOUNT_ID)).toBe(8590);
        expect(effectOnAccount(exp, DEFAULT_ACCOUNT_ID)).toBe(-8590);
        expect(effectOnAccount(tr, DEFAULT_ACCOUNT_ID) + effectOnAccount(tr, "acc-2")).toBe(0);
        expect(tr.categoryId).toBeNull();
    });
    it("pendente e futuro não são realizados", () => {
        expect(isRealized(buildTransaction({ ...base, status: "pending" }), "2026-11-16")).toBe(false);
        expect(isRealized(buildTransaction({ ...base, date: "2026-11-20" }), "2026-11-16")).toBe(false);
        expect(isRealized(buildTransaction(base), "2026-11-16")).toBe(true);
    });
});

describe("ids e duplicação", () => {
    it("gera ids únicos", () => {
        const ids = new Set(Array.from({ length: 2000 }, () => buildTransaction(base).id));
        expect(ids.size).toBe(2000);
    });
    it("duplicar remove vínculos e usa a data informada", () => {
        const t = buildTransaction({ ...base, recurrenceId: "r1", occurrenceDate: "2026-11-01", installment: { group: "g", n: 1, of: 2 } });
        const d = duplicateInput(t, "2026-12-01");
        expect(d.id).toBeUndefined();
        expect(d.recurrenceId).toBeUndefined();
        expect(d.installment).toBeUndefined();
        expect(d.date).toBe("2026-12-01");
    });
    it("fingerprint ignora acentos e caixa", () => {
        const a = buildTransaction({ ...base, description: "Pão de Açúcar" });
        const b = buildTransaction({ ...base, description: "pao de acucar" });
        expect(fingerprint(a)).toBe(fingerprint(b));
    });
});

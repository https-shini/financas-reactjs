import { describe, expect, it } from "vitest";
import { parseQuickEntry } from "./quickCapture";
import { storeWith, account } from "../test/helpers";

const store = storeWith({ accounts: [...storeWith().accounts, account({ id: "acc-nu", name: "Nubank" })] });
const today = "2026-11-16";

describe("captura rápida", () => {
    it("Mercado 85,90 ontem", () => {
        const r = parseQuickEntry("Mercado 85,90 ontem", store, today);
        expect(r.ok).toBe(true);
        expect(r.input).toMatchObject({ type: "expense", amountCents: 8590, description: "Mercado", date: "2026-11-15", categoryId: "cat-mercado", status: "paid" });
    });

    it("receita com dia e milhar", () => {
        const r = parseQuickEntry("recebi salário 5.000 dia 5", store, today);
        expect(r.input).toMatchObject({ type: "income", amountCents: 500000, date: "2026-11-05", categoryId: "cat-salario" });
    });

    it("data explícita, conta mencionada e valor com R$", () => {
        const r = parseQuickEntry("uber R$ 23,50 10/11 nubank", store, today);
        expect(r.input).toMatchObject({ amountCents: 2350, date: "2026-11-10", categoryId: "cat-transporte", accountId: "acc-nu" });
    });

    it("data futura vira pendente e sem valor não é válido", () => {
        expect(parseQuickEntry("aluguel 1800 amanhã", store, today).input.status).toBe("pending");
        const r = parseQuickEntry("padaria", store, today);
        expect(r.ok).toBe(false);
        expect(r.notes[0]).toMatch(/valor/);
    });
});

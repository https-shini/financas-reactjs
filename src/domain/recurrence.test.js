import { describe, expect, it } from "vitest";
import { buildRecurrence, generateOccurrences, monthlyEquivalent, occurrenceDates, virtualOccurrences } from "./recurrence";
import { storeWith } from "../test/helpers";
import { DEFAULT_ACCOUNT_ID } from "./defaults";
import * as ops from "../state/operations";

const rent = buildRecurrence(
    { type: "expense", amountCents: 180000, description: "Aluguel", categoryId: "cat-moradia", accountId: DEFAULT_ACCOUNT_ID, frequency: "monthly", interval: 1, startDate: "2026-01-31" },
    { id: "rec-1", now: "2026-01-01T00:00:00.000Z" }
);

describe("datas de ocorrência", () => {
    it("mensal no dia 31 respeita o último dia de cada mês sem acumular desvio", () => {
        expect(occurrenceDates(rent, "2026-01-01", "2026-04-30")).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
    });
    it("semanal, diária, anual e data final", () => {
        const w = { ...rent, frequency: "weekly", startDate: "2026-11-02", endDate: "2026-11-20" };
        expect(occurrenceDates(w, "2026-11-01", "2026-12-31")).toEqual(["2026-11-02", "2026-11-09", "2026-11-16"]);
        expect(occurrenceDates({ ...rent, frequency: "daily", startDate: "2026-11-01" }, "2026-11-01", "2026-11-03")).toHaveLength(3);
        expect(occurrenceDates({ ...rent, frequency: "yearly", startDate: "2024-02-29" }, "2024-01-01", "2026-12-31")).toEqual(["2024-02-29", "2025-02-28", "2026-02-28"]);
        expect(occurrenceDates({ ...rent, frequency: "monthly", interval: 2, startDate: "2026-01-10" }, "2026-01-01", "2026-06-30")).toEqual(["2026-01-10", "2026-03-10", "2026-05-10"]);
    });
});

describe("geração idempotente", () => {
    it("não duplica ocorrências ao gerar várias vezes", () => {
        let store = storeWith({ recurrences: [{ ...rent, startDate: "2026-10-05" }] });
        store = ops.generateRecurrences(store, "2026-11-16");
        const first = store.transactions.length;
        expect(first).toBe(3); // out, nov, dez (horizonte: fim do mês seguinte)
        store = ops.generateRecurrences(store, "2026-11-16");
        store = ops.generateRecurrences(store, "2026-11-17");
        expect(store.transactions).toHaveLength(first);
        expect(store.transactions.every((t) => t.status === "pending")).toBe(true);
    });

    it("ocorrência excluída não volta; desfazer a exclusão restaura", () => {
        let store = ops.generateRecurrences(storeWith({ recurrences: [{ ...rent, startDate: "2026-10-05" }] }), "2026-11-16");
        const nov = store.transactions.find((t) => t.date === "2026-11-05");
        const { store: after, removed } = ops.deleteTransactions(store, [nov.id]);
        const regen = ops.generateRecurrences(after, "2026-11-16");
        expect(regen.transactions.some((t) => t.date === "2026-11-05")).toBe(false);
        const restored = ops.restoreTransactions(regen, removed);
        expect(restored.transactions.filter((t) => t.date === "2026-11-05")).toHaveLength(1);
        expect(ops.generateRecurrences(restored, "2026-11-16").transactions).toHaveLength(3);
    });

    it("ocorrência editada (valor/data) não é recriada", () => {
        let store = ops.generateRecurrences(storeWith({ recurrences: [{ ...rent, startDate: "2026-11-05" }] }), "2026-11-16");
        const nov = store.transactions.find((t) => t.occurrenceDate === "2026-11-05");
        store = ops.updateTransaction(store, nov.id, { date: "2026-11-08", amountCents: 190000, status: "paid" });
        expect(generateOccurrences(store, "2026-12-31")).toHaveLength(0);
    });
});

describe("edição da série e cancelamento", () => {
    it("alterar valor atualiza pendentes futuros e preserva pagos", () => {
        let store = ops.generateRecurrences(storeWith({ recurrences: [{ ...rent, startDate: "2026-10-05" }] }), "2026-11-16");
        const oct = store.transactions.find((t) => t.date === "2026-10-05");
        store = ops.setTransactionsStatus(store, [oct.id], "paid");
        const { store: next } = ops.saveRecurrence(store, { id: "rec-1", amountCents: 200000 }, "2026-11-16");
        const byDate = Object.fromEntries(next.transactions.map((t) => [t.date, t]));
        expect(byDate["2026-10-05"].amountCents).toBe(180000);
        expect(byDate["2026-12-05"].amountCents).toBe(200000);
        expect(next.transactions).toHaveLength(3);
    });

    it("mudar a frequência regenera pendentes futuros", () => {
        let store = ops.generateRecurrences(storeWith({ recurrences: [{ ...rent, startDate: "2026-11-20" }] }), "2026-11-16");
        expect(store.transactions.map((t) => t.date)).toEqual(["2026-11-20", "2026-12-20"]);
        const { store: next } = ops.saveRecurrence(store, { id: "rec-1", frequency: "weekly" }, "2026-11-16");
        expect(next.transactions.map((t) => t.date)).toEqual(["2026-11-20", "2026-11-27", "2026-12-04", "2026-12-11", "2026-12-18", "2026-12-25"]);
    });

    it("cancelar remove pendentes futuros e para de gerar", () => {
        let store = ops.generateRecurrences(storeWith({ recurrences: [{ ...rent, startDate: "2026-10-05" }] }), "2026-11-16");
        store = ops.cancelRecurrence(store, "rec-1", "2026-11-16");
        expect(store.transactions.map((t) => t.date)).toEqual(["2026-10-05", "2026-11-05"]);
        expect(ops.generateRecurrences(store, "2027-03-01").transactions).toHaveLength(2);
    });

    it("ocorrências virtuais para projeção ignoram as já geradas", () => {
        const store = ops.generateRecurrences(storeWith({ recurrences: [{ ...rent, startDate: "2026-11-05" }] }), "2026-11-16");
        expect(virtualOccurrences(store, "2026-11-16", "2027-02-28").map((v) => v.date)).toEqual(["2027-01-05", "2027-02-05"]);
    });

    it("equivalente mensal", () => {
        expect(monthlyEquivalent({ ...rent, frequency: "yearly", amountCents: 120000 })).toBe(10000);
        expect(monthlyEquivalent({ ...rent, frequency: "weekly", amountCents: 1000 })).toBe(4348);
    });
});

import { describe, expect, it } from "vitest";
import { digitsToCents, formatMoney, numberToCents, parseMoneyString, splitCents, sumCents, variation } from "./money";

describe("parseMoneyString", () => {
    it.each([
        ["1.234,56", 123456],
        ["1234,56", 123456],
        ["1234.56", 123456],
        ["R$ 85,90", 8590],
        ["742.35", 74235],
        ["5000", 500000],
        ["1.200", 120000],
        ["1.234.567,89", 123456789],
        ["1,234.50", 123450],
        ["0,1", 10],
        ["10,005", 1001],
        ["-10,50", -1050],
        ["(10,00)", -1000],
        ["  12  ", 1200],
    ])("%s => %i", (input, expected) => {
        expect(parseMoneyString(input)).toBe(expected);
    });

    it("rejeita textos sem valor", () => {
        expect(parseMoneyString("")).toBeNull();
        expect(parseMoneyString("abc")).toBeNull();
        expect(parseMoneyString("1,2,3,4.5.6")).toBeNull();
        expect(parseMoneyString(null)).toBeNull();
    });

    it("respeita separador explícito", () => {
        expect(parseMoneyString("1.234", { decimal: "." })).toBe(123);
        expect(parseMoneyString("1,5", { decimal: "," })).toBe(150);
    });
});

describe("numberToCents", () => {
    it("evita erros de ponto flutuante", () => {
        expect(numberToCents(0.1 + 0.2)).toBe(30);
        expect(numberToCents(1.005)).toBe(101);
        expect(numberToCents(19.99)).toBe(1999);
        expect(numberToCents(NaN)).toBeNull();
    });
});

describe("formatMoney", () => {
    it("formata em BRL", () => {
        expect(formatMoney(123456)).toBe("R$ 1.234,56");
        expect(formatMoney(-500)).toBe("-R$ 5,00");
        expect(formatMoney(500, { signDisplay: "always" })).toBe("+R$ 5,00");
    });
});

describe("splitCents", () => {
    it("distribui o resto sem perder centavos", () => {
        expect(splitCents(1000, 3)).toEqual([334, 333, 333]);
        expect(sumCents(splitCents(120000, 12))).toBe(120000);
        expect(sumCents(splitCents(99999, 7))).toBe(99999);
    });
    it("valida parâmetros", () => {
        expect(() => splitCents(10, 0)).toThrow();
        expect(() => splitCents(10.5, 2)).toThrow();
    });
});

describe("digitsToCents e variation", () => {
    it("máscara bancária", () => {
        expect(digitsToCents("8590")).toBe(8590);
        expect(digitsToCents("R$ 1.234,56")).toBe(123456);
        expect(digitsToCents("")).toBe(0);
    });
    it("variação percentual", () => {
        expect(variation(150, 100)).toBe(50);
        expect(variation(50, 100)).toBe(-50);
        expect(variation(10, 0)).toBeNull();
        expect(variation(-50, -100)).toBe(50);
    });
});

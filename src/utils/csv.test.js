import { describe, expect, it } from "vitest";
import { csvField, safeCell, toCsv } from "./csv";
import { toRows } from "./exportFiles";
import { storeWith, tx } from "../test/helpers";

describe("proteção contra injeção de fórmulas", () => {
    it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1)", "  =HYPERLINK(\"x\")", "\t=1", "\r=1", "\uff1d1+1"])("neutraliza %j", (v) => {
        expect(safeCell(v).startsWith("'")).toBe(true);
    });
    it("mantém texto comum e valores numéricos/monetários", () => {
        expect(safeCell("Mercado")).toBe("Mercado");
        expect(safeCell("-R$\u00a01.234,56")).toBe("-R$\u00a01.234,56");
        expect(safeCell("-12,50")).toBe("-12,50");
        expect(safeCell("12%")).toBe("12%");
        expect(safeCell("'=x")).toBe("'=x");
    });
    it("campos com ; aspas ou quebra de linha são citados", () => {
        expect(csvField('a;b"c')).toBe('"a;b""c"');
        expect(csvField(-12.5)).toBe("-12,50");
        expect(toCsv([["=x", "ok"]])).toBe("\ufeff'=x;ok");
    });
    it("nomes de categoria e conta definidos pelo usuário também são protegidos", () => {
        const store = storeWith();
        store.categories[0] = { ...store.categories[0], name: "=HYPERLINK(\"http://x\")" };
        store.accounts[0] = { ...store.accounts[0], name: "+conta" };
        const [row] = toRows([tx({ categoryId: store.categories[0].id, description: "@desc" })], store);
        expect(row.Categoria.startsWith("'")).toBe(true);
        expect(row.Conta).toBe("'+conta");
        expect(row.Descrição).toBe("'@desc");
        const [raw] = toRows([tx({ description: "@desc" })], store, { safe: false });
        expect(raw.Descrição).toBe("@desc");
    });
});

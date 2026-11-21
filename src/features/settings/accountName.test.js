import { describe, expect, it } from "vitest";
import { accountNameTaken } from "./accountName";

describe("nome único de conta/cartão", () => {
    const accounts = [
        { id: "a", name: "Conta principal" },
        { id: "b", name: "Nubank  " },
    ];
    it("detecta duplicata ignorando maiúsculas e espaços", () => {
        expect(accountNameTaken(accounts, "conta PRINCIPAL")).toBe(true);
        expect(accountNameTaken(accounts, "  nubank ")).toBe(true);
    });
    it("permite manter o próprio nome ao editar e nomes novos", () => {
        expect(accountNameTaken(accounts, "Conta principal", "a")).toBe(false);
        expect(accountNameTaken(accounts, "Inter")).toBe(false);
        expect(accountNameTaken(accounts, "   ")).toBe(false);
    });
});

import { describe, expect, it } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { STORE_KEY } from "./storage/repository";

const readStore = () => JSON.parse(localStorage.getItem(STORE_KEY));

describe("aplicação", () => {
    it("migra dados da versão antiga e mostra o painel", async () => {
        localStorage.setItem("transactions", JSON.stringify([{ id: 1, desc: "Salário", amount: "5000", expense: false }, { id: 1, desc: "P&atilde;o &amp; caf&eacute;", amount: "10.5", expense: true }]));
        render(<App />);
        expect(await screen.findByRole("heading", { level: 1, name: "Início" })).toBeInTheDocument();
        await waitFor(() => expect(readStore().transactions).toHaveLength(2));
        expect(readStore().transactions.map((t) => t.amountCents)).toEqual([500000, 1050]);
        expect(localStorage.getItem("transactions")).not.toBeNull();
    });

    it("cria uma transação pelo painel de cadastro (valor com máscara, Enter salva)", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Início" });
        await user.click(screen.getAllByRole("button", { name: /Nova transação/ })[0]);
        const dialog = await screen.findByRole("dialog", { name: "Nova transação" });
        const amount = within(dialog).getByLabelText("Valor");
        await user.type(amount, "8590");
        expect(amount).toHaveValue("85,90");
        await user.type(within(dialog).getByRole("textbox", { name: "Descrição" }), "Mercado & feira{Enter}");
        await waitFor(() => expect(screen.queryByRole("dialog", { name: "Nova transação" })).not.toBeInTheDocument());
        const [tx] = readStore().transactions;
        expect(tx).toMatchObject({ amountCents: 8590, description: "Mercado & feira", type: "expense", status: "paid" });
    });

    it("não salva com campos inválidos e mostra os erros", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Início" });
        await user.click(screen.getAllByRole("button", { name: /Nova transação/ })[0]);
        const dialog = await screen.findByRole("dialog", { name: "Nova transação" });
        await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
        expect(within(dialog).getByText("Informe um valor maior que zero.")).toBeInTheDocument();
        expect(within(dialog).getByText("Informe uma descrição.")).toBeInTheDocument();
        expect(readStore().transactions).toHaveLength(0);
    });

    it("dados corrompidos abrem a tela de recuperação sem apagar nada", async () => {
        localStorage.setItem(STORE_KEY, "{corrompido");
        render(<App />);
        expect(await screen.findByRole("heading", { name: "Recuperação de dados" })).toBeInTheDocument();
        expect(localStorage.getItem(STORE_KEY)).toBe("{corrompido");
        expect(screen.getByRole("button", { name: "Baixar cópia" })).toBeInTheDocument();
    });
});

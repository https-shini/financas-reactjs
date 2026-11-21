import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";
import { STORE_KEY } from "../../storage/repository";
import { createEmptyStore, DEFAULT_ACCOUNT_ID } from "../../domain/defaults";
import { addDaysISO, todayISO } from "../../domain/dates";
import { billEntries, billSummary, filterEntries, groupByCategory } from "./billsModel";

afterEach(() => window.history.pushState({}, "", "/"));

const TODAY = "2026-11-21";
let seq = 0;
const tx = (over) => ({ id: `t${++seq}`, type: "expense", status: "paid", amountCents: 1000, description: "x", accountId: DEFAULT_ACCOUNT_ID, categoryId: null, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", ...over });

function fixture(today = TODAY) {
    const store = createEmptyStore();
    const card = { id: "card", name: "Cartão", type: "credit", color: "#000", closingDay: 5, dueDay: 12, limitCents: 500000, initialBalanceCents: 0, archived: false, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
    store.accounts.push(card);
    const d = (n) => addDaysISO(today, n);
    store.transactions = [
        tx({ description: "Luz", date: d(-3), status: "pending", amountCents: 20000 }), // a pagar, atrasada
        tx({ description: "Aluguel", date: d(5), status: "pending", amountCents: 150000 }), // a pagar, 7 dias
        tx({ description: "Mercado pago", date: today, amountCents: 30000 }), // paga
        tx({ description: "Compra no cartão", date: d(-1), accountId: "card", amountCents: 9000 }), // vira fatura
        tx({ description: "Freela", type: "income", date: d(-2), status: "pending", amountCents: 80000 }), // a receber, atrasada
        tx({ description: "Salário", type: "income", date: d(10), status: "pending", amountCents: 500000 }), // a receber
        tx({ description: "Bônus", type: "income", date: today, amountCents: 10000 }), // recebida
        tx({ description: "Reserva", type: "transfer", date: d(2), status: "pending", toAccountId: "card", amountCents: 1000 }), // pagamento de fatura agendado
    ];
    return store;
}

describe("modelo de Contas a Pagar / a Receber", () => {
    it("separa os módulos sem misturar receitas e despesas", () => {
        const store = fixture();
        const pay = billEntries(store, TODAY, "payable");
        const rec = billEntries(store, TODAY, "receivable");
        expect(pay.open.map((e) => e.description)).toEqual(expect.arrayContaining(["Luz", "Aluguel", "Reserva"]));
        expect(pay.open.some((e) => e.kind === "invoice")).toBe(true); // fatura do cartão em aberto
        expect(pay.open.some((e) => e.description === "Compra no cartão")).toBe(false); // compra no cartão entra pela fatura
        expect(pay.open.every((e) => e.tx?.type !== "income")).toBe(true);
        expect(pay.settled.map((e) => e.description)).toEqual(["Mercado pago"]);
        expect(rec.open.map((e) => e.description)).toEqual(["Freela", "Salário"]);
        expect(rec.settled.map((e) => e.description)).toEqual(["Bônus"]);
    });

    it("calcula indicadores do módulo", () => {
        const store = fixture();
        const s = billSummary(billEntries(store, TODAY, "receivable"), TODAY, "2026-11");
        expect(s).toMatchObject({ openCents: 580000, openCount: 2, overdueCents: 80000, overdueCount: 1, weekCount: 0, settledMonthCents: 10000, settledMonthCount: 1 });
        expect(s.next.description).toBe("Salário");
        const p = billSummary(billEntries(store, TODAY, "payable"), TODAY, "2026-11");
        expect(p.overdueCents).toBe(20000);
        expect(p.settledMonthCents).toBe(30000);
    });

    it("agrupa por categoria e filtra por texto e tipo", () => {
        const store = fixture();
        const { open } = billEntries(store, TODAY, "payable");
        const groups = groupByCategory(open);
        expect(groups.find((g) => g.key === "__invoice").count).toBeGreaterThanOrEqual(2);
        expect(filterEntries(open, { query: "alug" }).map((e) => e.description)).toEqual(["Aluguel"]);
        expect(filterEntries(open, { source: "invoices" }).every((e) => e.isInvoice)).toBe(true);
        expect(filterEntries(open, { source: "bills" }).some((e) => e.isInvoice)).toBe(false);
    });
});

describe("páginas Contas a Pagar e Contas a Receber", () => {
    const seed = () => localStorage.setItem(STORE_KEY, JSON.stringify(fixture(todayISO())));
    const readStore = () => JSON.parse(localStorage.getItem(STORE_KEY));

    it("Contas a pagar: indicadores próprios, grupos por vencimento e marcar como pago", async () => {
        seed();
        window.history.pushState({}, "", "/contas-a-pagar");
        const user = userEvent.setup();
        render(<App />);
        expect(await screen.findByRole("heading", { level: 1, name: "Contas a pagar" })).toBeInTheDocument();
        for (const k of ["Total a pagar", "Em atraso", "Vence em 7 dias"]) expect(screen.getByRole("region", { name: k })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /Em atraso/, level: 3 })).toBeInTheDocument();
        expect(screen.queryByText("Salário")).toBeNull(); // nada de receitas aqui
        await user.click(screen.getByRole("button", { name: "Marcar como pago: Luz" }));
        await waitFor(() => expect(readStore().transactions.find((t) => t.description === "Luz").status).toBe("paid"));
        await user.click(within(screen.getByRole("radiogroup", { name: /Visualização/ })).getByRole("radio", { name: "Pagas" }));
        expect(await screen.findByText("Luz")).toBeInTheDocument();
    });

    it("Contas a receber: só receitas, com filtro de busca", async () => {
        seed();
        window.history.pushState({}, "", "/contas-a-receber");
        const user = userEvent.setup();
        render(<App />);
        expect(await screen.findByRole("heading", { level: 1, name: "Contas a receber" })).toBeInTheDocument();
        expect(screen.getByRole("region", { name: "Total a receber" })).toBeInTheDocument();
        expect(screen.queryByText("Aluguel")).toBeNull();
        const list = screen.getByRole("region", { name: "Em aberto" });
        expect(within(list).getByText("Freela")).toBeInTheDocument();
        await user.type(screen.getByRole("searchbox", { name: "Buscar em contas a receber" }), "salá");
        expect(within(list).queryByText("Freela")).toBeNull();
        expect(within(list).getByText("Salário")).toBeInTheDocument();
    });

    it("o endereço antigo de vencimentos leva a Contas a pagar", async () => {
        window.history.pushState({}, "", "/planejamento/vencimentos");
        render(<App />);
        expect(await screen.findByRole("heading", { level: 1, name: "Contas a pagar" })).toBeInTheDocument();
    });
});

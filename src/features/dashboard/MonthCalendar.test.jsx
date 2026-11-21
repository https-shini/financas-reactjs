import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";
import { createEmptyStore } from "../../domain/defaults";
import { addDaysISO, addMonthsToKey, currentMonthKey, formatMonthLabel, todayISO } from "../../domain/dates";
import { buildCalendar, defaultSelectedDate } from "./calendarModel";

afterEach(() => window.history.pushState({}, "", "/"));

describe("modelo do calendário", () => {
    const tx = (over) => ({ id: Math.random().toString(36).slice(2), type: "expense", status: "paid", amountCents: 1000, description: "x", ...over });

    it("monta semanas completas de segunda a domingo e soma entradas, saídas e pendências por dia", () => {
        const store = createEmptyStore();
        store.transactions = [
            tx({ date: "2026-11-10", type: "income", amountCents: 500000 }),
            tx({ date: "2026-11-10", amountCents: 12345 }),
            tx({ date: "2026-11-10", type: "transfer", amountCents: 999 }),
            tx({ date: "2026-11-05", status: "pending", amountCents: 2000 }),
            tx({ date: "2026-11-25", status: "pending", amountCents: 3000 }),
        ];
        const { weeks, days } = buildCalendar(store, "2026-11", "2026-11-21");
        expect(weeks.every((w) => w.length === 7)).toBe(true);
        expect(weeks[0][0].date).toBe("2026-10-26"); // segunda-feira antes de 01/11 (domingo)
        expect(weeks.at(-1)[6].date).toBe("2026-12-06");
        expect(days.get("2026-10-26").inMonth).toBe(false);
        expect(days.get("2026-11-21").isToday).toBe(true);
        const d10 = days.get("2026-11-10");
        expect(d10).toMatchObject({ incomeCents: 500000, expenseCents: 12345 }); // transferência não entra
        expect(d10.transactions).toHaveLength(3);
        expect(days.get("2026-11-05")).toMatchObject({ pendingCount: 1, overdueCount: 1 });
        expect(days.get("2026-11-25")).toMatchObject({ pendingCount: 1, overdueCount: 0 });
    });

    it("seleciona hoje no mês atual e o dia 1 nos outros meses", () => {
        expect(defaultSelectedDate("2026-11", "2026-11-21")).toBe("2026-11-21");
        expect(defaultSelectedDate("2026-12", "2026-11-21")).toBe("2026-12-01");
    });
});

describe("calendário na Visão geral", () => {
    it("mostra o mês, seleciona hoje, navega pelas setas e adiciona lançamento no dia escolhido", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Visão geral" });
        const card = screen.getByRole("region", { name: "Calendário" });
        const today = todayISO();
        const grid = within(card).getByRole("group", { name: /Dias do mês/ });
        const selected = within(grid).getByRole("button", { pressed: true });
        expect(selected).toHaveAttribute("data-date", today);
        expect(selected).toHaveAttribute("aria-current", "date");
        expect(within(card).getByRole("heading", { level: 3, name: "Hoje" })).toBeInTheDocument();

        selected.focus();
        await user.keyboard("{ArrowRight}");
        const next = addDaysISO(today, 1);
        expect(within(screen.getByRole("region", { name: "Calendário" })).getByRole("button", { pressed: true })).toHaveAttribute("data-date", next);
        expect(document.activeElement).toHaveAttribute("data-date", next);

        await user.click(within(screen.getByRole("region", { name: "Calendário" })).getByRole("button", { name: "Adicionar neste dia" }));
        const dialog = await screen.findByRole("dialog", { name: "Nova transação" });
        expect(within(dialog).getByLabelText("Data")).toHaveValue(next);
    });

    it("o seletor de mês do painel troca o mês do calendário", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Visão geral" });
        const card = screen.getByRole("region", { name: "Calendário" });
        // Um único seletor de mês na Visão geral (no cabeçalho da página) controla todos os painéis.
        expect(within(card).queryByRole("group", { name: "Mês do calendário" })).toBeNull();
        const picker = screen.getByRole("group", { name: "Mês de referência do painel" });
        await user.click(within(picker).getByRole("button", { name: "Próximo mês" }));
        const nextMonth = addMonthsToKey(currentMonthKey(), 1);
        expect(within(picker).getByText(formatMonthLabel(nextMonth))).toBeInTheDocument();
        expect(within(card).getByRole("button", { pressed: true })).toHaveAttribute("data-date", `${nextMonth}-01`);
        await user.click(within(picker).getByRole("button", { name: "Hoje" }));
        expect(within(card).getByRole("button", { pressed: true })).toHaveAttribute("data-date", todayISO());
    });
});

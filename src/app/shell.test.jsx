import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { STORE_KEY } from "../storage/repository";

afterEach(() => window.history.pushState({}, "", "/"));

describe("shell VELDORA", () => {
    it("sidebar com marca, grupos de navegação e item ativo", async () => {
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Dashboard" });
        // A barra lateral só aparece no desktop (media query); no jsdom ela está oculta, por isso hidden: true.
        expect(screen.getAllByRole("link", { name: "VELDORA — ir para o Dashboard", hidden: true })[0]).toHaveAttribute("href", "/");
        const nav = screen.getByRole("navigation", { name: "Navegação principal", hidden: true });
        for (const g of ["Visão geral", "Financeiro", "Planejamento", "Análises", "Sistema"]) expect(within(nav).getByText(g)).toBeInTheDocument();
        expect(within(nav).getByRole("link", { name: "Dashboard", hidden: true })).toHaveAttribute("aria-current", "page");
        expect(document.title).toContain("VELDORA");
    });

    it("seletor de tema grava a preferência e responde às setas", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Dashboard" });
        const group = screen.getAllByRole("radiogroup", { name: "Tema", hidden: true })[0];
        await user.click(within(group).getByRole("radio", { name: "Tema escuro", hidden: true }));
        await waitFor(() => expect(JSON.parse(localStorage.getItem(STORE_KEY)).settings.theme).toBe("dark"));
        expect(within(group).getByRole("radio", { name: "Tema escuro", hidden: true })).toHaveAttribute("aria-checked", "true");
        await user.keyboard("{ArrowRight}");
        await waitFor(() => expect(JSON.parse(localStorage.getItem(STORE_KEY)).settings.theme).toBe("system"));
    });

    it("página interna do Design System abre por rota própria, fora do menu", async () => {
        window.history.pushState({}, "", "/design-system");
        render(<App />);
        expect(await screen.findByRole("heading", { level: 1, name: "Design System" })).toBeInTheDocument();
        const nav = screen.getByRole("navigation", { name: "Navegação principal", hidden: true });
        expect(within(nav).queryByRole("link", { name: /Design System/, hidden: true })).toBeNull();
    });

    it("páginas internas mostram sobretítulo do grupo e breadcrumbs na barra superior", async () => {
        window.history.pushState({}, "", "/planejamento/metas");
        render(<App />);
        expect(await screen.findByText("03 · Planejamento")).toBeInTheDocument();
        // A trilha fica na barra superior, visível só em telas largas (media query) — por isso hidden: true.
        const crumbs = screen.getByRole("navigation", { name: "Trilha de navegação", hidden: true });
        expect(within(crumbs).getByRole("link", { name: "Dashboard", hidden: true })).toBeInTheDocument();
        expect(within(crumbs).getByText("Metas")).toHaveAttribute("aria-current", "page");
    });
});

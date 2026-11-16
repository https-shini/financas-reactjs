import { afterEach, describe, expect, it } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { STORE_KEY } from "../storage/repository";

afterEach(() => window.history.pushState({}, "", "/"));

describe("shell Finanças", () => {
    it("sidebar com lockup da marca, seções do modelo, contador e item ativo", async () => {
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Visão geral" });
        // A barra lateral só aparece no desktop (media query); no jsdom ela está oculta, por isso hidden: true.
        expect(screen.getByRole("link", { name: "Finanças by GCruz.DEV — ir para a Visão geral", hidden: true })).toHaveAttribute("href", "/");
        const nav = screen.getByRole("navigation", { name: "Navegação principal", hidden: true });
        for (const g of ["Análise", "Financeiro", "Operações", "Ajuda"]) expect(within(nav).getByText(g, { selector: "p > span" })).toBeInTheDocument();
        expect(within(nav).getByRole("link", { name: "Visão geral", hidden: true })).toHaveAttribute("aria-current", "page");
        expect(document.title).toBe("Visão geral · Finanças");
        // Contador de "A pagar e receber" (nenhuma pendência no perfil novo => sem contador).
        expect(within(nav).getByRole("link", { name: "A pagar e receber", hidden: true })).toHaveAttribute("href", "/planejamento/vencimentos");
    });

    it("header: alternância de tema persiste a preferência (Escuro → Claro → Sistema)", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Visão geral" });
        const theme = () => JSON.parse(localStorage.getItem(STORE_KEY))?.settings.theme;
        const toggle = () => screen.getAllByRole("button", { name: /^Tema:/, hidden: true })[0];
        await user.click(toggle()); // padrão "system" → "dark"
        await waitFor(() => expect(theme()).toBe("dark"));
        expect(toggle()).toHaveAccessibleName("Tema: Escuro. Alternar para Claro");
        await user.click(toggle());
        await waitFor(() => expect(theme()).toBe("light"));
        await user.click(toggle());
        await waitFor(() => expect(theme()).toBe("system"));
    });

    it("header: Ctrl+K leva à busca global", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Visão geral" });
        await user.keyboard("{Control>}k{/Control}");
        // No jsdom a busca do desktop está oculta (media query): o atalho cai na busca da página de Transações.
        expect(await screen.findByRole("heading", { level: 1, name: "Transações" })).toBeInTheDocument();
    });

    it("header: notificações listam contas atrasadas e da semana", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Visão geral" });
        const bell = screen.getByRole("button", { name: /^Notificações/ });
        expect(bell).toHaveAccessibleName("Notificações: nenhum aviso");
        await user.click(bell);
        const panel = screen.getByRole("region", { name: "Notificações" });
        expect(within(panel).getByText(/Nenhuma conta atrasada/)).toBeInTheDocument();
        expect(within(panel).getByRole("link", { name: "Ver todos os vencimentos" })).toHaveAttribute("href", "/planejamento/vencimentos");
        await user.keyboard("{Escape}");
        expect(screen.queryByRole("region", { name: "Notificações" })).toBeNull();
        expect(bell).toHaveFocus();
    });

    it("página interna do Design System abre por rota própria, fora do menu", async () => {
        window.history.pushState({}, "", "/design-system");
        render(<App />);
        // Rota carregada sob demanda (lazy): sob carga da suíte inteira pode passar de 1 s.
        expect(await screen.findByRole("heading", { level: 1, name: "Design System" }, { timeout: 5000 })).toBeInTheDocument();
        const nav = screen.getByRole("navigation", { name: "Navegação principal", hidden: true });
        expect(within(nav).queryByRole("link", { name: /Design System/, hidden: true })).toBeNull();
    });

    it("páginas internas: título da página e breadcrumbs Finanças › página no header", async () => {
        window.history.pushState({}, "", "/planejamento/metas");
        render(<App />);
        expect(await screen.findByRole("heading", { level: 1, name: "Planejamento" })).toBeInTheDocument();
        // A trilha fica no header, visível só em telas largas (media query) — por isso hidden: true.
        const crumbs = screen.getByRole("navigation", { name: "Trilha de navegação", hidden: true });
        expect(within(crumbs).getByRole("link", { name: "Finanças", hidden: true })).toHaveAttribute("href", "/");
        expect(within(crumbs).getByText("Metas financeiras")).toHaveAttribute("aria-current", "page");
    });

    it("dashboard: KPIs do mês e transações recentes com filtro", async () => {
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Visão geral" });
        for (const k of ["Entradas", "Saídas", "Taxa de poupança"]) expect(screen.getByRole("region", { name: k })).toBeInTheDocument();
        const filter = screen.getByRole("radiogroup", { name: "Filtrar transações recentes" });
        await user.click(within(filter).getByRole("radio", { name: "Saídas" }));
        expect(within(filter).getByRole("radio", { name: "Saídas" })).toHaveAttribute("aria-checked", "true");
    });

    it("Transações: seleção mantém nome acessível completo e o botão Nova continua disponível", async () => {
        const user = userEvent.setup();
        window.history.pushState({}, "", "/movimentacoes");
        render(<App />);
        await screen.findByRole("heading", { level: 1, name: "Transações" });
        // "Nova" fica oculto só no celular (o botão flutuante "+" assume a ação); continua no DOM.
        expect(screen.getByRole("button", { name: "Nova", hidden: true })).toHaveClass("hide-mobile");
        const toggle = screen.getByRole("button", { name: "Selecionar" });
        await user.click(toggle);
        // No celular o rótulo visível encurta para "Cancelar", mas o nome acessível é o completo.
        expect(screen.getByRole("button", { name: "Cancelar seleção" })).toHaveAttribute("aria-pressed", "true");
    });
});

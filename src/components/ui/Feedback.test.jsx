import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { darkTheme } from "../../design/themes";
import { Tooltip, StatCard, DataTable, Pagination, Breadcrumbs, Alert } from "./Feedback";

const wrap = (ui) => render(
    <ThemeProvider theme={darkTheme}>
        <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
);

describe("componentes de feedback", () => {
    it("Tooltip: botão acessível descrito pelo conteúdo; abre com foco e fecha com Esc", async () => {
        const user = userEvent.setup();
        wrap(<Tooltip content="Soma das contas" label="Sobre o saldo" />);
        const btn = screen.getByRole("button", { name: "Sobre o saldo" });
        const tip = screen.getByRole("tooltip", { hidden: true });
        expect(btn).toHaveAttribute("aria-describedby", tip.id);
        expect(btn).toHaveAccessibleDescription("Soma das contas");
        await user.tab();
        expect(btn).toHaveFocus();
        await user.keyboard("{Escape}");
    });

    it("StatCard: região rotulada, valor, dica e tooltip", () => {
        wrap(<StatCard label="Saldo disponível" value={<span>R$ 10,00</span>} hint="3 contas" tooltip="Explicação" />);
        const region = screen.getByRole("region", { name: "Saldo disponível" });
        expect(within(region).getByText("R$ 10,00")).toBeInTheDocument();
        expect(within(region).getByText("3 contas")).toBeInTheDocument();
        expect(within(region).getByRole("button", { name: "Sobre: Saldo disponível" })).toBeInTheDocument();
    });

    it("DataTable: cabeçalhos com scope e data-label em cada célula (modo cartão no celular)", () => {
        wrap(
            <DataTable
                caption="Teste"
                columns={[
                    { key: "a", header: "Descrição" },
                    { key: "b", header: "Valor", align: "right" },
                ]}
                rows={[{ a: "Mercado", b: "R$ 1,00" }]}
            />
        );
        expect(screen.getByRole("table", { name: "Teste" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Descrição" })).toHaveAttribute("scope", "col");
        expect(screen.getByRole("cell", { name: "Mercado" })).toHaveAttribute("data-label", "Descrição");
        expect(screen.getByRole("cell", { name: "R$ 1,00" })).toHaveAttribute("data-label", "Valor");
    });

    it("DataTable: mostra o estado vazio quando não há linhas", () => {
        wrap(<DataTable columns={[{ key: "a", header: "A" }]} rows={[]} empty={<p>Nada</p>} />);
        expect(screen.getByText("Nada")).toBeInTheDocument();
        expect(screen.queryByRole("table")).toBeNull();
    });

    it("Pagination: página atual, reticências e limites", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        wrap(<Pagination page={1} pageCount={10} onChange={onChange} />);
        expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
        expect(screen.queryByRole("button", { name: "Página 5" })).toBeNull();
        await user.click(screen.getByRole("button", { name: "Próxima página" }));
        expect(onChange).toHaveBeenCalledWith(2);
    });

    it("Pagination: não renderiza com uma página só", () => {
        const { container } = wrap(<Pagination page={1} pageCount={1} onChange={() => {}} />);
        expect(container.querySelector("nav")).toBeNull();
    });

    it("Breadcrumbs: links até a página atual (aria-current)", () => {
        wrap(<Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: "Planejamento" }, { label: "Metas" }]} />);
        const nav = screen.getByRole("navigation", { name: "Trilha de navegação" });
        expect(within(nav).getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/");
        expect(within(nav).getByText("Metas")).toHaveAttribute("aria-current", "page");
    });

    it("Alert: perigo usa role=alert; informação usa role=status", () => {
        wrap(
            <>
                <Alert tone="danger" title="Erro" />
                <Alert tone="info" title="Info" />
            </>
        );
        expect(screen.getByRole("alert")).toHaveTextContent("Erro");
        expect(screen.getByRole("status")).toHaveTextContent("Info");
    });
});

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { VeldoraLogo, VeldoraSymbol, VeldoraAppIcon } from "./VeldoraLogo";
import { SYMBOL_BODY, SYMBOL_FACET, BRAND_COLORS } from "./geometry";

describe("marca VELDORA", () => {
    it("logo com título é uma imagem acessível", () => {
        render(<VeldoraLogo title="VELDORA" />);
        expect(screen.getByRole("img", { name: "VELDORA" })).toBeInTheDocument();
    });

    it("símbolo sem título é decorativo (aria-hidden)", () => {
        const { container } = render(<VeldoraSymbol size={24} />);
        const svg = container.querySelector("svg");
        expect(svg).toHaveAttribute("aria-hidden", "true");
        expect(screen.queryByRole("img")).toBeNull();
    });

    it.each(["color", "onDark", "onLight", "mono"])("variante %s renderiza o símbolo", (tone) => {
        const { container } = render(<VeldoraLogo tone={tone} title={`Logo ${tone}`} />);
        const paths = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d"));
        expect(paths).toContain(SYMBOL_BODY);
    });

    it("ícone do app inclui corpo e faceta do V", () => {
        const { container } = render(<VeldoraAppIcon title="Ícone" />);
        const paths = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d"));
        expect(paths).toEqual(expect.arrayContaining([SYMBOL_BODY, SYMBOL_FACET]));
    });

    it("favicon gerado usa a mesma geometria e cores oficiais (sem imagens externas)", () => {
        const svg = readFileSync("public/favicon.svg", "utf8");
        expect(svg).toContain(SYMBOL_BODY);
        expect(svg.toUpperCase()).toContain(BRAND_COLORS.indigo.toUpperCase());
        expect(svg).not.toMatch(/<image|href="http/);
    });
});

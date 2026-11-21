import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { readFileSync } from "node:fs";
import { darkTheme } from "../design/themes";
import { BrandMark, BrandLockup } from "./BrandLogo";
import { SYMBOL_GLYPH, SYMBOL_TILE, BRAND_COLORS, PRODUCT_NAME, SIGNATURE } from "./geometry";

const wrap = (ui) => render(<ThemeProvider theme={darkTheme}>{ui}</ThemeProvider>);

describe("marca Finanças by GCruz.DEV", () => {
    it("lockup: nome do produto + assinatura, como imagem acessível", () => {
        wrap(<BrandLockup />);
        const img = screen.getByRole("img", { name: "Finanças by GCruz.DEV" });
        expect(img).toHaveTextContent(PRODUCT_NAME);
        expect(img).toHaveTextContent(SIGNATURE.text);
    });

    it("lockup compacto omite a assinatura", () => {
        wrap(<BrandLockup compact title="Finanças" />);
        expect(screen.getByRole("img", { name: "Finanças" })).not.toHaveTextContent("gcruz");
    });

    it("símbolo sem título é decorativo (aria-hidden); com título é imagem", () => {
        const { container } = wrap(<BrandMark size={24} />);
        expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
        wrap(<BrandMark title="Símbolo" />);
        expect(screen.getByRole("img", { name: "Símbolo" })).toBeInTheDocument();
    });

    it("símbolo colorido usa a placa em gradiente violeta e o F; mono usa recorte em currentColor", () => {
        const { container } = wrap(<BrandMark />);
        const paths = [...container.querySelectorAll("path")];
        expect(paths.map((p) => p.getAttribute("d"))).toEqual([SYMBOL_TILE, SYMBOL_GLYPH]);
        expect(paths[0].getAttribute("fill")).toMatch(/^url\(#/);
        const stops = [...container.querySelectorAll("stop")].map((s) => s.getAttribute("stop-color"));
        expect(stops).toEqual([BRAND_COLORS.tile, BRAND_COLORS.tileEnd]);
        const mono = wrap(<BrandMark tone="mono" />).container.querySelector("path");
        expect(mono).toHaveAttribute("fill", "currentColor");
        expect(mono).toHaveAttribute("fill-rule", "evenodd");
    });

    it("favicon gerado é o próprio símbolo, sem imagens externas", () => {
        const svg = readFileSync("public/favicon.svg", "utf8");
        expect(svg).toContain(SYMBOL_GLYPH);
        expect(svg.toUpperCase()).toContain(BRAND_COLORS.tile.toUpperCase());
        expect(svg).not.toMatch(/<image|href="http/);
    });

    it("manifest e index.html usam o nome do produto", () => {
        const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
        expect(manifest.name).toBe("Finanças by GCruz.DEV");
        expect(manifest.theme_color).toBe("#0A0A0C");
        expect(readFileSync("index.html", "utf8")).toMatch(/<title>Finanças/);
    });
});

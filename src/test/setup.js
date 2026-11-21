import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// As páginas são carregadas sob demanda (React.lazy). Sob a carga da suíte inteira, o primeiro
// carregamento de um arquivo pode passar de 1 s: aumenta só o tempo de espera de findBy/waitFor.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
    cleanup();
    localStorage.clear();
});

// jsdom não implementa matchMedia nem ResizeObserver (usados por tema e gráficos).
if (!window.matchMedia) {
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    });
}
if (!window.ResizeObserver) {
    window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}
if (!window.scrollTo) window.scrollTo = () => {};

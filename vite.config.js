import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Os cabeçalhos de segurança (CSP etc.) vêm do vercel.json para que `npm run preview`
// sirva o build exatamente com as mesmas regras de produção.
const vercel = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf-8"));
const productionHeaders = Object.fromEntries((vercel.headers?.find((h) => h.source === "/(.*)")?.headers ?? []).map((h) => [h.key, h.value]));

// outDir "build" mantém compatibilidade com a configuração de deploy (vercel.json › outputDirectory).
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "build",
        sourcemap: false,
        chunkSizeWarningLimit: 900,
    },
    server: { port: 3000 },
    preview: { port: 3000, headers: productionHeaders },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.js"],
        css: false,
        include: ["src/**/*.test.{js,jsx}"],
    },
});

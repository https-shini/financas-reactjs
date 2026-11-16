import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// outDir "build" mantém compatibilidade com a configuração de deploy existente (Vercel/CRA).
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "build",
        sourcemap: false,
        chunkSizeWarningLimit: 900,
    },
    server: { port: 3000 },
    preview: { port: 3000 },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.js"],
        css: false,
        include: ["src/**/*.test.{js,jsx}"],
    },
});

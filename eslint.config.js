import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    { ignores: ["build/**", "dist/**", "coverage/**", "node_modules/**"] },
    {
        files: ["src/**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.browser, ...globals.node, ...globals.vitest },
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { "react-hooks": reactHooks },
        rules: {
            ...js.configs.recommended.rules,
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            // JSX usa variáveis de forma que o core do ESLint não reconhece sem plugin React.
            "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^(_|[A-Z])" }],
        },
    },
];

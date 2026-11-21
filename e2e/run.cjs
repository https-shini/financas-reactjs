// Bateria E2E do Finanças. Uso: npx vite --port 5173 & node e2e/run.cjs  (ONLY=regex filtra testes)
const fs = require("fs");
const path = require("path");
fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
for (const f of fs.readdirSync(path.join(__dirname, "suites")).sort()) require(path.join(__dirname, "suites", f));
require("./harness.cjs").run();

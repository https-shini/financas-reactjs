const fs = require("fs");
const os = require("os");
const path = require("path");
const { test, assert, eq, parseBRL } = require("../harness.cjs");
const { buildStore } = require("../fixtures.cjs");

async function seed(h, spec) {
    const r = await buildStore(h.page, spec);
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), r.store);
    return r;
}
const tmp = (name, content) => {
    const p = path.join(os.tmpdir(), `e2e-${Date.now()}-${name}`);
    fs.writeFileSync(p, content);
    return p;
};

// ---------------- Importação ----------------
test("Importação", "CSV: prévia, importação e detecção de duplicadas na segunda vez", async (h) => {
    await seed(h, {});
    const csv = tmp("imp.csv", "Data;Descrição;Valor\n05/11/2026;Padaria;-12,50\n06/11/2026;Venda bike;350,00\n07/11/2026;\"=SOMA(1;2)\";-1,00\n");
    await h.go("/configuracoes/dados");
    await h.page.getByRole("button", { name: "Importar arquivo" }).click();
    let dlg = h.dialog("Importar movimentações");
    await dlg.getByLabel("Arquivo para importar").setInputFiles(csv);
    await dlg.getByRole("button", { name: /^Importar 3 transação/ }).click();
    const s = await h.waitStore((s) => s.transactions.length === 3, "3 importadas");
    const by = Object.fromEntries(s.transactions.map((t) => [t.description, t]));
    assert(by["=SOMA(1;2)"], "texto com fórmula importado como texto (neutralizado só na exportação)");
    eq([by["Padaria"].type, by["Padaria"].amountCents, by["Padaria"].date], ["expense", 1250, "2026-11-05"], "despesa importada");
    eq([by["Venda bike"].type, by["Venda bike"].amountCents], ["income", 35000], "receita importada");
    await h.page.getByRole("button", { name: "Importar arquivo" }).click();
    dlg = h.dialog("Importar movimentações");
    await dlg.getByLabel("Arquivo para importar").setInputFiles(csv);
    await dlg.getByText(/3 possíveis duplicadas/).waitFor();
    assert(await dlg.getByRole("button", { name: /^Importar/ }).last().isDisabled(), "duplicadas não são importadas por padrão");
});

// ---------------- Exportação ----------------
test("Exportação", "CSV das transações: BOM, separador ';', valores e proteção contra fórmulas", async (h) => {
    await seed(h, { transactions: [{ type: "expense", amountCents: 123456, description: "=HYPERLINK(\"http://x\")", categoryId: "cat-compras" }] });
    await h.go("/movimentacoes");
    await h.page.getByRole("button", { name: "Exportar" }).click();
    const [dl] = await Promise.all([h.page.waitForEvent("download"), h.page.getByRole("menuitem", { name: "CSV (planilha simples)" }).click()]);
    const text = fs.readFileSync(await dl.path(), "utf8");
    assert(text.charCodeAt(0) === 0xfeff, "BOM UTF-8");
    assert(text.split("\n")[0].includes(";"), "separador ;");
    assert(!/[;\n]"?=HYPERLINK/.test(text), `fórmula neutralizada: ${text.slice(0, 200)}`);
    assert(/1\.?234,56/.test(text), "valor exportado");
});

test("Exportação", "Excel, PDF e Word geram arquivos não vazios", async (h) => {
    await seed(h, { transactions: [{ type: "income", amountCents: 1000, description: "Teste" }] });
    await h.go("/movimentacoes");
    for (const [item, ext] of [["Excel (.xlsx)", ".xlsx"], ["PDF", ".pdf"], ["Word (.docx)", ".docx"]]) {
        await h.page.getByRole("button", { name: "Exportar" }).click();
        const [dl] = await Promise.all([h.page.waitForEvent("download", { timeout: 15000 }), h.page.getByRole("menuitem", { name: item }).click()]);
        assert(dl.suggestedFilename().endsWith(ext), `${item}: nome ${dl.suggestedFilename()}`);
        assert(fs.statSync(await dl.path()).size > 500, `${item}: tamanho`);
    }
});

// ---------------- Backup ----------------
test("Backup", "baixar backup e restaurar devolve exatamente os dados salvos", async (h) => {
    await seed(h, { initialBalanceCents: 5000, transactions: [{ id: "keep", type: "expense", amountCents: 777, description: "Antes do backup" }] });
    await h.go("/configuracoes/dados");
    const [dl] = await Promise.all([h.page.waitForEvent("download"), h.page.getByRole("button", { name: "Baixar backup" }).click()]);
    const file = await dl.path();
    const backup = JSON.parse(fs.readFileSync(file, "utf8"));
    const before = await h.store();
    // altera os dados depois do backup
    await h.page.evaluate(() => {
        const s = JSON.parse(localStorage.getItem("financas:store"));
        s.transactions = [];
        localStorage.setItem("financas:store", JSON.stringify(s));
    });
    await h.go("/configuracoes/dados");
    await h.page.getByLabel("Arquivo de backup").setInputFiles(file);
    await h.dialog("Restaurar backup").getByRole("button", { name: "Substituir e restaurar" }).click();
    const after = await h.waitStore((s) => s.transactions.length === 1, "restaurado");
    eq(after.transactions, before.transactions, "transações restauradas");
    eq(after.accounts, before.accounts, "contas restauradas");
    assert(backup && (backup.data || backup.store || backup.transactions), "arquivo de backup com dados");
});

test("Backup", "arquivo de backup inválido é recusado sem alterar os dados", async (h) => {
    await seed(h, { transactions: [{ id: "keep", type: "expense", amountCents: 100, description: "Fica" }] });
    await h.go("/configuracoes/dados");
    await h.page.getByLabel("Arquivo de backup").setInputFiles(tmp("bad.json", '{"schemaVersion":2,"transactions":[{"id":1}]}'));
    await h.page.waitForTimeout(800);
    assert(!(await h.dialog("Restaurar backup").getByRole("button", { name: "Substituir e restaurar" }).isEnabled().catch(() => false)), "restauração não oferecida para arquivo inválido");
    const s = await h.store();
    eq(s.transactions.map((t) => t.id), ["keep"], "dados intactos");
});

// ---------------- Erros e exceções ----------------
test("Resiliência", "dados corrompidos abrem a recuperação sem apagar o conteúdo original", async (h) => {
    await h.page.evaluate(() => localStorage.setItem("financas:store", "{isto não é json"));
    await h.page.goto(require("../harness.cjs").BASE + "/");
    await h.page.getByRole("heading", { name: /Recuperação de dados/ }).waitFor();
    eq(await h.page.evaluate(() => localStorage.getItem("financas:store")), "{isto não é json", "conteúdo original preservado");
    h.errors.length = 0; // o erro de parse é esperado e tratado
});

test("Resiliência", "rota inexistente redireciona para a Visão geral", async (h) => {
    await h.page.goto(require("../harness.cjs").BASE + "/nao-existe/xyz");
    await h.page.getByRole("heading", { level: 1, name: "Visão geral" }).waitFor();
});

// ---------------- Relatórios e simulador ----------------
test("Relatórios", "relatório mensal confere com os lançamentos do mês", async (h) => {
    await seed(h, {
        transactions: [
            { type: "income", amountCents: 400000, description: "Salário", categoryId: "cat-salario" },
            { type: "expense", amountCents: 150000, description: "Aluguel", categoryId: "cat-moradia" },
            { type: "expense", amountCents: 50000, description: "Mercado", categoryId: "cat-mercado", status: "pending" },
        ],
    });
    await h.go("/relatorios/mensal");
    const dl = await h.page.locator("main dl").first().innerText();
    const vals = [...dl.matchAll(/[-+−]?R\$\s?[\d.]+,\d{2}/g)].map((m) => parseBRL(m[0]));
    assert(vals.includes(400000) && (vals.includes(-200000) || vals.includes(200000)) && vals.includes(200000), `resumo do mês: ${dl.replace(/\n/g, " ")}`);
    for (const r of ["/relatorios/anual", "/relatorios/comparar", "/relatorios/projecao", "/relatorios/saude"]) await h.go(r);
});

test("Simulador", "simulações não alteram os dados reais", async (h) => {
    await seed(h, { transactions: [{ type: "expense", amountCents: 100000, description: "Gasto", categoryId: "cat-lazer" }] });
    const before = await h.store();
    await h.go("/planejamento/simulador");
    for (const input of await h.page.locator("main input").all()) {
        const type = await input.getAttribute("type");
        if (type === "range") await input.fill("30").catch(() => {});
        else if (!type || type === "text") await input.fill("100").catch(() => {});
    }
    await h.page.waitForTimeout(400);
    eq(await h.store(), before, "store inalterado");
});

// ---------------- Navegação ----------------
test("Navegação", "todos os itens do menu abrem sua página, marcam o item ativo e não geram erros", async (h) => {
    await seed(h, {});
    await h.go("/");
    const nav = h.page.getByRole("navigation", { name: "Navegação principal" });
    const links = await nav.getByRole("link").all();
    const hrefs = [];
    for (const l of links) hrefs.push([await l.getAttribute("href"), (await l.innerText()).split("\n")[0].trim()]);
    assert(hrefs.length >= 15, `itens do menu: ${hrefs.length}`);
    for (const [href, label] of hrefs) {
        await nav.locator(`a[href="${href}"]`).first().click();
        await h.page.waitForFunction((label) => document.querySelector('nav[aria-label="Navegação principal"] [aria-current="page"]')?.textContent.includes(label), label, { timeout: 5000 }).catch(() => {});
        await h.page.getByRole("heading", { level: 1 }).first().waitFor();
        eq(await h.page.getByRole("heading", { level: 1 }).count(), 1, `um H1 em ${href}`);
        const cur = await nav.locator('[aria-current="page"]').first().innerText().catch(() => "");
        assert(cur.split("\n")[0].trim() === label, `item ativo em ${href}: "${cur}" ≠ "${label}"`);
    }
});

test("Navegação", "atalhos: N abre nova transação, / foca a busca, → avança o mês", async (h) => {
    await seed(h, {});
    await h.go("/");
    const month0 = await h.page.getByRole("group", { name: "Mês de referência do painel" }).innerText();
    await h.page.keyboard.press("ArrowRight");
    const month1 = await h.page.getByRole("group", { name: "Mês de referência do painel" }).innerText();
    assert(month0 !== month1, "→ troca o mês");
    await h.page.keyboard.press("n");
    await h.dialog("Nova transação").waitFor();
    await h.page.keyboard.press("Escape");
    await h.dialog("Nova transação").waitFor({ state: "detached" });
    await h.page.keyboard.press("/");
    eq(await h.page.evaluate(() => document.activeElement?.getAttribute("placeholder") || document.activeElement?.getAttribute("aria-label")), "Buscar transações", "/ foca a busca");
});

// ---------------- Responsividade ----------------
const ROUTES = ["/", "/movimentacoes", "/contas-a-pagar", "/contas-a-receber", "/planejamento/orcamentos", "/planejamento/metas", "/planejamento/recorrencias", "/planejamento/cartoes", "/planejamento/simulador", "/relatorios/mensal", "/relatorios/anual", "/relatorios/saude", "/configuracoes/aparencia", "/configuracoes/categorias", "/configuracoes/contas", "/configuracoes/dados", "/configuracoes/sobre"];
for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    test("Responsivo", `${width}px: sem rolagem horizontal, um H1 e sem erros em ${ROUTES.length} páginas`, async (h) => {
        await h.page.setViewportSize({ width, height: 900 });
        await seed(h, {
            accounts: [{ id: "card", name: "Cartão", type: "credit", closingDay: 28, dueDay: 5, limitCents: 300000 }],
            transactions: [
                { type: "income", amountCents: 500000, description: "Salário", categoryId: "cat-salario" },
                { type: "expense", amountCents: 120000, description: "Aluguel com descrição bem longa para testar quebra de linha", categoryId: "cat-moradia", status: "pending", days: 3 },
                { type: "expense", amountCents: 9000, description: "Compra", accountId: "card", days: -2 },
            ],
        });
        const problems = [];
        for (const r of ROUTES) {
            await h.go(r);
            await h.page.waitForTimeout(250);
            const m = await h.page.evaluate(() => ({ over: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: document.querySelectorAll("h1").length }));
            if (m.over > 1) problems.push(`${r}: rolagem horizontal de ${m.over}px`);
            if (m.h1 !== 1) problems.push(`${r}: ${m.h1} H1`);
        }
        assert(!problems.length, problems.join("; "));
    });
}

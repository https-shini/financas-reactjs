const { test, assert, eq, parseBRL } = require("../harness.cjs");

async function openNew(h) {
    await h.page.getByRole("button", { name: /Nova transação/ }).first().click();
    return h.dialog("Nova transação");
}
async function fillAmount(dlg, digits) {
    await dlg.getByRole("textbox", { name: "Valor" }).fill("");
    await dlg.getByRole("textbox", { name: "Valor" }).pressSequentially(digits);
}

test("Transações", "criar despesa persiste valor, categoria, data e status; aparece na lista e nos KPIs", async (h) => {
    await h.go("/");
    const dlg = await openNew(h);
    await fillAmount(dlg, "12345");
    eq(await dlg.getByRole("textbox", { name: "Valor" }).inputValue(), "123,45", "máscara do valor");
    await dlg.getByRole("textbox", { name: "Descrição" }).fill("Farmácia teste");
    await dlg.getByRole("button", { name: "Saúde" }).click();
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    await dlg.waitFor({ state: "detached" });
    const s = await h.waitStore((s) => s.transactions.length === 1, "1 transação");
    const tx = s.transactions[0];
    eq([tx.type, tx.amountCents, tx.description, tx.categoryId, tx.status], ["expense", 12345, "Farmácia teste", "cat-saude", "paid"], "transação salva");
    assert(tx.createdAt && tx.updatedAt && tx.id, "metadados");
    // KPI "Resultado do mês" e card de receitas × despesas refletem o lançamento
    const res = await h.page.getByRole("region", { name: "Resultado do mês" }).locator(".kpi-value").innerText();
    eq(parseBRL(res), -12345, "resultado do mês no KPI");
    await h.go("/movimentacoes");
    assert(await h.page.getByText("Farmácia teste").first().isVisible(), "listada em Transações");
});

test("Transações", "validação: campos obrigatórios bloqueiam o salvamento e exibem mensagens", async (h) => {
    await h.go("/");
    const dlg = await openNew(h);
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    await dlg.getByText("Informe um valor maior que zero.").waitFor();
    await dlg.getByText("Informe uma descrição.").waitFor();
    await fillAmount(dlg, "100");
    await dlg.getByRole("textbox", { name: "Descrição" }).fill("   ");
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    await dlg.getByText("Informe uma descrição.").waitFor();
    const s = await h.store();
    eq(s ? s.transactions.length : 0, 0, "nada salvo");
    // descrição limitada a 120 caracteres
    const max = await dlg.getByRole("textbox", { name: "Descrição" }).getAttribute("maxlength");
    eq(max, "120", "limite da descrição");
});

test("Transações", "editar preserva id/createdAt e atualiza valor e descrição", async (h) => {
    const { buildStore } = require("../fixtures.cjs");
    const { store } = await buildStore(h.page, { transactions: [{ id: "t1", type: "expense", amountCents: 5000, description: "Original", categoryId: "cat-mercado" }] });
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), store);
    await h.go("/movimentacoes");
    await h.page.getByRole("button", { name: "Ações para Original" }).click();
    await h.page.getByRole("menuitem", { name: "Editar" }).click();
    const dlg = h.dialog("Editar transação");
    await fillAmount(dlg, "7550");
    await dlg.getByRole("textbox", { name: "Descrição" }).fill("Editada");
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    const s = await h.waitStore((s) => s.transactions[0].description === "Editada", "edição persistida");
    eq([s.transactions.length, s.transactions[0].id, s.transactions[0].amountCents, s.transactions[0].createdAt], [1, "t1", 7550, store.transactions[0].createdAt], "edição");
});

test("Transações", "excluir com desfazer restaura exatamente o registro", async (h) => {
    const { buildStore } = require("../fixtures.cjs");
    const { store } = await buildStore(h.page, { transactions: [{ id: "t1", type: "income", amountCents: 900000, description: "Salário X", categoryId: "cat-salario" }] });
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), store);
    await h.go("/movimentacoes");
    await h.page.getByRole("button", { name: "Ações para Salário X" }).click();
    await h.page.getByRole("menuitem", { name: "Excluir" }).click();
    await h.waitStore((s) => s.transactions.length === 0, "removida");
    await h.page.getByRole("button", { name: "Desfazer" }).click();
    const s = await h.waitStore((s) => s.transactions.length === 1, "restaurada");
    eq(s.transactions[0], store.transactions[0], "registro idêntico após desfazer");
});

test("Transações", "duplicar cria cópia com novo id, data de hoje e status pago", async (h) => {
    const { buildStore } = require("../fixtures.cjs");
    const { store, today } = await buildStore(h.page, { transactions: [{ id: "t1", type: "expense", amountCents: 3000, description: "Uber", categoryId: "cat-transporte", days: -10 }] });
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), store);
    await h.go("/movimentacoes?periodo=tudo");
    await h.page.getByRole("button", { name: "Ações para Uber" }).first().click();
    await h.page.getByRole("menuitem", { name: "Duplicar" }).click();
    const dlg = h.dialog("Duplicar transação");
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    const s = await h.waitStore((s) => s.transactions.length === 2, "duplicada");
    const dup = s.transactions.find((t) => t.id !== "t1");
    eq([dup.amountCents, dup.description, dup.categoryId, dup.date, dup.status], [3000, "Uber", "cat-transporte", today, "paid"], "cópia");
});

test("Transações", "seleção em lote: marcar como pagas e excluir", async (h) => {
    const { buildStore } = require("../fixtures.cjs");
    const { store } = await buildStore(h.page, {
        transactions: [
            { id: "a", type: "expense", amountCents: 100, description: "Pend A", status: "pending" },
            { id: "b", type: "expense", amountCents: 200, description: "Pend B", status: "pending" },
            { id: "c", type: "expense", amountCents: 300, description: "Manter C" },
        ],
    });
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), store);
    await h.go("/movimentacoes");
    await h.page.getByRole("button", { name: "Selecionar", exact: true }).click();
    await h.page.getByRole("checkbox", { name: "Selecionar Pend A" }).check();
    await h.page.getByRole("checkbox", { name: "Selecionar Pend B" }).check();
    await h.page.getByRole("button", { name: /Marcar como pagas/ }).click();
    await h.waitStore((s) => s.transactions.filter((t) => t.status === "paid").length === 3, "todas pagas");
    await h.page.getByRole("button", { name: "Selecionar", exact: true }).click().catch(() => {});
    if (!(await h.page.getByRole("checkbox", { name: "Selecionar Pend A" }).isVisible().catch(() => false))) await h.page.getByRole("button", { name: /Selecionar/ }).first().click();
    await h.page.getByRole("checkbox", { name: "Selecionar Pend A" }).check();
    await h.page.getByRole("checkbox", { name: "Selecionar Pend B" }).check();
    await h.page.getByRole("button", { name: /^Excluir/ }).click();
    const confirm = h.page.getByRole("dialog").filter({ hasText: /Excluir/ });
    if (await confirm.isVisible().catch(() => false)) await confirm.getByRole("button", { name: /Excluir/ }).last().click();
    const s = await h.waitStore((s) => s.transactions.length === 1, "duas excluídas");
    eq(s.transactions[0].id, "c", "restou a correta");
});

test("Transações", "parcelamento em 3x gera parcelas pendentes cuja soma é o total", async (h) => {
    await h.go("/movimentacoes");
    const dlg = await openNew(h);
    await fillAmount(dlg, "10000");
    await dlg.getByRole("textbox", { name: "Descrição" }).fill("Notebook");
    await dlg.getByText("Mais opções").click();
    await dlg.locator("label").filter({ hasText: "Parcelar" }).click();
    await dlg.getByLabel("Número de parcelas").fill("3");
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    const s = await h.waitStore((s) => s.transactions.length === 3, "3 parcelas");
    const sum = s.transactions.reduce((a, t) => a + t.amountCents, 0);
    eq(sum, 10000, "soma das parcelas");
    eq(s.transactions.map((t) => t.installment && t.installment.of), [3, 3, 3], "marcação de parcela");
    const dates = s.transactions.map((t) => t.date).sort();
    assert(new Set(dates).size === 3, "datas distintas");
});

test("Transações", "repetir mensalmente gera série recorrente com lançamentos pendentes", async (h) => {
    await h.go("/movimentacoes");
    const dlg = await openNew(h);
    await fillAmount(dlg, "4990");
    await dlg.getByRole("textbox", { name: "Descrição" }).fill("Academia");
    await dlg.getByText("Mais opções").click();
    await dlg.locator("label").filter({ hasText: "Repetir (recorrente)" }).click();
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    const s = await h.waitStore((s) => s.recurrences.length === 1 && s.transactions.length >= 2, "série criada");
    assert(s.transactions.every((t) => t.recurrenceId === s.recurrences[0].id && t.amountCents === 4990), "lançamentos vinculados à série");
    assert(s.transactions.filter((t) => t.status === "pending").length >= 1, "futuros pendentes");
});

test("Transações", "filtros, busca e totais do filtro conferem com os dados", async (h) => {
    const { buildStore } = require("../fixtures.cjs");
    const { store } = await buildStore(h.page, {
        transactions: [
            { type: "income", amountCents: 500000, description: "Salário", categoryId: "cat-salario" },
            { type: "expense", amountCents: 12000, description: "Mercado bairro", categoryId: "cat-mercado" },
            { type: "expense", amountCents: 8000, description: "Mercado centro", categoryId: "cat-mercado", status: "pending" },
            { type: "expense", amountCents: 3000, description: "Uber", categoryId: "cat-transporte" },
        ],
    });
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), store);
    await h.go("/movimentacoes");
    await h.page.getByPlaceholder("Buscar por descrição, categoria ou observação").fill("mercado");
    await h.page.waitForTimeout(500);
    assert(await h.page.getByText("Mercado bairro").first().isVisible(), "busca encontra");
    assert(!(await h.page.getByText("Uber", { exact: true }).isVisible().catch(() => false)), "busca exclui");
    const totals = await h.page.getByRole("region", { name: "Totais do filtro" }).or(h.page.locator('[aria-label="Totais do filtro"]')).first().innerText();
    assert(totals.includes("200,00") || totals.includes("200"), `totais do filtro (R$ 200,00): ${totals.replace(/\n/g, " ")}`);
    await h.page.getByPlaceholder("Buscar por descrição, categoria ou observação").fill("");
    await h.page.getByLabel("Status").selectOption({ label: "Pendentes" });
    await h.page.waitForTimeout(300);
    assert(h.page.url().includes("status=pending"), "filtro refletido na URL");
    assert(await h.page.getByText("Mercado centro").first().isVisible(), "pendente visível");
    assert(!(await h.page.getByText("Mercado bairro").isVisible().catch(() => false)), "pago oculto");
    await h.page.getByLabel("Status").selectOption({ label: "Todos os status" });
    await h.page.getByLabel("Tipo").selectOption({ label: "Receitas" });
    await h.page.waitForTimeout(300);
    assert(await h.page.getByText("Salário", { exact: true }).first().isVisible(), "receita visível");
    assert(!(await h.page.getByText("Uber", { exact: true }).isVisible().catch(() => false)), "despesa oculta");
});

test("Transações", "captura rápida interpreta a frase e salva", async (h) => {
    await h.go("/");
    await h.page.keyboard.press("q");
    const dlg = h.dialog("Captura rápida");
    await dlg.getByLabel("Frase").fill("mercado 45,90 ontem");
    await dlg.getByRole("button", { name: "Confirmar e salvar" }).last().click();
    const s = await h.waitStore((s) => s.transactions.length === 1, "capturada");
    const tx = s.transactions[0];
    eq([tx.amountCents, tx.type, tx.categoryId], [4590, "expense", "cat-mercado"], "interpretação");
});

test("Transações", "regressão F1: digitar a busca e trocar outro filtro logo em seguida mantém os dois", async (h) => {
    const { buildStore } = require("../fixtures.cjs");
    const { store } = await buildStore(h.page, {
        transactions: [
            { type: "expense", amountCents: 100, description: "Café pago" },
            { type: "expense", amountCents: 200, description: "Café pendente", status: "pending" },
            { type: "expense", amountCents: 300, description: "Pão pendente", status: "pending" },
        ],
    });
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), store);
    await h.go("/movimentacoes");
    await h.page.getByPlaceholder("Buscar por descrição, categoria ou observação").fill("café");
    await h.page.getByLabel("Status").selectOption({ label: "Pendentes" }); // dentro dos 250 ms da busca
    await h.page.waitForTimeout(600);
    const url = new URL(h.page.url());
    eq([url.searchParams.get("q"), url.searchParams.get("status")], ["café", "pending"], "busca e status preservados");
    eq(await h.page.getByPlaceholder("Buscar por descrição, categoria ou observação").inputValue(), "café", "texto digitado mantido");
    assert(await h.page.getByText("Café pendente").isVisible(), "resultado correto visível");
    assert(!(await h.page.getByText("Pão pendente").isVisible().catch(() => false)), "busca aplicada");
    assert(!(await h.page.getByText("Café pago").isVisible().catch(() => false)), "status aplicado");
});

test("Transações", "regressão F5: ao abrir o cadastro, o primeiro clique no tipo funciona e não aparece erro antes de digitar", async (h) => {
    await h.go("/");
    const dlg = await openNew(h);
    await dlg.getByRole("radio", { name: "Receita" }).click();
    eq(await dlg.getByRole("radio", { name: "Receita" }).getAttribute("aria-checked"), "true", "tipo selecionado no primeiro clique");
    assert(!(await dlg.getByText("Informe um valor maior que zero.").isVisible()), "sem erro antes de salvar");
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    await dlg.getByText("Informe um valor maior que zero.").waitFor();
});

const { test, assert, eq } = require("../harness.cjs");
const { buildStore } = require("../fixtures.cjs");

async function seed(h, spec) {
    const r = await buildStore(h.page, spec);
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), r.store);
    return r;
}
const money = async (loc, digits) => {
    await loc.fill("");
    await loc.pressSequentially(digits);
};

test("Validação", "transação: valor trava no limite máximo e observação limitada a 500 caracteres", async (h) => {
    await h.go("/");
    const MAX = await h.page.evaluate(async () => (await import("/src/domain/money.js")).MAX_CENTS);
    await h.page.keyboard.press("n");
    const d = h.dialog("Nova transação");
    await money(d.getByRole("textbox", { name: "Valor" }), "99999999999999");
    eq(await d.getByRole("textbox", { name: "Valor" }).inputValue(), "999.999.999,99", "valor travado no limite");
    await d.getByText("Mais opções").click();
    eq(await d.getByLabel("Observações").getAttribute("maxlength"), "500", "limite de observações");
    await d.getByRole("textbox", { name: "Descrição" }).fill("No limite");
    await d.getByRole("button", { name: "Salvar", exact: true }).click();
    const s = await h.waitStore((s) => s.transactions.length === 1, "salva");
    assert(s.transactions[0].amountCents <= MAX, "dentro do limite do domínio");
});

test("Validação", "conta: nome obrigatório e nome duplicado não é aceito", async (h) => {
    await seed(h, {});
    await h.go("/configuracoes/contas");
    await h.page.getByRole("button", { name: "Nova", exact: true }).click();
    let d = h.dialog("Nova conta");
    await d.getByRole("button", { name: "Salvar" }).click();
    await h.page.waitForTimeout(300);
    eq((await h.store())?.accounts?.length ?? 1, 1, "sem nome não salva");
    await d.getByLabel("Nome").fill("conta principal");
    await d.getByRole("button", { name: "Salvar" }).click();
    await h.page.waitForTimeout(400);
    await d.getByText("Já existe uma conta ou cartão com este nome.").waitFor();
    const s = await h.store();
    eq((s?.accounts ?? []).filter((a) => a.name.toLowerCase() === "conta principal").length, 1, "nome duplicado de conta");
});

test("Validação", "cartão: dias de fechamento/vencimento fora de 1–31 não são aceitos", async (h) => {
    await seed(h, {});
    await h.go("/planejamento/cartoes");
    await h.page.getByRole("button", { name: "Adicionar cartão" }).click();
    const d = h.dialog("Novo cartão de crédito");
    await d.getByLabel("Nome").fill("Cartão inválido");
    const close = d.getByLabel("Dia de fechamento");
    const tag = await close.evaluate((e) => e.tagName);
    if (tag === "INPUT") {
        await close.fill("45");
        await d.getByLabel("Dia de vencimento").fill("0");
    }
    await d.getByRole("button", { name: "Salvar" }).click();
    await h.page.waitForTimeout(400);
    const s = await h.store();
    const card = (s?.accounts ?? []).find((a) => a.type === "credit");
    if (card) assert(card.closingDay >= 1 && card.closingDay <= 31 && card.dueDay >= 1 && card.dueDay <= 31, `dias salvos: ${card.closingDay}/${card.dueDay}`);
});

test("Validação", "meta e orçamento: valor zero não é aceito", async (h) => {
    await seed(h, {});
    await h.go("/planejamento/metas");
    await h.page.getByRole("button", { name: "Criar meta" }).click();
    const g = h.dialog("Nova meta");
    await g.getByLabel("Nome").fill("Zero");
    await g.getByRole("button", { name: "Salvar" }).click();
    await h.page.waitForTimeout(300);
    eq((await h.store())?.goals?.length ?? 0, 0, "meta sem valor");
    await h.go("/planejamento/orcamentos");
    await h.page.getByRole("button", { name: "Criar orçamento" }).click();
    const b = h.page.getByRole("dialog").last();
    await b.getByLabel("Categoria").selectOption("cat-lazer");
    await b.getByRole("button", { name: "Salvar" }).click();
    await h.page.waitForTimeout(300);
    eq((await h.store())?.budgets?.length ?? 0, 0, "orçamento sem limite");
});

test("Validação", "recorrência pelo formulário próprio: data final antes da inicial é recusada", async (h) => {
    await seed(h, {});
    await h.go("/planejamento/recorrencias");
    await h.page.getByRole("button", { name: /Nova recorrência|Nova|Criar/ }).first().click();
    const d = h.page.getByRole("dialog", { name: "Nova recorrência" });
    await money(d.getByRole("textbox", { name: "Valor" }), "1000");
    await d.getByLabel("Descrição").fill("Teste datas");
    await d.getByLabel("Data inicial").fill("2026-12-10");
    await d.getByLabel("Data final (opcional)").fill("2026-12-01");
    await d.getByRole("button", { name: "Salvar" }).click();
    await h.page.waitForTimeout(400);
    eq((await h.store())?.recurrences?.length ?? 0, 0, "série com datas invertidas");
});

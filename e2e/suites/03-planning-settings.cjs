const { test, assert, eq, parseBRL } = require("../harness.cjs");
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

// ---------------- Contas ----------------
test("Contas", "criar conta com saldo inicial altera o saldo atual; editar e excluir conta sem uso", async (h) => {
    await seed(h, {});
    await h.go("/configuracoes/contas");
    await h.page.getByRole("button", { name: "Nova", exact: true }).click();
    const dlg = h.dialog("Nova conta");
    await dlg.getByLabel("Nome").fill("Poupança E2E");
    await money(dlg.getByRole("textbox", { name: "Saldo inicial" }), "250000");
    await dlg.getByRole("button", { name: "Salvar" }).click();
    const s = await h.waitStore((s) => s.accounts.some((a) => a.name === "Poupança E2E"), "conta criada");
    const acc = s.accounts.find((a) => a.name === "Poupança E2E");
    eq(acc.initialBalanceCents, 250000, "saldo inicial");
    await h.go("/");
    eq(parseBRL(await h.page.getByRole("region", { name: "Saldo atual" }).locator(".kpi-value").innerText()), 250000, "saldo atual inclui a conta");
    await h.go("/configuracoes/contas");
    await h.page.getByRole("button", { name: "Ações para Poupança E2E" }).click();
    await h.page.getByRole("menuitem", { name: "Editar" }).click();
    await h.dialog("Editar conta").getByLabel("Nome").fill("Poupança 2");
    await h.dialog("Editar conta").getByRole("button", { name: "Salvar" }).click();
    await h.waitStore((s) => s.accounts.some((a) => a.name === "Poupança 2"), "renomeada");
    await h.page.getByRole("button", { name: "Ações para Poupança 2" }).click();
    await h.page.getByRole("menuitem", { name: /Excluir/ }).click();
    const c = h.page.getByRole("alertdialog").or(h.page.getByRole("dialog")).last();
    await c.getByRole("button", { name: /Excluir/ }).last().click();
    await h.waitStore((s) => !s.accounts.some((a) => a.name === "Poupança 2"), "excluída");
});

test("Contas", "transferência entre contas não altera o saldo consolidado e exige contas diferentes", async (h) => {
    await seed(h, { initialBalanceCents: 100000, accounts: [{ id: "acc2", name: "Reserva", type: "savings" }] });
    await h.go("/");
    await h.page.getByRole("button", { name: /Nova transação/ }).first().click();
    const dlg = h.dialog("Nova transação");
    await dlg.getByRole("radio", { name: "Transferência" }).click();
    await money(dlg.getByRole("textbox", { name: "Valor" }), "30000");
    await dlg.getByRole("textbox", { name: "Descrição" }).fill("Guardar");
    await dlg.getByLabel("Para a conta").selectOption("acc2");
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    const s = await h.waitStore((s) => s.transactions.length === 1, "transferência salva");
    eq([s.transactions[0].type, s.transactions[0].toAccountId], ["transfer", "acc2"], "transferência");
    eq(parseBRL(await h.page.getByRole("region", { name: "Saldo atual" }).locator(".kpi-value").innerText()), 100000, "consolidado inalterado");
    eq(parseBRL(await h.page.getByRole("region", { name: "Resultado do mês" }).locator(".kpi-value").innerText()), 0, "transferência fora do resultado");
});

// ---------------- Categorias ----------------
test("Categorias", "criar, editar e excluir categoria em uso movendo as transações", async (h) => {
    await seed(h, { transactions: [{ id: "t1", type: "expense", amountCents: 1000, description: "Ração", categoryId: "cat-outros" }] });
    await h.go("/configuracoes/categorias");
    await h.page.getByRole("button", { name: "Nova", exact: true }).click();
    const dlg = h.dialog("Nova categoria");
    await dlg.getByLabel("Nome").fill("Pets");
    await dlg.getByRole("button", { name: "Salvar" }).click();
    const s = await h.waitStore((s) => s.categories.some((c) => c.name === "Pets"), "criada");
    const pets = s.categories.find((c) => c.name === "Pets");
    // duplicidade de nome
    await h.page.getByRole("button", { name: "Nova", exact: true }).click();
    await h.dialog("Nova categoria").getByLabel("Nome").fill("pets");
    await h.dialog("Nova categoria").getByRole("button", { name: "Salvar" }).click();
    await h.page.waitForTimeout(400);
    const s2 = await h.store();
    eq(s2.categories.filter((c) => c.name.toLowerCase() === "pets").length, 1, "não duplica categoria com o mesmo nome");
    if (await h.dialog("Nova categoria").isVisible().catch(() => false)) await h.dialog("Nova categoria").getByRole("button", { name: "Cancelar" }).click();
    // exclui "Outros" (em uso) movendo para Pets
    await h.page.getByRole("button", { name: "Ações para Outros" }).click();
    await h.page.getByRole("menuitem", { name: "Excluir" }).click();
    const del = h.page.getByRole("dialog", { name: /Excluir “Outros/ });
    await del.getByLabel("Mover movimentações para").selectOption(pets.id);
    await del.getByRole("button", { name: "Mover e excluir" }).click();
    const s3 = await h.waitStore((s) => !s.categories.some((c) => c.id === "cat-outros"), "excluída");
    eq(s3.transactions[0].categoryId, pets.id, "transação movida");
});

// ---------------- Cartões ----------------
test("Cartões", "criar cartão, compra entra na fatura, pagamento parcial e total atualizam fatura, saldo e contas a pagar", async (h) => {
    await seed(h, { initialBalanceCents: 200000 });
    await h.go("/planejamento/cartoes");
    await h.page.getByRole("button", { name: "Adicionar cartão" }).click();
    const dlg = h.dialog("Novo cartão de crédito");
    await dlg.getByLabel("Nome").fill("Visa E2E");
    await money(dlg.getByRole("textbox", { name: "Limite" }), "300000");
    await dlg.getByRole("button", { name: "Salvar" }).click();
    let s = await h.waitStore((s) => s.accounts.some((a) => a.type === "credit"), "cartão criado");
    const card = s.accounts.find((a) => a.type === "credit");
    eq(card.limitCents, 300000, "limite");
    // compra no cartão
    await h.page.getByRole("button", { name: /Nova transação/ }).first().click().catch(() => {});
    if (!(await h.dialog("Nova transação").isVisible().catch(() => false))) await h.page.keyboard.press("n");
    const tx = h.dialog("Nova transação");
    await money(tx.getByRole("textbox", { name: "Valor" }), "40000");
    await tx.getByRole("textbox", { name: "Descrição" }).fill("Tênis");
    await tx.getByLabel("Conta ou cartão").selectOption(card.id);
    await tx.getByRole("button", { name: "Salvar", exact: true }).click();
    await h.waitStore((s) => s.transactions.length === 1, "compra");
    await h.go("/contas-a-pagar");
    const kpi = async () => parseBRL(await h.page.getByRole("region", { name: "Total a pagar" }).locator(".kpi-value").innerText());
    eq(await kpi(), 40000, "fatura em contas a pagar");
    await h.page.getByRole("button", { name: "Pagar fatura" }).first().click();
    await h.page.getByRole("button", { name: "Pagar", exact: true }).first().click();
    let pay = h.page.getByRole("dialog", { name: /Pagar fatura de/ });
    await money(pay.getByRole("textbox", { name: "Valor" }), "15000");
    await pay.getByRole("button", { name: "Registrar pagamento" }).click();
    s = await h.waitStore((s) => s.transactions.some((t) => t.type === "transfer"), "pagamento parcial");
    await h.go("/contas-a-pagar");
    eq(await kpi(), 25000, "restante da fatura após pagamento parcial");
    await h.go("/");
    eq(parseBRL(await h.page.getByRole("region", { name: "Saldo atual" }).locator(".kpi-value").innerText()), 200000 - 15000, "saldo da conta reduzido pelo pagamento");
    eq(parseBRL(await h.page.getByRole("region", { name: "Resultado do mês" }).locator(".kpi-value").innerText()), -40000, "compra conta uma vez só como despesa");
    await h.go("/contas-a-pagar");
    await h.page.getByRole("button", { name: "Pagar fatura" }).first().click();
    await h.page.getByRole("button", { name: "Pagar", exact: true }).first().click();
    pay = h.page.getByRole("dialog", { name: /Pagar fatura de/ });
    eq(parseBRL(await pay.getByRole("textbox", { name: "Valor" }).inputValue()), 25000, "valor sugerido = restante");
    await pay.getByRole("button", { name: "Registrar pagamento" }).click();
    await h.waitStore((s) => s.transactions.filter((t) => t.type === "transfer").length === 2, "pagamento total");
    await h.go("/contas-a-pagar");
    eq(await kpi(), 0, "fatura quitada");
});

test("Cartões", "pagamento acima do saldo da fatura não é aceito", async (h) => {
    await seed(h, {
        initialBalanceCents: 200000,
        accounts: [{ id: "card", name: "Cartão X", type: "credit", closingDay: 28, dueDay: 5, limitCents: 500000 }],
        transactions: [{ type: "expense", amountCents: 10000, description: "Compra", accountId: "card", days: -1 }],
    });
    await h.go("/planejamento/cartoes");
    await h.page.getByRole("button", { name: "Pagar", exact: true }).first().click();
    const pay = h.page.getByRole("dialog", { name: /Pagar fatura de/ });
    await money(pay.getByRole("textbox", { name: "Valor" }), "99999");
    await pay.getByRole("button", { name: "Registrar pagamento" }).click();
    await pay.getByText(/não pode passar do saldo em aberto/).waitFor();
    const s = await h.store();
    eq(s.transactions.filter((t) => t.type === "transfer").length, 0, "pagamento maior que a fatura bloqueado");
});

// ---------------- Orçamentos ----------------
test("Orçamentos", "criar orçamento calcula o uso do mês e alerta ao passar de 80%", async (h) => {
    await seed(h, { transactions: [{ type: "expense", amountCents: 45000, description: "Feira", categoryId: "cat-mercado" }] });
    await h.go("/planejamento/orcamentos");
    await h.page.getByRole("button", { name: "Criar orçamento" }).click();
    const dlg = h.page.getByRole("dialog").last();
    await dlg.getByLabel("Categoria").selectOption("cat-mercado");
    await money(dlg.getByRole("textbox", { name: /Limite/ }), "50000");
    await dlg.getByRole("button", { name: "Salvar" }).click();
    const s = await h.waitStore((s) => s.budgets.length === 1, "orçamento criado");
    eq([s.budgets[0].categoryId, s.budgets[0].limitCents], ["cat-mercado", 50000], "orçamento");
    const body = await h.page.locator("main").innerText();
    assert(/90\s?%/.test(body), "uso de 90% exibido");
    // duplicidade: mesma categoria não pode ter dois orçamentos
    await h.page.getByRole("button", { name: "Novo", exact: true }).click();
    const d2 = h.page.getByRole("dialog").last();
    const opts = await d2.getByLabel("Categoria").locator("option").allInnerTexts();
    assert(!opts.includes("Mercado"), `categoria já orçada não é oferecida de novo: ${opts.join(",")}`);
});

// ---------------- Metas ----------------
test("Metas", "criar meta, aportar, resgatar e impedir resgate acima do acumulado", async (h) => {
    await seed(h, {});
    await h.go("/planejamento/metas");
    await h.page.getByRole("button", { name: "Criar meta" }).click();
    const dlg = h.dialog("Nova meta");
    await dlg.getByLabel("Nome").fill("Viagem");
    await money(dlg.getByRole("textbox", { name: "Valor desejado" }), "1000000");
    await dlg.getByRole("button", { name: "Salvar" }).click();
    await h.waitStore((s) => s.goals.length === 1, "meta criada");
    await h.page.getByRole("button", { name: "Registrar aporte" }).click();
    let c = h.page.getByRole("dialog", { name: /Movimentar/ });
    await money(c.getByRole("textbox", { name: "Valor" }), "200000");
    await c.getByRole("button", { name: "Registrar" }).click();
    await h.waitStore((s) => s.goals[0].contributions.length === 1, "aporte");
    await h.page.getByRole("button", { name: "Registrar aporte" }).click();
    c = h.page.getByRole("dialog", { name: /Movimentar/ });
    await c.locator("label").filter({ hasText: "É um resgate" }).click();
    await money(c.getByRole("textbox", { name: "Valor" }), "300000");
    await c.getByRole("button", { name: "Registrar" }).click();
    await h.page.waitForTimeout(400);
    let s = await h.store();
    eq(s.goals[0].contributions.length, 1, "resgate acima do acumulado bloqueado");
    await money(c.getByRole("textbox", { name: "Valor" }), "50000");
    await c.getByRole("button", { name: "Registrar" }).click();
    s = await h.waitStore((s) => s.goals[0].contributions.length === 2, "resgate válido");
    eq(s.goals[0].contributions.reduce((a, x) => a + x.amountCents, 0), 150000, "acumulado");
    assert((await h.page.locator("main").innerText()).includes("15%"), "progresso 15%");
});

// ---------------- Recorrências ----------------
test("Recorrências", "encerrar série remove pendências futuras e mantém o histórico pago", async (h) => {
    await h.go("/movimentacoes");
    await h.page.getByRole("button", { name: /Nova transação|Nova/ }).first().click();
    const dlg = h.dialog("Nova transação");
    await money(dlg.getByRole("textbox", { name: "Valor" }), "3990");
    await dlg.getByRole("textbox", { name: "Descrição" }).fill("Streaming");
    await dlg.getByText("Mais opções").click();
    await dlg.locator("label").filter({ hasText: "Repetir (recorrente)" }).click();
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    const before = await h.waitStore((s) => s.recurrences.length === 1, "série");
    const paid = before.transactions.filter((t) => t.status === "paid").length;
    await h.go("/planejamento/recorrencias");
    await h.page.getByRole("button", { name: "Ações para Streaming" }).click();
    await h.page.getByRole("menuitem", { name: "Encerrar" }).click();
    const c = h.page.getByRole("alertdialog").or(h.page.getByRole("dialog")).last();
    if (await c.isVisible().catch(() => false)) await c.getByRole("button", { name: /Encerrar/ }).last().click();
    const s = await h.waitStore((s) => s.recurrences[0].active === false || s.recurrences[0].endDate, "encerrada");
    const pendingFuture = s.transactions.filter((t) => t.status === "pending" && t.recurrenceId).length;
    eq(pendingFuture, 0, "sem pendências futuras");
    eq(s.transactions.filter((t) => t.status === "paid").length, paid, "histórico mantido");
});

// ---------------- Preferências ----------------
test("Configurações", "tema e ocultar valores persistem após recarregar e se aplicam", async (h) => {
    await seed(h, { initialBalanceCents: 123456 });
    await h.go("/configuracoes/aparencia");
    await h.page.getByRole("radio", { name: "Escuro" }).click();
    await h.waitStore((s) => s.settings.theme === "dark", "tema");
    await h.page.locator("label").filter({ hasText: "Ocultar valores" }).first().click();
    await h.waitStore((s) => s.settings.hideBalances === true, "ocultar");
    await h.go("/");
    const v = await h.page.getByRole("region", { name: "Saldo atual" }).locator(".kpi-value").innerText();
    assert(v.includes("•"), `valor oculto: ${v}`);
    await h.page.reload();
    await h.page.getByRole("heading", { level: 1 }).waitFor();
    const bg = await h.page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert(bg !== "rgb(250, 250, 249)" && bg !== "rgb(255, 255, 255)", `fundo escuro após recarregar: ${bg}`);
});

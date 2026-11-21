const { test, assert, eq, parseBRL, BASE } = require("../harness.cjs");
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

test("Integridade", "duas abas: alteração em uma aparece na outra e nenhuma sobrescreve a outra", async (h) => {
    await seed(h, { transactions: [{ id: "t0", type: "expense", amountCents: 100, description: "Base" }] });
    await h.go("/movimentacoes");
    const p2 = await h.ctx.newPage();
    await p2.goto(BASE + "/movimentacoes");
    await p2.getByRole("heading", { level: 1 }).waitFor();
    // aba 1 cria
    await h.page.getByRole("button", { name: /^Nova$|Nova transação/ }).first().click();
    const d1 = h.dialog("Nova transação");
    await money(d1.getByRole("textbox", { name: "Valor" }), "1000");
    await d1.getByRole("textbox", { name: "Descrição" }).fill("Da aba 1");
    await d1.getByRole("button", { name: "Salvar", exact: true }).click();
    await h.waitStore((s) => s.transactions.length === 2, "aba 1 salvou");
    await p2.getByText("Da aba 1").first().waitFor({ timeout: 5000 });
    // aba 2 cria em seguida (com o estado sincronizado)
    await p2.getByRole("button", { name: /^Nova$|Nova transação/ }).first().click();
    const d2 = p2.getByRole("dialog", { name: "Nova transação" });
    await money(d2.getByRole("textbox", { name: "Valor" }), "2000");
    await d2.getByRole("textbox", { name: "Descrição" }).fill("Da aba 2");
    await d2.getByRole("button", { name: "Salvar", exact: true }).click();
    const s = await h.waitStore((s) => s.transactions.length === 3, "as três transações coexistem");
    eq(s.transactions.map((t) => t.description).sort(), ["Base", "Da aba 1", "Da aba 2"], "nenhuma perdida");
    await h.page.getByText("Da aba 2").first().waitFor({ timeout: 5000 });
});

test("Integridade", "armazenamento cheio: o usuário é avisado e o dado anterior não é corrompido", async (h) => {
    await seed(h, { transactions: [{ id: "t0", type: "expense", amountCents: 100, description: "Seguro" }] });
    await h.go("/");
    const before = await h.page.evaluate(() => localStorage.getItem("financas:store"));
    await h.page.evaluate(() => {
        const orig = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) {
            if (k === "financas:store") throw new DOMException("cheio", "QuotaExceededError");
            return orig.call(this, k, v);
        };
    });
    await h.page.keyboard.press("n");
    const d = h.dialog("Nova transação");
    await money(d.getByRole("textbox", { name: "Valor" }), "500");
    await d.getByRole("textbox", { name: "Descrição" }).fill("Não cabe");
    await d.getByRole("button", { name: "Salvar", exact: true }).click();
    await h.page.getByText(/espaço|armazenamento/i).first().waitFor({ timeout: 5000 });
    eq(await h.page.evaluate(() => localStorage.getItem("financas:store")), before, "dado persistido anterior intacto");
    h.errors.length = 0;
});

test("Integridade", "conta com movimentações não pode ser excluída (só arquivada)", async (h) => {
    await seed(h, { accounts: [{ id: "acc2", name: "Banco 2", type: "checking" }], transactions: [{ type: "expense", amountCents: 100, description: "x", accountId: "acc2" }] });
    await h.go("/configuracoes/contas");
    await h.page.getByRole("button", { name: "Ações para Banco 2" }).click();
    const del = h.page.getByRole("menuitem", { name: /Excluir/ });
    if (await del.isEnabled().catch(() => false)) {
        await del.click();
        const c = h.page.getByRole("alertdialog").or(h.page.getByRole("dialog")).last();
        if (await c.isVisible().catch(() => false)) await c.getByRole("button", { name: /Excluir/ }).last().click().catch(() => {});
    }
    await h.page.waitForTimeout(500);
    const s = await h.store();
    assert(s.accounts.some((a) => a.id === "acc2"), "conta mantida");
    eq(s.transactions.length, 1, "movimentações mantidas");
});

test("Regras", "editar toda a série recorrente altera só pendentes futuros; pagos mantêm o valor", async (h) => {
    await h.go("/movimentacoes");
    await h.page.keyboard.press("n");
    const d = h.dialog("Nova transação");
    await money(d.getByRole("textbox", { name: "Valor" }), "10000");
    await d.getByRole("textbox", { name: "Descrição" }).fill("Plano");
    await d.getByText("Mais opções").click();
    await d.locator("label").filter({ hasText: "Repetir (recorrente)" }).click();
    await d.getByRole("button", { name: "Salvar", exact: true }).click();
    const s0 = await h.waitStore((s) => s.recurrences.length === 1, "série");
    const paid = s0.transactions.find((t) => t.status === "paid");
    const pending = s0.transactions.filter((t) => t.status === "pending");
    assert(paid && pending.length, "há pago e pendentes");
    await h.go("/movimentacoes?periodo=tudo");
    await h.page.getByRole("button", { name: "Ações para Plano" }).first().click();
    await h.page.getByRole("menuitem", { name: "Editar" }).click();
    const e = h.dialog("Editar transação");
    await e.getByLabel(/Alterar toda a série/).check();
    await money(e.getByRole("textbox", { name: "Valor" }), "12000");
    await e.getByRole("button", { name: "Salvar", exact: true }).click();
    const s = await h.waitStore((s) => s.transactions.filter((t) => t.status === "pending").every((t) => t.amountCents === 12000), "pendentes atualizados");
    eq(s.transactions.find((t) => t.id === paid.id).amountCents, 10000, "pago mantém valor");
});

test("Regras", "editar todas as parcelas mantém o total e não altera parcela já paga", async (h) => {
    await h.go("/movimentacoes");
    await h.page.keyboard.press("n");
    const d = h.dialog("Nova transação");
    await money(d.getByRole("textbox", { name: "Valor" }), "30000");
    await d.getByRole("textbox", { name: "Descrição" }).fill("Geladeira");
    await d.getByText("Mais opções").click();
    await d.locator("label").filter({ hasText: "Parcelar" }).click();
    await d.getByLabel("Número de parcelas").fill("3");
    await d.getByRole("button", { name: "Salvar", exact: true }).click();
    const s0 = await h.waitStore((s) => s.transactions.length === 3, "parcelas");
    const first = s0.transactions.find((t) => t.installment.n === 1);
    await h.go("/movimentacoes?periodo=tudo");
    // edita a 2ª parcela pedindo "todas as parcelas"
    const second = s0.transactions.find((t) => t.installment.n === 2);
    await h.page.evaluate(() => 0);
    await h.page.getByRole("button", { name: `Ações para ${second.description}` }).nth(1).click().catch(async () => h.page.getByRole("button", { name: `Ações para ${second.description}` }).first().click());
    await h.page.getByRole("menuitem", { name: "Editar" }).click();
    const e = h.dialog("Editar transação");
    const scopeAll = e.getByLabel(/Alterar todas as parcelas/);
    await scopeAll.check();
    await e.getByRole("textbox", { name: "Descrição" }).fill("Geladeira nova");
    await e.getByRole("button", { name: "Salvar", exact: true }).click();
    const s = await h.waitStore((s) => s.transactions.filter((t) => t.description.startsWith("Geladeira nova")).length >= 2, "descrição aplicada");
    eq(s.transactions.reduce((a, t) => a + t.amountCents, 0), 30000, "total preservado");
    eq(s.transactions.length, 3, "sem parcelas duplicadas");
    assert(s.transactions.find((t) => t.id === first.id), "parcela 1 preservada");
});

test("Consistência", "calendário, despesas por categoria e movimentações do painel conferem com o armazenado", async (h) => {
    const { today } = await seed(h, {
        accounts: [{ id: "acc2", name: "Reserva", type: "savings" }],
        transactions: [
            { type: "expense", amountCents: 1111, description: "A1", categoryId: "cat-mercado", days: 0 },
            { type: "expense", amountCents: 2222, description: "A2", categoryId: "cat-mercado", days: 0 },
            { type: "income", amountCents: 5555, description: "B1", categoryId: "cat-salario", days: 0 },
            { type: "transfer", amountCents: 9999, description: "T", toAccountId: "acc2", days: 0 },
        ],
    });
    await h.go("/");
    const cal = h.page.getByRole("region", { name: "Calendário" });
    const label = await cal.locator(`[data-date="${today}"]`).getAttribute("aria-label");
    assert(/entradas R\$\s?55,55/.test(label) && /saídas R\$\s?33,33/.test(label), `dia de hoje no calendário: ${label}`);
    const cats = await h.page.getByRole("region", { name: /Despesas por categoria/ }).innerText();
    assert(/Mercado[\s\S]*33,33/.test(cats), `categoria Mercado = 33,33: ${cats.replace(/\n/g, " ")}`);
    const recent = await h.page.getByRole("region", { name: /Movimentações recentes/ }).innerText();
    for (const d of ["A1", "A2", "B1"]) assert(recent.includes(d), `recente ${d}`);
});

test("Consistência", "ocultar valores esconde valores também em Contas a pagar e a receber", async (h) => {
    const r = await buildStore(h.page, { transactions: [{ type: "expense", amountCents: 4321, description: "Pend", status: "pending", days: 2 }] });
    r.store.settings.hideBalances = true;
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), r.store);
    for (const p of ["/contas-a-pagar", "/contas-a-receber", "/"]) {
        await h.go(p);
        const text = await h.page.locator("main").innerText();
        const aria = await h.page.evaluate(() => [...document.querySelectorAll("main [aria-label]")].map((e) => e.getAttribute("aria-label")).join(" "));
        assert(!/43,21/.test(text + aria), `valor visível em ${p}`);
    }
});

test("Celular", "criar transação pelo botão + e marcar conta como paga no celular", async (h) => {
    await seed(h, { transactions: [{ id: "p", type: "expense", amountCents: 5000, description: "Água", status: "pending", days: 1 }] });
    await h.go("/");
    await h.page.getByRole("button", { name: "Nova transação" }).last().click();
    const d = h.dialog("Nova transação");
    await money(d.getByRole("textbox", { name: "Valor" }), "990");
    await d.getByRole("textbox", { name: "Descrição" }).fill("Pão");
    await d.getByRole("button", { name: "Salvar", exact: true }).click();
    await h.waitStore((s) => s.transactions.length === 2, "criada no celular");
    await h.page.getByRole("navigation", { name: "Navegação rápida" }).getByRole("link", { name: "Contas" }).click();
    await h.page.getByRole("heading", { level: 1, name: "Contas a pagar" }).waitFor();
    await h.page.getByRole("button", { name: "Marcar como pago: Água" }).click();
    await h.waitStore((s) => s.transactions.find((t) => t.id === "p").status === "paid", "paga no celular");
}, { mobile: true });

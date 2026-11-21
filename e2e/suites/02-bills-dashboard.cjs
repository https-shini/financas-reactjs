const { test, assert, eq, parseBRL } = require("../harness.cjs");
const { buildStore } = require("../fixtures.cjs");

const CARD = { id: "card", name: "Cartão Teste", type: "credit", closingDay: 28, dueDay: 5, limitCents: 500000 };
const SPEC = {
    initialBalanceCents: 100000,
    accounts: [CARD],
    transactions: [
        { id: "inc", type: "income", amountCents: 500000, description: "Salário pago", categoryId: "cat-salario" },
        { id: "exp", type: "expense", amountCents: 20000, description: "Mercado pago", categoryId: "cat-mercado" },
        { id: "late", type: "expense", amountCents: 15000, description: "Luz atrasada", categoryId: "cat-moradia", status: "pending", days: -3 },
        { id: "soon", type: "expense", amountCents: 7000, description: "Internet", categoryId: "cat-assinaturas", status: "pending", days: 5 },
        { id: "rec", type: "income", amountCents: 300000, description: "Cliente A", categoryId: "cat-freelance", status: "pending", days: 10 },
        { id: "reclate", type: "income", amountCents: 40000, description: "Cliente B", categoryId: "cat-freelance", status: "pending", days: -2 },
        { id: "buy", type: "expense", amountCents: 9000, description: "Compra cartão", categoryId: "cat-compras", accountId: "card", days: -1 },
    ],
};

async function seed(h, spec = SPEC) {
    const { store, today } = await buildStore(h.page, spec);
    await h.page.evaluate((s) => localStorage.setItem("financas:store", JSON.stringify(s)), store);
    return { store, today };
}
const kpi = async (h, name) => parseBRL(await h.page.getByRole("region", { name }).locator(".kpi-value").first().innerText());

test("Painel", "indicadores principais batem com os dados armazenados", async (h) => {
    await seed(h);
    await h.go("/");
    eq(await kpi(h, "Saldo atual"), 100000 + 500000 - 20000, "saldo atual (pagos até hoje, sem cartão)");
    eq(await kpi(h, "Total a pagar"), 15000 + 7000 + 9000, "total a pagar (pendentes + fatura)");
    eq(await kpi(h, "Total a receber"), 300000 + 40000, "total a receber");
    const month = await h.page.evaluate(async () => (await import("/src/domain/dates.js")).currentMonthKey());
    const inMonth = SPEC.transactions.filter(() => true); // conferido abaixo pelos dados do mês
    const s = await h.store();
    const start = `${month}-01`;
    const end = `${month}-31`;
    let inc = 0;
    let exp = 0;
    for (const t of s.transactions) if (t.date >= start && t.date <= end && t.type !== "transfer") t.type === "income" ? (inc += t.amountCents) : (exp += t.amountCents);
    eq(await kpi(h, "Resultado do mês"), inc - exp, "resultado do mês (competência)");
    assert(inMonth.length, "fixture");
    // Resumo do gráfico confere com o KPI
    const summary = await h.page.getByRole("region", { name: /Receitas × despesas/ }).locator("dl").innerText();
    assert(summary.replace(/\s/g, "").includes(new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(inc / 100)), `receitas do mês no gráfico (${inc})`);
});

test("Contas a pagar", "lista só compromissos; KPIs batem com o painel", async (h) => {
    await seed(h);
    await h.go("/contas-a-pagar");
    eq(await kpi(h, "Total a pagar"), 31000, "total a pagar");
    eq(await kpi(h, "Em atraso"), 15000, "em atraso");
    eq(await kpi(h, "Vence em 7 dias"), 7000, "vence em 7 dias");
    const list = h.page.getByRole("region", { name: "Em aberto" });
    for (const d of ["Luz atrasada", "Internet", "Fatura Cartão Teste"]) assert(await list.getByText(d).first().isVisible(), `contém ${d}`);
    for (const d of ["Cliente A", "Cliente B", "Salário pago", "Compra cartão"]) assert(!(await list.getByText(d).isVisible().catch(() => false)), `não contém ${d}`);
});

test("Contas a receber", "lista só receitas; KPIs próprios", async (h) => {
    await seed(h);
    await h.go("/contas-a-receber");
    eq(await kpi(h, "Total a receber"), 340000, "total a receber");
    eq(await kpi(h, "Em atraso"), 40000, "em atraso");
    const list = h.page.getByRole("region", { name: "Em aberto" });
    for (const d of ["Cliente A", "Cliente B"]) assert(await list.getByText(d).first().isVisible(), `contém ${d}`);
    for (const d of ["Luz atrasada", "Internet", "Fatura"]) assert(!(await list.getByText(d).first().isVisible().catch(() => false)), `não contém ${d}`);
});

test("Contas a pagar", "marcar como pago persiste, atualiza KPIs do módulo e o saldo do painel; reabrir desfaz", async (h) => {
    await seed(h);
    await h.go("/contas-a-pagar");
    await h.page.getByRole("button", { name: "Marcar como pago: Luz atrasada" }).click();
    await h.waitStore((s) => s.transactions.find((t) => t.id === "late").status === "paid", "luz paga");
    await h.page.waitForTimeout(200);
    eq(await kpi(h, "Total a pagar"), 16000, "total a pagar após pagamento");
    eq(await kpi(h, "Em atraso"), 0, "nada em atraso");
    await h.page.getByRole("radiogroup", { name: /Visualização/ }).getByRole("radio", { name: "Pagas" }).click();
    const pagas = h.page.getByRole("region", { name: "Pagas" });
    assert(await pagas.getByText("Luz atrasada").isVisible(), "aparece em Pagas");
    await h.page.getByRole("button", { name: "Reabrir Luz atrasada como pendente" }).click();
    await h.waitStore((s) => s.transactions.find((t) => t.id === "late").status === "pending", "reaberta");
    await h.go("/");
    eq(await kpi(h, "Total a pagar"), 31000, "painel após reabrir");
    eq(await kpi(h, "Saldo atual"), 580000, "saldo atual após reabrir");
});

test("Contas a receber", "marcar como recebido aumenta o saldo atual e reduz o total a receber", async (h) => {
    await seed(h);
    await h.go("/contas-a-receber");
    await h.page.getByRole("button", { name: "Marcar como recebido: Cliente B" }).click();
    await h.waitStore((s) => s.transactions.find((t) => t.id === "reclate").status === "paid", "recebido");
    await h.go("/");
    eq(await kpi(h, "Saldo atual"), 580000 + 40000, "saldo atual");
    eq(await kpi(h, "Total a receber"), 300000, "total a receber");
});

test("Contas a pagar", "nova conta a pagar abre como despesa pendente e entra em Em aberto", async (h) => {
    await seed(h);
    await h.go("/contas-a-pagar");
    await h.page.getByRole("button", { name: "Nova conta a pagar" }).click();
    const dlg = h.dialog("Nova transação");
    eq(await dlg.getByRole("radio", { name: "Despesa" }).getAttribute("aria-checked"), "true", "tipo despesa");
    eq(await dlg.getByRole("switch", { name: /Pago/ }).isChecked(), false, "status pendente");
    await dlg.getByRole("textbox", { name: "Valor" }).pressSequentially("25000");
    await dlg.getByRole("textbox", { name: "Descrição" }).fill("IPTU");
    await dlg.getByRole("button", { name: "Salvar", exact: true }).click();
    await h.waitStore((s) => s.transactions.some((t) => t.description === "IPTU" && t.status === "pending" && t.type === "expense"), "IPTU pendente");
    assert(await h.page.getByRole("region", { name: "Em aberto" }).getByText("IPTU").isVisible(), "na lista");
    eq(await kpi(h, "Total a pagar"), 56000, "total atualizado");
});

test("Contas a pagar", "filtros: busca, tipo (faturas) e horizonte", async (h) => {
    await seed(h);
    await h.go("/contas-a-pagar");
    const list = h.page.getByRole("region", { name: "Em aberto" });
    await h.page.getByLabel("Filtrar por tipo").selectOption("invoices");
    assert(await list.getByText("Fatura Cartão Teste").first().isVisible(), "fatura visível");
    assert(!(await list.getByText("Internet").isVisible().catch(() => false)), "contas ocultas");
    await h.page.getByLabel("Filtrar por tipo").selectOption("all");
    await h.page.getByLabel("Horizonte de vencimento").selectOption("7");
    assert(await list.getByText("Internet").isVisible(), "dentro de 7 dias");
    assert(await list.getByText("Luz atrasada").isVisible(), "atrasadas sempre aparecem");
    await h.page.getByRole("searchbox", { name: "Buscar em contas a pagar" }).fill("luz");
    assert(!(await list.getByText("Internet").isVisible().catch(() => false)), "busca filtra");
    await h.page.getByRole("button", { name: "Limpar filtros" }).click();
    assert(await list.getByText("Internet").isVisible(), "limpar restaura");
});

test("Contas a pagar", "pagar fatura leva à fatura certa em Cartões", async (h) => {
    await seed(h);
    await h.go("/contas-a-pagar");
    await h.page.getByRole("button", { name: "Pagar fatura" }).first().click();
    await h.page.waitForURL(/\/planejamento\/cartoes\?cartao=card&fatura=\d{4}-\d{2}/);
});

test("Navegação", "contadores da sidebar e notificações refletem atrasados + 7 dias de cada módulo", async (h) => {
    await seed(h);
    await h.go("/");
    const nav = h.page.getByRole("navigation", { name: "Navegação principal" });
    const pay = await nav.getByRole("link", { name: /^Contas a pagar/ }).getAttribute("aria-label");
    const rec = await nav.getByRole("link", { name: /^Contas a receber/ }).getAttribute("aria-label");
    assert(/\(2 pendentes, há atrasadas\)/.test(pay), `contador a pagar: ${pay}`);
    assert(/\(1 pendente, há atrasadas\)/.test(rec), `contador a receber: ${rec}`);
    await h.page.getByRole("button", { name: /^Notificações/ }).click();
    const panel = h.page.getByRole("region", { name: "Notificações" });
    await panel.getByRole("link", { name: /Cliente B/ }).click();
    await h.page.waitForURL(/\/contas-a-receber$/);
});

import { addDaysISO, monthEnd, monthStart } from "../../domain/dates";
import { indexById, upcomingItems } from "../../domain/selectors";
import { isCard } from "../../domain/cards";

/**
 * Modelo (somente leitura) dos módulos Contas a Pagar e Contas a Receber.
 * Não cria regra financeira nova: reaproveita `upcomingItems` (pendentes + faturas em aberto) e o status
 * dos lançamentos ("pending" / "paid"). Nada aqui altera o store.
 *
 * Contas a Pagar  = despesas pendentes fora do cartão, faturas de cartão em aberto e pagamentos de fatura agendados;
 *                   realizados = despesas pagas fora do cartão + pagamentos de fatura (transferência para o cartão).
 * Contas a Receber = receitas pendentes; realizados = receitas recebidas.
 * Transferências entre contas comuns não pertencem a nenhum dos dois módulos.
 */

export const BILL_KINDS = {
    payable: {
        id: "payable",
        title: "Contas a pagar",
        path: "/contas-a-pagar",
        amountType: "expense",
        settleLabel: "Pago",
        settledLabel: "Pagas",
        settledVerb: "Marcar como pago",
        settledToast: "Marcado como pago.",
        reopenToast: "Conta reaberta como pendente.",
        noun: "conta a pagar",
        nounPlural: "contas a pagar",
        party: "Categoria",
    },
    receivable: {
        id: "receivable",
        title: "Contas a receber",
        path: "/contas-a-receber",
        amountType: "income",
        settleLabel: "Recebido",
        settledLabel: "Recebidas",
        settledVerb: "Marcar como recebido",
        settledToast: "Marcado como recebido.",
        reopenToast: "Recebimento reaberto como pendente.",
        noun: "conta a receber",
        nounPlural: "contas a receber",
        party: "Origem",
    },
};

/** Horizonte "sem limite" para pendências futuras (100 anos). */
const ALL = 36500;

function belongsPending(it, kind, accounts) {
    if (kind === "receivable") return it.direction === "in";
    if (it.direction === "out") return true;
    // Pagamento de fatura agendado (transferência pendente para um cartão) é um compromisso a pagar.
    return it.kind === "transaction" && it.direction === "transfer" && isCard(accounts.get(it.tx.toAccountId));
}

function belongsSettled(tx, kind, accounts) {
    if (tx.status !== "paid") return false;
    if (kind === "receivable") return tx.type === "income";
    if (tx.type === "expense") return !isCard(accounts.get(tx.accountId));
    return tx.type === "transfer" && isCard(accounts.get(tx.toAccountId));
}

/** Classificação temporal de um item em aberto. */
export function dueBucket(item) {
    if (item.overdue) return "overdue";
    if (item.daysUntil === 0) return "today";
    if (item.daysUntil <= 7) return "week";
    return "later";
}

export const BUCKET_LABEL = { overdue: "Em atraso", today: "Vence hoje", week: "Próximos 7 dias", later: "Mais adiante" };

function decorate(base, cats, accounts) {
    const tx = base.tx;
    const category = tx?.categoryId ? cats.get(tx.categoryId) ?? null : null;
    const account = tx ? accounts.get(tx.accountId) ?? null : base.card ?? null;
    const toAccount = tx?.toAccountId ? accounts.get(tx.toAccountId) ?? null : null;
    return { ...base, category, account, toAccount, isInvoice: base.kind === "invoice" || (tx?.type === "transfer" && isCard(toAccount)) };
}

/**
 * Entradas do módulo: { open, settled }.
 * open: itens em aberto (inclui atrasados), do mais antigo ao mais distante.
 * settled: lançamentos já pagos/recebidos, do mais recente ao mais antigo.
 */
export function billEntries(store, today, kind) {
    const accounts = indexById(store.accounts);
    const cats = indexById(store.categories);
    const open = upcomingItems(store, today, ALL)
        .filter((it) => belongsPending(it, kind, accounts))
        .map((it) => decorate({ ...it, bucket: dueBucket(it), settled: false }, cats, accounts));
    const settled = store.transactions
        .filter((tx) => belongsSettled(tx, kind, accounts))
        .map((tx) => decorate({ kind: "transaction", id: tx.id, tx, date: tx.date, amountCents: tx.amountCents, description: tx.description, settled: true }, cats, accounts))
        .sort((a, b) => b.date.localeCompare(a.date));
    return { open, settled };
}

const sum = (list) => list.reduce((s, i) => s + i.amountCents, 0);

/** Indicadores do módulo para o mês de referência. */
export function billSummary({ open, settled }, today, month) {
    const overdue = open.filter((i) => i.overdue);
    const week = open.filter((i) => !i.overdue && i.date <= addDaysISO(today, 7));
    const start = monthStart(month);
    const end = monthEnd(month);
    const settledMonth = settled.filter((i) => i.date >= start && i.date <= end);
    const openMonth = open.filter((i) => i.date >= start && i.date <= end);
    const next = open.find((i) => !i.overdue) ?? null;
    return {
        openCents: sum(open),
        openCount: open.length,
        overdueCents: sum(overdue),
        overdueCount: overdue.length,
        weekCents: sum(week),
        weekCount: week.length,
        settledMonthCents: sum(settledMonth),
        settledMonthCount: settledMonth.length,
        openMonthCents: sum(openMonth),
        next,
    };
}

/** Agrupa valores por categoria (ou "Faturas de cartão"), do maior para o menor. */
export function groupByCategory(list) {
    const map = new Map();
    for (const it of list) {
        const key = it.isInvoice ? "__invoice" : it.category?.id ?? "__none";
        const label = it.isInvoice ? "Faturas de cartão" : it.category?.name ?? "Sem categoria";
        const color = it.isInvoice ? it.account?.color ?? it.toAccount?.color ?? null : it.category?.color ?? null;
        const icon = it.isInvoice ? "CreditCard" : it.category?.icon ?? "Tag";
        const cur = map.get(key) ?? { key, label, color, icon, cents: 0, count: 0 };
        cur.cents += it.amountCents;
        cur.count += 1;
        map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.cents - a.cents);
}

/** Filtros da listagem (texto, categoria/origem, tipo de item). */
export function filterEntries(list, { query = "", category = "all", source = "all" } = {}) {
    const q = query.trim().toLocaleLowerCase("pt-BR");
    return list.filter((it) => {
        if (q && !`${it.description} ${it.category?.name ?? ""} ${it.account?.name ?? ""}`.toLocaleLowerCase("pt-BR").includes(q)) return false;
        if (category !== "all") {
            const key = it.isInvoice ? "__invoice" : it.category?.id ?? "__none";
            if (key !== category) return false;
        }
        if (source === "invoices" && !it.isInvoice) return false;
        if (source === "bills" && it.isInvoice) return false;
        return true;
    });
}

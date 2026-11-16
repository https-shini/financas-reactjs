import { NEUTRAL_COLOR } from "../../design/tokens";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ResponsiveContainer, ComposedChart, Bar, Line } from "recharts";
import {
    Wallet, TrendingUp, CalendarClock, Lightbulb, PieChart, ListOrdered, Target, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
    Info, Plus, Upload, Sparkles, CreditCard, Flag, Receipt,
} from "lucide-react";
import {
    Card, CardHeader, Amount, Delta, Progress, levelTone, EmptyState, Button, Badge, CategoryIcon, StatCard, NumericDisplay, Text,
} from "../../components/ui";
import { PageHeader, Grid, Span, Stack, Row } from "../../components/layout/Page";
import { useChartTheme, ChartLegend } from "../../components/charts/chartTheme";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { useFormat } from "../../hooks/useFormat";
import {
    balancesByAccount, categoryBreakdown, consolidatedBalance, groupByDay, indexById, monthComparison, monthlySeries, sortTransactions,
    upcomingItems,
} from "../../domain/selectors";
import { budgetStatus } from "../../domain/budgets";
import { goalProgress } from "../../domain/goals";
import { generateInsights } from "../../domain/insights";
import { forecastEndOfMonth, spendableToday } from "../../domain/projection";
import { cardSummary, isCard, INVOICE_STATUS_LABEL } from "../../domain/cards";
import { formatDateBR, formatDayHeading, formatMonthLabel, monthEnd, monthStart } from "../../domain/dates";
import { ACCOUNT_TYPES } from "../../domain/defaults";
import { TransactionRow, TxList } from "../transactions/TransactionRow";
import { OnboardingCard } from "./OnboardingCard";

// ---------------- estilos locais ----------------

const Split = styled.dl`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid ${(p) => p.theme.colors.border};
    dt {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
    dd {
        display: grid;
        gap: 2px;
        font-size: ${(p) => p.theme.fontSize.base};
    }
`;

const AccountList = styled.ul`
    list-style: none;
    margin-top: 4px;
    display: grid;
    gap: 2px;
    li {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        min-height: 32px;
        align-items: center;
        font-size: ${(p) => p.theme.fontSize.sm};
    }
    .dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        display: inline-block;
        margin-right: 8px;
    }
`;

const ToggleLink = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    justify-self: start;
    font-size: ${(p) => p.theme.fontSize.sm};
    font-weight: ${(p) => p.theme.fontWeight.medium};
    color: ${(p) => p.theme.colors.primaryText};
`;

const SubMetric = styled.div`
    display: grid;
    gap: 2px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid ${(p) => p.theme.colors.border};
`;

const BarList = styled.ul`
    list-style: none;
    display: grid;
    gap: 2px;
    button {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 6px;
        border-radius: ${(p) => p.theme.radius.md};
        text-align: left;
        transition: background ${(p) => p.theme.motion.fast};
        &:hover {
            background: ${(p) => p.theme.colors.bgHover};
        }
    }
    .name {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: ${(p) => p.theme.fontSize.sm};
        margin-bottom: 6px;
        span:first-child {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
    .pct {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
        font-variant-numeric: tabular-nums;
        min-width: 36px;
        text-align: right;
    }
`;

const DayHeading = styled.h3`
    font-family: ${(p) => p.theme.fonts.sans} !important;
    font-size: ${(p) => p.theme.fontSize.xs} !important;
    font-weight: ${(p) => p.theme.fontWeight.semibold};
    text-transform: uppercase;
    letter-spacing: ${(p) => p.theme.letterSpacing.wide} !important;
    color: ${(p) => p.theme.colors.textMuted};
    padding: 10px 8px 4px;
`;

const ItemList = styled.ul`
    list-style: none;
    display: grid;
    gap: 2px;
    li {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        padding: 4px 6px;
        border-radius: ${(p) => p.theme.radius.md};
    }
    .info {
        flex: 1;
        min-width: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
    }
    .info > span:first-child {
        font-weight: ${(p) => p.theme.fontWeight.medium};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .when {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px 6px;
        margin-top: 2px;
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

const InsightList = styled.ul`
    list-style: none;
    display: grid;
    gap: 10px;
    grid-template-columns: minmax(0, 1fr);
    ${(p) => p.theme.media.tablet} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    li {
        display: flex;
        gap: 12px;
        padding: 14px;
        border-radius: ${(p) => p.theme.radius.md};
        background: ${(p) => p.theme.colors.bgSurface};
        border: 1px solid ${(p) => p.theme.colors.border};
    }
    .ic {
        flex-shrink: 0;
        margin-top: 2px;
    }
    strong {
        display: block;
        font-size: ${(p) => p.theme.fontSize.md};
        margin-bottom: 2px;
    }
`;

const ChartBox = styled.div`
    width: 100%;
    height: 260px;
    ${(p) => p.theme.media.mobile} {
        height: 220px;
    }
`;

const BigValue = ({ children }) => <NumericDisplay>{children}</NumericDisplay>;

// ---------------- indicadores principais ----------------

function BalanceCard({ store, today }) {
    const [open, setOpen] = useState(false);
    const c = consolidatedBalance(store, today);
    const balances = balancesByAccount(store, today).filter((b) => !b.account.archived || b.balanceCents !== 0);
    const multiple = balances.length > 1;
    return (
        <StatCard
            label="Saldo disponível"
            icon={Wallet}
            iconTone="primaryText"
            accent="brand"
            tooltip="Soma do saldo realizado das contas (exceto cartões): considera apenas lançamentos pagos até hoje."
            value={
                <BigValue>
                    <Amount cents={c.cashCents} private colored={false} weight={700} big />
                </BigValue>
            }
            hint={
                c.cardDebtCents > 0 ? (
                    <>
                        Cartões a pagar <Amount cents={c.cardDebtCents} private colored={false} weight={500} /> · patrimônio <Amount cents={c.netWorthCents} private colored={false} weight={500} />
                    </>
                ) : (
                    "Saldo realizado em todas as contas"
                )
            }
        >
            {multiple && (
                <>
                    <ToggleLink type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
                        {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />} Ver por conta
                    </ToggleLink>
                    {open && (
                        <AccountList>
                            {balances.map(({ account, balanceCents }) => (
                                <li key={account.id}>
                                    <span>
                                        <span className="dot" style={{ background: account.color }} aria-hidden="true" />
                                        {account.name} <Text as="span" $variant="caption" $tone="muted">· {ACCOUNT_TYPES[account.type]}</Text>
                                    </span>
                                    <Amount cents={balanceCents} private sign={isCard(account)} colored={isCard(account)} />
                                </li>
                            ))}
                        </AccountList>
                    )}
                </>
            )}
        </StatCard>
    );
}

function MonthResultCard({ store, month }) {
    const cmp = monthComparison(store, month);
    const cur = cmp.current;
    const monthName = formatMonthLabel(month).split(" de ")[0].toLowerCase();
    return (
        <StatCard
            label={`Resultado de ${monthName}`}
            icon={TrendingUp}
            iconTone={cur.resultCents >= 0 ? "income" : "expense"}
            accent={cur.resultCents >= 0 ? "income" : "expense"}
            tooltip="Receitas menos despesas do mês (competência: data do lançamento, incluindo pendentes). Transferências não entram."
            value={
                <BigValue>
                    <Amount cents={cur.resultCents} sign private weight={700} big />
                </BigValue>
            }
            delta={<Delta value={cmp.resultVariation} />}
        >
            <Split>
                <div>
                    <dt>Receitas</dt>
                    <dd>
                        <Amount cents={cur.incomeCents} type="income" private />
                        <Delta value={cmp.incomeVariation} suffix="" />
                    </dd>
                </div>
                <div>
                    <dt>Despesas</dt>
                    <dd>
                        <Amount cents={cur.expenseCents} type="expense" private />
                        <Delta value={cmp.expenseVariation} goodWhenUp={false} suffix="" />
                    </dd>
                </div>
            </Split>
        </StatCard>
    );
}

function ForecastCard({ store, today }) {
    const f = forecastEndOfMonth(store, today);
    const s = spendableToday(store, today);
    return (
        <StatCard
            label={`Previsto até ${formatDateBR(f.endDate, "dd/MM")}`}
            icon={Sparkles}
            iconTone="accentText"
            accent="accent"
            tooltip="Projeção do dinheiro em contas até o fim do mês: saldo atual + pendentes + recorrências + faturas de cartão a vencer."
            value={
                <BigValue>
                    <Amount cents={f.endBalanceCents} private colored={false} weight={700} big />
                </BigValue>
            }
            hint={
                <>
                    Entradas <Amount cents={f.inflowCents} type="income" private weight={500} /> · saídas <Amount cents={f.outflowCents} type="expense" private weight={500} />
                </>
            }
        >
            <SubMetric>
                <Text $variant="caption" $tone="secondary">
                    Pode gastar por dia até o fim do mês
                </Text>
                <Text $variant="h2" as="p">
                    <Amount cents={s.dailyCents} private colored={false} />
                </Text>
                <Text $variant="caption" $tone="muted">
                    {s.shortfall ? "Os compromissos já lançados superam o saldo previsto." : `Saldo previsto${s.reserveCents ? " menos a reserva para metas" : ""}, dividido por ${s.daysLeft} dia(s).`}
                </Text>
                {f.firstNegativeDate && (
                    <Row $gap={2} style={{ marginTop: 6 }}>
                        <Badge $tone="expense">
                            <AlertTriangle size={12} aria-hidden="true" /> Saldo negativo em {formatDateBR(f.firstNegativeDate, "dd/MM")}
                        </Badge>
                    </Row>
                )}
            </SubMetric>
        </StatCard>
    );
}

// ---------------- gráficos ----------------

function CashflowCard({ store, month, onPickMonth }) {
    const chart = useChartTheme();
    const { money } = useFormat();
    const data = monthlySeries(store, month, 6).map((r) => ({
        ...r,
        label: formatMonthLabel(r.month, "short"),
        income: r.incomeCents / 100,
        expense: r.expenseCents / 100,
        result: r.resultCents / 100,
    }));
    const hasData = data.some((d) => d.incomeCents || d.expenseCents);
    return (
        <Card aria-labelledby="cf-title">
            <CardHeader
                id="cf-title"
                title="Evolução: receitas × despesas"
                subtitle="Últimos 6 meses · clique em um mês para selecioná-lo"
                actions={
                    <Button size="sm" variant="ghost" as={Link} to="/relatorios/anual">
                        Relatórios
                    </Button>
                }
            />
            {hasData ? (
                <>
                    <ChartBox aria-hidden="true">
                        <ResponsiveContainer>
                            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} onClick={(e) => e?.activePayload && onPickMonth(e.activePayload[0].payload.month)}>
                                {chart.grid}
                                {chart.xAxis({ dataKey: "label" })}
                                {chart.yAxis()}
                                {chart.tooltip()}
                                <Bar dataKey="income" name="Receitas" fill={chart.colors.income} radius={chart.barRadius} maxBarSize={26} cursor="pointer" />
                                <Bar dataKey="expense" name="Despesas" fill={chart.colors.expense} radius={chart.barRadius} maxBarSize={26} cursor="pointer" />
                                <Line dataKey="result" name="Resultado" stroke={chart.colors.accent} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: chart.colors.accent }} activeDot={{ r: 5 }} type="monotone" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </ChartBox>
                    <div className="sr-only">
                        <table>
                            <caption>Receitas e despesas por mês</caption>
                            <thead>
                                <tr>
                                    <th>Mês</th>
                                    <th>Receitas</th>
                                    <th>Despesas</th>
                                    <th>Resultado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((d) => (
                                    <tr key={d.month}>
                                        <td>{formatMonthLabel(d.month)}</td>
                                        <td>{money(d.incomeCents)}</td>
                                        <td>{money(d.expenseCents)}</td>
                                        <td>{money(d.resultCents)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <ChartLegend
                        items={[
                            { label: "Receitas", color: chart.colors.income },
                            { label: "Despesas", color: chart.colors.expense },
                            { label: "Resultado", color: chart.colors.accent, line: true },
                        ]}
                    />
                </>
            ) : (
                <EmptyState compact icon={TrendingUp} title="Sem histórico ainda" description="O gráfico aparece quando houver lançamentos nos últimos meses." />
            )}
        </Card>
    );
}

function CategoriesCard({ store, month }) {
    const rows = categoryBreakdown(store, monthStart(month), monthEnd(month), "expense");
    const navigate = useNavigate();
    const max = rows[0]?.totalCents ?? 0;
    return (
        <Card aria-labelledby="cat-title">
            <CardHeader id="cat-title" title="Despesas por categoria" subtitle={formatMonthLabel(month)} />
            {rows.length ? (
                <BarList>
                    {rows.slice(0, 7).map((r) => (
                        <li key={r.category.id ?? "none"}>
                            <button
                                type="button"
                                onClick={() => navigate(`/movimentacoes?inicio=${monthStart(month)}&fim=${monthEnd(month)}&tipo=expense&cat=${r.category.id ?? "none"}`)}
                                aria-label={`${r.category.name}: ${Math.round(r.pct)}% das despesas. Ver lançamentos`}
                            >
                                <CategoryIcon category={r.category} size={32} />
                                <span style={{ minWidth: 0 }}>
                                    <span className="name">
                                        <span>{r.category.name}</span>
                                        <Amount cents={r.totalCents} private colored={false} weight={500} />
                                    </span>
                                    <Progress value={r.totalCents} max={max} color={r.category.color} height={6} />
                                </span>
                                <span className="pct">{Math.round(r.pct)}%</span>
                            </button>
                        </li>
                    ))}
                </BarList>
            ) : (
                <EmptyState compact icon={PieChart} title="Nenhuma despesa no mês" description="Quando houver despesas, você verá aqui para onde vai o dinheiro." />
            )}
        </Card>
    );
}

// ---------------- listas ----------------

function RecentCard({ store, today }) {
    const { openTransaction } = useUI();
    const cats = useMemo(() => indexById(store.categories), [store.categories]);
    const accs = useMemo(() => indexById(store.accounts), [store.accounts]);
    const recent = sortTransactions(store.transactions.filter((t) => t.date <= today), "date-desc").slice(0, 7);
    const groups = groupByDay(recent);
    return (
        <Card aria-labelledby="recent-title">
            <CardHeader
                id="recent-title"
                title="Últimas transações"
                actions={
                    <Button size="sm" variant="ghost" as={Link} to="/movimentacoes">
                        Ver todas
                    </Button>
                }
            />
            {groups.length ? (
                groups.map((g) => (
                    <section key={g.date} aria-label={formatDayHeading(g.date, today)}>
                        <DayHeading>{formatDayHeading(g.date, today)}</DayHeading>
                        <TxList>
                            {g.items.map((tx) => (
                                <TransactionRow key={tx.id} tx={tx} categories={cats} accounts={accs} today={today} onOpen={(t) => openTransaction({ mode: "edit", tx: t })} />
                            ))}
                        </TxList>
                    </section>
                ))
            ) : (
                <EmptyState compact icon={ListOrdered} title="Nenhuma movimentação" description="Registre receitas e despesas para acompanhar seu mês.">
                    <Button variant="primary" icon={Plus} onClick={() => openTransaction()}>
                        Nova transação
                    </Button>
                </EmptyState>
            )}
        </Card>
    );
}

function UpcomingCard({ store, today }) {
    const { setTransactionsStatus } = useFinanceActions();
    const all = upcomingItems(store, today, 30).filter((i) => i.kind === "transaction");
    const items = all.slice(0, 5);
    return (
        <Card aria-labelledby="up-title">
            <CardHeader
                id="up-title"
                title="Contas a pagar e receber"
                subtitle="Atrasadas e próximos 30 dias"
                actions={
                    <Button size="sm" variant="ghost" as={Link} to="/planejamento/vencimentos">
                        Ver todas{all.length > 5 ? ` (${all.length})` : ""}
                    </Button>
                }
            />
            {items.length ? (
                <ItemList>
                    {items.map((it) => (
                        <li key={it.id}>
                            <CategoryIcon category={store.categories.find((c) => c.id === it.tx.categoryId) ?? { icon: "Tag", color: NEUTRAL_COLOR }} size={34} />
                            <span className="info">
                                <span>{it.description}</span>
                                <span className="when">
                                    {it.overdue ? (
                                        <Badge $tone="expense">Atrasada desde {formatDateBR(it.date, "dd/MM")}</Badge>
                                    ) : it.daysUntil === 0 ? (
                                        <Badge $tone="warning">Vence hoje</Badge>
                                    ) : (
                                        `${formatDateBR(it.date, "dd/MM")} · em ${it.daysUntil} dia(s)`
                                    )}
                                </span>
                            </span>
                            <Amount cents={it.amountCents} type={it.direction === "in" ? "income" : it.direction === "out" ? "expense" : "transfer"} private />
                            <Button
                                size="sm"
                                variant="ghost"
                                icon={CheckCircle2}
                                onClick={() => setTransactionsStatus([it.tx.id], "paid")}
                                aria-label={`Marcar ${it.description} como ${it.direction === "in" ? "recebido" : "pago"}`}
                                title={it.direction === "in" ? "Marcar como recebido" : "Marcar como pago"}
                            />
                        </li>
                    ))}
                </ItemList>
            ) : (
                <EmptyState compact icon={CalendarClock} title="Nada a vencer" description="Lançamentos pendentes e recorrências aparecem aqui." />
            )}
        </Card>
    );
}

function InvoicesCard({ store, today }) {
    const navigate = useNavigate();
    const cards = store.accounts.filter((a) => isCard(a) && !a.archived);
    const rows = cards
        .map((c) => {
            const s = cardSummary(store, c, today);
            const pending = s.invoices.filter((i) => i.remainingCents > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
            const next = pending[0] ?? s.currentInvoice;
            return { card: c, summary: s, invoice: next };
        })
        .sort((a, b) => a.invoice.dueDate.localeCompare(b.invoice.dueDate));
    return (
        <Card aria-labelledby="inv-title">
            <CardHeader
                id="inv-title"
                title="Próximas faturas"
                subtitle="Cartões de crédito"
                actions={
                    <Button size="sm" variant="ghost" as={Link} to="/planejamento/cartoes">
                        Cartões
                    </Button>
                }
            />
            {rows.length ? (
                <ItemList>
                    {rows.map(({ card, summary, invoice }) => {
                        const overdue = invoice.status === "overdue";
                        return (
                            <li key={card.id}>
                                <CategoryIcon category={{ icon: "Receipt", color: card.color }} size={34} />
                                <span className="info">
                                    <span>{card.name}</span>
                                    <span className="when">
                                        {overdue ? <Badge $tone="expense">Vencida em {formatDateBR(invoice.dueDate, "dd/MM")}</Badge> : <span>{`${INVOICE_STATUS_LABEL[invoice.status]} · vence ${formatDateBR(invoice.dueDate, "dd/MM")}`}</span>}
                                        <span>
                                            Limite livre <Amount cents={summary.availableCents} private colored={false} weight={400} />
                                        </span>
                                    </span>
                                </span>
                                <Amount cents={invoice.remainingCents || invoice.totalCents} private colored={false} />
                                {invoice.remainingCents > 0 && (
                                    <Button size="sm" variant="ghost" onClick={() => navigate(`/planejamento/cartoes?cartao=${card.id}&fatura=${invoice.month}`)}>
                                        Pagar
                                    </Button>
                                )}
                            </li>
                        );
                    })}
                </ItemList>
            ) : (
                <EmptyState compact icon={CreditCard} title="Nenhum cartão" description="Cadastre cartões para acompanhar faturas, limite e parcelas.">
                    <Button size="sm" as={Link} to="/planejamento/cartoes" icon={Receipt}>
                        Adicionar cartão
                    </Button>
                </EmptyState>
            )}
        </Card>
    );
}

function GoalsCard({ store, today }) {
    const goals = store.goals.filter((g) => !g.archived).slice(0, 3);
    return (
        <Card aria-labelledby="goals-title">
            <CardHeader
                id="goals-title"
                title="Metas financeiras"
                actions={
                    <Button size="sm" variant="ghost" as={Link} to="/planejamento/metas">
                        Gerenciar
                    </Button>
                }
            />
            {goals.length ? (
                <Stack $gap={4}>
                    {goals.map((g) => {
                        const p = goalProgress(g, today);
                        return (
                            <div key={g.id}>
                                <Row $justify="space-between" $gap={2} style={{ marginBottom: 6 }}>
                                    <Text as="span" $variant="body" style={{ fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {g.name}
                                    </Text>
                                    <Text as="span" $variant="caption" $tone="secondary" $numeric>
                                        {Math.round(p.pct)}%
                                    </Text>
                                </Row>
                                <Progress value={p.savedCents} max={g.targetCents} color={g.color} label={`${g.name}: ${Math.round(p.pct)}% concluída`} />
                                <Text $variant="caption" $tone="muted" style={{ marginTop: 6 }}>
                                    <Amount cents={p.savedCents} private colored={false} weight={500} /> de <Amount cents={g.targetCents} private colored={false} weight={400} />
                                    {p.completed ? " · concluída" : p.suggestedMonthlyCents ? <> · aporte sugerido <Amount cents={p.suggestedMonthlyCents} private colored={false} weight={400} />/mês</> : ""}
                                </Text>
                            </div>
                        );
                    })}
                </Stack>
            ) : (
                <EmptyState compact icon={Flag} title="Nenhuma meta" description="Defina objetivos como reserva de emergência ou viagem e acompanhe o progresso.">
                    <Button size="sm" as={Link} to="/planejamento/metas">
                        Criar meta
                    </Button>
                </EmptyState>
            )}
        </Card>
    );
}

function BudgetsCard({ store, month }) {
    const rows = budgetStatus(store, month).slice(0, 5);
    return (
        <Card aria-labelledby="bud-title">
            <CardHeader
                id="bud-title"
                title="Orçamentos"
                subtitle={formatMonthLabel(month)}
                actions={
                    <Button size="sm" variant="ghost" as={Link} to="/planejamento/orcamentos">
                        Gerenciar
                    </Button>
                }
            />
            {rows.length ? (
                <Stack $gap={4}>
                    {rows.map((r) => (
                        <div key={r.budget.id}>
                            <Row $justify="space-between" $wrap $gap={2} style={{ marginBottom: 6 }}>
                                <Row $gap={2}>
                                    <CategoryIcon category={r.category} size={24} />
                                    <Text as="span" $variant="caption" style={{ fontWeight: 500 }} $tone="default">
                                        {r.category.name}
                                    </Text>
                                    {r.level !== "ok" && <Badge $tone={levelTone(r.level)}>{r.level === "exceeded" ? "Estourado" : "80% atingido"}</Badge>}
                                </Row>
                                <Text as="span" $variant="caption" $tone="secondary">
                                    <Amount cents={r.spentCents} private colored={false} weight={500} /> de <Amount cents={r.limitCents} private colored={false} weight={400} />
                                </Text>
                            </Row>
                            <Progress value={r.spentCents} max={r.limitCents} tone={levelTone(r.level)} label={`${r.category.name}: ${Math.round(r.pct)}% do orçamento`} />
                        </div>
                    ))}
                </Stack>
            ) : (
                <EmptyState compact icon={Target} title="Sem orçamentos" description="Defina limites mensais por categoria para receber alertas em 80% e 100%.">
                    <Button as={Link} to="/planejamento/orcamentos" size="sm">
                        Criar orçamento
                    </Button>
                </EmptyState>
            )}
        </Card>
    );
}

function InsightsCard({ store, month, today }) {
    const { locale, currency } = store.settings;
    const list = generateInsights(store, month, today, { locale, currency });
    const iconFor = (tone) => (tone === "warning" ? AlertTriangle : tone === "good" ? CheckCircle2 : Info);
    const toneFor = (tone) => (tone === "warning" ? "warning" : tone === "good" ? "income" : "accent");
    return (
        <Card aria-labelledby="ins-title">
            <CardHeader id="ins-title" title="Insights" subtitle="Análises automáticas calculadas a partir dos seus lançamentos" actions={<Badge $tone="accent">Inteligência</Badge>} />
            {list.length ? (
                <InsightList>
                    {list.slice(0, 4).map((i) => {
                        const Icon = iconFor(i.tone);
                        return (
                            <li key={i.id}>
                                <span className="ic">
                                    <Badge $tone={toneFor(i.tone)} aria-hidden="true" style={{ padding: 6 }}>
                                        <Icon size={14} />
                                    </Badge>
                                </span>
                                <div>
                                    <strong>{i.title}</strong>
                                    <Text $variant="caption" $tone="secondary">
                                        {i.detail}
                                    </Text>
                                </div>
                            </li>
                        );
                    })}
                </InsightList>
            ) : (
                <EmptyState compact icon={Lightbulb} title="Ainda sem insights" description="Com alguns meses de histórico, mostramos variações por categoria, peso das despesas fixas e alertas." />
            )}
        </Card>
    );
}

export default function DashboardPage() {
    const { store, today } = useFinance();
    const { month, setMonth, openTransaction } = useUI();
    const isEmpty = store.transactions.length === 0;
    const showOnboarding = !store.settings.onboardingDone && isEmpty;

    return (
        <>
            <PageHeader
                title="Visão geral"
                description={isEmpty ? "Bem-vindo ao Finanças. Comece registrando sua primeira transação." : `Resumo financeiro de ${formatMonthLabel(month).toLowerCase()}`}
            />
            {showOnboarding && <OnboardingCard />}
            {!showOnboarding && isEmpty && (
                <Card style={{ marginBottom: 20 }}>
                    <EmptyState icon={Sparkles} title="Nenhuma movimentação ainda" description="Adicione receitas e despesas ou importe uma planilha para ver seu painel ganhar vida.">
                        <Button variant="primary" icon={Plus} onClick={() => openTransaction()}>
                            Nova transação
                        </Button>
                        <Button as={Link} to="/configuracoes/dados#importar" icon={Upload}>
                            Importar dados
                        </Button>
                    </EmptyState>
                </Card>
            )}
            <Grid>
                <Span $desktop={4}>
                    <BalanceCard store={store} today={today} />
                </Span>
                <Span $desktop={4}>
                    <MonthResultCard store={store} month={month} />
                </Span>
                <Span $desktop={4}>
                    <ForecastCard store={store} today={today} />
                </Span>
                <Span $desktop={8}>
                    <CashflowCard store={store} month={month} onPickMonth={setMonth} />
                </Span>
                <Span $desktop={4}>
                    <CategoriesCard store={store} month={month} />
                </Span>
                <Span $desktop={6}>
                    <UpcomingCard store={store} today={today} />
                </Span>
                <Span $desktop={6}>
                    <RecentCard store={store} today={today} />
                </Span>
                <Span $desktop={4}>
                    <InvoicesCard store={store} today={today} />
                </Span>
                <Span $desktop={4}>
                    <GoalsCard store={store} today={today} />
                </Span>
                <Span $desktop={4}>
                    <BudgetsCard store={store} month={month} />
                </Span>
                <Span $desktop={12}>
                    <InsightsCard store={store} month={month} today={today} />
                </Span>
            </Grid>
        </>
    );
}

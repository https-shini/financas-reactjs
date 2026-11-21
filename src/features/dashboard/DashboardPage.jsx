import { NEUTRAL_COLOR } from "../../design/tokens";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { ResponsiveContainer, ComposedChart, Bar, Line } from "recharts";
import {
    Wallet, TrendingUp, CalendarClock, Lightbulb, PieChart, ListOrdered, Target, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
    Info, Plus, Upload, Sparkles, CreditCard, Flag, Receipt, Zap, ArrowUp, ArrowDown, ArrowLeftRight, PiggyBank,
} from "lucide-react";
import {
    Card, CardHeader, Amount, Delta, Progress, levelTone, EmptyState, Button, Badge, CategoryIcon, StatCard, NumericDisplay, Text, SegmentedControl,
} from "../../components/ui";
import { PageHeader, Grid, Span, Stack, Row } from "../../components/layout/Page";
import { useChartTheme, ChartLegend } from "../../components/charts/chartTheme";
import { Sparkline } from "../../components/charts/Sparkline";
import { percentOf } from "../../domain/money";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { useFormat } from "../../hooks/useFormat";
import {
    balancesByAccount, categoryBreakdown, consolidatedBalance, indexById, monthComparison, monthlySeries, sortTransactions,
    upcomingItems,
} from "../../domain/selectors";
import { budgetStatus } from "../../domain/budgets";
import { goalProgress } from "../../domain/goals";
import { generateInsights } from "../../domain/insights";
import { forecastEndOfMonth, spendableToday } from "../../domain/projection";
import { cardSummary, isCard, INVOICE_STATUS_LABEL } from "../../domain/cards";
import { formatDateBR, formatMonthLabel, monthEnd, monthStart } from "../../domain/dates";
import { ACCOUNT_TYPES } from "../../domain/defaults";
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

// ---------------- KPIs do mês (padrão Nexus: valor em mono + variação + minigráfico) ----------------

const KpiGrid = styled.div`
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
    }
    /* Celular: duas colunas, valor menor e variação em linha própria. */
    ${(p) => p.theme.media.mobile} {
        section {
            padding: 12px 14px;
            gap: 8px;
        }
        .kpi-value > span {
            font-size: 1.25rem;
        }
        .kpi-foot {
            flex-direction: column;
            align-items: stretch;
            gap: 6px;
        }
        .kpi-foot svg {
            width: 100%;
        }
    }
`;

const KpiFoot = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
`;

function KpiRow({ store, month }) {
    const theme = useTheme();
    const cmp = monthComparison(store, month);
    const cur = cmp.current;
    const prev = cmp.previous;
    const series = monthlySeries(store, month, 6);
    const rate = (r) => (r.incomeCents ? percentOf(r.resultCents, r.incomeCents) : null);
    const curRate = rate(cur);
    const prevRate = rate(prev);
    const rateDelta = curRate !== null && prevRate !== null ? curRate - prevRate : null;
    const monthName = formatMonthLabel(month).split(" de ")[0].toLowerCase();
    const items = [
        {
            key: "in",
            label: "Entradas",
            icon: ArrowUp,
            tone: "income",
            tip: "Receitas do mês (competência: data do lançamento, incluindo pendentes). Transferências não entram.",
            value: <Amount cents={cur.incomeCents} private colored={false} weight={600} big />,
            delta: <Delta value={cmp.incomeVariation} suffix="vs. mês ant." />,
            spark: series.map((r) => r.incomeCents),
            color: theme.colors.chart.income,
        },
        {
            key: "out",
            label: "Saídas",
            icon: ArrowDown,
            tone: "expense",
            tip: "Despesas do mês (competência), incluindo pendentes e compras no cartão.",
            value: <Amount cents={cur.expenseCents} private colored={false} weight={600} big />,
            delta: <Delta value={cmp.expenseVariation} goodWhenUp={false} suffix="vs. mês ant." />,
            spark: series.map((r) => r.expenseCents),
            color: theme.colors.chart.expense,
        },
        {
            key: "res",
            label: `Saldo de ${monthName}`,
            icon: Wallet,
            tone: "accentText",
            tip: "Entradas menos saídas do mês. Transferências entre contas não entram.",
            value: <Amount cents={cur.resultCents} sign private weight={600} big />,
            delta: <Delta value={cmp.resultVariation} suffix="vs. mês ant." />,
            spark: series.map((r) => r.resultCents),
            color: theme.colors.chart.primary,
        },
        {
            key: "rate",
            label: "Taxa de poupança",
            icon: PiggyBank,
            tone: "neutral",
            tip: "Quanto das entradas do mês sobrou: saldo do mês ÷ entradas.",
            value:
                curRate === null ? (
                    <Text $tone="muted">Sem entradas no mês</Text>
                ) : (
                    <>
                        {Math.round(curRate)}
                        <span style={{ fontSize: "0.54em", opacity: 0.6, marginLeft: 2 }}>%</span>
                    </>
                ),
            delta: <Delta value={rateDelta} unit=" pp" suffix="vs. mês ant." />,
            spark: series.map((r) => rate(r) ?? 0),
            color: theme.colors.chart.neutral,
        },
    ];
    return (
        <KpiGrid>
            {items.map((k) => (
                <StatCard
                    key={k.key}
                    label={k.label}
                    icon={k.icon}
                    iconTone={k.tone}
                    tooltip={k.tip}
                    value={
                        <span className="kpi-value">
                            <BigValue>{k.value}</BigValue>
                        </span>
                    }
                >
                    <KpiFoot className="kpi-foot">
                        {k.delta}
                        <Sparkline values={k.spark} color={k.color} />
                    </KpiFoot>
                </StatCard>
            ))}
        </KpiGrid>
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

// ---------------- Transações recentes (tabela no padrão Nexus) ----------------

const RecentTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: ${(p) => p.theme.fontSize.md};
    th {
        text-align: left;
        font-size: ${(p) => p.theme.fontSize.xs};
        font-weight: ${(p) => p.theme.fontWeight.medium};
        letter-spacing: ${(p) => p.theme.letterSpacing.wide};
        text-transform: uppercase;
        color: ${(p) => p.theme.colors.textMuted};
        padding: 10px 8px;
        border-bottom: 1px solid ${(p) => p.theme.colors.border};
    }
    td {
        padding: 10px 8px;
        border-bottom: 1px solid ${(p) => p.theme.colors.border};
        vertical-align: middle;
    }
    tr:last-child td {
        border-bottom: 0;
    }
    tbody tr {
        transition: background ${(p) => p.theme.motion.fast};
    }
    tbody tr:hover {
        background: ${(p) => p.theme.colors.bgSurface};
    }
    .r {
        text-align: right;
    }
    .desc {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        text-align: left;
        width: 100%;
        border-radius: ${(p) => p.theme.radius.sm};
    }
    .desc:focus-visible {
        outline: 2px solid ${(p) => p.theme.colors.focus};
        outline-offset: 2px;
    }
    .desc .t {
        display: grid;
        min-width: 0;
    }
    .desc .n {
        font-weight: ${(p) => p.theme.fontWeight.medium};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .desc .c {
        font-size: ${(p) => p.theme.fontSize.sm};
        color: ${(p) => p.theme.colors.textMuted};
    }
    .date {
        color: ${(p) => p.theme.colors.textSecondary};
        white-space: nowrap;
    }
    /* Celular: só descrição e valor (tipo e data aparecem na linha de detalhe). */
    ${(p) => p.theme.media.mobile} {
        .hide-sm {
            display: none;
        }
    }
`;

const TYPE_BADGE = {
    income: { tone: "income", icon: ArrowUp, label: "Entrada" },
    expense: { tone: "expense", icon: ArrowDown, label: "Saída" },
    transfer: { tone: "neutral", icon: ArrowLeftRight, label: "Transferência" },
};

function TypeBadge({ type }) {
    const b = TYPE_BADGE[type] ?? TYPE_BADGE.expense;
    return (
        <Badge $tone={b.tone}>
            <b.icon size={11} aria-hidden="true" /> {b.label}
        </Badge>
    );
}

function RecentCard({ store, today }) {
    const { openTransaction } = useUI();
    const [filter, setFilter] = useState("all");
    const cats = useMemo(() => indexById(store.categories), [store.categories]);
    const all = sortTransactions(store.transactions.filter((t) => t.date <= today), "date-desc");
    const rows = all.filter((t) => filter === "all" || t.type === filter).slice(0, 8);
    return (
        <Card aria-labelledby="recent-title">
            <CardHeader
                id="recent-title"
                title="Transações recentes"
                subtitle={`${rows.length} ${rows.length === 1 ? "registro" : "registros"} · até hoje`}
                actions={
                    <SegmentedControl
                        label="Filtrar transações recentes"
                        value={filter}
                        onChange={setFilter}
                        options={[
                            { value: "all", label: "Todas" },
                            { value: "income", label: "Entradas" },
                            { value: "expense", label: "Saídas" },
                        ]}
                    />
                }
            />
            {rows.length ? (
                <div style={{ overflowX: "auto", margin: "0 -8px" }}>
                    <RecentTable>
                        <caption className="sr-only">Transações recentes</caption>
                        <thead>
                            <tr>
                                <th scope="col">Descrição</th>
                                <th scope="col" className="hide-sm">
                                    Tipo
                                </th>
                                <th scope="col" className="hide-sm">
                                    Data
                                </th>
                                <th scope="col" className="r">
                                    Valor
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((tx) => {
                                const cat = tx.categoryId ? cats.get(tx.categoryId) : null;
                                return (
                                    <tr key={tx.id}>
                                        <td>
                                            <button type="button" className="desc" onClick={() => openTransaction({ mode: "edit", tx })} aria-label={`Editar ${tx.description}`}>
                                                <CategoryIcon category={cat ?? { icon: "Tag", color: NEUTRAL_COLOR }} size={32} />
                                                <span className="t">
                                                    <span className="n">{tx.description}</span>
                                                    <span className="c">{cat?.name ?? (tx.type === "transfer" ? "Transferência" : "Sem categoria")}</span>
                                                </span>
                                            </button>
                                        </td>
                                        <td className="hide-sm">
                                            <TypeBadge type={tx.type} />
                                        </td>
                                        <td className="hide-sm date">{formatDateBR(tx.date, "dd 'de' MMM")}</td>
                                        <td className="r">
                                            <Amount cents={tx.amountCents} type={tx.type} private />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </RecentTable>
                </div>
            ) : (
                <EmptyState compact icon={ListOrdered} title="Nenhuma transação" description="Registre receitas e despesas para acompanhar seu mês.">
                    <Button variant="primary" icon={Plus} onClick={() => openTransaction()}>
                        Nova transação
                    </Button>
                </EmptyState>
            )}
            {all.length > 0 && (
                <Row $justify="space-between" style={{ marginTop: 12 }}>
                    <Text as="span" $variant="caption" $tone="muted">
                        Clique em uma transação para editar
                    </Text>
                    <Button size="sm" variant="ghost" as={Link} to="/movimentacoes">
                        Ver todas
                    </Button>
                </Row>
            )}
        </Card>
    );
}

// ---------------- Distribuição: entradas × saídas do mês (donut) ----------------

const DonutWrap = styled.div`
    display: grid;
    justify-items: center;
    gap: 18px;
    padding: 4px 0 2px;
    .donut {
        position: relative;
        width: 200px;
        height: 200px;
    }
    .donut svg {
        transform: rotate(-90deg);
    }
    .center {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        text-align: center;
    }
    .center .l {
        font-size: ${(p) => p.theme.fontSize.xs};
        text-transform: uppercase;
        letter-spacing: ${(p) => p.theme.letterSpacing.wide};
        color: ${(p) => p.theme.colors.textMuted};
    }
    .center .v {
        font-size: 0.95rem;
        margin-top: 2px;
    }
    ul {
        list-style: none;
        width: 100%;
        display: grid;
        gap: 8px;
    }
    li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid ${(p) => p.theme.colors.border};
        border-radius: ${(p) => p.theme.radius.md};
        background: ${(p) => p.theme.colors.bgSurface};
    }
    li .sw {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        flex-shrink: 0;
    }
    li .k {
        flex: 1;
        font-weight: ${(p) => p.theme.fontWeight.medium};
    }
    li .v {
        display: grid;
        justify-items: end;
        line-height: 1.3;
    }
    li .p {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

function DistributionCard({ store, month }) {
    const theme = useTheme();
    const cur = monthComparison(store, month).current;
    const total = cur.incomeCents + cur.expenseCents;
    const inPct = total ? Math.round(percentOf(cur.incomeCents, total)) : 0;
    const outPct = total ? 100 - inPct : 0;
    const r = 84;
    const circ = 2 * Math.PI * r;
    const inLen = total ? (cur.incomeCents / total) * circ : 0;
    return (
        <Card aria-labelledby="dist-title">
            <CardHeader id="dist-title" title="Distribuição" subtitle={`Entradas × saídas em ${formatMonthLabel(month).toLowerCase()}`} />
            {total ? (
                <DonutWrap>
                    <div className="donut" role="img" aria-label={`Entradas ${inPct}%, saídas ${outPct}% do movimento do mês.`}>
                        <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true">
                            <circle cx="100" cy="100" r={r} fill="none" stroke={theme.colors.chart.expense} strokeWidth="14" />
                            <circle cx="100" cy="100" r={r} fill="none" stroke={theme.colors.chart.income} strokeWidth="14" strokeDasharray={`${inLen} ${circ - inLen}`} />
                        </svg>
                        <div className="center">
                            <span className="l">Saldo</span>
                            <span className="v">
                                <Amount cents={cur.resultCents} sign private />
                            </span>
                        </div>
                    </div>
                    <ul>
                        <li>
                            <span className="sw" style={{ background: theme.colors.chart.income }} aria-hidden="true" />
                            <span className="k">Entradas</span>
                            <span className="v">
                                <Amount cents={cur.incomeCents} private colored={false} />
                                <span className="p">{inPct}%</span>
                            </span>
                        </li>
                        <li>
                            <span className="sw" style={{ background: theme.colors.chart.expense }} aria-hidden="true" />
                            <span className="k">Saídas</span>
                            <span className="v">
                                <Amount cents={cur.expenseCents} private colored={false} />
                                <span className="p">{outPct}%</span>
                            </span>
                        </li>
                    </ul>
                </DonutWrap>
            ) : (
                <EmptyState compact icon={PieChart} title="Sem movimento no mês" description="Entradas e saídas aparecem aqui assim que forem registradas." />
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
    const { month, setMonth, openTransaction, openQuickCapture } = useUI();
    const isEmpty = store.transactions.length === 0;
    const showOnboarding = !store.settings.onboardingDone && isEmpty;

    return (
        <>
            <PageHeader
                title="Visão geral"
                description={isEmpty ? "Bem-vindo ao Finanças. Comece registrando sua primeira transação." : `Resumo financeiro de ${formatMonthLabel(month).toLowerCase()}`}
                actions={
                    <>
                        <Button icon={Zap} onClick={() => openQuickCapture()} title="Captura rápida (Q)">
                            Captura rápida
                        </Button>
                        {/* No celular o botão "+" da navegação inferior já cria transações. */}
                        <Button variant="primary" icon={Plus} onClick={() => openTransaction()} className="hide-mobile" title="Nova transação (N)">
                            Nova transação
                        </Button>
                    </>
                }
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
                <Span $desktop={12}>
                    <KpiRow store={store} month={month} />
                </Span>
                <Span $desktop={8}>
                    <RecentCard store={store} today={today} />
                </Span>
                <Span $desktop={4}>
                    <DistributionCard store={store} month={month} />
                </Span>
                <Span $desktop={6}>
                    <BalanceCard store={store} today={today} />
                </Span>
                <Span $desktop={6}>
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
                    <InvoicesCard store={store} today={today} />
                </Span>
                <Span $desktop={6}>
                    <GoalsCard store={store} today={today} />
                </Span>
                <Span $desktop={6}>
                    <BudgetsCard store={store} month={month} />
                </Span>
                <Span $desktop={12}>
                    <InsightsCard store={store} month={month} today={today} />
                </Span>
            </Grid>
        </>
    );
}

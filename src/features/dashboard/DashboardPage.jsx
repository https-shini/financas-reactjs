import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import {
    Wallet, TrendingUp, CalendarClock, Lightbulb, PieChart, ListOrdered, Target, ChevronDown, ChevronUp, AlertTriangle,
    CheckCircle2, Info, Plus, Upload, Sparkles,
} from "lucide-react";
import { Card, CardHeader, Amount, Delta, Progress, levelTone, EmptyState, Button, Badge, CategoryIcon, Muted } from "../../components/ui";
import { PageHeader, Grid, Span, Stack, Row } from "../../components/layout/Page";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { useFormat } from "../../hooks/useFormat";
import {
    balancesByAccount, categoryBreakdown, consolidatedBalance, groupByDay, indexById, monthComparison, monthlySeries, sortTransactions,
    upcomingItems,
} from "../../domain/selectors";
import { budgetStatus } from "../../domain/budgets";
import { generateInsights } from "../../domain/insights";
import { forecastEndOfMonth, spendableToday } from "../../domain/projection";
import { currentMonthKey, formatDateBR, formatDayHeading, formatMonthLabel, monthEnd, monthStart } from "../../domain/dates";
import { isCard } from "../../domain/cards";
import { TransactionRow, TxList } from "../transactions/TransactionRow";
import { OnboardingCard } from "./OnboardingCard";
import { ACCOUNT_TYPES } from "../../domain/defaults";

const Big = styled.p`
    font-size: ${(p) => p.theme.fontSize["3xl"]};
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin: 4px 0 6px;
    ${(p) => p.theme.media.mobile} {
        font-size: 1.75rem;
    }
`;

const Label = styled.p`
    color: ${(p) => p.theme.colors.textSecondary};
    font-size: ${(p) => p.theme.fontSize.sm};
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
`;

const Split = styled.dl`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    margin-top: 12px;
    dt {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
    dd {
        font-size: ${(p) => p.theme.fontSize.base};
        display: grid;
        gap: 2px;
    }
`;

const AccountList = styled.ul`
    list-style: none;
    margin-top: 12px;
    border-top: 1px solid ${(p) => p.theme.colors.border};
    padding-top: 8px;
    display: grid;
    gap: 4px;
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
        border-radius: 50%;
        display: inline-block;
        margin-right: 8px;
    }
`;

const ToggleLink = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 36px;
    font-size: ${(p) => p.theme.fontSize.sm};
    font-weight: 500;
    color: ${(p) => p.theme.colors.primaryText};
`;

const BarList = styled.ul`
    list-style: none;
    display: grid;
    gap: 4px;
`;

const BarItem = styled.li`
    a,
    button {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 6px 4px;
        border-radius: 8px;
        text-decoration: none;
        text-align: left;
        &:hover {
            background: ${(p) => p.theme.colors.bgHover};
        }
    }
    .name {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: ${(p) => p.theme.fontSize.sm};
        margin-bottom: 4px;
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
    font-size: ${(p) => p.theme.fontSize.xs};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${(p) => p.theme.colors.textMuted};
    padding: 10px 8px 4px;
`;

const BillList = styled.ul`
    list-style: none;
    display: grid;
    gap: 2px;
    li {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        padding: 4px 8px;
        border-radius: 8px;
    }
    .info {
        flex: 1;
        min-width: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
    }
    .when {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .info span:first-child {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .when {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

const InsightList = styled.ul`
    list-style: none;
    display: grid;
    gap: 8px;
    li {
        display: flex;
        gap: 12px;
        padding: 12px;
        border-radius: ${(p) => p.theme.radius.md};
        background: ${(p) => p.theme.colors.bgSurface};
    }
    strong {
        display: block;
        font-size: ${(p) => p.theme.fontSize.md};
        margin-bottom: 2px;
    }
    p {
        font-size: ${(p) => p.theme.fontSize.sm};
        color: ${(p) => p.theme.colors.textSecondary};
        line-height: 1.5;
    }
`;

const ChartBox = styled.div`
    width: 100%;
    height: 260px;
    ${(p) => p.theme.media.mobile} {
        height: 220px;
    }
`;

function BalanceCard({ store, today }) {
    const [open, setOpen] = useState(false);
    const c = consolidatedBalance(store, today);
    const balances = balancesByAccount(store, today).filter((b) => !b.account.archived || b.balanceCents !== 0);
    const cash = balances.filter((b) => !isCard(b.account));
    return (
        <Card aria-labelledby="bal-title">
            <Label id="bal-title">
                <Wallet size={16} aria-hidden="true" /> Saldo em contas
            </Label>
            <Big>
                <Amount cents={c.cashCents} private colored={false} weight={700} big />
            </Big>
            {c.cardDebtCents > 0 && (
                <Muted>
                    Cartões a pagar: <Amount cents={c.cardDebtCents} private colored={false} weight={500} /> · Patrimônio: <Amount cents={c.netWorthCents} private colored={false} weight={500} />
                </Muted>
            )}
            {cash.length > 1 || balances.length > cash.length ? (
                <>
                    <div style={{ marginTop: 8 }}>
                        <ToggleLink type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
                            {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />} Ver por conta
                        </ToggleLink>
                    </div>
                    {open && (
                        <AccountList>
                            {balances.map(({ account, balanceCents }) => (
                                <li key={account.id}>
                                    <span>
                                        <span className="dot" style={{ background: account.color }} aria-hidden="true" />
                                        {account.name} <Muted>· {ACCOUNT_TYPES[account.type]}</Muted>
                                    </span>
                                    <Amount cents={balanceCents} private sign={isCard(account)} colored={isCard(account)} />
                                </li>
                            ))}
                        </AccountList>
                    )}
                </>
            ) : (
                <Muted>Saldo realizado: considera apenas lançamentos pagos até hoje.</Muted>
            )}
        </Card>
    );
}

function MonthResultCard({ store, month }) {
    const cmp = monthComparison(store, month);
    const cur = cmp.current;
    const pending = cur.pendingIncomeCents + cur.pendingExpenseCents;
    return (
        <Card aria-labelledby="res-title">
            <Label id="res-title">
                <TrendingUp size={16} aria-hidden="true" /> Resultado de {formatMonthLabel(month).split(" de ")[0].toLowerCase()}
            </Label>
            <Big>
                <Amount cents={cur.resultCents} sign private weight={700} big />
            </Big>
            <Delta value={cmp.resultVariation} />
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
            {pending > 0 && (
                <Muted style={{ display: "block", marginTop: 8 }}>
                    Inclui lançamentos pendentes do mês.
                </Muted>
            )}
        </Card>
    );
}

function ForecastCard({ store, today }) {
    const f = forecastEndOfMonth(store, today);
    const s = spendableToday(store, today);
    return (
        <Card aria-labelledby="fc-title">
            <Label id="fc-title">
                <CalendarClock size={16} aria-hidden="true" /> Previsto até {formatDateBR(f.endDate, "dd/MM")}
            </Label>
            <Big>
                <Amount cents={f.endBalanceCents} private colored={false} weight={700} big />
            </Big>
            <Muted>
                Entradas previstas <Amount cents={f.inflowCents} type="income" private weight={500} /> · saídas <Amount cents={f.outflowCents} type="expense" private weight={500} />
            </Muted>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid", borderColor: "inherit" }}>
                <Label>Pode gastar por dia até o fim do mês</Label>
                <p style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: 2 }}>
                    <Amount cents={s.dailyCents} private colored={false} />
                </p>
                <Muted>
                    {s.shortfall
                        ? "Os compromissos já lançados superam o saldo previsto."
                        : `Saldo previsto${s.reserveCents ? " menos a reserva para metas" : ""}, dividido por ${s.daysLeft} dia(s).`}
                </Muted>
            </div>
            {f.firstNegativeDate && (
                <Row $gap={2} style={{ marginTop: 12 }}>
                    <Badge $tone="expense">
                        <AlertTriangle size={12} aria-hidden="true" /> Saldo negativo em {formatDateBR(f.firstNegativeDate, "dd/MM")}
                    </Badge>
                </Row>
            )}
        </Card>
    );
}

function CashflowCard({ store, month, onPickMonth }) {
    const theme = useTheme();
    const { money, hideBalances } = useFormat();
    const end = month > currentMonthKey() ? month : month;
    const data = monthlySeries(store, end, 6).map((r) => ({
        ...r,
        label: formatMonthLabel(r.month, "short"),
        income: r.incomeCents / 100,
        expense: r.expenseCents / 100,
        result: r.resultCents / 100,
    }));
    const hasData = data.some((d) => d.incomeCents || d.expenseCents);
    return (
        <Card aria-labelledby="cf-title">
            <CardHeader id="cf-title" title="Receitas × despesas" subtitle="Últimos 6 meses · linha = resultado" actions={<Button size="sm" variant="ghost" as={Link} to="/relatorios">Relatórios</Button>} />
            {hasData ? (
                <>
                    <ChartBox aria-hidden="true">
                        <ResponsiveContainer>
                            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} onClick={(e) => e?.activePayload && onPickMonth(e.activePayload[0].payload.month)}>
                                <CartesianGrid vertical={false} stroke={theme.colors.chartGrid} />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: theme.colors.chartAxis, fontSize: 12 }} />
                                <YAxis
                                    width={56}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: theme.colors.chartAxis, fontSize: 12 }}
                                    tickFormatter={(v) => (hideBalances ? "•••" : Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v))}
                                />
                                <Tooltip
                                    cursor={{ fill: theme.colors.bgHover }}
                                    contentStyle={{ background: theme.colors.bgElevated, border: `1px solid ${theme.colors.border}`, borderRadius: 10, color: theme.colors.text }}
                                    formatter={(v, name) => [hideBalances ? "••••" : money(Math.round(v * 100)), name]}
                                />
                                <Bar dataKey="income" name="Receitas" fill={theme.colors.income} radius={[4, 4, 0, 0]} maxBarSize={28} cursor="pointer" />
                                <Bar dataKey="expense" name="Despesas" fill={theme.colors.expense} radius={[4, 4, 0, 0]} maxBarSize={28} cursor="pointer" />
                                <Line dataKey="result" name="Resultado" stroke={theme.colors.primaryText} strokeWidth={2} dot={{ r: 3 }} type="monotone" />
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
                    <Row $gap={4} $wrap style={{ marginTop: 8, fontSize: "0.8125rem" }} aria-hidden="true">
                        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: theme.colors.income, marginRight: 6 }} />Receitas</span>
                        <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: theme.colors.expense, marginRight: 6 }} />Despesas</span>
                        <span><span style={{ display: "inline-block", width: 12, height: 2, background: theme.colors.primaryText, marginRight: 6, verticalAlign: "middle" }} />Resultado</span>
                    </Row>
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
            <CardHeader id="cat-title" title="Gastos por categoria" subtitle={formatMonthLabel(month)} />
            {rows.length ? (
                <BarList>
                    {rows.slice(0, 7).map((r) => (
                        <BarItem key={r.category.id ?? "none"}>
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
                        </BarItem>
                    ))}
                </BarList>
            ) : (
                <EmptyState compact icon={PieChart} title="Nenhuma despesa no mês" description="Quando houver despesas, você verá aqui para onde vai o dinheiro." />
            )}
        </Card>
    );
}

function RecentCard({ store, today }) {
    const { openTransaction } = useUI();
    const cats = useMemo(() => indexById(store.categories), [store.categories]);
    const accs = useMemo(() => indexById(store.accounts), [store.accounts]);
    const recent = sortTransactions(store.transactions.filter((t) => t.date <= today), "date-desc").slice(0, 8);
    const groups = groupByDay(recent);
    return (
        <Card aria-labelledby="recent-title">
            <CardHeader id="recent-title" title="Últimas movimentações" actions={<Button size="sm" variant="ghost" as={Link} to="/movimentacoes">Ver todas</Button>} />
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
    const items = upcomingItems(store, today, 30).slice(0, 6);
    const total = upcomingItems(store, today, 30).length;
    const navigate = useNavigate();
    return (
        <Card aria-labelledby="up-title">
            <CardHeader id="up-title" title="Próximos vencimentos" subtitle="Atrasados e próximos 30 dias" actions={<Button size="sm" variant="ghost" as={Link} to="/planejamento">Ver todos{total > 6 ? ` (${total})` : ""}</Button>} />
            {items.length ? (
                <BillList>
                    {items.map((it) => (
                        <li key={it.id}>
                            {it.kind === "invoice" ? (
                                <CategoryIcon category={{ icon: "Receipt", color: it.card.color }} size={36} />
                            ) : (
                                <CategoryIcon category={store.categories.find((c) => c.id === it.tx.categoryId) ?? { icon: "Tag", color: "#64748b" }} size={36} />
                            )}
                            <span className="info">
                                <span>{it.description}</span>
                                <span className="when">
                                    {it.overdue ? (
                                        <Badge $tone="expense">Atrasado desde {formatDateBR(it.date, "dd/MM")}</Badge>
                                    ) : it.daysUntil === 0 ? (
                                        <Badge $tone="warning">Vence hoje</Badge>
                                    ) : (
                                        `${formatDateBR(it.date, "dd/MM")} · em ${it.daysUntil} dia(s)`
                                    )}
                                </span>
                            </span>
                            <Amount cents={it.amountCents} type={it.direction === "in" ? "income" : it.direction === "out" ? "expense" : "transfer"} private />
                            {it.kind === "transaction" ? (
                                <Button size="sm" variant="ghost" icon={CheckCircle2} onClick={() => setTransactionsStatus([it.tx.id], "paid")} aria-label={`Marcar ${it.description} como ${it.direction === "in" ? "recebido" : "pago"}`}>
                                    <span className="hide-mobile">{it.direction === "in" ? "Recebido" : "Pago"}</span>
                                </Button>
                            ) : (
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/planejamento/cartoes?cartao=${it.card.id}`)}>
                                    Pagar
                                </Button>
                            )}
                        </li>
                    ))}
                </BillList>
            ) : (
                <EmptyState compact icon={CalendarClock} title="Nada a vencer" description="Lançamentos pendentes, recorrências e faturas aparecem aqui." />
            )}
        </Card>
    );
}

function BudgetsCard({ store, month }) {
    const rows = budgetStatus(store, month).slice(0, 5);
    return (
        <Card aria-labelledby="bud-title">
            <CardHeader id="bud-title" title="Orçamentos" subtitle={formatMonthLabel(month)} actions={<Button size="sm" variant="ghost" as={Link} to="/planejamento/orcamentos">Gerenciar</Button>} />
            {rows.length ? (
                <Stack $gap={4}>
                    {rows.map((r) => (
                        <div key={r.budget.id}>
                            <Row $justify="space-between" style={{ marginBottom: 6, fontSize: "0.875rem" }}>
                                <Row $gap={2}>
                                    <CategoryIcon category={r.category} size={24} />
                                    <span>{r.category.name}</span>
                                    {r.level !== "ok" && <Badge $tone={levelTone(r.level)}>{r.level === "exceeded" ? "Estourado" : "Atenção"}</Badge>}
                                </Row>
                                <span>
                                    <Amount cents={r.spentCents} private colored={false} weight={500} /> <Muted>de <Amount cents={r.limitCents} private colored={false} weight={400} /></Muted>
                                </span>
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
    const theme = useTheme();
    const iconFor = (tone) => (tone === "warning" ? AlertTriangle : tone === "good" ? CheckCircle2 : Info);
    const colorFor = (tone) => (tone === "warning" ? theme.colors.warning : tone === "good" ? theme.colors.income : theme.colors.info);
    return (
        <Card aria-labelledby="ins-title">
            <CardHeader id="ins-title" title="Insights" subtitle="Calculados a partir dos seus lançamentos" />
            {list.length ? (
                <InsightList>
                    {list.slice(0, 4).map((i) => {
                        const Icon = iconFor(i.tone);
                        return (
                            <li key={i.id}>
                                <Icon size={18} color={colorFor(i.tone)} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <strong>{i.title}</strong>
                                    <p>{i.detail}</p>
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
                title="Início"
                description={isEmpty ? "Bem-vindo! Comece registrando sua primeira movimentação." : `Visão geral de ${formatMonthLabel(month).toLowerCase()}`}
                actions={
                    isEmpty ? null : (
                        <span className="only-mobile">
                            <Button variant="primary" icon={Plus} onClick={() => openTransaction()}>
                                Nova transação
                            </Button>
                        </span>
                    )
                }
            />
            {showOnboarding && <OnboardingCard />}
            {!showOnboarding && isEmpty && (
                <Card style={{ marginBottom: 20 }}>
                    <EmptyState icon={Sparkles} title="Nenhuma movimentação ainda" description="Adicione receitas e despesas ou importe uma planilha para ver seu painel ganhar vida.">
                        <Button variant="primary" icon={Plus} onClick={() => openTransaction()}>
                            Nova transação
                        </Button>
                        <Button as={Link} to="/configuracoes/dados" icon={Upload}>
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
                <Span $desktop={6}>
                    <BudgetsCard store={store} month={month} />
                </Span>
                <Span $desktop={6}>
                    <InsightsCard store={store} month={month} today={today} />
                </Span>
            </Grid>
        </>
    );
}

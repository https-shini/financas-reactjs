import { useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { toast } from "react-toastify";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { CalendarDays, CalendarRange, GitCompare, TrendingUp, HeartPulse, Download, AlertTriangle, BarChart3 } from "lucide-react";
import { Card, CardHeader, Button, Amount, Badge, EmptyState, Menu, RouteTabs, Select, Input, CategoryIcon, Progress, levelTone, Muted, Delta } from "../../components/ui";
import { PageHeader, Grid, Span, Row, Stack } from "../../components/layout/Page";
import { useFinance } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { useFormat } from "../../hooks/useFormat";
import { categoryBreakdown, firstMonthWithData, monthComparison, monthlySeries, netWorthSeries, periodSummary, topExpenses, indexById } from "../../domain/selectors";
import { budgetStatus } from "../../domain/budgets";
import { projectCashBalance } from "../../domain/projection";
import { healthScore } from "../../domain/intelligence";
import { addMonthsToKey, currentMonthKey, formatDateBR, formatMonthLabel, monthEnd, monthStart } from "../../domain/dates";
import { formatMoney, percentOf, variation } from "../../domain/money";
import { exportReportCSV, exportReportPDF } from "../../utils/exportReport";

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: ${(p) => p.theme.fontSize.sm};
    th,
    td {
        padding: 10px 8px;
        border-bottom: 1px solid ${(p) => p.theme.colors.border};
        text-align: right;
        white-space: nowrap;
    }
    th:first-child,
    td:first-child {
        text-align: left;
        white-space: normal;
    }
    thead th {
        font-weight: 600;
        color: ${(p) => p.theme.colors.textSecondary};
        font-size: ${(p) => p.theme.fontSize.xs};
    }
    tfoot td {
        font-weight: 700;
    }
`;

const Scroll = styled.div`
    position: relative;
    overflow-x: auto;
`;

const Kpis = styled.dl`
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    div {
        padding: 14px;
        border-radius: ${(p) => p.theme.radius.md};
        background: ${(p) => p.theme.colors.bgSurface};
        display: grid;
        gap: 2px;
    }
    dt {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
    dd {
        font-size: ${(p) => p.theme.fontSize.lg};
    }
`;

const ChartBox = styled.div`
    width: 100%;
    height: ${(p) => p.$h ?? 280}px;
`;

function useChartProps() {
    const theme = useTheme();
    const { money, hideBalances } = useFormat();
    return {
        theme,
        grid: <CartesianGrid vertical={false} stroke={theme.colors.chartGrid} />,
        yAxis: <YAxis width={60} tickLine={false} axisLine={false} tick={{ fill: theme.colors.chartAxis, fontSize: 12 }} tickFormatter={(v) => (hideBalances ? "•••" : Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v))} />,
        tooltip: <Tooltip cursor={{ fill: theme.colors.bgHover }} contentStyle={{ background: theme.colors.bgElevated, border: `1px solid ${theme.colors.border}`, borderRadius: 10, color: theme.colors.text }} formatter={(v, n) => [hideBalances ? "••••" : money(Math.round(v * 100)), n]} />,
    };
}

function ExportMenu({ onExport }) {
    return (
        <Menu
            label="Exportar relatório"
            items={[
                { label: "PDF", icon: Download, onClick: () => onExport("pdf") },
                { label: "CSV", icon: Download, onClick: () => onExport("csv") },
            ]}
            trigger={(p) => (
                <Button size="sm" icon={Download} {...p}>
                    Exportar
                </Button>
            )}
        />
    );
}

async function runExport(kind, payload) {
    try {
        if (kind === "pdf") await exportReportPDF({ ...payload, filename: `${payload.filename}.pdf` });
        else exportReportCSV({ ...payload, filename: `${payload.filename}.csv` });
    } catch (e) {
        toast.error(`Falha ao exportar: ${e.message}`);
    }
}

function CategoryTable({ rows, total, caption }) {
    return (
        <Scroll>
            <Table>
                <caption className="sr-only">{caption}</caption>
                <thead>
                    <tr>
                        <th scope="col">Categoria</th>
                        <th scope="col">Lançamentos</th>
                        <th scope="col">%</th>
                        <th scope="col">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.category.id ?? "none"}>
                            <td>
                                <Row $gap={2}>
                                    <CategoryIcon category={r.category} size={24} />
                                    {r.category.name}
                                </Row>
                            </td>
                            <td>{r.count}</td>
                            <td>{Math.round(r.pct)}%</td>
                            <td>
                                <Amount cents={r.totalCents} private colored={false} weight={500} />
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td>Total</td>
                        <td />
                        <td>100%</td>
                        <td>
                            <Amount cents={total} private colored={false} />
                        </td>
                    </tr>
                </tfoot>
            </Table>
        </Scroll>
    );
}

// ---------------- Mensal ----------------

function MonthlyReport() {
    const { store } = useFinance();
    const { month } = useUI();
    const { money } = useFormat();
    const start = monthStart(month);
    const end = monthEnd(month);
    const cmp = monthComparison(store, month);
    const cur = cmp.current;
    const expenses = categoryBreakdown(store, start, end, "expense");
    const incomes = categoryBreakdown(store, start, end, "income");
    const top = topExpenses(store, start, end, 10);
    const budgets = budgetStatus(store, month);
    const savingsRate = cur.incomeCents ? percentOf(cur.resultCents, cur.incomeCents) : null;

    const doExport = (kind) =>
        runExport(kind, {
            title: `Relatório mensal · ${formatMonthLabel(month)}`,
            subtitle: `Receitas ${money(cur.incomeCents)} · Despesas ${money(cur.expenseCents)} · Resultado ${money(cur.resultCents)}`,
            filename: `relatorio-${month}`,
            sections: [
                { heading: "Despesas por categoria", head: ["Categoria", "Lançamentos", "%", "Total"], body: expenses.map((r) => [r.category.name, r.count, `${Math.round(r.pct)}%`, money(r.totalCents)]) },
                { heading: "Receitas por categoria", head: ["Categoria", "Lançamentos", "%", "Total"], body: incomes.map((r) => [r.category.name, r.count, `${Math.round(r.pct)}%`, money(r.totalCents)]) },
                { heading: "Maiores despesas", head: ["Descrição", "Data", "Valor"], body: top.map((t) => [t.description, formatDateBR(t.date), money(t.amountCents)]) },
                { heading: "Orçamentos", head: ["Categoria", "Planejado", "Realizado", "%"], body: budgets.map((b) => [b.category.name, money(b.limitCents), money(b.spentCents), `${Math.round(b.pct)}%`]) },
            ],
        });

    if (!cur.count) {
        return (
            <Card>
                <EmptyState icon={CalendarDays} title={`Sem lançamentos em ${formatMonthLabel(month).toLowerCase()}`} description="Use as setas no topo para escolher outro mês." />
            </Card>
        );
    }

    return (
        <Stack $gap={4}>
            <Card aria-labelledby="m-sum">
                <CardHeader id="m-sum" title={`Resumo de ${formatMonthLabel(month).toLowerCase()}`} actions={<ExportMenu onExport={doExport} />} />
                <Kpis>
                    <div>
                        <dt>Receitas</dt>
                        <dd>
                            <Amount cents={cur.incomeCents} type="income" private />
                        </dd>
                        <Delta value={cmp.incomeVariation} />
                    </div>
                    <div>
                        <dt>Despesas</dt>
                        <dd>
                            <Amount cents={cur.expenseCents} type="expense" private />
                        </dd>
                        <Delta value={cmp.expenseVariation} goodWhenUp={false} />
                    </div>
                    <div>
                        <dt>Resultado</dt>
                        <dd>
                            <Amount cents={cur.resultCents} sign private />
                        </dd>
                        <Delta value={cmp.resultVariation} />
                    </div>
                    <div>
                        <dt>Taxa de poupança</dt>
                        <dd>{savingsRate === null ? "—" : `${Math.round(savingsRate)}%`}</dd>
                        <Muted>do que entrou, quanto sobrou</Muted>
                    </div>
                </Kpis>
            </Card>
            <Grid>
                <Span $desktop={6}>
                    <Card aria-labelledby="m-exp">
                        <CardHeader id="m-exp" title="Despesas por categoria" />
                        {expenses.length ? <CategoryTable rows={expenses} total={cur.expenseCents} caption="Despesas por categoria" /> : <Muted>Sem despesas.</Muted>}
                    </Card>
                </Span>
                <Span $desktop={6}>
                    <Card aria-labelledby="m-inc">
                        <CardHeader id="m-inc" title="Receitas por categoria" />
                        {incomes.length ? <CategoryTable rows={incomes} total={cur.incomeCents} caption="Receitas por categoria" /> : <Muted>Sem receitas.</Muted>}
                    </Card>
                </Span>
                <Span $desktop={6}>
                    <Card aria-labelledby="m-top">
                        <CardHeader id="m-top" title="Maiores despesas" />
                        <Scroll>
                            <Table>
                                <thead>
                                    <tr>
                                        <th scope="col">Descrição</th>
                                        <th scope="col">Data</th>
                                        <th scope="col">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top.map((t) => (
                                        <tr key={t.id}>
                                            <td>{t.description}</td>
                                            <td>{formatDateBR(t.date, "dd/MM")}</td>
                                            <td>
                                                <Amount cents={t.amountCents} private colored={false} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Scroll>
                    </Card>
                </Span>
                <Span $desktop={6}>
                    <Card aria-labelledby="m-bud">
                        <CardHeader id="m-bud" title="Orçamento planejado × realizado" />
                        {budgets.length ? (
                            <Stack $gap={3}>
                                {budgets.map((b) => (
                                    <div key={b.budget.id}>
                                        <Row $justify="space-between" style={{ fontSize: "0.875rem", marginBottom: 4 }}>
                                            <span>{b.category.name}</span>
                                            <span>
                                                <Amount cents={b.spentCents} private colored={false} weight={500} /> / <Amount cents={b.limitCents} private colored={false} weight={400} /> ({Math.round(b.pct)}%)
                                            </span>
                                        </Row>
                                        <Progress value={b.spentCents} max={b.limitCents} tone={levelTone(b.level)} label={`${b.category.name} ${Math.round(b.pct)}%`} />
                                    </div>
                                ))}
                            </Stack>
                        ) : (
                            <Muted>Nenhum orçamento definido.</Muted>
                        )}
                    </Card>
                </Span>
            </Grid>
        </Stack>
    );
}

// ---------------- Anual ----------------

function AnnualReport() {
    const { store, today } = useFinance();
    const { money } = useFormat();
    const chart = useChartProps();
    const first = firstMonthWithData(store);
    const years = useMemo(() => {
        const set = new Set(store.transactions.map((t) => Number(t.date.slice(0, 4))));
        set.add(Number(today.slice(0, 4)));
        return [...set].sort((a, b) => b - a);
    }, [store.transactions, today]);
    const [year, setYear] = useState(Number(today.slice(0, 4)));
    const series = monthlySeries(store, `${year}-12`, 12);
    const nw = netWorthSeries(store, `${year}-12`, 12, today).filter((r) => `${r.month}-01` <= today);
    const totals = periodSummary(store, `${year}-01-01`, `${year}-12-31`);
    const prev = periodSummary(store, `${year - 1}-01-01`, `${year - 1}-12-31`);
    const cats = categoryBreakdown(store, `${year}-01-01`, `${year}-12-31`, "expense");
    const monthsWithData = series.filter((r) => r.incomeCents || r.expenseCents).length || 1;
    const data = series.map((r) => ({ label: formatMonthLabel(r.month, "short").split(" ")[0], Receitas: r.incomeCents / 100, Despesas: r.expenseCents / 100 }));

    const doExport = (kind) =>
        runExport(kind, {
            title: `Relatório anual · ${year}`,
            subtitle: `Receitas ${money(totals.incomeCents)} · Despesas ${money(totals.expenseCents)} · Resultado ${money(totals.resultCents)}`,
            filename: `relatorio-${year}`,
            sections: [
                { heading: "Mês a mês", head: ["Mês", "Receitas", "Despesas", "Resultado"], body: series.map((r) => [formatMonthLabel(r.month), money(r.incomeCents), money(r.expenseCents), money(r.resultCents)]) },
                { heading: "Despesas por categoria", head: ["Categoria", "Lançamentos", "%", "Total"], body: cats.map((r) => [r.category.name, r.count, `${Math.round(r.pct)}%`, money(r.totalCents)]) },
            ],
        });

    if (!first) {
        return (
            <Card>
                <EmptyState icon={BarChart3} title="Sem dados para relatórios" description="Os relatórios aparecem quando houver lançamentos." />
            </Card>
        );
    }

    return (
        <Stack $gap={4}>
            <Card aria-labelledby="y-sum">
                <CardHeader
                    id="y-sum"
                    title={`Resumo de ${year}`}
                    actions={
                        <Row $gap={2}>
                            <Select aria-label="Ano" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </Select>
                            <ExportMenu onExport={doExport} />
                        </Row>
                    }
                />
                <Kpis>
                    <div>
                        <dt>Receitas</dt>
                        <dd>
                            <Amount cents={totals.incomeCents} type="income" private />
                        </dd>
                        <Delta value={variation(totals.incomeCents, prev.incomeCents)} suffix="vs. ano anterior" />
                    </div>
                    <div>
                        <dt>Despesas</dt>
                        <dd>
                            <Amount cents={totals.expenseCents} type="expense" private />
                        </dd>
                        <Delta value={variation(totals.expenseCents, prev.expenseCents)} goodWhenUp={false} suffix="vs. ano anterior" />
                    </div>
                    <div>
                        <dt>Resultado</dt>
                        <dd>
                            <Amount cents={totals.resultCents} sign private />
                        </dd>
                    </div>
                    <div>
                        <dt>Média mensal de despesas</dt>
                        <dd>
                            <Amount cents={Math.round(totals.expenseCents / monthsWithData)} private colored={false} />
                        </dd>
                    </div>
                </Kpis>
            </Card>
            <Grid>
                <Span $desktop={7}>
                    <Card aria-labelledby="y-chart">
                        <CardHeader id="y-chart" title="Receitas e despesas por mês" />
                        <ChartBox aria-hidden="true">
                            <ResponsiveContainer>
                                <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    {chart.grid}
                                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: chart.theme.colors.chartAxis, fontSize: 12 }} />
                                    {chart.yAxis}
                                    {chart.tooltip}
                                    <Bar dataKey="Receitas" fill={chart.theme.colors.income} radius={[4, 4, 0, 0]} maxBarSize={18} />
                                    <Bar dataKey="Despesas" fill={chart.theme.colors.expense} radius={[4, 4, 0, 0]} maxBarSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartBox>
                        <Scroll style={{ marginTop: 12 }}>
                            <Table>
                                <caption className="sr-only">Receitas, despesas e resultado por mês de {year}</caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Mês</th>
                                        <th scope="col">Receitas</th>
                                        <th scope="col">Despesas</th>
                                        <th scope="col">Resultado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {series.map((r) => (
                                        <tr key={r.month}>
                                            <td>{formatMonthLabel(r.month)}</td>
                                            <td>
                                                <Amount cents={r.incomeCents} private colored={false} weight={400} />
                                            </td>
                                            <td>
                                                <Amount cents={r.expenseCents} private colored={false} weight={400} />
                                            </td>
                                            <td>
                                                <Amount cents={r.resultCents} sign private weight={500} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Scroll>
                    </Card>
                </Span>
                <Span $desktop={5}>
                    <Stack $gap={4}>
                        <Card aria-labelledby="y-nw">
                            <CardHeader id="y-nw" title="Evolução do patrimônio" subtitle="Saldo realizado de todas as contas ao fim de cada mês" />
                            <ChartBox $h={200} aria-hidden="true">
                                <ResponsiveContainer>
                                    <AreaChart data={nw.map((r) => ({ label: formatMonthLabel(r.month, "short").split(" ")[0], Patrimônio: r.balanceCents / 100 }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        {chart.grid}
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: chart.theme.colors.chartAxis, fontSize: 12 }} />
                                        {chart.yAxis}
                                        {chart.tooltip}
                                        <Area dataKey="Patrimônio" stroke={chart.theme.colors.primaryText} fill={chart.theme.colors.primarySoft} strokeWidth={2} type="monotone" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartBox>
                            <p className="sr-only">{nw.map((r) => `${formatMonthLabel(r.month)}: ${money(r.balanceCents)}`).join("; ")}</p>
                        </Card>
                        <Card aria-labelledby="y-cat">
                            <CardHeader id="y-cat" title="Categorias que mais consomem" />
                            {cats.length ? <CategoryTable rows={cats.slice(0, 8)} total={totals.expenseCents} caption="Despesas do ano por categoria" /> : <Muted>Sem despesas no ano.</Muted>}
                        </Card>
                    </Stack>
                </Span>
            </Grid>
        </Stack>
    );
}

// ---------------- Comparar ----------------

function CompareReport() {
    const { store } = useFinance();
    const { month } = useUI();
    const { money } = useFormat();
    const [a, setA] = useState({ start: monthStart(addMonthsToKey(month, -1)), end: monthEnd(addMonthsToKey(month, -1)) });
    const [b, setB] = useState({ start: monthStart(month), end: monthEnd(month) });
    const valid = a.start && a.end && b.start && b.end && a.start <= a.end && b.start <= b.end;
    const sa = valid ? periodSummary(store, a.start, a.end) : null;
    const sb = valid ? periodSummary(store, b.start, b.end) : null;
    const ca = valid ? categoryBreakdown(store, a.start, a.end, "expense") : [];
    const cb = valid ? categoryBreakdown(store, b.start, b.end, "expense") : [];
    const cats = indexById(store.categories);
    const keys = [...new Set([...ca, ...cb].map((r) => r.category.id ?? "none"))];
    const rows = keys
        .map((k) => {
            const va = ca.find((r) => (r.category.id ?? "none") === k)?.totalCents ?? 0;
            const vb = cb.find((r) => (r.category.id ?? "none") === k)?.totalCents ?? 0;
            return { key: k, name: k === "none" ? "Sem categoria" : cats.get(k)?.name ?? "Categoria", a: va, b: vb, diff: vb - va };
        })
        .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));
    const label = (p) => `${formatDateBR(p.start)} – ${formatDateBR(p.end)}`;

    const preset = (kind) => {
        if (kind === "month") {
            setA({ start: monthStart(addMonthsToKey(month, -1)), end: monthEnd(addMonthsToKey(month, -1)) });
            setB({ start: monthStart(month), end: monthEnd(month) });
        } else {
            setA({ start: monthStart(addMonthsToKey(month, -12)), end: monthEnd(addMonthsToKey(month, -12)) });
            setB({ start: monthStart(month), end: monthEnd(month) });
        }
    };

    const doExport = (kind) =>
        runExport(kind, {
            title: "Comparação entre períodos",
            subtitle: `A: ${label(a)} · B: ${label(b)}`,
            filename: "comparacao-periodos",
            sections: [
                { heading: "Resumo", head: ["Indicador", "Período A", "Período B", "Diferença"], body: [["Receitas", money(sa.incomeCents), money(sb.incomeCents), money(sb.incomeCents - sa.incomeCents)], ["Despesas", money(sa.expenseCents), money(sb.expenseCents), money(sb.expenseCents - sa.expenseCents)], ["Resultado", money(sa.resultCents), money(sb.resultCents), money(sb.resultCents - sa.resultCents)]] },
                { heading: "Despesas por categoria", head: ["Categoria", "Período A", "Período B", "Diferença"], body: rows.map((r) => [r.name, money(r.a), money(r.b), money(r.diff)]) },
            ],
        });

    const periodInputs = (p, setP, name) => (
        <fieldset style={{ border: 0, display: "grid", gap: 6 }}>
            <legend style={{ fontWeight: 600, marginBottom: 6 }}>{name}</legend>
            <Row $gap={2} $wrap>
                <Input style={{ flex: "1 1 140px" }} type="date" aria-label={`${name}: início`} value={p.start} onChange={(e) => setP((x) => ({ ...x, start: e.target.value }))} />
                <Input style={{ flex: "1 1 140px" }} type="date" aria-label={`${name}: fim`} value={p.end} min={p.start} onChange={(e) => setP((x) => ({ ...x, end: e.target.value }))} />
            </Row>
        </fieldset>
    );

    return (
        <Stack $gap={4}>
            <Card aria-labelledby="cmp-t">
                <CardHeader id="cmp-t" title="Comparar períodos" actions={valid ? <ExportMenu onExport={doExport} /> : null} />
                <Row $wrap $gap={2} style={{ marginBottom: 12 }}>
                    <Button size="sm" onClick={() => preset("month")}>
                        Mês atual × anterior
                    </Button>
                    <Button size="sm" onClick={() => preset("year")}>
                        Mesmo mês do ano passado
                    </Button>
                </Row>
                <Grid>
                    <Span $desktop={6} $tablet={1}>
                        {periodInputs(a, setA, "Período A")}
                    </Span>
                    <Span $desktop={6} $tablet={1}>
                        {periodInputs(b, setB, "Período B")}
                    </Span>
                </Grid>
            </Card>
            {valid ? (
                <Card aria-labelledby="cmp-r">
                    <CardHeader id="cmp-r" title="Resultado da comparação" subtitle={`A: ${label(a)} · B: ${label(b)}`} />
                    <Scroll>
                        <Table>
                            <thead>
                                <tr>
                                    <th scope="col">Indicador</th>
                                    <th scope="col">Período A</th>
                                    <th scope="col">Período B</th>
                                    <th scope="col">Diferença</th>
                                    <th scope="col">Variação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Receitas", sa.incomeCents, sb.incomeCents, true],
                                    ["Despesas", sa.expenseCents, sb.expenseCents, false],
                                    ["Resultado", sa.resultCents, sb.resultCents, true],
                                ].map(([n, x, y, good]) => (
                                    <tr key={n}>
                                        <td>{n}</td>
                                        <td>
                                            <Amount cents={x} private colored={false} weight={400} />
                                        </td>
                                        <td>
                                            <Amount cents={y} private colored={false} weight={400} />
                                        </td>
                                        <td>
                                            <Amount cents={y - x} sign private />
                                        </td>
                                        <td>
                                            <Delta value={variation(y, x)} goodWhenUp={good} suffix="" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Scroll>
                    <h3 style={{ fontSize: "0.9375rem", margin: "20px 0 8px" }}>Despesas por categoria</h3>
                    <Scroll>
                        <Table>
                            <thead>
                                <tr>
                                    <th scope="col">Categoria</th>
                                    <th scope="col">Período A</th>
                                    <th scope="col">Período B</th>
                                    <th scope="col">Diferença</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.key}>
                                        <td>{r.name}</td>
                                        <td>
                                            <Amount cents={r.a} private colored={false} weight={400} />
                                        </td>
                                        <td>
                                            <Amount cents={r.b} private colored={false} weight={400} />
                                        </td>
                                        <td>
                                            <Amount cents={-r.diff} sign private />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Scroll>
                    <Muted style={{ display: "block", marginTop: 8 }}>Na diferença por categoria, valores positivos indicam que se gastou menos no período B.</Muted>
                </Card>
            ) : (
                <Card>
                    <Muted>Informe datas válidas (início anterior ao fim) para os dois períodos.</Muted>
                </Card>
            )}
        </Stack>
    );
}

// ---------------- Projeção ----------------

function ProjectionReport() {
    const { store, today } = useFinance();
    const { money } = useFormat();
    const chart = useChartProps();
    const [days, setDays] = useState(30);
    const p = useMemo(() => projectCashBalance(store, today, days), [store, today, days]);
    const data = p.series.map((d) => ({ label: formatDateBR(d.date, "dd/MM"), Saldo: d.balanceCents / 100 }));
    return (
        <Stack $gap={4}>
            <Card aria-labelledby="pj-t">
                <CardHeader
                    id="pj-t"
                    title="Saldo projetado"
                    subtitle="Dinheiro em contas + pendentes + recorrências + parcelas + faturas de cartão"
                    actions={
                        <Select aria-label="Horizonte" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                            <option value={30}>30 dias</option>
                            <option value={90}>90 dias</option>
                        </Select>
                    }
                />
                <Kpis>
                    <div>
                        <dt>Hoje</dt>
                        <dd>
                            <Amount cents={p.startCents} private colored={false} />
                        </dd>
                    </div>
                    <div>
                        <dt>Em {days} dias</dt>
                        <dd>
                            <Amount cents={p.endBalanceCents} private colored={false} />
                        </dd>
                    </div>
                    <div>
                        <dt>Menor saldo</dt>
                        <dd>
                            <Amount cents={p.minBalanceCents} sign private />
                        </dd>
                        <Muted>em {formatDateBR(p.minDate)}</Muted>
                    </div>
                    <div>
                        <dt>Saldo negativo</dt>
                        <dd>{p.firstNegativeDate ? <Badge $tone="expense"><AlertTriangle size={12} aria-hidden="true" /> a partir de {formatDateBR(p.firstNegativeDate)}</Badge> : <Badge $tone="income">Não previsto</Badge>}</dd>
                    </div>
                </Kpis>
                <ChartBox style={{ marginTop: 16 }} aria-hidden="true">
                    <ResponsiveContainer>
                        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            {chart.grid}
                            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={days > 30 ? 13 : 4} tick={{ fill: chart.theme.colors.chartAxis, fontSize: 12 }} />
                            {chart.yAxis}
                            {chart.tooltip}
                            <ReferenceLine y={0} stroke={chart.theme.colors.expense} strokeDasharray="4 4" />
                            <Line dataKey="Saldo" stroke={chart.theme.colors.primaryText} dot={false} strokeWidth={2} type="stepAfter" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartBox>
            </Card>
            <Card aria-labelledby="pj-e">
                <CardHeader id="pj-e" title="Lançamentos considerados" subtitle={`${p.events.length} evento(s) até ${formatDateBR(p.series[p.series.length - 1].date)}`} />
                {p.events.length ? (
                    <Scroll>
                        <Table>
                            <thead>
                                <tr>
                                    <th scope="col">Descrição</th>
                                    <th scope="col">Data</th>
                                    <th scope="col">Origem</th>
                                    <th scope="col">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {p.events.map((e, i) => (
                                    <tr key={i}>
                                        <td>{e.label}</td>
                                        <td>
                                            {formatDateBR(e.date, "dd/MM")} {e.overdue && <Badge $tone="expense">atrasado</Badge>}
                                        </td>
                                        <td>{{ pending: "Pendente", scheduled: "Agendado", recurrence: "Recorrência", invoice: "Fatura" }[e.kind]}</td>
                                        <td>
                                            <Amount cents={e.cents} sign private />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Scroll>
                ) : (
                    <Muted>Nenhum lançamento futuro. A projeção mantém o saldo atual.</Muted>
                )}
                <p className="sr-only">Saldo projetado em {days} dias: {money(p.endBalanceCents)}.</p>
            </Card>
        </Stack>
    );
}

// ---------------- Saúde ----------------

function HealthReport() {
    const { store, today } = useFinance();
    const h = healthScore(store, today);
    if (h.score === null) {
        return (
            <Card>
                <EmptyState icon={HeartPulse} title="Indicador ainda não disponível" description={h.reason} />
            </Card>
        );
    }
    return (
        <Grid>
            <Span $desktop={4}>
                <Card aria-labelledby="h-t">
                    <CardHeader id="h-t" title="Saúde financeira" subtitle={`Base: ${h.months.map((m) => formatMonthLabel(m, "short")).join(", ")}`} />
                    <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "3.5rem", fontWeight: 700, lineHeight: 1 }} aria-label={`Pontuação ${h.score} de 100`}>
                        {h.score}
                        <span style={{ fontSize: "1rem", opacity: 0.6 }}>/100</span>
                    </p>
                    <div style={{ margin: "12px 0" }}>
                        <Badge $tone={h.level.tone}>{h.level.label}</Badge>
                    </div>
                    </div>
                    <Progress value={h.score} max={100} tone={h.level.tone} height={10} label="Pontuação de saúde financeira" />
                    <Muted style={{ display: "block", marginTop: 12 }}>Critérios sem dados não entram no cálculo; a nota é proporcional aos critérios avaliados.</Muted>
                </Card>
            </Span>
            <Span $desktop={8}>
                <Card aria-labelledby="h-c">
                    <CardHeader id="h-c" title="Como a pontuação foi calculada" />
                    <Stack $gap={4}>
                        {h.criteria.map((c) => (
                            <div key={c.key}>
                                <Row $justify="space-between" $wrap>
                                    <strong style={{ fontWeight: 600 }}>{c.label}</strong>
                                    {c.evaluated ? (
                                        <span>
                                            {String(c.points).replace(".", ",")} / {c.max} pontos
                                        </span>
                                    ) : (
                                        <Badge>Não avaliado</Badge>
                                    )}
                                </Row>
                                <Muted style={{ display: "block", margin: "2px 0 6px" }}>
                                    {c.value} · {c.explanation}
                                </Muted>
                                {c.evaluated && <Progress value={c.points} max={c.max} tone={c.points / c.max >= 0.6 ? "income" : c.points / c.max >= 0.3 ? "warning" : "expense"} label={c.label} />}
                            </div>
                        ))}
                    </Stack>
                    <Muted style={{ display: "block", marginTop: 16 }}>
                        Renda média: {formatMoney(h.averageIncomeCents, { locale: store.settings.locale, currency: store.settings.currency })} · Despesa média: {formatMoney(h.averageExpenseCents, { locale: store.settings.locale, currency: store.settings.currency })}
                    </Muted>
                </Card>
            </Span>
        </Grid>
    );
}

export default function ReportsPage() {
    const { month } = useUI();
    const tabs = [
        { to: "/relatorios/mensal", label: "Mensal", icon: CalendarDays },
        { to: "/relatorios/anual", label: "Anual", icon: CalendarRange },
        { to: "/relatorios/comparar", label: "Comparar", icon: GitCompare },
        { to: "/relatorios/projecao", label: "Projeção", icon: TrendingUp },
        { to: "/relatorios/saude", label: "Saúde financeira", icon: HeartPulse },
    ];
    return (
        <>
            <PageHeader title="Relatórios" description={month === currentMonthKey() ? "Análises do seu histórico financeiro" : `Mês selecionado: ${formatMonthLabel(month)}`} />
            <RouteTabs tabs={tabs} label="Tipos de relatório" />
            <Routes>
                <Route index element={<Navigate to="mensal" replace />} />
                <Route path="mensal" element={<MonthlyReport />} />
                <Route path="anual" element={<AnnualReport />} />
                <Route path="comparar" element={<CompareReport />} />
                <Route path="projecao" element={<ProjectionReport />} />
                <Route path="saude" element={<HealthReport />} />
                <Route path="*" element={<Navigate to="mensal" replace />} />
            </Routes>
        </>
    );
}

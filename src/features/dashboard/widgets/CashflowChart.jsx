import { Link } from "react-router-dom";
import styled from "styled-components";
import { ResponsiveContainer, ComposedChart, Bar, Line, Cell } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardHeader, Amount, Button, EmptyState } from "../../../components/ui";
import { useChartTheme, ChartLegend } from "../../../components/charts/chartTheme";
import { useFormat } from "../../../hooks/useFormat";
import { monthlySeries } from "../../../domain/selectors";
import { percentOf } from "../../../domain/money";
import { formatMonthLabel } from "../../../domain/dates";

const Summary = styled.dl`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
    margin: 0 0 20px;
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    background: ${(p) => p.theme.colors.border};
    overflow: hidden;
    div {
        padding: 12px 14px;
        background: ${(p) => p.theme.colors.bgElevated};
        min-width: 0;
    }
    dt {
        font-size: 0.75rem;
        color: ${(p) => p.theme.colors.textMuted};
        margin-bottom: 4px;
    }
    dd {
        margin: 0;
        font-size: 1rem;
        font-family: ${(p) => p.theme.fonts.mono};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    ${(p) => p.theme.media.mobile} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
`;

const ChartBox = styled.div`
    width: 100%;
    height: 280px;
    ${(p) => p.theme.media.mobile} {
        height: 220px;
    }
`;

/** Comparativo de receitas e despesas: resumo do mês de referência + evolução dos últimos 6 meses. */
export function CashflowChart({ store, month, onPickMonth }) {
    const chart = useChartTheme();
    const { money, hideBalances } = useFormat();
    const series = monthlySeries(store, month, 6);
    const data = series.map((r) => ({
        ...r,
        label: formatMonthLabel(r.month, "short"),
        income: r.incomeCents / 100,
        expense: r.expenseCents / 100,
        result: r.resultCents / 100,
    }));
    const cur = series.at(-1);
    const savings = cur?.incomeCents ? Math.round(percentOf(cur.resultCents, cur.incomeCents)) : null;
    const hasData = data.some((d) => d.incomeCents || d.expenseCents);

    return (
        <Card aria-labelledby="cf-title">
            <CardHeader
                id="cf-title"
                title="Receitas × despesas"
                subtitle={`${formatMonthLabel(month)} e os 5 meses anteriores · clique em um mês para analisá-lo`}
                actions={
                    <Button size="sm" variant="ghost" as={Link} to="/relatorios/anual">
                        Relatórios
                    </Button>
                }
            />
            <Summary aria-label={`Resumo de ${formatMonthLabel(month)}`}>
                <div>
                    <dt>Receitas</dt>
                    <dd>
                        <Amount cents={cur?.incomeCents ?? 0} type="income" private />
                    </dd>
                </div>
                <div>
                    <dt>Despesas</dt>
                    <dd>
                        <Amount cents={cur?.expenseCents ?? 0} type="expense" private />
                    </dd>
                </div>
                <div>
                    <dt>Resultado</dt>
                    <dd>
                        <Amount cents={cur?.resultCents ?? 0} sign private />
                    </dd>
                </div>
                <div>
                    <dt>Poupança</dt>
                    <dd>{savings === null ? "—" : hideBalances ? "••" : `${savings}%`}</dd>
                </div>
            </Summary>
            {hasData ? (
                <>
                    <ChartBox aria-hidden="true">
                        <ResponsiveContainer>
                            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} onClick={(e) => e?.activePayload && onPickMonth(e.activePayload[0].payload.month)}>
                                {chart.grid}
                                {chart.xAxis({ dataKey: "label" })}
                                {chart.yAxis()}
                                {chart.tooltip()}
                                <Bar dataKey="income" name="Receitas" fill={chart.colors.income} radius={chart.barRadius} maxBarSize={28} cursor="pointer">
                                    {data.map((d) => (
                                        <Cell key={d.month} fillOpacity={d.month === month ? 1 : 0.45} />
                                    ))}
                                </Bar>
                                <Bar dataKey="expense" name="Despesas" fill={chart.colors.expense} radius={chart.barRadius} maxBarSize={28} cursor="pointer">
                                    {data.map((d) => (
                                        <Cell key={d.month} fillOpacity={d.month === month ? 1 : 0.45} />
                                    ))}
                                </Bar>
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

import { useMemo, useState } from "react";
import styled from "styled-components";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { useChartTheme, ChartLegend } from "../../components/charts/chartTheme";
import { Calculator, RotateCcw } from "lucide-react";
import { Card, CardHeader, Button, Amount, EmptyState, Field, MoneyInput, Switch, CategoryIcon, Muted, Badge } from "../../components/ui";
import { Grid, Span, Row, Stack } from "../../components/layout/Page";
import { useFinance } from "../../state/contexts";
import { useFormat } from "../../hooks/useFormat";
import { simulate, simulatorBaseline } from "../../domain/intelligence";
import { formatMonthLabel } from "../../domain/dates";

const CutRow = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
    align-items: center;
    input[type="range"] {
        width: 100%;
        accent-color: ${(p) => p.theme.colors.primary};
        min-height: 32px;
    }
    .val {
        min-width: 48px;
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-size: ${(p) => p.theme.fontSize.sm};
    }
`;

const Result = styled.dl`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    div {
        padding: 12px;
        border-radius: ${(p) => p.theme.radius.md};
        background: ${(p) => p.theme.colors.bgSurface};
    }
    dt {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
    dd {
        font-size: ${(p) => p.theme.fontSize.lg};
        margin-top: 2px;
    }
`;

const EMPTY = { cuts: {}, budgets: {}, extraIncomeCents: 0, contributionCents: 0, anticipateInstallments: false };

/** Simulador "e se": projeta 6 e 12 meses sem alterar os dados reais. */
export function SimulatorSection() {
    const { store, today } = useFinance();
    const chart = useChartTheme();
    const { money } = useFormat();
    const baseline = useMemo(() => simulatorBaseline(store, today), [store, today]);
    const [scenario, setScenario] = useState(EMPTY);
    const result = useMemo(() => (baseline ? simulate(baseline, scenario, today) : null), [baseline, scenario, today]);

    if (!baseline) {
        return (
            <Card>
                <EmptyState icon={Calculator} title="Simulador indisponível" description="Registre pelo menos um mês de receitas e despesas para simular cenários." />
            </Card>
        );
    }

    const data = result.series.map((r) => ({ label: formatMonthLabel(r.month, "short"), base: r.baseCents / 100, sim: r.simCents / 100, total: r.simTotalCents / 100 }));
    const diff6 = result.at6.simTotalCents - result.at6.baseCents;
    const diff12 = result.at12.simTotalCents - result.at12.baseCents;

    return (
        <Grid>
            <Span $desktop={5}>
                <Card aria-labelledby="sim-in">
                    <CardHeader
                        id="sim-in"
                        title="Cenário"
                        subtitle={`Base: médias de ${baseline.months.length} mês(es) com lançamentos`}
                        actions={
                            <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setScenario(EMPTY)}>
                                Limpar
                            </Button>
                        }
                    />
                    <Stack $gap={4}>
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: 8 }}>Reduzir gastos por categoria</p>
                            <Stack $gap={2}>
                                {baseline.categories.slice(0, 8).map((c) => (
                                    <CutRow key={c.id}>
                                        <CategoryIcon category={c.category} size={28} />
                                        <label>
                                            <span style={{ fontSize: "var(--v-font-size-sm)", display: "block" }}>
                                                {c.category.name} · <Amount cents={c.monthlyCents} private colored={false} weight={400} />/mês
                                            </span>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                step={5}
                                                value={scenario.cuts[c.id] ?? 0}
                                                aria-label={`Redução em ${c.category.name} (%)`}
                                                onChange={(e) => setScenario((s) => ({ ...s, cuts: { ...s.cuts, [c.id]: Number(e.target.value) } }))}
                                            />
                                        </label>
                                        <span className="val">−{scenario.cuts[c.id] ?? 0}%</span>
                                    </CutRow>
                                ))}
                            </Stack>
                        </div>
                        <Field label="Aumento de receita mensal">{({ id }) => <MoneyInput id={id} value={scenario.extraIncomeCents} onChange={(c) => setScenario((s) => ({ ...s, extraIncomeCents: c }))} />}</Field>
                        <Field label="Aporte mensal em investimentos" hint="Sai do caixa e soma no total investido.">
                            {({ id, describedBy }) => <MoneyInput id={id} value={scenario.contributionCents} aria-describedby={describedBy} onChange={(c) => setScenario((s) => ({ ...s, contributionCents: c }))} />}
                        </Field>
                        <Switch
                            checked={scenario.anticipateInstallments}
                            onChange={(v) => setScenario((s) => ({ ...s, anticipateInstallments: v }))}
                            label="Antecipar parcelas futuras"
                            description={baseline.futureInstallments.length ? `Quita agora ${money(result.installmentsTotalCents)} em parcelas futuras.` : "Não há parcelas futuras."}
                            disabled={!baseline.futureInstallments.length}
                        />
                    </Stack>
                </Card>
            </Span>
            <Span $desktop={7}>
                <Card aria-labelledby="sim-out">
                    <CardHeader id="sim-out" title="Impacto projetado" subtitle="Saldo em contas + investido, comparado ao cenário atual" />
                    <Result>
                        <div>
                            <dt>Em 6 meses</dt>
                            <dd>
                                <Amount cents={diff6} sign private />
                            </dd>
                        </div>
                        <div>
                            <dt>Em 12 meses</dt>
                            <dd>
                                <Amount cents={diff12} sign private />
                            </dd>
                        </div>
                        <div>
                            <dt>Economia mensal do cenário</dt>
                            <dd>
                                <Amount cents={result.monthlySavingCents} sign private />
                            </dd>
                        </div>
                        <div>
                            <dt>Total investido em 12 meses</dt>
                            <dd>
                                <Amount cents={result.at12.investedCents} private colored={false} />
                            </dd>
                        </div>
                    </Result>
                    <div style={{ width: "100%", height: 260, marginTop: 16 }} aria-hidden="true">
                        <ResponsiveContainer>
                            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                {chart.grid}
                                {chart.xAxis({ dataKey: "label" })}
                                {chart.yAxis()}
                                {chart.tooltip()}
                                <Line dataKey="base" name="Atual" stroke={chart.colors.neutral} strokeDasharray="4 4" dot={false} strokeWidth={2} />
                                <Line dataKey="total" name="Simulado (caixa + investido)" stroke={chart.colors.accent} dot={false} strokeWidth={2.5} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <ChartLegend
                        items={[
                            { label: "Atual", color: chart.colors.neutral, line: true },
                            { label: "Simulado (caixa + investido)", color: chart.colors.accent, line: true },
                        ]}
                    />
                    <p className="sr-only">
                        Diferença em 6 meses: {money(diff6)}. Em 12 meses: {money(diff12)}.
                    </p>
                    <Row $wrap $gap={2} style={{ marginTop: 12 }}>
                        <Badge $tone="info">Premissas</Badge>
                        <Muted>Receita e despesas mensais iguais à média recente; parcelas futuras conhecidas; nenhum rendimento sobre investimentos. Os dados reais não são alterados.</Muted>
                    </Row>
                </Card>
            </Span>
        </Grid>
    );
}

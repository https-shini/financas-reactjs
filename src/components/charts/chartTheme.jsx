// Padrão visual único para todos os gráficos (Recharts) do Finanças.
import { useMemo } from "react";
import { useTheme } from "styled-components";
import { CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useFormat } from "../../hooks/useFormat";

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function useChartTheme() {
    const theme = useTheme();
    const { money, hideBalances } = useFormat();
    return useMemo(() => {
        const c = theme.colors;
        const tick = { fill: c.chartAxis, fontSize: 12, fontFamily: theme.fonts.sans };
        return {
            colors: c.chart,
            tick,
            /** Elementos prontos (use dentro do gráfico). */
            grid: <CartesianGrid vertical={false} stroke={c.chartGrid} strokeDasharray="3 4" />,
            xAxis: (props = {}) => <XAxis tickLine={false} axisLine={false} tick={tick} dy={6} {...props} />,
            yAxis: (props = {}) => (
                <YAxis width={56} tickLine={false} axisLine={false} tick={tick} tickFormatter={(v) => (hideBalances ? "•••" : compact.format(v))} {...props} />
            ),
            tooltip: (props = {}) => (
                <Tooltip
                    cursor={{ fill: c.bgHover, stroke: c.borderStrong }}
                    contentStyle={{
                        background: c.bgElevated,
                        border: `1px solid ${c.borderStrong}`,
                        borderRadius: 12,
                        color: c.text,
                        boxShadow: theme.shadows.lg,
                        fontFamily: theme.fonts.sans,
                        fontSize: 13,
                        fontVariantNumeric: "tabular-nums",
                    }}
                    labelStyle={{ color: c.textSecondary, marginBottom: 4 }}
                    itemStyle={{ padding: 0 }}
                    formatter={(v, n) => [hideBalances ? "••••" : money(Math.round(v * 100)), n]}
                    {...props}
                />
            ),
            barRadius: [6, 6, 0, 0],
        };
    }, [theme, money, hideBalances]);
}

/** Legenda acessível e consistente (os itens também aparecem como texto). */
export function ChartLegend({ items }) {
    const theme = useTheme();
    return (
        <ul aria-hidden="true" style={{ listStyle: "none", display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>
            {items.map((it) => (
                <li key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span
                        style={{
                            display: "inline-block",
                            width: it.line ? 14 : 10,
                            height: it.line ? 2 : 10,
                            borderRadius: it.line ? 1 : 3,
                            background: it.color,
                        }}
                    />
                    {it.label}
                </li>
            ))}
        </ul>
    );
}

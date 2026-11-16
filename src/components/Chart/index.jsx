import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import styled, { useTheme } from "styled-components";
import { useFinance } from "../../state/contexts";
import { totalsOf } from "../../domain/selectors";
import { formatMoney } from "../../domain/money";

const Container = styled.section`
    width: 95%;
    max-width: 1120px;
    margin: 20px auto 60px;
    background-color: ${(props) => props.theme.colors.bgElevated};
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: ${(props) => props.theme.radius.lg};
    padding: 32px;
    @media (max-width: 750px) {
        padding: 16px;
    }
`;

const Title = styled.h2`
    margin-bottom: 16px;
    font-size: 1.125rem;
`;

const Chart = () => {
    const { store } = useFinance();
    const theme = useTheme();
    const t = totalsOf(store.transactions);
    if (!t.incomeCents && !t.expenseCents) return null;
    const data = [
        { name: "Entradas", value: t.incomeCents / 100 },
        { name: "Saídas", value: t.expenseCents / 100 },
    ];
    const COLORS = [theme.colors.success, theme.colors.error];
    return (
        <Container aria-labelledby="chart-title">
            <Title id="chart-title">Distribuição financeira</Title>
            <p className="sr-only">
                Entradas {formatMoney(t.incomeCents)}, saídas {formatMoney(t.expenseCents)}.
            </p>
            <div style={{ width: "100%", height: 300 }} aria-hidden="true">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={data} innerRadius="55%" outerRadius="80%" paddingAngle={2} dataKey="value">
                            {data.map((entry, index) => (
                                <Cell key={entry.name} fill={COLORS[index]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatMoney(Math.round(v * 100))} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Container>
    );
};

export default Chart;

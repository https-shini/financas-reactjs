import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { PieChart } from "lucide-react";
import { Card, CardHeader, Amount, CategoryIcon, EmptyState, Progress } from "../../../components/ui";
import { categoryBreakdown } from "../../../domain/selectors";
import { formatMonthLabel, monthEnd, monthStart } from "../../../domain/dates";

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

/** Para onde foi o dinheiro: despesas do mês por categoria (clique abre as transações). */
export function CategorySpend({ store, month }) {
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


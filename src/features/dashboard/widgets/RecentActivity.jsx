import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { ArrowUp, ArrowDown, ArrowLeftRight, ListOrdered, Plus } from "lucide-react";
import { NEUTRAL_COLOR } from "../../../design/tokens";
import { Card, CardHeader, Amount, Badge, Button, CategoryIcon, EmptyState, SegmentedControl, Text } from "../../../components/ui";
import { Row } from "../../../components/layout/Page";
import { useUI } from "../../../app/UIContext";
import { indexById, sortTransactions } from "../../../domain/selectors";
import { formatDateBR } from "../../../domain/dates";

/** Movimentações recentes: últimas 8 operações até hoje, com filtro por tipo (clique edita). */
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

export function RecentActivity({ store, today }) {
    const { openTransaction } = useUI();
    const [filter, setFilter] = useState("all");
    const cats = useMemo(() => indexById(store.categories), [store.categories]);
    const all = sortTransactions(store.transactions.filter((t) => t.date <= today), "date-desc");
    const rows = all.filter((t) => filter === "all" || t.type === filter).slice(0, 8);
    return (
        <Card aria-labelledby="recent-title">
            <CardHeader
                id="recent-title"
                title="Movimentações recentes"
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
                        <caption className="sr-only">Movimentações recentes</caption>
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


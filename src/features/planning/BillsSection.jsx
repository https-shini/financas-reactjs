import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { CalendarClock, CheckCircle2, Pencil, Receipt } from "lucide-react";
import { Card, CardHeader, Button, Amount, Badge, CategoryIcon, EmptyState, Select, Muted } from "../../components/ui";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { upcomingItems } from "../../domain/selectors";
import { formatDateBR } from "../../domain/dates";

export const ItemList = styled.ul`
    list-style: none;
    display: grid;
    gap: 2px;
    li {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 60px;
        padding: 6px 8px;
        border-radius: ${(p) => p.theme.radius.md};
        flex-wrap: wrap;
        &:hover {
            background: ${(p) => p.theme.colors.bgHover};
        }
    }
    .grow {
        flex: 1;
        min-width: 160px;
        display: grid;
    }
    .grow > span:first-child {
        font-weight: 500;
    }
    .actions {
        display: flex;
        gap: 4px;
        margin-left: auto;
    }
`;

const Summary = styled.dl`
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    margin-bottom: 16px;
    div {
        display: grid;
    }
    dt {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
    dd {
        font-size: ${(p) => p.theme.fontSize.lg};
    }
`;

/** Contas a pagar e a receber, com atrasados e faturas. */
export function BillsSection() {
    const { store, today } = useFinance();
    const { setTransactionsStatus } = useFinanceActions();
    const { openTransaction } = useUI();
    const navigate = useNavigate();
    const [horizon, setHorizon] = useState(30);
    const items = upcomingItems(store, today, horizon);
    const overdue = items.filter((i) => i.overdue);
    const next = items.filter((i) => !i.overdue);
    const toPay = items.filter((i) => i.direction === "out").reduce((s, i) => s + i.amountCents, 0);
    const toReceive = items.filter((i) => i.direction === "in").reduce((s, i) => s + i.amountCents, 0);

    const markPaid = (it) => {
        setTransactionsStatus([it.tx.id], "paid");
        toast.success(it.direction === "in" ? "Marcado como recebido." : "Marcado como pago.");
    };

    const renderList = (list) => (
        <ItemList>
            {list.map((it) => (
                <li key={it.id}>
                    {it.kind === "invoice" ? (
                        <CategoryIcon category={{ icon: "Receipt", color: it.card.color }} />
                    ) : (
                        <CategoryIcon category={store.categories.find((c) => c.id === it.tx.categoryId) ?? { icon: "Tag", color: "#64748b" }} />
                    )}
                    <span className="grow">
                        <span>{it.description}</span>
                        <Muted>
                            {formatDateBR(it.date)}{" "}
                            {it.overdue ? <Badge $tone="expense">Atrasado</Badge> : it.daysUntil === 0 ? <Badge $tone="warning">Hoje</Badge> : `· em ${it.daysUntil} dia(s)`}{" "}
                            {it.direction === "in" ? <Badge $tone="income">A receber</Badge> : it.direction === "out" ? <Badge>A pagar</Badge> : <Badge>Transferência</Badge>}
                        </Muted>
                    </span>
                    <Amount cents={it.amountCents} type={it.direction === "in" ? "income" : it.direction === "out" ? "expense" : "transfer"} private />
                    <span className="actions">
                        {it.kind === "transaction" ? (
                            <>
                                <Button size="sm" icon={CheckCircle2} onClick={() => markPaid(it)}>
                                    {it.direction === "in" ? "Recebido" : "Pago"}
                                </Button>
                                <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Editar ${it.description}`} onClick={() => openTransaction({ mode: "edit", tx: it.tx })} />
                            </>
                        ) : (
                            <Button size="sm" icon={Receipt} onClick={() => navigate(`/planejamento/cartoes?cartao=${it.card.id}&fatura=${it.invoice.month}`)}>
                                Pagar fatura
                            </Button>
                        )}
                    </span>
                </li>
            ))}
        </ItemList>
    );

    return (
        <Card aria-labelledby="bills-title">
            <CardHeader
                id="bills-title"
                title="Contas a pagar e a receber"
                subtitle="Lançamentos pendentes não entram no saldo realizado até serem marcados como pagos."
                actions={
                    <Select aria-label="Horizonte" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
                        <option value={7}>Próximos 7 dias</option>
                        <option value={30}>Próximos 30 dias</option>
                        <option value={90}>Próximos 90 dias</option>
                        <option value={365}>Próximos 12 meses</option>
                    </Select>
                }
            />
            <Summary>
                <div>
                    <dt>A pagar</dt>
                    <dd>
                        <Amount cents={toPay} type="expense" private />
                    </dd>
                </div>
                <div>
                    <dt>A receber</dt>
                    <dd>
                        <Amount cents={toReceive} type="income" private />
                    </dd>
                </div>
                <div>
                    <dt>Atrasados</dt>
                    <dd>{overdue.length}</dd>
                </div>
            </Summary>
            {items.length === 0 ? (
                <EmptyState icon={CalendarClock} title="Nada pendente" description="Marque lançamentos como pendentes ou crie recorrências para acompanhar vencimentos aqui." />
            ) : (
                <>
                    {overdue.length > 0 && (
                        <section aria-labelledby="ov-h">
                            <h3 id="ov-h" style={{ fontSize: "0.8125rem", margin: "4px 8px", color: "inherit" }}>
                                Atrasados
                            </h3>
                            {renderList(overdue)}
                        </section>
                    )}
                    {next.length > 0 && (
                        <section aria-labelledby="nx-h">
                            <h3 id="nx-h" style={{ fontSize: "0.8125rem", margin: "12px 8px 4px" }}>
                                Próximos
                            </h3>
                            {renderList(next)}
                        </section>
                    )}
                </>
            )}
        </Card>
    );
}

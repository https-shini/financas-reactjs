import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { CalendarCheck2, CreditCard, ArrowRight } from "lucide-react";
import { NEUTRAL_COLOR } from "../../../design/tokens";
import { Card, CardHeader, Amount, Badge, CategoryIcon, EmptyState, SegmentedControl } from "../../../components/ui";
import { formatDateBR } from "../../../domain/dates";
import { billEntries } from "../../bills/billsModel";

const WINDOW_DAYS = 15;

const List = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 10px 2px;
        border-bottom: 1px solid ${(p) => p.theme.colors.border};
    }
    li:last-child {
        border-bottom: 0;
    }
    .info {
        min-width: 0;
        display: grid;
    }
    .d {
        font-weight: ${(p) => p.theme.fontWeight.medium};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.875rem;
    }
    .w {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 2px;
        font-size: 0.75rem;
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

const Ic = styled.span`
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: ${(p) => p.theme.colors.bgSurface};
    border: 1px solid ${(p) => p.theme.colors.border};
    color: ${(p) => p.$color ?? p.theme.colors.textSecondary};
`;

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid ${(p) => p.theme.colors.border};
    font-size: 0.8125rem;
    color: ${(p) => p.theme.colors.textMuted};
    a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        color: ${(p) => p.theme.colors.primaryText};
        text-decoration: none;
    }
`;

function when(e) {
    if (e.overdue) return <Badge $tone="expense">Atrasado {-e.daysUntil}d</Badge>;
    if (e.daysUntil === 0) return <Badge $tone="warning">Hoje</Badge>;
    if (e.daysUntil === 1) return <Badge $tone="warning">Amanhã</Badge>;
    return <span>{formatDateBR(e.date, "EEE, dd/MM")}</span>;
}

/** Alertas de vencimento: atrasados e próximos 15 dias, separados entre pagar e receber. */
export function DueSoonCard({ store, today }) {
    const pay = useMemo(() => billEntries(store, today, "payable").open.filter((e) => e.overdue || e.daysUntil <= WINDOW_DAYS), [store, today]);
    const rec = useMemo(() => billEntries(store, today, "receivable").open.filter((e) => e.overdue || e.daysUntil <= WINDOW_DAYS), [store, today]);
    const [tab, setTab] = useState(() => (pay.length || !rec.length ? "pay" : "rec"));
    const list = tab === "pay" ? pay : rec;
    const total = list.reduce((s, e) => s + e.amountCents, 0);
    const late = list.filter((e) => e.overdue).length;
    const type = tab === "pay" ? "expense" : "income";

    return (
        <Card aria-labelledby="due-title">
            <CardHeader id="due-title" title="Próximos vencimentos" subtitle={`Atrasados e próximos ${WINDOW_DAYS} dias`} />
            <div style={{ marginBottom: 8 }}>
                <SegmentedControl
                    label="Tipo de vencimento"
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: "pay", label: `A pagar · ${pay.length}` },
                        { value: "rec", label: `A receber · ${rec.length}` },
                    ]}
                />
            </div>
            {list.length ? (
                <List aria-label={tab === "pay" ? "Contas a pagar próximas" : "Contas a receber próximas"}>
                    {list.slice(0, 6).map((e) => (
                        <li key={e.id}>
                            {e.isInvoice ? (
                                <Ic $color={e.card?.color ?? e.toAccount?.color} aria-hidden="true">
                                    <CreditCard size={15} />
                                </Ic>
                            ) : (
                                <CategoryIcon category={e.category ?? { icon: "Tag", color: NEUTRAL_COLOR }} size={32} />
                            )}
                            <span className="info">
                                <span className="d">{e.description}</span>
                                <span className="w">{when(e)}</span>
                            </span>
                            <Amount cents={e.amountCents} type={type} private />
                        </li>
                    ))}
                </List>
            ) : (
                <EmptyState compact icon={CalendarCheck2} title={tab === "pay" ? "Nenhuma conta a vencer" : "Nenhum recebimento previsto"} description={`Nada em atraso ou nos próximos ${WINDOW_DAYS} dias.`} />
            )}
            <Footer>
                <span>
                    {list.length > 6 ? `+${list.length - 6} · ` : ""}
                    Total <Amount cents={total} type={type} private />
                    {late ? ` · ${late} atrasado${late > 1 ? "s" : ""}` : ""}
                </span>
                <Link to={tab === "pay" ? "/contas-a-pagar" : "/contas-a-receber"}>
                    Ver todas <ArrowRight size={13} aria-hidden="true" />
                </Link>
            </Footer>
        </Card>
    );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styled, { css } from "styled-components";
import { CalendarDays, CreditCard, Plus, ArrowRight } from "lucide-react";
import { NEUTRAL_COLOR } from "../../design/tokens";
import { Card, CardHeader, Amount, Button, CategoryIcon, MonthPicker, focusRing } from "../../components/ui";
import { useFormat } from "../../hooks/useFormat";
import { useUI } from "../../app/UIContext";
import { addDaysISO, formatDateBR, formatDayHeading } from "../../domain/dates";
import { indexById, sortTransactions } from "../../domain/selectors";
import { buildCalendar, defaultSelectedDate } from "./calendarModel";

const WEEKDAYS = [
    ["Seg", "segunda-feira"],
    ["Ter", "terça-feira"],
    ["Qua", "quarta-feira"],
    ["Qui", "quinta-feira"],
    ["Sex", "sexta-feira"],
    ["Sáb", "sábado"],
    ["Dom", "domingo"],
];

// ---------------- estilos ----------------

const Layout = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
        gap: 24px;
    }
`;

const Weekdays = styled.div`
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin-bottom: 6px;
    span {
        font-size: 0.6875rem;
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: ${(p) => p.theme.colors.textMuted};
        padding: 0 8px;
        ${(p) => p.theme.media.mobile} {
            text-align: center;
            padding: 0;
        }
    }
`;

const Days = styled.div`
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    ${(p) => p.theme.media.mobile} {
        gap: 4px;
    }
`;

const DayButton = styled.button`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    min-width: 0;
    min-height: 84px;
    padding: 8px;
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgElevated};
    color: ${(p) => p.theme.colors.text};
    text-align: left;
    cursor: pointer;
    font: inherit;
    transition:
        background ${(p) => p.theme.motion.fast},
        border-color ${(p) => p.theme.motion.fast};
    @media (hover: hover) {
        &:hover {
            background: ${(p) => p.theme.colors.interactiveHover};
            border-color: ${(p) => p.theme.colors.borderStrong};
        }
    }
    ${focusRing()}
    ${(p) =>
        !p.$inMonth &&
        css`
            background: transparent;
            border-style: dashed;
            .num,
            .amt {
                opacity: 0.45;
            }
        `}
    ${(p) =>
        p.$weekend &&
        p.$inMonth &&
        css`
            background: ${p.theme.colors.bgSurface};
        `}
    &[aria-pressed="true"] {
        border-color: ${(p) => p.theme.colors.accent};
        background: ${(p) => p.theme.colors.accentSoft};
        box-shadow: inset 0 0 0 1px ${(p) => p.theme.colors.accent};
    }

    .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
    }
    .num {
        display: inline-grid;
        place-items: center;
        min-width: 26px;
        height: 26px;
        padding: 0 4px;
        border-radius: 999px;
        font-family: ${(p) => p.theme.fonts.mono};
        font-size: 0.8125rem;
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        font-variant-numeric: tabular-nums;
        margin: -3px 0 0 -3px;
    }
    ${(p) =>
        p.$today &&
        css`
            .num {
                background: ${p.theme.colors.accent};
                color: ${p.theme.colors.onAccent};
            }
        `}
    .marks {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        color: ${(p) => p.theme.colors.textMuted};
    }
    .amt {
        font-family: ${(p) => p.theme.fonts.mono};
        font-size: 0.6875rem;
        line-height: 1.35;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .amt.in {
        color: ${(p) => p.theme.colors.income};
    }
    .amt.out {
        color: ${(p) => p.theme.colors.expense};
    }
    .amts {
        margin-top: auto;
        display: flex;
        flex-direction: column;
    }
    .dots {
        display: none;
    }

    /* Celular: célula quadrada, apenas número + pontos coloridos. */
    ${(p) => p.theme.media.mobile} {
        min-height: 0;
        aspect-ratio: 1 / 1;
        padding: 4px 2px;
        align-items: center;
        justify-content: center;
        gap: 3px;
        .top {
            justify-content: center;
        }
        .num {
            margin: 0;
        }
        .marks,
        .amts {
            display: none;
        }
        .dots {
            display: flex;
            gap: 3px;
            min-height: 5px;
        }
    }
`;

const Dot = styled.span`
    width: ${(p) => p.$size ?? 6}px;
    height: ${(p) => p.$size ?? 6}px;
    border-radius: 999px;
    flex-shrink: 0;
    background: ${(p) => p.theme.colors[p.$tone]};
`;

const Legend = styled.ul`
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 14px 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.75rem;
    color: ${(p) => p.theme.colors.textMuted};
    li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
`;

const Panel = styled.aside`
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    padding: 16px;
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgSurface};
    h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        letter-spacing: -0.01em;
    }
    .sub {
        margin: 2px 0 0;
        font-size: 0.8125rem;
        color: ${(p) => p.theme.colors.textMuted};
    }
    .totals {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin: 0;
        div {
            padding: 10px 12px;
            border-radius: ${(p) => p.theme.radius.sm};
            background: ${(p) => p.theme.colors.bgElevated};
            border: 1px solid ${(p) => p.theme.colors.border};
            min-width: 0;
        }
        dt {
            font-size: 0.75rem;
            color: ${(p) => p.theme.colors.textMuted};
            margin-bottom: 2px;
        }
        dd {
            margin: 0;
            font-size: 0.875rem;
        }
    }
    ul.items {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 264px;
        overflow-y: auto;
    }
    .item {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        margin: 0;
        border: 0;
        border-radius: ${(p) => p.theme.radius.sm};
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
        @media (hover: hover) {
            &:hover {
                background: ${(p) => p.theme.colors.interactiveHover};
            }
        }
        ${focusRing(true)}
    }
    .t {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }
    .n {
        font-size: 0.875rem;
        font-weight: ${(p) => p.theme.fontWeight.medium};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .c {
        font-size: 0.75rem;
        color: ${(p) => p.theme.colors.textMuted};
    }
    .inv {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: ${(p) => p.theme.colors.warningSoft};
        color: ${(p) => p.theme.colors.warning};
    }
    .tag {
        color: ${(p) => p.theme.colors.warning};
    }
    .tag.late {
        color: ${(p) => p.theme.colors.expense};
    }
    .empty {
        margin: 0;
        padding: 18px 8px;
        text-align: center;
        font-size: 0.875rem;
        color: ${(p) => p.theme.colors.textMuted};
    }
    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: auto;
        > * {
            flex: 1 1 auto;
            text-decoration: none;
        }
    }
`;

// ---------------- componente ----------------

function useCompactMoney() {
    const { locale, currency } = useFormat();
    return useMemo(() => {
        // Abaixo de mil: valor inteiro arredondado (R$ 268); acima: notação compacta (R$ 2,3 mil).
        const small = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
        const big = new Intl.NumberFormat(locale, { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 });
        return (cents) => (Math.abs(cents) < 100000 ? small : big).format(cents / 100);
    }, [locale, currency]);
}

/**
 * Calendário mensal da Visão geral: organiza entradas, saídas, pendências e vencimentos de fatura por dia
 * e funciona como navegador do mês de referência do painel (substitui o seletor de mês que ficava no header).
 */
export function MonthCalendar({ store, today, month, onMonthChange }) {
    const { openTransaction } = useUI();
    const { money, hideBalances } = useFormat();
    const compact = useCompactMoney();
    const [picked, setPicked] = useState(null);
    const focusNext = useRef(false);
    const gridRef = useRef(null);

    const selected = picked && picked.slice(0, 7) === month ? picked : defaultSelectedDate(month, today);
    const { weeks, days } = useMemo(() => buildCalendar(store, month, today), [store, month, today]);
    const cats = useMemo(() => indexById(store.categories), [store.categories]);
    const day = days.get(selected);

    const select = (date, { focus = false } = {}) => {
        focusNext.current = focus;
        setPicked(date);
        if (date.slice(0, 7) !== month) onMonthChange(date.slice(0, 7));
    };

    useEffect(() => {
        if (!focusNext.current) return;
        focusNext.current = false;
        gridRef.current?.querySelector(`[data-date="${selected}"]`)?.focus();
    }, [selected]);

    const onKeyDown = (e) => {
        const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        let next = null;
        if (e.key in steps) next = addDaysISO(selected, steps[e.key]);
        else if (e.key === "Home") next = addDaysISO(selected, -((new Date(`${selected}T12:00:00`).getDay() + 6) % 7));
        else if (e.key === "End") next = addDaysISO(selected, 6 - ((new Date(`${selected}T12:00:00`).getDay() + 6) % 7));
        if (!next) return;
        // Impede que o atalho global ←/→ (troca de mês) também seja acionado.
        e.preventDefault();
        e.stopPropagation();
        select(next, { focus: true });
    };

    const describe = (d) => {
        const parts = [formatDateBR(d.date, "EEEE, d 'de' MMMM")];
        if (d.isToday) parts.push("hoje");
        if (!hideBalances) {
            if (d.incomeCents) parts.push(`entradas ${money(d.incomeCents)}`);
            if (d.expenseCents) parts.push(`saídas ${money(d.expenseCents)}`);
        } else if (d.transactions.length) parts.push(`${d.transactions.length} ${d.transactions.length === 1 ? "lançamento" : "lançamentos"}`);
        if (d.overdueCount) parts.push(`${d.overdueCount} em atraso`);
        else if (d.pendingCount) parts.push(`${d.pendingCount} ${d.pendingCount === 1 ? "pendente" : "pendentes"}`);
        if (d.invoices.length) parts.push(`${d.invoices.length === 1 ? "vencimento de fatura" : `${d.invoices.length} vencimentos de fatura`}`);
        return parts.join(", ");
    };

    const txs = day ? sortTransactions(day.transactions, "date-desc") : [];

    return (
        <Card aria-labelledby="calendar-title">
            <CardHeader
                id="calendar-title"
                title="Calendário"
                subtitle="Entradas, saídas e vencimentos dia a dia"
                actions={<MonthPicker value={month} onChange={onMonthChange} label="Mês do calendário" />}
            />
            <Layout>
                <div>
                    <Weekdays aria-hidden="true">
                        {WEEKDAYS.map(([short]) => (
                            <span key={short}>{short}</span>
                        ))}
                    </Weekdays>
                    <Days ref={gridRef} role="group" aria-label="Dias do mês (use as setas para navegar)" onKeyDown={onKeyDown}>
                        {weeks.flat().map((d, i) => {
                            const isSel = d.date === selected;
                            const late = d.overdueCount > 0;
                            return (
                                <DayButton
                                    key={d.date}
                                    type="button"
                                    data-date={d.date}
                                    tabIndex={isSel ? 0 : -1}
                                    aria-pressed={isSel}
                                    aria-current={d.isToday ? "date" : undefined}
                                    aria-label={describe(d)}
                                    $inMonth={d.inMonth}
                                    $today={d.isToday}
                                    $weekend={i % 7 >= 5}
                                    onClick={() => select(d.date)}
                                >
                                    <span className="top">
                                        <span className="num">{Number(d.date.slice(8))}</span>
                                        <span className="marks" aria-hidden="true">
                                            {d.invoices.length > 0 && <CreditCard size={12} />}
                                            {d.pendingCount > 0 && <Dot $tone={late ? "expense" : "warning"} $size={7} />}
                                        </span>
                                    </span>
                                    <span className="amts" aria-hidden="true">
                                        {hideBalances ? (
                                            d.transactions.length > 0 && <span className="amt">••••</span>
                                        ) : (
                                            <>
                                                {d.incomeCents > 0 && <span className="amt in">+{compact(d.incomeCents)}</span>}
                                                {d.expenseCents > 0 && <span className="amt out">−{compact(d.expenseCents)}</span>}
                                            </>
                                        )}
                                    </span>
                                    <span className="dots" aria-hidden="true">
                                        {d.incomeCents > 0 && <Dot $tone="income" $size={5} />}
                                        {d.expenseCents > 0 && <Dot $tone="expense" $size={5} />}
                                        {(d.pendingCount > 0 || d.invoices.length > 0) && <Dot $tone="warning" $size={5} />}
                                    </span>
                                </DayButton>
                            );
                        })}
                    </Days>
                    <Legend aria-label="Legenda do calendário">
                        <li>
                            <Dot $tone="income" /> Entradas
                        </li>
                        <li>
                            <Dot $tone="expense" /> Saídas
                        </li>
                        <li>
                            <Dot $tone="warning" /> Pendente
                        </li>
                        <li>
                            <CreditCard size={12} aria-hidden="true" /> Vencimento de fatura
                        </li>
                    </Legend>
                </div>

                <Panel aria-labelledby="calendar-day-title" aria-live="polite">
                    <div>
                        <h3 id="calendar-day-title">{formatDayHeading(selected, today)}</h3>
                        <p className="sub">{formatDateBR(selected, "dd/MM/yyyy")} · {txs.length === 0 ? "sem lançamentos" : `${txs.length} ${txs.length === 1 ? "lançamento" : "lançamentos"}`}</p>
                    </div>
                    {day && (day.incomeCents > 0 || day.expenseCents > 0) && (
                        <dl className="totals">
                            <div>
                                <dt>Entradas</dt>
                                <dd>
                                    <Amount cents={day.incomeCents} type="income" private />
                                </dd>
                            </div>
                            <div>
                                <dt>Saídas</dt>
                                <dd>
                                    <Amount cents={day.expenseCents} type="expense" private />
                                </dd>
                            </div>
                        </dl>
                    )}
                    {(day?.invoices.length > 0 || txs.length > 0) ? (
                        <ul className="items" aria-label="Lançamentos do dia">
                            {day.invoices.map((it, i) => (
                                <li key={`inv-${i}`}>
                                    <div className="item" style={{ cursor: "default" }}>
                                        <span className="inv" aria-hidden="true">
                                            <CreditCard size={15} />
                                        </span>
                                        <span className="t">
                                            <span className="n">{it.description}</span>
                                            <span className={`c tag${it.overdue ? " late" : ""}`}>{it.overdue ? "Fatura vencida" : "Vencimento de fatura"}</span>
                                        </span>
                                        <Amount cents={it.amountCents} type="expense" private />
                                    </div>
                                </li>
                            ))}
                            {txs.map((tx) => {
                                const cat = tx.categoryId ? cats.get(tx.categoryId) : null;
                                const late = tx.status === "pending" && tx.date < today;
                                return (
                                    <li key={tx.id}>
                                        <button type="button" className="item" onClick={() => openTransaction({ mode: "edit", tx })} aria-label={`Editar ${tx.description}`}>
                                            <CategoryIcon category={cat ?? { icon: "Tag", color: NEUTRAL_COLOR }} size={30} />
                                            <span className="t">
                                                <span className="n">{tx.description}</span>
                                                <span className="c">
                                                    {cat?.name ?? (tx.type === "transfer" ? "Transferência" : "Sem categoria")}
                                                    {tx.status === "pending" && <span className={`tag${late ? " late" : ""}`}> · {late ? "Em atraso" : "Pendente"}</span>}
                                                </span>
                                            </span>
                                            <Amount cents={tx.amountCents} type={tx.type} private />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="empty">
                            <CalendarDays size={20} aria-hidden="true" style={{ display: "block", margin: "0 auto 6px" }} />
                            Nenhuma movimentação neste dia.
                        </p>
                    )}
                    <div className="actions">
                        <Button size="sm" icon={Plus} onClick={() => openTransaction({ defaults: { date: selected } })}>
                            Adicionar neste dia
                        </Button>
                        {txs.length > 0 && (
                            <Button size="sm" as={Link} to={`/movimentacoes?inicio=${selected}&fim=${selected}`} iconRight={ArrowRight}>
                                Ver no extrato
                            </Button>
                        )}
                    </div>
                </Panel>
            </Layout>
        </Card>
    );
}

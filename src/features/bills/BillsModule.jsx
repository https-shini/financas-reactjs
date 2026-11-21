import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { AlertTriangle, CalendarClock, CheckCircle2, CreditCard, Pencil, Plus, Receipt, RotateCcw, Search, Clock3, ArrowRight } from "lucide-react";
import { NEUTRAL_COLOR } from "../../design/tokens";
import {
    Card, CardHeader, Amount, Badge, Button, IconButton, CategoryIcon, EmptyState, Input, Select, SegmentedControl, StatCard, MonthPicker, NumericDisplay, Progress,
} from "../../components/ui";
import { PageHeader, Grid, Span } from "../../components/layout/Page";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { formatDateBR, formatMonthLabel } from "../../domain/dates";
import { BILL_KINDS, BUCKET_LABEL, billEntries, billSummary, filterEntries, groupByCategory } from "./billsModel";

// ---------------- estilos ----------------

const KpiGrid = styled.div`
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
    }
    ${(p) => p.theme.media.mobile} {
        section {
            padding: 12px 14px;
            gap: 8px;
        }
        .kpi-value > span {
            font-size: 1.25rem;
        }
    }
`;

const Toolbar = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    .search {
        position: relative;
        flex: 1 1 100%;
        min-width: 0;
        svg {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: ${(p) => p.theme.colors.textMuted};
            pointer-events: none;
        }
        input {
            padding-left: 34px;
            width: 100%;
        }
    }
    select {
        flex: 0 1 auto;
        min-width: 0;
        max-width: 100%;
    }
    ${(p) => p.theme.media.mobile} {
        select {
            flex: 1 1 140px;
        }
    }
`;

const Group = styled.section`
    & + & {
        margin-top: 18px;
    }
    h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 6px;
        padding: 0 8px;
        font-size: 0.75rem;
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: ${(p) => (p.$tone === "overdue" ? p.theme.colors.expense : p.theme.colors.textMuted)};
    }
    h3 .total {
        margin-left: auto;
        font-family: ${(p) => p.theme.fonts.mono};
        letter-spacing: 0;
        text-transform: none;
        font-weight: ${(p) => p.theme.fontWeight.medium};
    }
`;

const List = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    li {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 12px;
        min-height: 60px;
        padding: 8px;
        border-radius: ${(p) => p.theme.radius.md};
        border-bottom: 1px solid ${(p) => p.theme.colors.border};
        @media (hover: hover) {
            &:hover {
                background: ${(p) => p.theme.colors.interactiveHover};
            }
        }
    }
    li:last-child {
        border-bottom: 0;
    }
    .info {
        min-width: 0;
        display: grid;
    }
    .desc {
        font-weight: ${(p) => p.theme.fontWeight.medium};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px 14px;
        margin-top: 2px;
        font-size: 0.75rem;
        color: ${(p) => p.theme.colors.textMuted};
    }
    .meta .late {
        color: ${(p) => p.theme.colors.expense};
        font-weight: ${(p) => p.theme.fontWeight.medium};
    }
    .amount {
        text-align: right;
        white-space: nowrap;
    }
    .actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
    }
    ${(p) => p.theme.media.tablet} {
        .actions {
            min-width: 168px;
        }
    }
    ${(p) => p.theme.media.mobile} {
        li {
            grid-template-columns: auto minmax(0, 1fr) auto;
            row-gap: 8px;
        }
        .actions {
            grid-column: 2 / -1;
            justify-content: flex-start;
        }
    }
`;

const InvoiceIcon = styled.span`
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 999px;
    color: ${(p) => p.$color ?? p.theme.colors.textSecondary};
    background: ${(p) => p.theme.colors.bgSurface};
    border: 1px solid ${(p) => p.theme.colors.border};
`;

const Breakdown = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 14px;
    li {
        display: grid;
        gap: 6px;
    }
    .row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.875rem;
    }
    .name {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .n {
        font-size: 0.75rem;
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

const NextBox = styled.div`
    display: grid;
    gap: 4px;
    padding: 14px 16px;
    margin-bottom: 18px;
    border-radius: ${(p) => p.theme.radius.md};
    background: ${(p) => p.theme.colors.bgSurface};
    border: 1px solid ${(p) => p.theme.colors.border};
    .lbl {
        font-size: 0.75rem;
        color: ${(p) => p.theme.colors.textMuted};
    }
    .desc {
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
        font-size: 0.8125rem;
        color: ${(p) => p.theme.colors.textSecondary};
    }
`;

// ---------------- partes ----------------

function EntryIcon({ entry, size = 36 }) {
    if (entry.isInvoice) {
        const color = entry.card?.color ?? entry.toAccount?.color;
        return (
            <InvoiceIcon $color={color} aria-hidden="true" style={{ width: size, height: size }}>
                <CreditCard size={Math.round(size * 0.45)} />
            </InvoiceIcon>
        );
    }
    return <CategoryIcon category={entry.category ?? { icon: "Tag", color: NEUTRAL_COLOR }} size={size} />;
}

function whenText(entry, cfg) {
    if (entry.settled) return `${cfg.settleLabel} em ${formatDateBR(entry.date, "dd/MM/yyyy")}`;
    if (entry.overdue) return `Venceu em ${formatDateBR(entry.date, "dd/MM")} · ${-entry.daysUntil} dia(s) de atraso`;
    if (entry.daysUntil === 0) return "Vence hoje";
    if (entry.daysUntil === 1) return `Vence amanhã · ${formatDateBR(entry.date, "dd/MM")}`;
    return `Vence em ${formatDateBR(entry.date, "dd/MM/yyyy")} · em ${entry.daysUntil} dias`;
}

function EntryRow({ entry, cfg, onSettle, onReopen, onEdit, onInvoice }) {
    const tx = entry.tx;
    const party = entry.isInvoice ? "Fatura de cartão" : entry.category?.name ?? "Sem categoria";
    const account = entry.kind === "invoice" ? entry.card?.name : entry.isInvoice ? entry.toAccount?.name : entry.account?.name;
    return (
        <li>
            <EntryIcon entry={entry} />
            <span className="info">
                <span className="desc">{entry.description}</span>
                <span className="meta">
                    <span>{account ? `${party} · ${account}` : party}</span>
                    <span className={entry.overdue ? "late" : undefined}>{whenText(entry, cfg)}</span>
                </span>
            </span>
            <span className="amount">
                <Amount cents={entry.amountCents} type={cfg.amountType} private />
            </span>
            <span className="actions">
                {entry.kind === "invoice" ? (
                    <Button size="sm" icon={Receipt} onClick={() => onInvoice(entry)}>
                        Pagar fatura
                    </Button>
                ) : entry.settled ? (
                    <IconButton size="sm" icon={RotateCcw} label={`Reabrir ${entry.description} como pendente`} onClick={() => onReopen(entry)} />
                ) : (
                    <Button size="sm" icon={CheckCircle2} onClick={() => onSettle(entry)} aria-label={`${cfg.settledVerb}: ${entry.description}`}>
                        {cfg.settleLabel}
                    </Button>
                )}
                {tx && <IconButton size="sm" icon={Pencil} label={`Editar ${entry.description}`} onClick={() => onEdit(entry)} />}
            </span>
        </li>
    );
}

const BUCKETS = ["overdue", "today", "week", "later"];

// ---------------- módulo ----------------

/**
 * Página de um módulo financeiro (Contas a Pagar ou Contas a Receber).
 * Cada módulo tem rota, indicadores, filtros, listagem e painel lateral próprios; os dados vêm do store real.
 */
export function BillsModule({ kind }) {
    const cfg = BILL_KINDS[kind];
    const isPay = kind === "payable";
    const { store, today } = useFinance();
    const { setTransactionsStatus } = useFinanceActions();
    const { month, setMonth, openTransaction } = useUI();
    const navigate = useNavigate();
    const [view, setView] = useState("open");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [source, setSource] = useState("all");
    const [horizon, setHorizon] = useState("all");

    const entries = useMemo(() => billEntries(store, today, kind), [store, today, kind]);
    const summary = billSummary(entries, today, month);
    const categories = useMemo(() => groupByCategory([...entries.open, ...entries.settled]), [entries]);

    const horizonLimit = horizon === "all" ? null : Number(horizon);
    const openList = filterEntries(
        entries.open.filter((e) => horizonLimit === null || e.overdue || e.daysUntil <= horizonLimit),
        { query, category, source }
    );
    const settledList = filterEntries(
        entries.settled.filter((e) => e.date.slice(0, 7) === month),
        { query, category, source }
    );
    const openBreakdown = groupByCategory(entries.open);
    const breakdownMax = openBreakdown[0]?.cents ?? 0;

    const settle = (e) => {
        setTransactionsStatus([e.tx.id], "paid");
        toast.success(cfg.settledToast);
    };
    const reopen = (e) => {
        setTransactionsStatus([e.tx.id], "pending");
        toast.info(cfg.reopenToast);
    };
    const edit = (e) => openTransaction({ mode: "edit", tx: e.tx });
    const goInvoice = (e) => navigate(`/planejamento/cartoes?cartao=${e.card.id}&fatura=${e.invoice.month}`);
    const create = () => openTransaction({ defaults: { type: cfg.amountType, status: "pending" } });

    const monthName = formatMonthLabel(month).toLowerCase();
    const kpis = [
        {
            key: "open",
            label: isPay ? "Total a pagar" : "Total a receber",
            icon: isPay ? Receipt : CalendarClock,
            tone: isPay ? "expense" : "income",
            tip: isPay
                ? "Soma das despesas pendentes (fora do cartão), faturas de cartão em aberto e pagamentos de fatura agendados."
                : "Soma das receitas pendentes, inclusive as atrasadas.",
            value: <Amount cents={summary.openCents} private colored={false} weight={600} big />,
            hint: `${summary.openCount} ${summary.openCount === 1 ? "lançamento em aberto" : "lançamentos em aberto"}`,
        },
        {
            key: "overdue",
            label: "Em atraso",
            icon: AlertTriangle,
            tone: summary.overdueCount ? "expense" : "neutral",
            tip: isPay ? "Contas com vencimento anterior a hoje e ainda não pagas." : "Recebimentos previstos para antes de hoje que ainda não entraram.",
            value: <Amount cents={summary.overdueCents} private colored={false} weight={600} big />,
            hint: summary.overdueCount ? `${summary.overdueCount} ${summary.overdueCount === 1 ? "item atrasado" : "itens atrasados"}` : "Nada em atraso",
        },
        {
            key: "week",
            label: isPay ? "Vence em 7 dias" : "Previsto em 7 dias",
            icon: Clock3,
            tone: "warning",
            tip: "Itens em aberto com data entre hoje e os próximos 7 dias.",
            value: <Amount cents={summary.weekCents} private colored={false} weight={600} big />,
            hint: `${summary.weekCount} ${summary.weekCount === 1 ? "item" : "itens"} na semana`,
        },
        {
            key: "settled",
            label: isPay ? `Pago em ${monthName.split(" de ")[0]}` : `Recebido em ${monthName.split(" de ")[0]}`,
            icon: CheckCircle2,
            tone: isPay ? "neutral" : "income",
            tip: isPay ? "Despesas pagas fora do cartão e pagamentos de fatura no mês de referência." : "Receitas recebidas no mês de referência.",
            value: <Amount cents={summary.settledMonthCents} private colored={false} weight={600} big />,
            hint: `${summary.settledMonthCount} ${summary.settledMonthCount === 1 ? "lançamento" : "lançamentos"} · ${formatMonthLabel(month)}`,
        },
    ];

    const filtersActive = query || category !== "all" || source !== "all";
    const clear = () => {
        setQuery("");
        setCategory("all");
        setSource("all");
    };

    const rowProps = { cfg, onSettle: settle, onReopen: reopen, onEdit: edit, onInvoice: goInvoice };
    const emptyText = filtersActive ? "Nenhum item corresponde aos filtros." : view === "open" ? `Nenhuma ${cfg.noun} em aberto.` : `Nada ${isPay ? "pago" : "recebido"} em ${monthName}.`;

    return (
        <>
            <PageHeader
                title={cfg.title}
                description={
                    isPay
                        ? "Compromissos, despesas e faturas: o que vence, o que está atrasado e o que já foi pago."
                        : "Receitas previstas: o que ainda vai entrar, o que está atrasado e o que já foi recebido."
                }
                actions={
                    <>
                        <Button as={Link} to={isPay ? "/contas-a-receber" : "/contas-a-pagar"} iconRight={ArrowRight} className="hide-mobile">
                            {isPay ? "Contas a receber" : "Contas a pagar"}
                        </Button>
                        <Button variant="primary" icon={Plus} onClick={create}>
                            {isPay ? "Nova conta a pagar" : "Nova conta a receber"}
                        </Button>
                    </>
                }
            />
            <Grid>
                <Span $desktop={12}>
                    <KpiGrid>
                        {kpis.map((k) => (
                            <StatCard
                                key={k.key}
                                label={k.label}
                                icon={k.icon}
                                iconTone={k.tone}
                                tooltip={k.tip}
                                hint={k.hint}
                                value={
                                    <span className="kpi-value">
                                        <NumericDisplay>{k.value}</NumericDisplay>
                                    </span>
                                }
                            />
                        ))}
                    </KpiGrid>
                </Span>

                <Span $desktop={8}>
                    <Card aria-labelledby={`${kind}-list-title`}>
                        <CardHeader
                            id={`${kind}-list-title`}
                            title={view === "open" ? "Em aberto" : cfg.settledLabel}
                            subtitle={
                                view === "open"
                                    ? `${openList.length} ${openList.length === 1 ? "item" : "itens"} · ordenados por vencimento`
                                    : `${settledList.length} ${settledList.length === 1 ? "lançamento" : "lançamentos"} em ${monthName}`
                            }
                            actions={
                                <SegmentedControl
                                    label={`Visualização de ${cfg.nounPlural}`}
                                    value={view}
                                    onChange={setView}
                                    options={[
                                        { value: "open", label: "Em aberto" },
                                        { value: "settled", label: cfg.settledLabel },
                                    ]}
                                />
                            }
                        />
                        <Toolbar>
                            <span className="search">
                                <Search size={15} aria-hidden="true" />
                                <Input type="search" aria-label={`Buscar em ${cfg.nounPlural}`} placeholder="Buscar descrição, categoria ou conta" value={query} onChange={(e) => setQuery(e.target.value)} />
                            </span>
                            <Select aria-label={isPay ? "Filtrar por categoria" : "Filtrar por origem"} value={category} onChange={(e) => setCategory(e.target.value)}>
                                <option value="all">{isPay ? "Todas as categorias" : "Todas as origens"}</option>
                                {categories.map((c) => (
                                    <option key={c.key} value={c.key}>
                                        {c.label}
                                    </option>
                                ))}
                            </Select>
                            {isPay && (
                                <Select aria-label="Filtrar por tipo" value={source} onChange={(e) => setSource(e.target.value)}>
                                    <option value="all">Contas e faturas</option>
                                    <option value="bills">Somente contas</option>
                                    <option value="invoices">Somente faturas de cartão</option>
                                </Select>
                            )}
                            {view === "open" ? (
                                <Select aria-label="Horizonte de vencimento" value={horizon} onChange={(e) => setHorizon(e.target.value)}>
                                    <option value="7">Próximos 7 dias</option>
                                    <option value="30">Próximos 30 dias</option>
                                    <option value="90">Próximos 90 dias</option>
                                    <option value="all">Todos os vencimentos</option>
                                </Select>
                            ) : (
                                <MonthPicker value={month} onChange={setMonth} label={`Mês das contas ${isPay ? "pagas" : "recebidas"}`} />
                            )}
                            {filtersActive && (
                                <Button size="sm" variant="ghost" onClick={clear}>
                                    Limpar filtros
                                </Button>
                            )}
                        </Toolbar>

                        {view === "open" ? (
                            openList.length ? (
                                BUCKETS.map((b) => {
                                    const items = openList.filter((e) => e.bucket === b);
                                    if (!items.length) return null;
                                    return (
                                        <Group key={b} $tone={b} aria-labelledby={`${kind}-${b}`}>
                                            <h3 id={`${kind}-${b}`}>
                                                {BUCKET_LABEL[b]} <Badge $tone={b === "overdue" ? "expense" : undefined}>{items.length}</Badge>
                                                <span className="total">
                                                    <Amount cents={items.reduce((s, i) => s + i.amountCents, 0)} type={cfg.amountType} private />
                                                </span>
                                            </h3>
                                            <List>
                                                {items.map((e) => (
                                                    <EntryRow key={e.id} entry={e} {...rowProps} />
                                                ))}
                                            </List>
                                        </Group>
                                    );
                                })
                            ) : (
                                <EmptyState compact icon={CheckCircle2} title={emptyText} description={filtersActive ? "Ajuste ou limpe os filtros." : `Lançamentos marcados como pendentes aparecem aqui até serem ${isPay ? "pagos" : "recebidos"}.`} />
                            )
                        ) : settledList.length ? (
                            <List aria-label={cfg.settledLabel}>
                                {settledList.map((e) => (
                                    <EntryRow key={e.id} entry={e} {...rowProps} />
                                ))}
                            </List>
                        ) : (
                            <EmptyState compact icon={CalendarClock} title={emptyText} description="Use o seletor de mês para ver outros períodos." />
                        )}
                    </Card>
                </Span>

                <Span $desktop={4}>
                    <Card aria-labelledby={`${kind}-side-title`}>
                        <CardHeader id={`${kind}-side-title`} title={isPay ? "Compromissos por categoria" : "A receber por origem"} subtitle="Valores em aberto" />
                        {summary.next && (
                            <NextBox>
                                <span className="lbl">{isPay ? "Próximo vencimento" : "Próximo recebimento"}</span>
                                <span className="desc">{summary.next.description}</span>
                                <span className="row">
                                    <span>{summary.next.daysUntil === 0 ? "Hoje" : formatDateBR(summary.next.date, "dd/MM/yyyy")}</span>
                                    <Amount cents={summary.next.amountCents} type={cfg.amountType} private />
                                </span>
                            </NextBox>
                        )}
                        {openBreakdown.length ? (
                            <Breakdown>
                                {openBreakdown.slice(0, 8).map((g) => (
                                    <li key={g.key}>
                                        <span className="row">
                                            {g.key === "__invoice" ? (
                                                <InvoiceIcon aria-hidden="true" style={{ width: 28, height: 28 }}>
                                                    <CreditCard size={13} />
                                                </InvoiceIcon>
                                            ) : (
                                                <CategoryIcon category={{ icon: g.icon, color: g.color ?? NEUTRAL_COLOR }} size={28} />
                                            )}
                                            <span className="name">
                                                {g.label} <span className="n">· {g.count}</span>
                                            </span>
                                            <Amount cents={g.cents} type={cfg.amountType} private />
                                        </span>
                                        <Progress value={g.cents} max={breakdownMax} height={6} color={g.color ?? undefined} tone={isPay ? "expense" : "income"} label={`${g.label}: proporção do total em aberto`} />
                                    </li>
                                ))}
                            </Breakdown>
                        ) : (
                            <EmptyState compact icon={CheckCircle2} title="Tudo em dia" description={`Não há ${cfg.nounPlural} em aberto.`} />
                        )}
                    </Card>
                </Span>
            </Grid>
        </>
    );
}

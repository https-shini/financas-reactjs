import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { Search, SlidersHorizontal, Download, Plus, X, CheckSquare, ListOrdered, CheckCircle2, Trash2, Tag } from "lucide-react";
import { Card, Button, Select, Input, Amount, Badge, EmptyState, Menu, Modal, ModalBody, ModalFooter, Checkbox, Muted } from "../../components/ui";
import { PageHeader, Row } from "../../components/layout/Page";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { useFormat } from "../../hooks/useFormat";
import { filterTransactions, groupByDay, indexById, SORTS, sortTransactions, totalsOf } from "../../domain/selectors";
import { addDaysISO, formatDateBR, formatDayHeading, formatMonthLabel, monthEnd, monthStart } from "../../domain/dates";
import { TYPE_LABEL } from "../../domain/transactions";
import { TransactionRow, TxList } from "./TransactionRow";
import { exportToCsv, exportToExcel, exportToPDF, exportToWord } from "../../utils/exportFiles";

const PAGE = 150;

const Toolbar = styled.div`
    display: grid;
    gap: 8px;
    margin-bottom: 12px;
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: minmax(220px, 1fr) repeat(4, auto) auto;
        align-items: center;
    }
`;

const SearchBox = styled.div`
    position: relative;
    svg {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: ${(p) => p.theme.colors.textMuted};
        pointer-events: none;
    }
    input {
        padding-left: 36px;
    }
`;

const InlineFilters = styled.div`
    display: none;
    ${(p) => p.theme.media.desktop} {
        display: contents;
    }
`;

const MobileFilterRow = styled.div`
    display: flex;
    gap: 8px;
    ${(p) => p.theme.media.desktop} {
        display: none;
    }
    > * {
        flex: 1;
    }
`;

const Chips = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
`;

const Chip = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 0 10px;
    border-radius: 999px;
    background: ${(p) => p.theme.colors.primarySoft};
    color: ${(p) => p.theme.colors.primaryText};
    font-size: ${(p) => p.theme.fontSize.sm};
    font-weight: 500;
    @media (pointer: coarse) {
        min-height: 40px;
    }
`;

const Totals = styled.dl`
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    padding: 12px 16px;
    margin-bottom: 12px;
    border-radius: ${(p) => p.theme.radius.md};
    background: ${(p) => p.theme.colors.bgSurface};
    div {
        display: grid;
    }
    dt {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

const DayHead = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 14px 8px 4px;
    border-top: 1px solid ${(p) => p.theme.colors.border};
    &:first-child {
        border-top: 0;
        padding-top: 4px;
    }
    h2 {
        font-size: ${(p) => p.theme.fontSize.sm};
        font-weight: 600;
        color: ${(p) => p.theme.colors.textSecondary};
    }
    span {
        font-size: ${(p) => p.theme.fontSize.xs};
    }
`;

const BulkBar = styled.div`
    position: sticky;
    top: ${(p) => p.theme.layout.topbar};
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: ${(p) => p.theme.radius.md};
    background: ${(p) => p.theme.colors.bgElevated};
    border: 1px solid ${(p) => p.theme.colors.primary};
    box-shadow: ${(p) => p.theme.shadows.md};
`;

const CheckList = styled.fieldset`
    border: 0;
    display: grid;
    gap: 2px;
    legend {
        font-weight: 600;
        margin-bottom: 8px;
    }
    label {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 40px;
    }
`;

const PERIODS = { mes: "Mês selecionado", "30d": "Últimos 30 dias", ano: "Este ano", tudo: "Todo o período", custom: "Personalizado" };

function readFilters(params, month, today) {
    const list = (k) => (params.get(k) ? params.get(k).split(",").filter(Boolean) : []);
    let periodo = params.get("periodo") ?? (params.get("inicio") || params.get("fim") ? "custom" : "mes");
    let start = "";
    let end = "";
    if (periodo === "mes") {
        start = monthStart(month);
        end = monthEnd(month);
    } else if (periodo === "30d") {
        start = addDaysISO(today, -29);
        end = today;
    } else if (periodo === "ano") {
        start = `${today.slice(0, 4)}-01-01`;
        end = `${today.slice(0, 4)}-12-31`;
    } else if (periodo === "custom") {
        start = params.get("inicio") ?? "";
        end = params.get("fim") ?? "";
    }
    return {
        periodo,
        filters: {
            q: params.get("q") ?? "",
            start,
            end,
            types: list("tipo"),
            categoryIds: list("cat"),
            accountIds: list("conta"),
            status: params.get("status") ?? "",
        },
        sort: params.get("ordem") ?? "date-desc",
    };
}

export default function TransactionsPage() {
    const { store, today } = useFinance();
    const actions = useFinanceActions();
    const { month, openTransaction, deleteWithUndo } = useUI();
    const { money } = useFormat();
    const [params, setParams] = useSearchParams();
    const [limit, setLimit] = useState(PAGE);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(() => new Set());
    const searchRef = useRef(null);
    const [qDraft, setQDraft] = useState(params.get("q") ?? "");

    const { periodo, filters, sort } = readFilters(params, month, today);
    const cats = useMemo(() => indexById(store.categories), [store.categories]);
    const accs = useMemo(() => indexById(store.accounts), [store.accounts]);

    useEffect(() => {
        if (params.get("focus") === "busca") {
            searchRef.current?.focus();
            const next = new URLSearchParams(params);
            next.delete("focus");
            setParams(next, { replace: true });
        }
    }, [params, setParams]);

    useEffect(() => setQDraft(params.get("q") ?? ""), [params]);

    // Busca com pequeno atraso para não recalcular a cada tecla.
    useEffect(() => {
        const t = setTimeout(() => {
            if ((params.get("q") ?? "") !== qDraft) update({ q: qDraft || null });
        }, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [qDraft]);

    useEffect(() => {
        setLimit(PAGE);
        setSelected(new Set());
    }, [params]);

    const update = (patch) => {
        const next = new URLSearchParams(params);
        for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length)) next.delete(k);
            else next.set(k, Array.isArray(v) ? v.join(",") : v);
        }
        setParams(next, { replace: true });
    };

    const result = useMemo(() => sortTransactions(filterTransactions(store, filters), sort), [store, filters.q, filters.start, filters.end, filters.types.join(), filters.categoryIds.join(), filters.accountIds.join(), filters.status, sort]); // eslint-disable-line react-hooks/exhaustive-deps
    const totals = totalsOf(result);
    const visible = result.slice(0, limit);
    const isDateSort = sort.startsWith("date");
    const groups = isDateSort ? groupByDay(visible) : null;

    const chips = [];
    if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, clear: () => update({ q: null }) });
    if (periodo !== "mes") chips.push({ key: "p", label: periodo === "custom" ? `${filters.start ? formatDateBR(filters.start) : "…"} – ${filters.end ? formatDateBR(filters.end) : "…"}` : PERIODS[periodo], clear: () => update({ periodo: null, inicio: null, fim: null }) });
    for (const t of filters.types) chips.push({ key: `t${t}`, label: TYPE_LABEL[t], clear: () => update({ tipo: filters.types.filter((x) => x !== t) }) });
    if (filters.status) chips.push({ key: "s", label: filters.status === "paid" ? "Pagos" : "Pendentes", clear: () => update({ status: null }) });
    for (const c of filters.categoryIds) chips.push({ key: `c${c}`, label: c === "none" ? "Sem categoria" : cats.get(c)?.name ?? "Categoria", clear: () => update({ cat: filters.categoryIds.filter((x) => x !== c) }) });
    for (const a of filters.accountIds) chips.push({ key: `a${a}`, label: accs.get(a)?.name ?? "Conta", clear: () => update({ conta: filters.accountIds.filter((x) => x !== a) }) });
    const advancedCount = filters.categoryIds.length + filters.accountIds.length + (periodo === "custom" ? 1 : 0);

    const periodLabel = periodo === "mes" ? formatMonthLabel(month) : chips.find((c) => c.key === "p")?.label;

    const toggleStatus = (tx) => {
        actions.setTransactionsStatus([tx.id], tx.status === "pending" ? "paid" : "pending");
        toast.success(tx.status === "pending" ? "Marcado como pago." : "Marcado como pendente.");
    };

    const onSelect = (id, checked) => {
        setSelected((s) => {
            const n = new Set(s);
            if (checked) n.add(id);
            else n.delete(id);
            return n;
        });
    };

    const doExport = async (kind) => {
        if (!result.length) {
            toast.info("Nenhuma transação para exportar com os filtros atuais.");
            return;
        }
        try {
            const subtitle = `${periodLabel ?? ""} · ${result.length} lançamentos`;
            if (kind === "csv") exportToCsv(result, store);
            if (kind === "xlsx") await exportToExcel(result, store);
            if (kind === "pdf") await exportToPDF(result, store, { subtitle });
            if (kind === "docx") await exportToWord(result, store);
        } catch (e) {
            toast.error(`Falha ao exportar: ${e.message}`);
        }
    };

    const rowProps = {
        categories: cats,
        accounts: accs,
        today,
        onOpen: (tx) => openTransaction({ mode: "edit", tx }),
        onDuplicate: (tx) => openTransaction({ mode: "duplicate", tx }),
        onToggleStatus: toggleStatus,
        onDelete: (tx) => deleteWithUndo([tx.id]),
        selectable: selecting,
        onSelect,
    };

    const periodSelect = (
        <Select aria-label="Período" value={periodo} onChange={(e) => (e.target.value === "custom" ? setFiltersOpen(true) : update({ periodo: e.target.value === "mes" ? null : e.target.value, inicio: null, fim: null }))}>
            {Object.entries(PERIODS).map(([k, v]) => (
                <option key={k} value={k}>
                    {v}
                </option>
            ))}
        </Select>
    );
    const typeSelect = (
        <Select aria-label="Tipo" value={filters.types.length === 1 ? filters.types[0] : ""} onChange={(e) => update({ tipo: e.target.value ? [e.target.value] : null })}>
            <option value="">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
            <option value="transfer">Transferências</option>
        </Select>
    );
    const statusSelect = (
        <Select aria-label="Status" value={filters.status} onChange={(e) => update({ status: e.target.value || null })}>
            <option value="">Todos os status</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
        </Select>
    );
    const sortSelect = (
        <Select aria-label="Ordenar por" value={sort} onChange={(e) => update({ ordem: e.target.value === "date-desc" ? null : e.target.value })}>
            {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                    {v.label}
                </option>
            ))}
        </Select>
    );

    return (
        <>
            <PageHeader
                title="Movimentações"
                description={periodLabel}
                actions={
                    <>
                        <Menu
                            label="Exportar"
                            items={[
                                { label: "CSV (planilha simples)", icon: Download, onClick: () => doExport("csv") },
                                { label: "Excel (.xlsx)", icon: Download, onClick: () => doExport("xlsx") },
                                { label: "PDF", icon: Download, onClick: () => doExport("pdf") },
                                { label: "Word (.docx)", icon: Download, onClick: () => doExport("docx") },
                            ]}
                            trigger={(p) => (
                                <Button {...p} icon={Download}>
                                    Exportar
                                </Button>
                            )}
                        />
                        <Button
                            icon={CheckSquare}
                            aria-pressed={selecting}
                            onClick={() => {
                                setSelecting((v) => !v);
                                setSelected(new Set());
                            }}
                        >
                            {selecting ? "Cancelar seleção" : "Selecionar"}
                        </Button>
                        <Button variant="primary" icon={Plus} onClick={() => openTransaction()}>
                            Nova
                        </Button>
                    </>
                }
            />

            <Toolbar role="search">
                <SearchBox>
                    <Search size={16} aria-hidden="true" />
                    <label htmlFor="tx-search" className="sr-only">
                        Buscar por descrição, categoria ou observação
                    </label>
                    <Input ref={searchRef} id="tx-search" type="search" placeholder="Buscar por descrição, categoria ou observação" value={qDraft} onChange={(e) => setQDraft(e.target.value)} />
                </SearchBox>
                <InlineFilters>
                    {periodSelect}
                    {typeSelect}
                    {statusSelect}
                    {sortSelect}
                    <Button icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)}>
                        Filtros{advancedCount ? ` (${advancedCount})` : ""}
                    </Button>
                </InlineFilters>
                <MobileFilterRow>
                    {sortSelect}
                    <Button icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)}>
                        Filtros{chips.length ? ` (${chips.length})` : ""}
                    </Button>
                </MobileFilterRow>
            </Toolbar>

            {chips.length > 0 && (
                <Chips aria-label="Filtros ativos">
                    {chips.map((c) => (
                        <Chip key={c.key} type="button" onClick={c.clear} aria-label={`Remover filtro ${c.label}`}>
                            {c.label} <X size={14} aria-hidden="true" />
                        </Chip>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                        Limpar tudo
                    </Button>
                </Chips>
            )}

            <Totals aria-label="Totais do filtro">
                <div>
                    <dt>Lançamentos</dt>
                    <dd>{totals.count}</dd>
                </div>
                <div>
                    <dt>Receitas</dt>
                    <dd>
                        <Amount cents={totals.incomeCents} type="income" private />
                    </dd>
                </div>
                <div>
                    <dt>Despesas</dt>
                    <dd>
                        <Amount cents={totals.expenseCents} type="expense" private />
                    </dd>
                </div>
                <div>
                    <dt>Saldo do período</dt>
                    <dd>
                        <Amount cents={totals.netCents} sign private />
                    </dd>
                </div>
                {totals.transferCents > 0 && (
                    <div>
                        <dt>Transferências (neutras)</dt>
                        <dd>
                            <Amount cents={totals.transferCents} type="transfer" private />
                        </dd>
                    </div>
                )}
            </Totals>

            {selecting && (
                <BulkBar role="region" aria-label="Ações em lote">
                    <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
                        <Checkbox
                            checked={selected.size > 0 && selected.size === visible.length}
                            onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((t) => t.id)) : new Set())}
                        />
                        {selected.size} selecionada(s)
                    </label>
                    <Button size="sm" icon={CheckCircle2} disabled={!selected.size} onClick={() => { actions.setTransactionsStatus([...selected], "paid"); toast.success("Marcadas como pagas."); }}>
                        Marcar como pagas
                    </Button>
                    <Menu
                        label="Recategorizar"
                        align="left"
                        items={store.categories.filter((c) => !c.archived).map((c) => ({ label: c.name, onClick: () => { actions.setTransactionsCategory([...selected], c.id); toast.success(`Categoria alterada para ${c.name}.`); } }))}
                        trigger={(p) => (
                            <Button size="sm" icon={Tag} disabled={!selected.size} {...p}>
                                Categoria
                            </Button>
                        )}
                    />
                    <Button size="sm" variant="danger-ghost" icon={Trash2} disabled={!selected.size} onClick={() => { deleteWithUndo([...selected]); setSelected(new Set()); }}>
                        Excluir
                    </Button>
                </BulkBar>
            )}

            <Card $flush={false}>
                {result.length === 0 ? (
                    store.transactions.length === 0 ? (
                        <EmptyState icon={ListOrdered} title="Nenhuma movimentação" description="Registre receitas, despesas e transferências. Use N para abrir o cadastro rapidamente.">
                            <Button variant="primary" icon={Plus} onClick={() => openTransaction()}>
                                Nova transação
                            </Button>
                        </EmptyState>
                    ) : (
                        <EmptyState icon={Search} title="Nada encontrado" description="Nenhuma movimentação corresponde aos filtros. Ajuste o período ou limpe os filtros.">
                            <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>Limpar filtros</Button>
                        </EmptyState>
                    )
                ) : groups ? (
                    groups.map((g) => (
                        <section key={g.date} aria-labelledby={`d-${g.date}`}>
                            <DayHead>
                                <h2 id={`d-${g.date}`}>{formatDayHeading(g.date, today)}</h2>
                                {g.netCents !== 0 && <Amount cents={g.netCents} sign private weight={500} />}
                            </DayHead>
                            <TxList>
                                {g.items.map((tx) => (
                                    <TransactionRow key={tx.id} tx={tx} selected={selected.has(tx.id)} {...rowProps} />
                                ))}
                            </TxList>
                        </section>
                    ))
                ) : (
                    <TxList>
                        {visible.map((tx) => (
                            <TransactionRow key={tx.id} tx={tx} selected={selected.has(tx.id)} showDate {...rowProps} />
                        ))}
                    </TxList>
                )}
                {result.length > limit && (
                    <Row $justify="center" style={{ marginTop: 12 }}>
                        <Button onClick={() => setLimit((l) => l + PAGE)}>
                            Carregar mais ({result.length - limit} restantes)
                        </Button>
                    </Row>
                )}
            </Card>

            <FiltersDialog
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                store={store}
                filters={filters}
                periodo={periodo}
                onApply={(patch) => {
                    update(patch);
                    setFiltersOpen(false);
                }}
            />
            <Muted className="sr-only" aria-live="polite">
                {result.length} resultado(s). {money(totals.netCents)} no período.
            </Muted>
        </>
    );
}

function FiltersDialog({ open, onClose, store, filters, periodo, onApply }) {
    const [cats, setCats] = useState(filters.categoryIds);
    const [accs, setAccs] = useState(filters.accountIds);
    const [types, setTypes] = useState(filters.types);
    const [status, setStatus] = useState(filters.status);
    const [start, setStart] = useState(periodo === "custom" ? filters.start : "");
    const [end, setEnd] = useState(periodo === "custom" ? filters.end : "");
    const [per, setPer] = useState(periodo);

    useEffect(() => {
        if (open) {
            setPer(periodo);
            setCats(filters.categoryIds);
            setAccs(filters.accountIds);
            setTypes(filters.types);
            setStatus(filters.status);
            setStart(periodo === "custom" ? filters.start : "");
            setEnd(periodo === "custom" ? filters.end : "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const toggle = (list, setList, id) => setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

    return (
        <Modal open={open} onClose={onClose} title="Filtros" variant="sheet" size="md">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onApply({
                        cat: cats,
                        conta: accs,
                        tipo: types,
                        status: status || null,
                        ...(per === "custom" ? { periodo: null, inicio: start || null, fim: end || null } : { periodo: per === "mes" ? null : per, inicio: null, fim: null }),
                    });
                }}
            >
                <ModalBody style={{ display: "grid", gap: 20 }}>
                    <fieldset style={{ border: 0, display: "grid", gap: 8 }}>
                        <legend style={{ fontWeight: 600, marginBottom: 8 }}>Período</legend>
                        <Select aria-label="Período" value={per} onChange={(e) => setPer(e.target.value)}>
                            {Object.entries(PERIODS).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </Select>
                        {per === "custom" && (
                        <Row $gap={2}>
                            <label style={{ flex: 1, display: "grid", gap: 4, fontSize: "var(--v-font-size-sm)" }}>
                                De
                                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                            </label>
                            <label style={{ flex: 1, display: "grid", gap: 4, fontSize: "var(--v-font-size-sm)" }}>
                                Até
                                <Input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
                            </label>
                        </Row>
                        )}
                    </fieldset>
                    <CheckList>
                        <legend>Tipo</legend>
                        {["income", "expense", "transfer"].map((t) => (
                            <label key={t}>
                                <Checkbox checked={types.includes(t)} onChange={() => toggle(types, setTypes, t)} /> {TYPE_LABEL[t]}
                            </label>
                        ))}
                    </CheckList>
                    <CheckList>
                        <legend>Status</legend>
                        {[
                            ["", "Todos"],
                            ["paid", "Pagos"],
                            ["pending", "Pendentes"],
                        ].map(([v, l]) => (
                            <label key={v}>
                                <input type="radio" name="f-status" checked={status === v} onChange={() => setStatus(v)} /> {l}
                            </label>
                        ))}
                    </CheckList>
                    <CheckList>
                        <legend>Categorias</legend>
                        <label>
                            <Checkbox checked={cats.includes("none")} onChange={() => toggle(cats, setCats, "none")} /> Sem categoria
                        </label>
                        {store.categories.map((c) => (
                            <label key={c.id}>
                                <Checkbox checked={cats.includes(c.id)} onChange={() => toggle(cats, setCats, c.id)} /> {c.name}
                                {c.archived && <Badge>arquivada</Badge>}
                            </label>
                        ))}
                    </CheckList>
                    <CheckList>
                        <legend>Contas e cartões</legend>
                        {store.accounts.map((a) => (
                            <label key={a.id}>
                                <Checkbox checked={accs.includes(a.id)} onChange={() => toggle(accs, setAccs, a.id)} /> {a.name}
                            </label>
                        ))}
                    </CheckList>
                </ModalBody>
                <ModalFooter>
                    <Button
                        onClick={() => {
                            setCats([]);
                            setAccs([]);
                            setTypes([]);
                            setStatus("");
                            setStart("");
                            setEnd("");
                            setPer("mes");
                        }}
                    >
                        Limpar
                    </Button>
                    <Button type="submit" variant="primary">
                        Aplicar filtros
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

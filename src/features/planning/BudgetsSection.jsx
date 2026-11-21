import { useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { Target, Plus, Pencil, Trash2, CalendarRange, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardHeader, Button, Amount, Badge, CategoryIcon, EmptyState, Progress, levelTone, Menu, Modal, ModalBody, ModalFooter, Field, Select, MoneyInput, Muted, useConfirm, MonthPicker } from "../../components/ui";
import { Row, Stack } from "../../components/layout/Page";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { budgetHistory, budgetStatus, budgetTotals, buildBudget, validateBudgetInput, limitFor } from "../../domain/budgets";
import { formatMonthLabel } from "../../domain/dates";

const History = styled.ol`
    list-style: none;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
    margin-top: 12px;
    li {
        display: grid;
        gap: 4px;
        font-size: ${(p) => p.theme.fontSize.xs};
        text-align: center;
    }
    .bar {
        height: 56px;
        display: flex;
        align-items: flex-end;
        background: ${(p) => p.theme.colors.bgSurface};
        border-radius: 6px;
        overflow: hidden;
    }
    .bar span {
        width: 100%;
        border-radius: 6px 6px 0 0;
    }
`;

function BudgetDialog({ budget, month, onClose, mode }) {
    const { store } = useFinance();
    const { upsertBudget, setBudgetOverride } = useFinanceActions();
    const [categoryId, setCategoryId] = useState(budget?.categoryId ?? "");
    const [limit, setLimit] = useState(budget ? (mode === "override" ? limitFor(budget, month) : budget.limitCents) : 0);
    const [submitted, setSubmitted] = useState(false);
    const available = store.categories.filter((c) => !c.archived && c.kind !== "income" && (c.id === budget?.categoryId || !store.budgets.some((b) => b.categoryId === c.id)));
    const v = mode === "override" ? { ok: limit >= 0, errors: {} } : validateBudgetInput({ id: budget?.id, categoryId, limitCents: limit }, store);

    const save = (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!v.ok) return;
        if (mode === "override") {
            setBudgetOverride(budget.id, month, limit);
            toast.success(`Limite de ${formatMonthLabel(month).toLowerCase()} ajustado.`);
        } else {
            upsertBudget(buildBudget({ ...(budget ?? {}), categoryId, limitCents: limit }, { id: budget?.id }));
            toast.success(budget ? "Orçamento atualizado." : "Orçamento criado.");
        }
        onClose();
    };

    return (
        <Modal open onClose={onClose} title={mode === "override" ? `Limite só em ${formatMonthLabel(month).toLowerCase()}` : budget ? "Editar orçamento" : "Novo orçamento"} size="sm" variant="sheet">
            <form onSubmit={save}>
                <ModalBody style={{ display: "grid", gap: 16 }}>
                    {mode !== "override" && (
                        <Field label="Categoria" error={submitted ? v.errors.categoryId : undefined}>
                            {({ id, describedBy, invalid }) => (
                                <Select id={id} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={Boolean(budget)} aria-describedby={describedBy} aria-invalid={invalid || undefined}>
                                    <option value="">Selecione…</option>
                                    {available.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </Select>
                            )}
                        </Field>
                    )}
                    <Field label={mode === "override" ? "Limite neste mês" : "Limite mensal"} error={submitted ? v.errors.limitCents : undefined} hint={mode === "override" ? "Os demais meses continuam com o limite padrão." : "Vale para todos os meses (é possível ajustar um mês específico)."}>
                        {({ id, describedBy, invalid }) => <MoneyInput id={id} value={limit} onChange={setLimit} aria-describedby={describedBy} aria-invalid={invalid || undefined} data-autofocus />}
                    </Field>
                </ModalBody>
                <ModalFooter>
                    {mode === "override" && budget.overrides?.[month] !== undefined && (
                        <Button
                            variant="ghost"
                            style={{ marginRight: "auto" }}
                            onClick={() => {
                                setBudgetOverride(budget.id, month, null);
                                toast.success("Ajuste removido.");
                                onClose();
                            }}
                        >
                            Remover ajuste
                        </Button>
                    )}
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="primary">
                        Salvar
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

export function BudgetsSection() {
    const { store } = useFinance();
    const { deleteBudget } = useFinanceActions();
    const { month, setMonth } = useUI();
    const confirm = useConfirm();
    const [dialog, setDialog] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const rows = budgetStatus(store, month);
    const totals = budgetTotals(rows);

    return (
        <Card aria-labelledby="bud-title">
            <CardHeader
                id="bud-title"
                title={`Orçamentos de ${formatMonthLabel(month).toLowerCase()}`}
                subtitle="Gasto planejado × realizado por categoria (inclui pendentes). Alertas em 80% e 100%."
                actions={
                    <>
                        <MonthPicker value={month} onChange={setMonth} label="Mês dos orçamentos" />
                        <Button variant="primary" size="sm" icon={Plus} onClick={() => setDialog({ mode: "create" })}>
                            Novo
                        </Button>
                    </>
                }
            />
            {rows.length === 0 ? (
                <EmptyState icon={Target} title="Nenhum orçamento" description="Defina quanto pretende gastar por categoria a cada mês e acompanhe o realizado.">
                    <Button variant="primary" icon={Plus} onClick={() => setDialog({ mode: "create" })}>
                        Criar orçamento
                    </Button>
                </EmptyState>
            ) : (
                <Stack $gap={5}>
                    <div>
                        <Row $justify="space-between" $wrap style={{ marginBottom: 8 }}>
                            <strong>Total planejado</strong>
                            <span>
                                <Amount cents={totals.spentCents} private colored={false} /> de <Amount cents={totals.limitCents} private colored={false} weight={500} />
                            </span>
                        </Row>
                        <Progress value={totals.spentCents} max={totals.limitCents} tone={levelTone(totals.pct >= 100 ? "exceeded" : totals.pct >= 80 ? "warning" : "ok")} height={10} label={`Total: ${Math.round(totals.pct)}%`} />
                        <Muted style={{ display: "block", marginTop: 6 }}>
                            {totals.remainingCents >= 0 ? "Restam " : "Excedido em "}
                            <Amount cents={Math.abs(totals.remainingCents)} private colored={false} weight={500} />
                        </Muted>
                    </div>
                    {rows.map((r) => (
                        <div key={r.budget.id}>
                            <Row $justify="space-between" $gap={2} $wrap style={{ marginBottom: 6 }}>
                                <Row $gap={2} style={{ minWidth: 0 }}>
                                    <CategoryIcon category={r.category} size={32} />
                                    <div style={{ minWidth: 0 }}>
                                        <strong style={{ fontWeight: 500 }}>{r.category.name}</strong>{" "}
                                        {r.level !== "ok" && <Badge $tone={levelTone(r.level)}>{r.level === "exceeded" ? "Limite ultrapassado" : "80% atingido"}</Badge>}
                                        {r.budget.overrides?.[month] !== undefined && <Badge $tone="info">Ajustado no mês</Badge>}
                                        <Muted style={{ display: "block" }}>
                                            <Amount cents={r.spentCents} private colored={false} weight={500} /> de <Amount cents={r.limitCents} private colored={false} weight={400} /> · {Math.round(r.pct)}% ·{" "}
                                            {r.remainingCents >= 0 ? "restam " : "excedido em "}
                                            <Amount cents={Math.abs(r.remainingCents)} private colored={false} weight={400} />
                                        </Muted>
                                    </div>
                                </Row>
                                <Row $gap={1} style={{ marginLeft: "auto" }}>
                                    <Button size="sm" variant="ghost" icon={expanded === r.budget.id ? ChevronUp : ChevronDown} aria-expanded={expanded === r.budget.id} onClick={() => setExpanded(expanded === r.budget.id ? null : r.budget.id)}>
                                        Histórico
                                    </Button>
                                    <Menu
                                        label={`Ações para orçamento de ${r.category.name}`}
                                        items={[
                                            { label: "Editar limite padrão", icon: Pencil, onClick: () => setDialog({ mode: "edit", budget: r.budget }) },
                                            { label: "Ajustar só neste mês", icon: CalendarRange, onClick: () => setDialog({ mode: "override", budget: r.budget }) },
                                            {
                                                label: "Excluir",
                                                icon: Trash2,
                                                danger: true,
                                                onClick: async () => {
                                                    if (await confirm({ title: "Excluir orçamento", message: `Excluir o orçamento de ${r.category.name}? As movimentações não são afetadas.`, confirmLabel: "Excluir" })) {
                                                        deleteBudget(r.budget.id);
                                                        toast.success("Orçamento excluído.");
                                                    }
                                                },
                                            },
                                        ]}
                                    />
                                </Row>
                            </Row>
                            <Progress value={r.spentCents} max={r.limitCents} tone={levelTone(r.level)} label={`${r.category.name}: ${Math.round(r.pct)}%`} />
                            {expanded === r.budget.id && (
                                <History aria-label={`Histórico de ${r.category.name}`}>
                                    {budgetHistory(store, r.budget, month, 6).map((h) => (
                                        <li key={h.month} title={`${formatMonthLabel(h.month)}: ${Math.round(h.pct)}%`}>
                                            <span className="bar" aria-hidden="true">
                                                <Bar pct={h.pct} level={h.level} />
                                            </span>
                                            <span>{formatMonthLabel(h.month, "short")}</span>
                                            <span>{Math.round(h.pct)}%</span>
                                        </li>
                                    ))}
                                </History>
                            )}
                        </div>
                    ))}
                </Stack>
            )}
            {dialog && <BudgetDialog {...dialog} month={month} onClose={() => setDialog(null)} />}
        </Card>
    );
}

const BarFill = styled.span`
    height: ${(p) => Math.min(100, p.$pct)}%;
    background: ${(p) => p.theme.colors[p.$tone]};
`;
function Bar({ pct, level }) {
    return <BarFill $pct={pct} $tone={levelTone(level)} />;
}

import { useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { Flag, Plus, Pencil, Trash2, PiggyBank, Archive, ArchiveRestore } from "lucide-react";
import { Card, CardHeader, Button, Amount, Badge, EmptyState, Progress, Menu, Modal, ModalBody, ModalFooter, Field, Input, Select, MoneyInput, DatePicker, Switch, Muted, IconButton, useConfirm } from "../../components/ui";
import { Row } from "../../components/layout/Page";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { buildContribution, buildGoal, goalProgress, validateGoalInput } from "../../domain/goals";
import { GOAL_KINDS, CATEGORY_COLORS } from "../../domain/defaults";
import { formatDateBR } from "../../domain/dates";

const GoalsGrid = styled.div`
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;

const GoalCard = styled.article`
    display: grid;
    gap: 10px;
    padding: 16px;
    border-radius: ${(p) => p.theme.radius.lg};
    border: 1px solid ${(p) => p.theme.colors.border};
    border-top: 4px solid ${(p) => p.$color};
    h3 {
        font-size: ${(p) => p.theme.fontSize.base};
    }
    dl {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }
    dt {
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
    ul {
        list-style: none;
        display: grid;
        gap: 2px;
        max-height: 160px;
        overflow: auto;
        font-size: ${(p) => p.theme.fontSize.sm};
    }
    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }
`;

function GoalDialog({ goal, onClose }) {
    const { upsertGoal } = useFinanceActions();
    const [form, setForm] = useState({ name: goal?.name ?? "", kind: goal?.kind ?? "emergency", targetCents: goal?.targetCents ?? 0, deadline: goal?.deadline ?? "", color: goal?.color ?? CATEGORY_COLORS[0] });
    const [submitted, setSubmitted] = useState(false);
    const v = validateGoalInput(form);
    const set = (p) => setForm((f) => ({ ...f, ...p }));
    const save = (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!v.ok) return;
        upsertGoal(buildGoal({ ...(goal ?? {}), ...form, deadline: form.deadline || null }, { id: goal?.id }));
        toast.success(goal ? "Meta atualizada." : "Meta criada.");
        onClose();
    };
    return (
        <Modal open onClose={onClose} title={goal ? "Editar meta" : "Nova meta"} variant="sheet" size="sm">
            <form onSubmit={save}>
                <ModalBody style={{ display: "grid", gap: 16 }}>
                    <Field label="Nome" error={submitted ? v.errors.name : undefined}>
                        {({ id, describedBy, invalid }) => <Input id={id} value={form.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} aria-describedby={describedBy} aria-invalid={invalid || undefined} placeholder="Ex.: Viagem para o Chile" data-autofocus />}
                    </Field>
                    <Field label="Tipo">
                        {({ id }) => (
                            <Select id={id} value={form.kind} onChange={(e) => set({ kind: e.target.value })}>
                                {Object.entries(GOAL_KINDS).map(([k, l]) => (
                                    <option key={k} value={k}>
                                        {l}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                    <Field label="Valor desejado" error={submitted ? v.errors.targetCents : undefined}>
                        {({ id, describedBy, invalid }) => <MoneyInput id={id} value={form.targetCents} onChange={(c) => set({ targetCents: c })} aria-describedby={describedBy} aria-invalid={invalid || undefined} />}
                    </Field>
                    <Field label="Prazo (opcional)" hint="Com prazo, calculamos o aporte mensal sugerido." error={submitted ? v.errors.deadline : undefined}>
                        {({ id, describedBy }) => <DatePicker id={id} value={form.deadline} onChange={(e) => set({ deadline: e.target.value })} aria-describedby={describedBy} />}
                    </Field>
                    <Field label="Cor">
                        {({ id }) => (
                            <Select id={id} value={form.color} onChange={(e) => set({ color: e.target.value })}>
                                {CATEGORY_COLORS.map((c, i) => (
                                    <option key={c} value={c}>
                                        Cor {i + 1}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="primary">
                        Salvar
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

function ContributionDialog({ goal, onClose }) {
    const { today } = useFinance();
    const { addContribution } = useFinanceActions();
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(today);
    const [note, setNote] = useState("");
    const [withdraw, setWithdraw] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const saved = goal.contributions.reduce((acc, c) => acc + c.amountCents, 0);
    const error = amount <= 0 ? "Informe um valor." : withdraw && amount > saved ? "O resgate não pode ser maior que o valor acumulado." : undefined;
    const save = (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (error) return;
        addContribution(goal.id, buildContribution({ date, amountCents: withdraw ? -amount : amount, note }));
        toast.success(withdraw ? "Resgate registrado." : "Aporte registrado.");
        onClose();
    };
    return (
        <Modal open onClose={onClose} title={`Movimentar “${goal.name}”`} size="sm" variant="sheet">
            <form onSubmit={save}>
                <ModalBody style={{ display: "grid", gap: 16 }}>
                    <Switch checked={withdraw} onChange={setWithdraw} label="É um resgate (retirada)" />
                    <Field label="Valor" error={submitted ? error : undefined}>
                        {({ id, describedBy, invalid }) => <MoneyInput id={id} value={amount} onChange={setAmount} aria-describedby={describedBy} aria-invalid={invalid || undefined} data-autofocus />}
                    </Field>
                    <Field label="Data">{({ id }) => <DatePicker id={id} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
                    <Field label="Observação (opcional)">{({ id }) => <Input id={id} value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} />}</Field>
                    <Muted>Aportes registram o quanto você separou para a meta. Para mover dinheiro entre contas, use uma transferência.</Muted>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="primary">
                        Registrar
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

export function GoalsSection() {
    const { store, today } = useFinance();
    const { deleteGoal, deleteContribution, upsertGoal } = useFinanceActions();
    const confirm = useConfirm();
    const [editing, setEditing] = useState(null);
    const [contrib, setContrib] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const goals = store.goals.filter((g) => showArchived || !g.archived);

    return (
        <Card aria-labelledby="goals-title">
            <CardHeader
                id="goals-title"
                title="Metas financeiras"
                subtitle="Acompanhe objetivos e quanto aportar por mês para chegar lá."
                actions={
                    <Button variant="primary" size="sm" icon={Plus} onClick={() => setEditing({})}>
                        Nova meta
                    </Button>
                }
            />
            {store.goals.some((g) => g.archived) && <Switch checked={showArchived} onChange={setShowArchived} label="Mostrar arquivadas" />}
            {goals.length === 0 ? (
                <EmptyState icon={Flag} title="Nenhuma meta" description="Reserva de emergência, viagem, imóvel… defina o valor e o prazo e acompanhe o progresso.">
                    <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
                        Criar meta
                    </Button>
                </EmptyState>
            ) : (
                <GoalsGrid>
                    {goals.map((g) => {
                        const p = goalProgress(g, today);
                        return (
                            <GoalCard key={g.id} $color={g.color} aria-labelledby={`g-${g.id}`}>
                                <Row $justify="space-between">
                                    <div>
                                        <h3 id={`g-${g.id}`}>{g.name}</h3>
                                        <Muted>{GOAL_KINDS[g.kind] ?? g.kind}</Muted>
                                    </div>
                                    <Menu
                                        label={`Ações para ${g.name}`}
                                        items={[
                                            { label: "Editar", icon: Pencil, onClick: () => setEditing(g) },
                                            { label: g.archived ? "Reativar" : "Arquivar", icon: g.archived ? ArchiveRestore : Archive, onClick: () => upsertGoal({ ...g, archived: !g.archived, updatedAt: new Date().toISOString() }) },
                                            {
                                                label: "Excluir",
                                                icon: Trash2,
                                                danger: true,
                                                onClick: async () => {
                                                    if (await confirm({ title: "Excluir meta", message: `Excluir “${g.name}” e seu histórico de aportes?`, confirmLabel: "Excluir" })) {
                                                        deleteGoal(g.id);
                                                        toast.success("Meta excluída.");
                                                    }
                                                },
                                            },
                                        ]}
                                    />
                                </Row>
                                <div>
                                    <Row $justify="space-between" style={{ marginBottom: 6 }}>
                                        <Amount cents={p.savedCents} private colored={false} weight={700} />
                                        <Muted>
                                            de <Amount cents={g.targetCents} private colored={false} weight={500} />
                                        </Muted>
                                    </Row>
                                    <Progress value={p.savedCents} max={g.targetCents} color={g.color} height={10} label={`${g.name}: ${Math.round(p.pct)}%`} />
                                    <Row $justify="space-between" style={{ marginTop: 6 }}>
                                        <Muted>{Math.round(p.pct)}%</Muted>
                                        {p.completed ? <Badge $tone="income">Concluída</Badge> : p.overdue ? <Badge $tone="expense">Prazo vencido</Badge> : null}
                                    </Row>
                                </div>
                                <dl>
                                    <div>
                                        <dt>Faltam</dt>
                                        <dd>
                                            <Amount cents={p.remainingCents} private colored={false} weight={500} />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Prazo</dt>
                                        <dd>{g.deadline ? `${formatDateBR(g.deadline)}${p.monthsLeft ? ` (${p.monthsLeft} mês/meses)` : ""}` : "Sem prazo"}</dd>
                                    </div>
                                    {p.suggestedMonthlyCents !== null && !p.completed && (
                                        <div style={{ gridColumn: "1 / -1" }}>
                                            <dt>Aporte mensal sugerido</dt>
                                            <dd>
                                                <Amount cents={p.suggestedMonthlyCents} private colored={false} weight={600} />{" "}
                                                {p.pendingThisMonthCents === 0 ? <Badge $tone="income">Em dia este mês</Badge> : <Muted>(falta <Amount cents={p.pendingThisMonthCents} private colored={false} weight={400} /> este mês)</Muted>}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                                {g.contributions.length > 0 && (
                                    <ul aria-label="Aportes">
                                        {[...g.contributions]
                                            .sort((a, b) => b.date.localeCompare(a.date))
                                            .map((c) => (
                                                <li key={c.id}>
                                                    <span>
                                                        {formatDateBR(c.date)} {c.note && <Muted>· {c.note}</Muted>}
                                                    </span>
                                                    <Row $gap={1}>
                                                        <Amount cents={c.amountCents} sign private />
                                                        <IconButton
                                                            icon={Trash2}
                                                            size="sm"
                                                            label="Excluir aporte"
                                                            onClick={async () => {
                                                                if (await confirm({ title: "Excluir aporte", message: "Excluir este registro de aporte?", confirmLabel: "Excluir" })) deleteContribution(g.id, c.id);
                                                            }}
                                                        />
                                                    </Row>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                                {!g.archived && (
                                    <Button icon={PiggyBank} onClick={() => setContrib(g)}>
                                        Registrar aporte
                                    </Button>
                                )}
                            </GoalCard>
                        );
                    })}
                </GoalsGrid>
            )}
            {editing && <GoalDialog goal={editing.id ? editing : null} onClose={() => setEditing(null)} />}
            {contrib && <ContributionDialog goal={contrib} onClose={() => setContrib(null)} />}
        </Card>
    );
}

import { NEUTRAL_COLOR } from "../../design/tokens";
import { useState } from "react";
import { toast } from "react-toastify";
import { Repeat, Plus, Pencil, StopCircle, Trash2, Sparkles, Check, X } from "lucide-react";
import { Card, CardHeader, Button, Amount, Badge, CategoryIcon, EmptyState, Menu, Modal, ModalBody, ModalFooter, Field, Input, Select, MoneyInput, DatePicker, SegmentedControl, FormGrid, Muted, useConfirm, Subheading } from "../../components/ui";
import { Stack } from "../../components/layout/Page";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { describeFrequency, monthlyEquivalent, occurrenceDates, validateRecurrenceInput } from "../../domain/recurrence";
import { detectSubscriptions } from "../../domain/intelligence";
import { FREQUENCIES } from "../../domain/defaults";
import { addYearsISO, formatDateBR } from "../../domain/dates";
import { isCard } from "../../domain/cards";
import { ItemList } from "./BillsSection";

function RecurrenceDialog({ recurrence, preset, onClose }) {
    const { store, today } = useFinance();
    const { saveRecurrence } = useFinanceActions();
    const base = recurrence ?? preset ?? {};
    const [form, setForm] = useState({
        type: base.type ?? "expense",
        amountCents: base.amountCents ?? 0,
        description: base.description ?? "",
        categoryId: base.categoryId ?? "",
        accountId: base.accountId ?? (store.accounts.find((a) => !a.archived && !isCard(a)) ?? store.accounts[0]).id,
        frequency: base.frequency ?? "monthly",
        interval: base.interval ?? 1,
        startDate: base.startDate ?? today,
        endDate: base.endDate ?? "",
    });
    const [submitted, setSubmitted] = useState(false);
    const set = (p) => setForm((f) => ({ ...f, ...p }));
    const v = validateRecurrenceInput({ ...form, interval: Number(form.interval) }, store);
    const cats = store.categories.filter((c) => !c.archived && (c.kind === form.type || c.kind === "both"));

    const save = (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!v.ok) return;
        try {
            saveRecurrence({ ...(recurrence ? { id: recurrence.id } : {}), ...form, interval: Number(form.interval), categoryId: form.categoryId || null, endDate: form.endDate || null });
            toast.success(recurrence ? "Série atualizada. Pendentes futuros foram ajustados; pagos não mudam." : "Recorrência criada.");
            onClose();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const err = (k) => (submitted ? v.errors[k] : undefined);
    return (
        <Modal open onClose={onClose} title={recurrence ? "Editar série recorrente" : "Nova recorrência"} variant="sheet">
            <form onSubmit={save}>
                <ModalBody style={{ display: "grid", gap: 16 }}>
                    <SegmentedControl
                        label="Tipo"
                        value={form.type}
                        onChange={(type) => set({ type, categoryId: "" })}
                        options={[
                            { value: "expense", label: "Despesa", tone: "expense" },
                            { value: "income", label: "Receita", tone: "income" },
                        ]}
                    />
                    <Field label="Valor" error={err("amountCents")}>
                        {({ id, describedBy, invalid }) => <MoneyInput id={id} value={form.amountCents} onChange={(c) => set({ amountCents: c })} aria-describedby={describedBy} aria-invalid={invalid || undefined} data-autofocus />}
                    </Field>
                    <Field label="Descrição" error={err("description")}>
                        {({ id, describedBy, invalid }) => <Input id={id} value={form.description} maxLength={120} onChange={(e) => set({ description: e.target.value })} aria-describedby={describedBy} aria-invalid={invalid || undefined} />}
                    </Field>
                    <FormGrid $cols={2}>
                        <Field label="Categoria">
                            {({ id }) => (
                                <Select id={id} value={form.categoryId ?? ""} onChange={(e) => set({ categoryId: e.target.value })}>
                                    <option value="">Sem categoria</option>
                                    {cats.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </Select>
                            )}
                        </Field>
                        <Field label="Conta ou cartão" error={err("accountId")}>
                            {({ id }) => (
                                <Select id={id} value={form.accountId} onChange={(e) => set({ accountId: e.target.value })}>
                                    {store.accounts
                                        .filter((a) => !a.archived || a.id === form.accountId)
                                        .map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name}
                                            </option>
                                        ))}
                                </Select>
                            )}
                        </Field>
                        <Field label="Frequência" error={err("frequency")}>
                            {({ id }) => (
                                <Select id={id} value={form.frequency} onChange={(e) => set({ frequency: e.target.value })}>
                                    {Object.entries(FREQUENCIES).map(([k, l]) => (
                                        <option key={k} value={k}>
                                            {l}
                                        </option>
                                    ))}
                                </Select>
                            )}
                        </Field>
                        <Field label="Repetir a cada" error={err("interval")} hint={describeFrequency({ frequency: form.frequency, interval: Number(form.interval) || 1 })}>
                            {({ id, describedBy }) => <Input id={id} type="number" min={1} max={365} inputMode="numeric" value={form.interval} aria-describedby={describedBy} onChange={(e) => set({ interval: e.target.value })} />}
                        </Field>
                        <Field label="Data inicial" error={err("startDate")}>
                            {({ id }) => <DatePicker id={id} value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />}
                        </Field>
                        <Field label="Data final (opcional)" error={err("endDate")}>
                            {({ id }) => <DatePicker id={id} value={form.endDate ?? ""} min={form.startDate} onChange={(e) => set({ endDate: e.target.value })} />}
                        </Field>
                    </FormGrid>
                    <Muted>As ocorrências são criadas como pendentes até o fim do mês seguinte e aparecem em Vencimentos. Abrir o app várias vezes não gera duplicados.</Muted>
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

export function RecurrencesSection() {
    const { store, today } = useFinance();
    const { cancelRecurrence, deleteRecurrence, updateSettings } = useFinanceActions();
    const confirm = useConfirm();
    const [dialog, setDialog] = useState(null);
    const suggestions = detectSubscriptions(store, today);
    const active = store.recurrences.filter((r) => r.active);
    const ended = store.recurrences.filter((r) => !r.active);
    const monthlyOut = active.filter((r) => r.type === "expense").reduce((s, r) => s + monthlyEquivalent(r), 0);
    const monthlyIn = active.filter((r) => r.type === "income").reduce((s, r) => s + monthlyEquivalent(r), 0);

    const nextDate = (r) => occurrenceDates(r, today, addYearsISO(today, 2))[0];

    const row = (r) => {
        const cat = store.categories.find((c) => c.id === r.categoryId);
        const acc = store.accounts.find((a) => a.id === r.accountId);
        const next = r.active ? nextDate(r) : null;
        return (
            <li key={r.id}>
                <CategoryIcon category={cat ?? { icon: "Repeat", color: NEUTRAL_COLOR }} />
                <span className="grow">
                    <span>{r.description}</span>
                    <Muted>
                        {describeFrequency(r)} · {acc?.name} {next ? `· próxima em ${formatDateBR(next)}` : r.endDate ? `· encerrada em ${formatDateBR(r.endDate)}` : ""}
                    </Muted>
                </span>
                <Amount cents={r.amountCents} type={r.type} private />
                <Menu
                    label={`Ações para ${r.description}`}
                    items={[
                        r.active && { label: "Editar série", icon: Pencil, onClick: () => setDialog({ recurrence: r }) },
                        r.active && {
                            label: "Encerrar",
                            icon: StopCircle,
                            onClick: async () => {
                                if (await confirm({ title: "Encerrar recorrência", message: `Encerrar “${r.description}”? Lançamentos pendentes futuros serão removidos; os já pagos permanecem.`, confirmLabel: "Encerrar" })) {
                                    cancelRecurrence(r.id);
                                    toast.success("Recorrência encerrada.");
                                }
                            },
                        },
                        {
                            label: "Excluir regra",
                            icon: Trash2,
                            danger: true,
                            onClick: async () => {
                                if (await confirm({ title: "Excluir recorrência", message: `Excluir a regra “${r.description}”? Pendentes futuros serão removidos; lançamentos existentes continuam como avulsos.`, confirmLabel: "Excluir" })) {
                                    deleteRecurrence(r.id);
                                    toast.success("Recorrência excluída.");
                                }
                            },
                        },
                    ]}
                />
            </li>
        );
    };

    return (
        <Stack $gap={4}>
            {suggestions.length > 0 && (
                <Card aria-labelledby="sug-title">
                    <CardHeader id="sug-title" title="Possíveis assinaturas detectadas" subtitle="Despesas que se repetem com valor e intervalo regulares. Nada é criado sem sua confirmação." />
                    <ItemList>
                        {suggestions.map((s) => (
                            <li key={s.key}>
                                <Sparkles size={18} aria-hidden="true" />
                                <span className="grow">
                                    <span>{s.description}</span>
                                    <Muted>
                                        {FREQUENCIES[s.frequency]} · {s.count} ocorrências · última em {formatDateBR(s.lastDate)} · próxima prevista {formatDateBR(s.nextDate)}
                                    </Muted>
                                </span>
                                <Amount cents={s.amountCents} type="expense" private />
                                <span className="actions">
                                    <Button size="sm" icon={Check} onClick={() => setDialog({ preset: { type: "expense", amountCents: s.amountCents, description: s.description, categoryId: s.categoryId, accountId: s.accountId, frequency: s.frequency, startDate: s.nextDate } })}>
                                        Criar recorrência
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        icon={X}
                                        onClick={() => {
                                            updateSettings({ dismissedSuggestions: [...(store.settings.dismissedSuggestions ?? []), s.key] });
                                            toast.info("Sugestão ignorada.");
                                        }}
                                    >
                                        Ignorar
                                    </Button>
                                </span>
                            </li>
                        ))}
                    </ItemList>
                </Card>
            )}
            <Card aria-labelledby="rec-title">
                <CardHeader
                    id="rec-title"
                    title="Recorrências"
                    subtitle={active.length ? `Fixos por mês: saídas ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: store.settings.currency }).format(monthlyOut / 100)} · entradas ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: store.settings.currency }).format(monthlyIn / 100)}` : "Aluguel, salário, assinaturas e outros lançamentos que se repetem."}
                    actions={
                        <Button variant="primary" size="sm" icon={Plus} onClick={() => setDialog({})}>
                            Nova
                        </Button>
                    }
                />
                {store.recurrences.length === 0 ? (
                    <EmptyState icon={Repeat} title="Nenhuma recorrência" description="Cadastre despesas e receitas fixas para que apareçam automaticamente como pendentes a cada período.">
                        <Button variant="primary" icon={Plus} onClick={() => setDialog({})}>
                            Criar recorrência
                        </Button>
                    </EmptyState>
                ) : (
                    <>
                        <ItemList>{active.map(row)}</ItemList>
                        {ended.length > 0 && (
                            <>
                                <Subheading>
                                    Encerradas <Badge>{ended.length}</Badge>
                                </Subheading>
                                <ItemList>{ended.map(row)}</ItemList>
                            </>
                        )}
                    </>
                )}
            </Card>
            {dialog && <RecurrenceDialog {...dialog} onClose={() => setDialog(null)} />}
        </Stack>
    );
}

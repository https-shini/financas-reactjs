import { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Trash2, ChevronDown } from "lucide-react";
import {
    BottomSheet,
    ModalBody,
    ModalFooter,
    Button,
    Field,
    Input,
    Textarea,
    Select,
    DatePicker,
    MoneyInput,
    SegmentedControl,
    Switch,
    CategoryIcon,
    FormGrid,
    Badge, FieldLabel } from "../../components/ui";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { buildTransaction, duplicateInput, validateTransactionInput, DESCRIPTION_MAX } from "../../domain/transactions";
import { addDaysISO } from "../../domain/dates";
import { categoryUsage } from "../../domain/selectors";
import { isCard, invoiceMonthOf, cardInvoices } from "../../domain/cards";
import { FREQUENCIES } from "../../domain/defaults";
import { buildInstallments, installmentGroup, applyGroupEdit, isInstallmentLocked, MAX_INSTALLMENTS } from "../../domain/installments";
import { useFormat } from "../../hooks/useFormat";

const TYPE_OPTIONS = [
    { value: "expense", label: "Despesa", icon: ArrowDownCircle, tone: "expense" },
    { value: "income", label: "Receita", icon: ArrowUpCircle, tone: "income" },
    { value: "transfer", label: "Transferência", icon: ArrowLeftRight, tone: "transfer" },
];

const CatGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    ${(p) => p.theme.media.tablet} {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }
`;

const CatButton = styled.button`
    display: grid;
    justify-items: center;
    gap: 4px;
    padding: 8px 4px;
    min-height: 68px;
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => (p["aria-pressed"] ? p.theme.colors.primary : p.theme.colors.border)};
    background: ${(p) => (p["aria-pressed"] ? p.theme.colors.primarySoft : "transparent")};
    font-size: ${(p) => p.theme.fontSize.xs};
    color: ${(p) => p.theme.colors.text};
    span:last-child {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    &:hover {
        background: ${(p) => (p["aria-pressed"] ? p.theme.colors.primarySoft : p.theme.colors.bgHover)};
    }
`;

const Chips = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

const Chip = styled.button`
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid ${(p) => (p["aria-pressed"] ? p.theme.colors.primary : p.theme.colors.border)};
    background: ${(p) => (p["aria-pressed"] ? p.theme.colors.primarySoft : "transparent")};
    color: ${(p) => (p["aria-pressed"] ? p.theme.colors.primaryText : p.theme.colors.textSecondary)};
    font-size: ${(p) => p.theme.fontSize.sm};
    font-weight: 500;
    @media (pointer: coarse) {
        min-height: 44px;
    }
`;

const Advanced = styled.details`
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 48px;
        padding: 0 12px;
        cursor: pointer;
        font-weight: 500;
        list-style: none;
        color: ${(p) => p.theme.colors.textSecondary};
    }
    summary::-webkit-details-marker {
        display: none;
    }
    &[open] summary svg {
        transform: rotate(180deg);
    }
    > div {
        display: grid;
        gap: 16px;
        padding: 4px 12px 16px;
    }
`;

const Scope = styled.fieldset`
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    padding: 8px 12px 12px;
    legend {
        padding: 0 4px;
        font-size: ${(p) => p.theme.fontSize.sm};
        color: ${(p) => p.theme.colors.textSecondary};
    }
    label {
        display: flex;
        gap: 8px;
        align-items: center;
        min-height: 40px;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
`;

const Stack = styled.div`
    display: grid;
    gap: 16px;
`;

function initialState({ mode, tx, defaults, store, today }) {
    const firstAccount = store.accounts.find((a) => !a.archived && !isCard(a)) ?? store.accounts[0];
    if (tx && (mode === "edit" || mode === "duplicate")) {
        const base = mode === "duplicate" ? duplicateInput(tx, today) : tx;
        return {
            type: base.type,
            amountCents: base.amountCents,
            description: base.description,
            categoryId: base.categoryId ?? null,
            date: base.date,
            accountId: base.accountId,
            toAccountId: base.toAccountId ?? "",
            status: base.status,
            notes: base.notes ?? "",
        };
    }
    return {
        type: defaults?.type ?? "expense",
        amountCents: defaults?.amountCents ?? 0,
        description: defaults?.description ?? "",
        categoryId: defaults?.categoryId ?? null,
        date: defaults?.date ?? today,
        accountId: defaults?.accountId ?? firstAccount.id,
        toAccountId: defaults?.toAccountId ?? "",
        status: defaults?.status ?? "paid",
        notes: defaults?.notes ?? "",
    };
}

/**
 * Painel de cadastro/edição/duplicação de transações.
 * Ordem: valor → tipo → descrição → categoria → data → conta → status; avançado: observações, repetir, parcelar.
 */
export function TransactionSheet({ open, onClose, mode = "create", tx, defaults }) {
    const { store, today } = useFinance();
    const actions = useFinanceActions();
    const { deleteWithUndo } = useUI();
    const { money } = useFormat();
    const amountRef = useRef(null);

    const [form, setForm] = useState(() => initialState({ mode, tx, defaults, store, today }));
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [showAllCats, setShowAllCats] = useState(false);
    const [repeat, setRepeat] = useState({ enabled: false, frequency: "monthly", interval: 1, endDate: "" });
    const [installments, setInstallments] = useState({ enabled: false, count: 2 });
    const [scope, setScope] = useState("one");

    const isEdit = mode === "edit";
    const account = store.accounts.find((a) => a.id === form.accountId);
    const onCard = isCard(account);
    const recurrence = isEdit && tx?.recurrenceId ? store.recurrences.find((r) => r.id === tx.recurrenceId) : null;
    const group = isEdit && tx?.installment ? installmentGroup(store, tx.installment.group) : null;

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));
    const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

    const input = useMemo(
        () => ({
            ...form,
            status: onCard && form.type !== "transfer" ? "paid" : form.status,
            categoryId: form.type === "transfer" ? null : form.categoryId,
            toAccountId: form.type === "transfer" ? form.toAccountId : undefined,
        }),
        [form, onCard]
    );
    const validation = validateTransactionInput(input, store);
    const extraErrors = {};
    if (installments.enabled && (!Number.isInteger(installments.count) || installments.count < 2 || installments.count > MAX_INSTALLMENTS)) {
        extraErrors.installments = `Use entre 2 e ${MAX_INSTALLMENTS} parcelas.`;
    }
    if (repeat.enabled && repeat.endDate && repeat.endDate < form.date) extraErrors.repeatEnd = "A data final deve ser posterior à data do lançamento.";
    const errors = { ...validation.errors, ...extraErrors };
    const showError = (field) => (submitted || touched[field] ? errors[field] : undefined);
    const ok = Object.keys(errors).length === 0;

    const usage = useMemo(() => categoryUsage(store), [store]);
    const categories = useMemo(() => {
        const kind = form.type === "income" ? "income" : "expense";
        return store.categories
            .filter((c) => !c.archived && (c.kind === kind || c.kind === "both"))
            .sort((a, b) => (usage.get(b.id)?.count ?? 0) - (usage.get(a.id)?.count ?? 0));
    }, [store.categories, form.type, usage]);
    const quickCats = categories.slice(0, 8);
    const selectedOutside = form.categoryId && !quickCats.some((c) => c.id === form.categoryId);

    const accountOptions = store.accounts.filter((a) => !a.archived || a.id === form.accountId || a.id === form.toAccountId);
    const sourceAccounts = form.type === "transfer" ? accountOptions : accountOptions;
    const destAccounts = accountOptions.filter((a) => a.id !== form.accountId);

    const reset = () => {
        setForm((f) => ({ ...initialState({ mode: "create", defaults: { type: f.type, accountId: f.accountId, date: f.date, categoryId: null }, store, today }) }));
        setTouched({});
        setSubmitted(false);
        setInstallments({ enabled: false, count: 2 });
        setRepeat((r) => ({ ...r, enabled: false }));
        setTimeout(() => amountRef.current?.focus(), 30);
    };

    const save = (andNew) => {
        setSubmitted(true);
        if (!ok) {
            toast.error("Revise os campos destacados.");
            return;
        }
        try {
            if (isEdit) {
                if (scope === "series" && recurrence) {
                    actions.saveRecurrence({ id: recurrence.id, type: input.type, amountCents: input.amountCents, description: input.description, categoryId: input.categoryId, accountId: input.accountId });
                    actions.updateTransaction(tx.id, input);
                    toast.success("Série atualizada (lançamentos pagos não foram alterados).");
                } else if (scope === "group" && group) {
                    const card = isCard(account) ? account : null;
                    const paidMonths = new Set(card ? cardInvoices(store, card, today).filter((i) => i.status === "paid").map((i) => i.month) : []);
                    const locked = (p) => isInstallmentLocked(p, { today, paidInvoiceMonths: paidMonths, isCardAccount: Boolean(card), invoiceMonthOf: (d) => invoiceMonthOf(d, card?.closingDay ?? 1) });
                    const currentTotal = group.reduce((s, p) => s + p.amountCents, 0);
                    const newTotal = currentTotal - tx.amountCents + input.amountCents;
                    const edited = applyGroupEdit(group, { description: input.description, categoryId: input.categoryId, notes: input.notes, totalCents: newTotal !== currentTotal ? newTotal : undefined }, locked);
                    actions.replaceTransactions(edited);
                    toast.success(`Parcelamento atualizado (${group.length} parcelas).`);
                } else {
                    actions.updateTransaction(tx.id, input);
                    toast.success("Transação atualizada.");
                }
                onClose();
                return;
            }

            if (installments.enabled && input.type !== "transfer") {
                const parcels = buildInstallments(input, installments.count, { today, isCardAccount: onCard });
                actions.addTransactions(parcels);
                toast.success(`${installments.count} parcelas de ${money(parcels[0].amountCents)} criadas.`);
            } else if (repeat.enabled && input.type !== "transfer") {
                const rec = actions.saveRecurrence({
                    type: input.type,
                    amountCents: input.amountCents,
                    description: input.description,
                    categoryId: input.categoryId,
                    accountId: input.accountId,
                    frequency: repeat.frequency,
                    interval: Number(repeat.interval) || 1,
                    startDate: input.date,
                    endDate: repeat.endDate || null,
                });
                if (input.status === "paid") {
                    const first = actions.getStore().transactions.find((t) => t.recurrenceId === rec.id && t.occurrenceDate === input.date);
                    if (first) actions.setTransactionsStatus([first.id], "paid");
                }
                toast.success("Recorrência criada. Os próximos lançamentos aparecem como pendentes.");
            } else {
                actions.addTransactions([buildTransaction(input)]);
                toast.success(mode === "duplicate" ? "Transação duplicada." : "Transação adicionada.");
            }
            if (andNew) reset();
            else onClose();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const title = isEdit ? "Editar transação" : mode === "duplicate" ? "Duplicar transação" : "Nova transação";

    return (
        <BottomSheet open={open} onClose={onClose} title={title} size="md" initialFocusRef={amountRef}>
            <Form
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    save(false);
                }}
            >
                <ModalBody>
                    <Stack>
                        <Field label="Valor" error={showError("amountCents")}>
                            {({ id, describedBy, invalid }) => (
                                <MoneyInput
                                    ref={amountRef}
                                    id={id}
                                    large
                                    value={form.amountCents}
                                    onChange={(c) => set({ amountCents: c })}
                                    // Campo vazio só acusa erro ao salvar: mostrar o erro ao sair do campo empurrava o seletor de tipo e o clique se perdia.
                                    onBlur={() => form.amountCents > 0 && touch("amountCents")}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid || undefined}
                                />
                            )}
                        </Field>

                        <SegmentedControl
                            label="Tipo de transação"
                            options={isEdit && (tx?.installment || tx?.recurrenceId) ? TYPE_OPTIONS.filter((o) => o.value !== "transfer") : TYPE_OPTIONS}
                            value={form.type}
                            onChange={(type) => set({ type, categoryId: type === form.type ? form.categoryId : null })}
                        />

                        <Field label="Descrição" error={showError("description")}>
                            {({ id, describedBy, invalid }) => (
                                <Input
                                    id={id}
                                    value={form.description}
                                    maxLength={DESCRIPTION_MAX}
                                    placeholder={form.type === "transfer" ? "Ex.: Guardar na poupança" : form.type === "income" ? "Ex.: Salário" : "Ex.: Mercado"}
                                    onChange={(e) => set({ description: e.target.value })}
                                    onBlur={(e) => e.target.value.trim() && touch("description")}
                                    aria-describedby={describedBy}
                                    aria-invalid={invalid || undefined}
                                    autoComplete="off"
                                />
                            )}
                        </Field>

                        {form.type !== "transfer" && (
                            <div role="group" aria-labelledby="cat-label">
                                <FieldLabel id="cat-label">
                                    Categoria
                                </FieldLabel>
                                <CatGrid>
                                    {quickCats.map((c) => (
                                        <CatButton key={c.id} type="button" aria-pressed={form.categoryId === c.id} onClick={() => set({ categoryId: form.categoryId === c.id ? null : c.id })}>
                                            <CategoryIcon category={c} size={28} />
                                            <span>{c.name}</span>
                                        </CatButton>
                                    ))}
                                </CatGrid>
                                {(showAllCats || selectedOutside || categories.length > quickCats.length) && (
                                    <div style={{ marginTop: 8 }}>
                                        {showAllCats || selectedOutside ? (
                                            <Field label="Todas as categorias" labelHidden>
                                                {({ id }) => (
                                                    <Select id={id} value={form.categoryId ?? ""} onChange={(e) => set({ categoryId: e.target.value || null })}>
                                                        <option value="">Sem categoria</option>
                                                        {categories.map((c) => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                )}
                                            </Field>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => setShowAllCats(true)}>
                                                Ver todas as categorias ({categories.length})
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <Field label="Data" error={showError("date")}>
                            {({ id, describedBy, invalid }) => (
                                <div style={{ display: "grid", gap: 8 }}>
                                    <Chips>
                                        <Chip type="button" aria-pressed={form.date === today} onClick={() => set({ date: today })}>
                                            Hoje
                                        </Chip>
                                        <Chip type="button" aria-pressed={form.date === addDaysISO(today, -1)} onClick={() => set({ date: addDaysISO(today, -1) })}>
                                            Ontem
                                        </Chip>
                                    </Chips>
                                    <DatePicker id={id} value={form.date} onChange={(e) => set({ date: e.target.value })} aria-describedby={describedBy} aria-invalid={invalid || undefined} />
                                </div>
                            )}
                        </Field>

                        <FormGrid $cols={form.type === "transfer" ? 2 : 1}>
                            <Field label={form.type === "transfer" ? "Da conta" : "Conta ou cartão"} error={showError("accountId")}>
                                {({ id, describedBy }) => (
                                    <Select id={id} value={form.accountId} onChange={(e) => set({ accountId: e.target.value })} aria-describedby={describedBy}>
                                        {sourceAccounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name}
                                                {isCard(a) ? " (cartão)" : ""}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            </Field>
                            {form.type === "transfer" && (
                                <Field label="Para a conta" error={showError("toAccountId") ?? (submitted ? errors.toAccountId : undefined)}>
                                    {({ id, describedBy, invalid }) => (
                                        <Select id={id} value={form.toAccountId} onChange={(e) => set({ toAccountId: e.target.value })} aria-describedby={describedBy} aria-invalid={invalid || undefined}>
                                            <option value="">Selecione…</option>
                                            {destAccounts.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name}
                                                    {isCard(a) ? " (pagamento de cartão)" : ""}
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                </Field>
                            )}
                        </FormGrid>

                        {onCard && form.type !== "transfer" ? (
                            <p style={{ fontSize: "var(--v-font-size-sm)", color: "var(--v-color-text-secondary)" }}>
                                Compras no cartão entram na fatura e são pagas quando a fatura é paga.
                            </p>
                        ) : (
                            <Switch
                                checked={form.status === "paid"}
                                onChange={(v) => set({ status: v ? "paid" : "pending" })}
                                label={form.type === "income" ? "Recebido" : form.type === "transfer" ? "Transferência realizada" : "Pago"}
                                description={form.status === "pending" ? "Fica em Contas a pagar ou a receber e não entra no saldo realizado." : undefined}
                            />
                        )}

                        {isEdit && recurrence && (
                            <Scope>
                                <legend>
                                    Lançamento recorrente <Badge $tone="primary">{FREQUENCIES[recurrence.frequency]}</Badge>
                                </legend>
                                <label>
                                    <input type="radio" name="scope" checked={scope === "one"} onChange={() => setScope("one")} /> Alterar apenas este lançamento
                                </label>
                                <label>
                                    <input type="radio" name="scope" checked={scope === "series"} onChange={() => setScope("series")} /> Alterar toda a série (pendentes a partir de hoje)
                                </label>
                            </Scope>
                        )}

                        {isEdit && group && (
                            <Scope>
                                <legend>
                                    Parcela {tx.installment.n} de {tx.installment.of}
                                </legend>
                                <label>
                                    <input type="radio" name="scope" checked={scope === "one"} onChange={() => setScope("one")} /> Alterar apenas esta parcela
                                </label>
                                <label>
                                    <input type="radio" name="scope" checked={scope === "group"} onChange={() => setScope("group")} /> Alterar todas as parcelas (parcelas já pagas mantêm o valor)
                                </label>
                            </Scope>
                        )}

                        <Advanced open={Boolean(form.notes) || repeat.enabled || installments.enabled || undefined}>
                            <summary>
                                Mais opções <ChevronDown size={16} aria-hidden="true" />
                            </summary>
                            <div>
                                <Field label="Observações" error={showError("notes")} hint="Opcional">
                                    {({ id, describedBy }) => (
                                        <Textarea id={id} value={form.notes} maxLength={500} onChange={(e) => set({ notes: e.target.value })} aria-describedby={describedBy} rows={2} />
                                    )}
                                </Field>

                                {!isEdit && form.type !== "transfer" && (
                                    <>
                                        <Switch
                                            checked={repeat.enabled}
                                            onChange={(v) => {
                                                setRepeat((r) => ({ ...r, enabled: v }));
                                                if (v) setInstallments((i) => ({ ...i, enabled: false }));
                                            }}
                                            label="Repetir (recorrente)"
                                            description="Gera os próximos lançamentos como pendentes."
                                        />
                                        {repeat.enabled && (
                                            <FormGrid $cols={3}>
                                                <Field label="Frequência">
                                                    {({ id }) => (
                                                        <Select id={id} value={repeat.frequency} onChange={(e) => setRepeat((r) => ({ ...r, frequency: e.target.value }))}>
                                                            {Object.entries(FREQUENCIES).map(([k, v]) => (
                                                                <option key={k} value={k}>
                                                                    {v}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    )}
                                                </Field>
                                                <Field label="A cada" hint="Intervalo">
                                                    {({ id, describedBy }) => (
                                                        <Input id={id} type="number" min={1} max={365} inputMode="numeric" value={repeat.interval} aria-describedby={describedBy} onChange={(e) => setRepeat((r) => ({ ...r, interval: Math.max(1, Number(e.target.value) || 1) }))} />
                                                    )}
                                                </Field>
                                                <Field label="Até (opcional)" error={submitted ? errors.repeatEnd : undefined}>
                                                    {({ id, describedBy }) => <DatePicker id={id} value={repeat.endDate} min={form.date} aria-describedby={describedBy} onChange={(e) => setRepeat((r) => ({ ...r, endDate: e.target.value }))} />}
                                                </Field>
                                            </FormGrid>
                                        )}
                                        <Switch
                                            checked={installments.enabled}
                                            onChange={(v) => {
                                                setInstallments((i) => ({ ...i, enabled: v }));
                                                if (v) setRepeat((r) => ({ ...r, enabled: false }));
                                            }}
                                            label="Parcelar"
                                            description="Divide o valor em parcelas mensais."
                                        />
                                        {installments.enabled && (
                                            <Field
                                                label="Número de parcelas"
                                                error={submitted || touched.installments ? errors.installments : undefined}
                                                hint={
                                                    form.amountCents && installments.count >= 2
                                                        ? `${installments.count}× de aproximadamente ${money(Math.ceil(form.amountCents / installments.count))}`
                                                        : undefined
                                                }
                                            >
                                                {({ id, describedBy }) => (
                                                    <Input
                                                        id={id}
                                                        type="number"
                                                        min={2}
                                                        max={MAX_INSTALLMENTS}
                                                        inputMode="numeric"
                                                        value={installments.count}
                                                        aria-describedby={describedBy}
                                                        onBlur={() => touch("installments")}
                                                        onChange={(e) => setInstallments((i) => ({ ...i, count: Number(e.target.value) }))}
                                                    />
                                                )}
                                            </Field>
                                        )}
                                    </>
                                )}
                            </div>
                        </Advanced>
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    {isEdit && (
                        <Button
                            variant="danger-ghost"
                            icon={Trash2}
                            style={{ marginRight: "auto" }}
                            onClick={() => {
                                deleteWithUndo([tx.id]);
                                onClose();
                            }}
                        >
                            Excluir
                        </Button>
                    )}
                    {!isEdit && (
                        <Button type="button" onClick={() => save(true)}>
                            Salvar e criar outra
                        </Button>
                    )}
                    <Button type="submit" variant="primary">
                        Salvar
                    </Button>
                </ModalFooter>
            </Form>
        </BottomSheet>
    );
}

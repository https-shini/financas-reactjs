import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { CreditCard, Plus, Pencil, Archive, ArchiveRestore, Trash2, Receipt } from "lucide-react";
import {
    Card, CardHeader, Button, Amount, Badge, EmptyState, Progress, Menu, Modal, ModalBody, ModalFooter, Field, Input, Select, MoneyInput, DatePicker, Switch, FormGrid, Muted, useConfirm,
} from "../../components/ui";
import { Grid, Span, Row, Stack } from "../../components/layout/Page";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { cardSummary, INVOICE_STATUS_LABEL, isCard } from "../../domain/cards";
import { buildTransaction, cleanText } from "../../domain/transactions";
import { formatDateBR, formatMonthLabel } from "../../domain/dates";
import { CATEGORY_COLORS } from "../../domain/defaults";
import { newId } from "../../domain/ids";
import { indexById, sortTransactions } from "../../domain/selectors";
import { TransactionRow, TxList } from "../transactions/TransactionRow";

const CardTile = styled.button`
    display: grid;
    gap: 10px;
    width: 100%;
    text-align: left;
    padding: 16px;
    border-radius: ${(p) => p.theme.radius.lg};
    border: 2px solid ${(p) => (p["aria-pressed"] ? p.theme.colors.primary : p.theme.colors.border)};
    background: ${(p) => p.theme.colors.bgElevated};
    .stripe {
        height: 6px;
        border-radius: 3px;
        background: ${(p) => p.$color};
    }
`;

const InvoiceTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: ${(p) => p.theme.fontSize.sm};
    th,
    td {
        padding: 10px 8px;
        border-bottom: 1px solid ${(p) => p.theme.colors.border};
        text-align: left;
    }
    td.num,
    th.num {
        text-align: right;
    }
    tr[aria-selected="true"] {
        background: ${(p) => p.theme.colors.primarySoft};
    }
    ${(p) => p.theme.media.mobile} {
        .hide-sm {
            display: none;
        }
    }
`;

const statusTone = { open: "info", closed: "warning", paid: "income", overdue: "expense" };

function CardDialog({ card, onClose }) {
    const { store } = useFinance();
    const { upsertAccount } = useFinanceActions();
    const cash = store.accounts.filter((a) => !isCard(a) && !a.archived);
    const [form, setForm] = useState({
        name: card?.name ?? "",
        limitCents: card?.limitCents ?? 0,
        closingDay: card?.closingDay ?? 1,
        dueDay: card?.dueDay ?? 10,
        paymentAccountId: card?.paymentAccountId ?? cash[0]?.id ?? "",
        color: card?.color ?? CATEGORY_COLORS[1],
    });
    const [submitted, setSubmitted] = useState(false);
    const set = (p) => setForm((f) => ({ ...f, ...p }));
    const errors = {};
    if (!cleanText(form.name)) errors.name = "Informe um nome.";
    if (!(form.closingDay >= 1 && form.closingDay <= 31)) errors.closingDay = "Dia entre 1 e 31.";
    if (!(form.dueDay >= 1 && form.dueDay <= 31)) errors.dueDay = "Dia entre 1 e 31.";

    const save = (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (Object.keys(errors).length) return;
        const now = new Date().toISOString();
        try {
            upsertAccount({
                ...(card ?? {}),
                id: card?.id ?? newId(),
                name: cleanText(form.name, 60),
                type: "credit",
                color: form.color,
                initialBalanceCents: card?.initialBalanceCents ?? 0,
                archived: card?.archived ?? false,
                limitCents: form.limitCents,
                closingDay: Number(form.closingDay),
                dueDay: Number(form.dueDay),
                paymentAccountId: form.paymentAccountId || null,
                createdAt: card?.createdAt ?? now,
                updatedAt: now,
            });
            toast.success(card ? "Cartão atualizado." : "Cartão criado.");
            onClose();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <Modal open onClose={onClose} title={card ? "Editar cartão" : "Novo cartão de crédito"} variant="sheet">
            <form onSubmit={save}>
                <ModalBody style={{ display: "grid", gap: 16 }}>
                    <Field label="Nome" error={submitted ? errors.name : undefined}>
                        {({ id, describedBy, invalid }) => <Input id={id} value={form.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} aria-describedby={describedBy} aria-invalid={invalid || undefined} placeholder="Ex.: Nubank Roxinho" data-autofocus />}
                    </Field>
                    <Field label="Limite">{({ id }) => <MoneyInput id={id} value={form.limitCents} onChange={(c) => set({ limitCents: c })} />}</Field>
                    <FormGrid $cols={2}>
                        <Field label="Dia de fechamento" error={submitted ? errors.closingDay : undefined} hint="Compras após este dia vão para a fatura seguinte.">
                            {({ id, describedBy }) => <Input id={id} type="number" min={1} max={31} inputMode="numeric" value={form.closingDay} aria-describedby={describedBy} onChange={(e) => set({ closingDay: Number(e.target.value) })} />}
                        </Field>
                        <Field label="Dia de vencimento" error={submitted ? errors.dueDay : undefined}>
                            {({ id }) => <Input id={id} type="number" min={1} max={31} inputMode="numeric" value={form.dueDay} onChange={(e) => set({ dueDay: Number(e.target.value) })} />}
                        </Field>
                    </FormGrid>
                    <Field label="Conta de pagamento" hint="Conta usada por padrão para pagar a fatura.">
                        {({ id, describedBy }) => (
                            <Select id={id} value={form.paymentAccountId} onChange={(e) => set({ paymentAccountId: e.target.value })} aria-describedby={describedBy}>
                                <option value="">Escolher ao pagar</option>
                                {cash.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                    <Field label="Cor de identificação">
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

function PayInvoiceDialog({ card, invoice, onClose }) {
    const { store, today } = useFinance();
    const { addTransactions } = useFinanceActions();
    const cash = store.accounts.filter((a) => !isCard(a) && !a.archived);
    const [amount, setAmount] = useState(Math.max(0, invoice.remainingCents - invoice.scheduledCents));
    const [date, setDate] = useState(today < invoice.dueDate ? today : today);
    const [accountId, setAccountId] = useState(card.paymentAccountId && cash.some((a) => a.id === card.paymentAccountId) ? card.paymentAccountId : cash[0]?.id);
    const [scheduled, setScheduled] = useState(false);
    const error = amount <= 0 ? "Informe o valor do pagamento." : !accountId ? "Escolha a conta." : undefined;
    const [submitted, setSubmitted] = useState(false);

    const save = (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (error) return;
        addTransactions([
            buildTransaction({
                type: "transfer",
                amountCents: amount,
                description: `Pagamento fatura ${card.name} (${formatMonthLabel(invoice.month, "short")})`,
                date,
                accountId,
                toAccountId: card.id,
                status: scheduled ? "pending" : "paid",
                invoiceRef: { cardId: card.id, month: invoice.month },
            }),
        ]);
        toast.success(scheduled ? "Pagamento agendado." : "Pagamento registrado. As compras não são contadas novamente como despesa.");
        onClose();
    };

    return (
        <Modal open onClose={onClose} title={`Pagar fatura de ${formatMonthLabel(invoice.month).toLowerCase()}`} description={`${card.name} · vence em ${formatDateBR(invoice.dueDate)}`} size="sm" variant="sheet">
            <form onSubmit={save}>
                <ModalBody style={{ display: "grid", gap: 16 }}>
                    <Field label="Valor" error={submitted ? error : undefined} hint="Pode ser parcial; o restante continua em aberto.">
                        {({ id, describedBy }) => <MoneyInput id={id} value={amount} onChange={setAmount} aria-describedby={describedBy} data-autofocus />}
                    </Field>
                    <Field label="Pagar com">
                        {({ id }) => (
                            <Select id={id} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                                {cash.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                    <Field label="Data">{({ id }) => <DatePicker id={id} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
                    <Switch checked={scheduled} onChange={setScheduled} label="Apenas agendar (ainda não pago)" />
                    <Muted>O pagamento é registrado como transferência da conta para o cartão: reduz o saldo da conta e a dívida do cartão sem duplicar despesas.</Muted>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="primary">
                        {scheduled ? "Agendar" : "Registrar pagamento"}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

export function CardsSection() {
    const { store, today } = useFinance();
    const { setAccountArchived, deleteAccount } = useFinanceActions();
    const { openTransaction, deleteWithUndo } = useUI();
    const confirm = useConfirm();
    const [params, setParams] = useSearchParams();
    const [dialog, setDialog] = useState(null);
    const [paying, setPaying] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const cards = store.accounts.filter((a) => isCard(a) && (showArchived || !a.archived));
    const selectedId = params.get("cartao") && cards.some((c) => c.id === params.get("cartao")) ? params.get("cartao") : cards[0]?.id;
    const selected = cards.find((c) => c.id === selectedId);
    const summary = selected ? cardSummary(store, selected, today) : null;
    const invoiceMonth = params.get("fatura") && summary?.invoices.some((i) => i.month === params.get("fatura")) ? params.get("fatura") : summary?.currentInvoice.month;
    const invoice = summary ? summary.invoices.find((i) => i.month === invoiceMonth) ?? summary.currentInvoice : null;
    const cats = useMemo(() => indexById(store.categories), [store.categories]);
    const accs = useMemo(() => indexById(store.accounts), [store.accounts]);

    const select = (id, month) => {
        const next = new URLSearchParams(params);
        next.set("cartao", id);
        if (month) next.set("fatura", month);
        else next.delete("fatura");
        setParams(next, { replace: true });
    };

    const run = (fn, ok) => {
        try {
            fn();
            toast.success(ok);
        } catch (e) {
            toast.error(e.message);
        }
    };

    if (!store.accounts.some(isCard)) {
        return (
            <Card>
                <EmptyState icon={CreditCard} title="Nenhum cartão cadastrado" description="Cadastre seus cartões para controlar faturas, limite disponível e compras parceladas.">
                    <Button variant="primary" icon={Plus} onClick={() => setDialog({})}>
                        Adicionar cartão
                    </Button>
                </EmptyState>
                {dialog && <CardDialog card={null} onClose={() => setDialog(null)} />}
            </Card>
        );
    }

    return (
        <Stack $gap={4}>
            <Row $justify="space-between" $wrap>
                {store.accounts.some((a) => isCard(a) && a.archived) ? <Switch checked={showArchived} onChange={setShowArchived} label="Mostrar arquivados" /> : <span />}
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setDialog({})}>
                    Novo cartão
                </Button>
            </Row>
            <Grid>
                {cards.map((c) => {
                    const s = cardSummary(store, c, today);
                    return (
                        <Span key={c.id} $desktop={4} $tablet={1}>
                            <CardTile type="button" $color={c.color} aria-pressed={c.id === selectedId} onClick={() => select(c.id)}>
                                <span className="stripe" aria-hidden="true" />
                                <Row $justify="space-between">
                                    <strong>{c.name}</strong>
                                    {c.archived && <Badge>Arquivado</Badge>}
                                </Row>
                                <Muted>
                                    Fatura atual: <Amount cents={s.currentInvoice.totalCents} private colored={false} weight={600} /> · vence {formatDateBR(s.currentInvoice.dueDate, "dd/MM")}
                                </Muted>
                                <Progress value={s.usedCents} max={s.limitCents || 1} tone={s.usedCents > s.limitCents ? "expense" : s.usedCents > s.limitCents * 0.8 ? "warning" : "primary"} label={`Limite usado de ${c.name}`} />
                                <Muted>
                                    Disponível <Amount cents={s.availableCents} private colored={false} weight={500} /> de <Amount cents={s.limitCents} private colored={false} weight={400} />
                                </Muted>
                            </CardTile>
                        </Span>
                    );
                })}
            </Grid>

            {selected && summary && invoice && (
                <Grid>
                    <Span $desktop={5}>
                        <Card aria-labelledby="inv-list">
                            <CardHeader
                                id="inv-list"
                                title={`Faturas · ${selected.name}`}
                                subtitle={`Fecha dia ${selected.closingDay} · vence dia ${selected.dueDay}`}
                                actions={
                                    <Menu
                                        label={`Ações para ${selected.name}`}
                                        items={[
                                            { label: "Editar cartão", icon: Pencil, onClick: () => setDialog({ card: selected }) },
                                            { label: selected.archived ? "Reativar" : "Arquivar", icon: selected.archived ? ArchiveRestore : Archive, onClick: () => run(() => setAccountArchived(selected.id, !selected.archived), selected.archived ? "Cartão reativado." : "Cartão arquivado.") },
                                            {
                                                label: "Excluir",
                                                icon: Trash2,
                                                danger: true,
                                                onClick: async () => {
                                                    if (await confirm({ title: "Excluir cartão", message: "Só é possível excluir cartões sem lançamentos. Para manter o histórico, arquive.", confirmLabel: "Excluir" })) run(() => deleteAccount(selected.id), "Cartão excluído.");
                                                },
                                            },
                                        ]}
                                    />
                                }
                            />
                            {summary.invoices.length === 0 ? (
                                <Muted>Sem compras neste cartão ainda.</Muted>
                            ) : (
                                <InvoiceTable>
                                    <caption className="sr-only">Faturas</caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">Fatura</th>
                                            <th scope="col" className="hide-sm">
                                                Vencimento
                                            </th>
                                            <th scope="col" className="num">
                                                Total
                                            </th>
                                            <th scope="col">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...summary.invoices].reverse().map((i) => (
                                            <tr key={i.month} aria-selected={i.month === invoice.month}>
                                                <td>
                                                    <Button size="sm" variant="ghost" onClick={() => select(selected.id, i.month)} aria-label={`Ver fatura de ${formatMonthLabel(i.month)}`}>
                                                        {formatMonthLabel(i.month, "short")}
                                                    </Button>
                                                </td>
                                                <td className="hide-sm">{formatDateBR(i.dueDate)}</td>
                                                <td className="num">
                                                    <Amount cents={i.totalCents} private colored={false} weight={500} />
                                                </td>
                                                <td>
                                                    <Badge $tone={statusTone[i.status]}>{INVOICE_STATUS_LABEL[i.status]}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </InvoiceTable>
                            )}
                        </Card>
                    </Span>
                    <Span $desktop={7}>
                        <Card aria-labelledby="inv-detail">
                            <CardHeader
                                id="inv-detail"
                                title={`Fatura de ${formatMonthLabel(invoice.month).toLowerCase()}`}
                                subtitle={`Fecha em ${formatDateBR(invoice.closingDate)} · vence em ${formatDateBR(invoice.dueDate)}`}
                                actions={
                                    invoice.remainingCents - (invoice.scheduledCents ?? 0) > 0 ? (
                                        <Button variant="primary" size="sm" icon={Receipt} onClick={() => setPaying(invoice)}>
                                            Pagar
                                        </Button>
                                    ) : null
                                }
                            />
                            <Row $wrap $gap={6} style={{ marginBottom: 12 }}>
                                <div>
                                    <Muted>Total</Muted>
                                    <div style={{ fontSize: "1.25rem" }}>
                                        <Amount cents={invoice.totalCents} private colored={false} weight={700} />
                                    </div>
                                </div>
                                <div>
                                    <Muted>Pago</Muted>
                                    <div>
                                        <Amount cents={invoice.paidCents} private colored={false} />
                                    </div>
                                </div>
                                <div>
                                    <Muted>Em aberto</Muted>
                                    <div>
                                        <Amount cents={invoice.remainingCents} private colored={false} />
                                    </div>
                                </div>
                                <Badge $tone={statusTone[invoice.status]}>{INVOICE_STATUS_LABEL[invoice.status]}</Badge>
                            </Row>
                            {invoice.transactions?.length ? (
                                <TxList>
                                    {sortTransactions(invoice.transactions, "date-desc").map((tx) => (
                                        <TransactionRow
                                            key={tx.id}
                                            tx={tx}
                                            categories={cats}
                                            accounts={accs}
                                            today={today}
                                            showDate
                                            onOpen={(t) => openTransaction({ mode: "edit", tx: t })}
                                            onDuplicate={(t) => openTransaction({ mode: "duplicate", tx: t })}
                                            onDelete={(t) => deleteWithUndo([t.id])}
                                        />
                                    ))}
                                </TxList>
                            ) : (
                                <Muted>Nenhuma compra nesta fatura.</Muted>
                            )}
                            <div style={{ marginTop: 12 }}>
                                <Button icon={Plus} onClick={() => openTransaction({ defaults: { type: "expense", accountId: selected.id } })}>
                                    Nova compra no cartão
                                </Button>
                            </div>
                        </Card>
                    </Span>
                </Grid>
            )}
            {dialog && <CardDialog card={dialog.card ?? null} onClose={() => setDialog(null)} />}
            {paying && <PayInvoiceDialog card={selected} invoice={paying} onClose={() => setPaying(null)} />}
        </Stack>
    );
}

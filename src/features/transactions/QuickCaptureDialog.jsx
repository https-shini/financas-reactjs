import { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { Modal, ModalBody, ModalFooter, Button, Field, Input, Amount, CategoryChip, Badge } from "../../components/ui";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { parseQuickEntry } from "../../domain/quickCapture";
import { buildTransaction, validateTransactionInput, TYPE_LABEL } from "../../domain/transactions";
import { formatDateBR } from "../../domain/dates";

const Preview = styled.dl`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
    padding: 16px;
    border-radius: ${(p) => p.theme.radius.md};
    background: ${(p) => p.theme.colors.bgSurface};
    margin-top: 16px;
    dt {
        color: ${(p) => p.theme.colors.textMuted};
        font-size: ${(p) => p.theme.fontSize.sm};
    }
    dd {
        min-width: 0;
        font-weight: 500;
    }
`;

/** Captura rápida por frase com prévia obrigatória antes de salvar. */
export function QuickCaptureDialog({ open, onClose }) {
    const { store, today } = useFinance();
    const actions = useFinanceActions();
    const { openTransaction } = useUI();
    const [text, setText] = useState("");
    const inputRef = useRef(null);

    const parsed = useMemo(() => (text.trim() ? parseQuickEntry(text, store, today) : null), [text, store, today]);
    const valid = parsed && parsed.ok && validateTransactionInput(parsed.input, store).ok;
    const cat = parsed?.input.categoryId ? store.categories.find((c) => c.id === parsed.input.categoryId) : null;
    const acc = parsed ? store.accounts.find((a) => a.id === parsed.input.accountId) : null;

    const save = () => {
        if (!valid) return;
        actions.addTransactions([buildTransaction(parsed.input)]);
        toast.success("Transação adicionada.");
        setText("");
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title="Captura rápida" description='Escreva como falaria: "Mercado 85,90 ontem".' size="sm" initialFocusRef={inputRef}>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    save();
                }}
            >
                <ModalBody>
                    <Field label="Frase" hint="Valor, descrição e, se quiser, a data (hoje, ontem, dia 5, 10/11) e a conta.">
                        {({ id, describedBy }) => <Input id={id} ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} aria-describedby={describedBy} autoComplete="off" placeholder="Ex.: Uber 23,50 ontem" />}
                    </Field>
                    {parsed && (
                        <Preview aria-live="polite" aria-label="Prévia">
                            <dt>Tipo</dt>
                            <dd>
                                <Badge $tone={parsed.input.type === "income" ? "income" : "expense"}>{TYPE_LABEL[parsed.input.type]}</Badge>
                            </dd>
                            <dt>Valor</dt>
                            <dd>{parsed.input.amountCents ? <Amount cents={parsed.input.amountCents} type={parsed.input.type} /> : "—"}</dd>
                            <dt>Descrição</dt>
                            <dd>{parsed.input.description || "—"}</dd>
                            <dt>Categoria</dt>
                            <dd>
                                <CategoryChip category={cat} />
                                {!parsed.guessedCategory && <span className="sr-only"> (não identificada)</span>}
                            </dd>
                            <dt>Data</dt>
                            <dd>
                                {formatDateBR(parsed.input.date)} {parsed.input.status === "pending" && <Badge $tone="warning">Pendente</Badge>}
                            </dd>
                            <dt>Conta</dt>
                            <dd>{acc?.name}</dd>
                        </Preview>
                    )}
                    {parsed?.notes.length > 0 && (
                        <p role="status" style={{ marginTop: 8, fontSize: "0.8125rem" }}>
                            {parsed.notes.join(" ")}
                        </p>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        disabled={!parsed}
                        onClick={() => {
                            onClose();
                            openTransaction({ mode: "create", defaults: parsed?.input });
                        }}
                    >
                        Editar detalhes
                    </Button>
                    <Button type="submit" variant="primary" disabled={!valid}>
                        Confirmar e salvar
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

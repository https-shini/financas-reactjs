import styled from "styled-components";
import { ArrowLeftRight, Repeat, Copy, Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Amount, Badge, CategoryIcon, Checkbox, Menu } from "../../components/ui";
import { UNCATEGORIZED } from "../../domain/selectors";
import { formatDateBR } from "../../domain/dates";

const Li = styled.li`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px 0 0;
    border-radius: ${(p) => p.theme.radius.md};
    @media (max-width: 374px) {
        gap: 2px;
        padding-right: 0;
    }
    &:hover {
        background: ${(p) => p.theme.colors.bgHover};
    }
    ${(p) => p.$selected && `background: ${p.theme.colors.primarySoft};`}
`;

const Main = styled.button`
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 8px;
    text-align: left;
    border-radius: ${(p) => p.theme.radius.md};
    /* Telas muito estreitas: mais espaço para a descrição. */
    @media (max-width: 374px) {
        gap: 8px;
        padding: 8px 4px;
    }
`;

const Texts = styled.span`
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
    .desc {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .meta {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

const TransferIcon = styled.span`
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
    color: ${(p) => p.theme.colors.textSecondary};
    background: ${(p) => p.theme.colors.bgSurface};
`;

const Right = styled.span`
    display: grid;
    justify-items: end;
    gap: 2px;
    flex-shrink: 0;
`;

/**
 * Linha de transação. Clique abre a edição. Menu com editar, duplicar, marcar pago/pendente e excluir.
 */
export function TransactionRow({ tx, categories, accounts, today, onOpen, onDuplicate, onToggleStatus, onDelete, selectable, selected, onSelect, showDate = false }) {
    const cat = tx.categoryId ? categories.get(tx.categoryId) ?? UNCATEGORIZED : UNCATEGORIZED;
    const acc = accounts.get(tx.accountId);
    const to = tx.toAccountId ? accounts.get(tx.toAccountId) : null;
    const overdue = tx.status === "pending" && tx.date < today;
    const statusLabel = tx.type === "income" ? "recebido" : "pago";

    return (
        <Li $selected={selected}>
            {selectable && (
                <label style={{ display: "grid", placeItems: "center", width: 40, height: 44, flexShrink: 0 }}>
                    <span className="sr-only">Selecionar {tx.description}</span>
                    <Checkbox checked={selected} onChange={(e) => onSelect?.(tx.id, e.target.checked)} />
                </label>
            )}
            <Main type="button" onClick={() => onOpen(tx)} aria-label={`${tx.description}, ${formatDateBR(tx.date)}. Abrir para editar`}>
                {tx.type === "transfer" ? (
                    <TransferIcon aria-hidden="true">
                        <ArrowLeftRight size={18} />
                    </TransferIcon>
                ) : (
                    <CategoryIcon category={cat} />
                )}
                <Texts>
                    <span className="desc">{tx.description}</span>
                    <span className="meta">
                        {showDate && <span>{formatDateBR(tx.date, "dd/MM")}</span>}
                        {tx.type === "transfer" ? (
                            <span>
                                {acc?.name} → {to?.name}
                            </span>
                        ) : (
                            <span>
                                {cat.name} · {acc?.name}
                            </span>
                        )}
                        {tx.installment && (
                            <Badge>
                                {tx.installment.n}/{tx.installment.of}
                            </Badge>
                        )}
                        {tx.recurrenceId && (
                            <span title="Recorrente" style={{ display: "inline-flex" }}>
                                <Repeat size={12} aria-hidden="true" />
                                <span className="sr-only">Recorrente</span>
                            </span>
                        )}
                        {tx.status === "pending" && <Badge $tone={overdue ? "expense" : "warning"}>{overdue ? "Atrasada" : "Pendente"}</Badge>}
                    </span>
                </Texts>
                <Right>
                    <Amount cents={tx.amountCents} type={tx.type} />
                </Right>
            </Main>
            {onDelete && (
                <Menu
                    label={`Ações para ${tx.description}`}
                    items={[
                        { label: "Editar", icon: Pencil, onClick: () => onOpen(tx) },
                        { label: "Duplicar", icon: Copy, onClick: () => onDuplicate(tx) },
                        onToggleStatus && {
                            label: tx.status === "pending" ? `Marcar como ${statusLabel}` : "Marcar como pendente",
                            icon: tx.status === "pending" ? CheckCircle2 : Clock,
                            onClick: () => onToggleStatus(tx),
                        },
                        { label: "Excluir", icon: Trash2, danger: true, onClick: () => onDelete(tx) },
                    ]}
                />
            )}
        </Li>
    );
}

export const TxList = styled.ul`
    list-style: none;
    display: grid;
    gap: 2px;
`;

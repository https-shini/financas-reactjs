import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Bell, CalendarClock, CheckCircle2 } from "lucide-react";
import { IconButton, Amount, floatingSurface, interactiveItem } from "../../components/ui";
import { useFinance } from "../../state/contexts";
import { upcomingItems } from "../../domain/selectors";
import { formatDateBR } from "../../domain/dates";

const Wrap = styled.div`
    position: relative;
    display: inline-block;
`;

const Dot = styled.span`
    position: absolute;
    top: 4px;
    right: 3px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: ${(p) => p.theme.radius.full};
    background: ${(p) => (p.$alert ? p.theme.colors.error : p.theme.colors.primary)};
    color: ${(p) => (p.$alert ? p.theme.colors.bg : p.theme.colors.onPrimary)};
    font-family: ${(p) => p.theme.fonts.mono};
    font-size: 10px;
    font-weight: 700;
    line-height: 16px;
    text-align: center;
    pointer-events: none;
`;

const Panel = styled.div`
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: ${(p) => p.theme.z.dropdown};
    width: min(340px, calc(100vw - 24px));
    ${floatingSurface}
    overflow: hidden;
    header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 12px 14px;
        border-bottom: 1px solid ${(p) => p.theme.colors.border};
        h2 {
            font-size: ${(p) => p.theme.fontSize.md};
            font-weight: ${(p) => p.theme.fontWeight.semibold};
        }
        span {
            font-size: ${(p) => p.theme.fontSize.sm};
            color: ${(p) => p.theme.colors.textMuted};
        }
    }
    ul {
        list-style: none;
        max-height: 320px;
        overflow-y: auto;
    }
    li + li {
        border-top: 1px solid ${(p) => p.theme.colors.border};
    }
    li a {
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 10px 14px;
        text-decoration: none;
        ${interactiveItem}
        color: ${(p) => p.theme.colors.text};
    }
    .ic {
        color: ${(p) => p.theme.colors.textMuted};
        flex-shrink: 0;
    }
    .txt {
        flex: 1;
        min-width: 0;
        display: grid;
        font-size: ${(p) => p.theme.fontSize.md};
    }
    .desc {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .when {
        font-size: ${(p) => p.theme.fontSize.sm};
        color: ${(p) => p.theme.colors.textMuted};
    }
    .when.late {
        color: ${(p) => p.theme.colors.expense};
    }
    .empty {
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 16px 14px;
        color: ${(p) => p.theme.colors.textSecondary};
        font-size: ${(p) => p.theme.fontSize.md};
    }
    footer a {
        display: block;
        padding: 10px 14px;
        border-top: 1px solid ${(p) => p.theme.colors.border};
        font-size: ${(p) => p.theme.fontSize.sm};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        color: ${(p) => p.theme.colors.primaryText};
        text-decoration: none;
    }
`;

/**
 * Notificações do header: contas atrasadas e que vencem nos próximos 7 dias (somente leitura).
 * Painel não modal: Esc ou clique fora fecham; o foco volta ao sino.
 */
export function Notifications() {
    const { store, today } = useFinance();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const btnRef = useRef(null);
    const id = useId();
    const items = upcomingItems(store, today, 7);
    const late = items.filter((i) => i.overdue).length;

    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
        const onKey = (e) => {
            if (e.key === "Escape") {
                setOpen(false);
                btnRef.current?.focus();
            }
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const label = items.length ? `Notificações: ${items.length} aviso(s)${late ? `, ${late} atrasado(s)` : ""}` : "Notificações: nenhum aviso";
    return (
        <Wrap ref={wrapRef}>
            <IconButton ref={btnRef} icon={Bell} size="sm" label={label} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen((v) => !v)} />
            {items.length > 0 && (
                <Dot $alert={late > 0} aria-hidden="true">
                    {items.length > 9 ? "9+" : items.length}
                </Dot>
            )}
            {open && (
                <Panel id={id} role="region" aria-label="Notificações">
                    <header>
                        <h2>Notificações</h2>
                        <span>Atrasadas e próximos 7 dias</span>
                    </header>
                    {items.length ? (
                        <ul>
                            {items.slice(0, 8).map((it) => (
                                <li key={it.id}>
                                    <Link to="/planejamento/vencimentos" onClick={() => setOpen(false)}>
                                        <CalendarClock size={16} className="ic" aria-hidden="true" />
                                        <span className="txt">
                                            <span className="desc">{it.description}</span>
                                            <span className={`when${it.overdue ? " late" : ""}`}>
                                                {it.overdue ? `Atrasada desde ${formatDateBR(it.date, "dd/MM")}` : it.daysUntil === 0 ? "Vence hoje" : `Vence ${formatDateBR(it.date, "dd/MM")} · em ${it.daysUntil} dia(s)`}
                                            </span>
                                        </span>
                                        {typeof it.amountCents === "number" && <Amount cents={it.amountCents} type={it.direction === "in" ? "income" : it.direction === "out" ? "expense" : "transfer"} private />}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="empty">
                            <CheckCircle2 size={16} aria-hidden="true" /> Nenhuma conta atrasada ou vencendo nesta semana.
                        </p>
                    )}
                    <footer>
                        <Link to="/planejamento/vencimentos" onClick={() => setOpen(false)}>
                            Ver todos os vencimentos
                        </Link>
                    </footer>
                </Panel>
            )}
        </Wrap>
    );
}

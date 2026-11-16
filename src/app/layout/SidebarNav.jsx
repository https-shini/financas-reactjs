import { Link, useLocation } from "react-router-dom";
import styled, { css } from "styled-components";
import { NAV_GROUPS, activeNavId } from "../navigation";
import { typeRole, interactiveItem } from "../../components/ui";
import { useFinance } from "../../state/contexts";
import { upcomingItems } from "../../domain/selectors";

const Group = styled.div`
    display: grid;
    gap: ${(p) => p.theme.layout.sidebarItemGap};
    & + & {
        margin-top: ${(p) => p.theme.layout.sidebarSectionGap};
    }
`;

const GroupLabel = styled.p`
    ${typeRole("overline")}
    text-transform: uppercase;
    color: ${(p) => p.theme.colors.textMuted};
    padding: 12px 10px 6px;
    ${(p) =>
        p.$collapsed &&
        css`
            padding: 10px 0 6px;
            &::before {
                content: "";
                display: block;
                height: 1px;
                margin: 0 14px;
                background: ${p.theme.colors.border};
            }
        `}
`;

// Item de navegação: dimensões vêm de theme.layout; cores e estados vêm do padrão `interactiveItem`.
const ItemLink = styled(Link)`
    position: relative;
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.space(2.5)};
    min-height: ${(p) => p.theme.layout.sidebarItemHeight};
    padding-inline: ${(p) => p.theme.layout.sidebarItemPaddingInline};
    border-radius: ${(p) => p.theme.radius.md};
    text-decoration: none;
    font-weight: ${(p) => p.theme.fontWeight.medium};
    font-size: 0.84375rem;
    white-space: nowrap;
    overflow: hidden;
    ${interactiveItem}
    ${(p) =>
        p.$collapsed &&
        css`
            justify-content: center;
            padding: 0;
        `}
    svg {
        flex-shrink: 0;
        width: ${(p) => p.theme.layout.sidebarIcon};
        height: ${(p) => p.theme.layout.sidebarIcon};
    }
    .label {
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .count {
        margin-left: auto;
        min-width: 20px;
        padding: 1px 6px;
        border-radius: ${(p) => p.theme.radius.full};
        background: ${(p) => p.theme.colors.bgHover};
        color: ${(p) => p.theme.colors.textSecondary};
        font-size: ${(p) => p.theme.fontSize.xs};
        font-variant-numeric: tabular-nums;
        text-align: center;
    }
    .count.alert {
        background: ${(p) => p.theme.colors.expenseSoft};
        color: ${(p) => p.theme.colors.expense};
    }
    .dot {
        position: absolute;
        top: 6px;
        right: 9px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: ${(p) => p.theme.colors.expense};
    }
    ${(p) => p.theme.media.coarse} {
        min-height: ${(p) => p.theme.layout.touchTarget};
    }
`;

/** Navegação agrupada da sidebar (e do drawer no celular). collapsed: só ícones, com rótulo acessível e dica. */
export function SidebarNav({ collapsed = false, onNavigate, label = "Navegação principal" }) {
    const location = useLocation();
    const active = activeNavId(location);
    const { store, today } = useFinance();
    // Contador de "Contas a pagar e receber": atrasadas + próximos 7 dias (somente leitura).
    const bills = upcomingItems(store, today, 7);
    const counts = { bills: { n: bills.length, alert: bills.some((b) => b.overdue) } };
    return (
        <nav aria-label={label}>
            {NAV_GROUPS.map((g) => (
                <Group key={g.id} role="group" aria-labelledby={`nav-g-${g.id}-${label.length}`}>
                    <GroupLabel id={`nav-g-${g.id}-${label.length}`} $collapsed={collapsed}>
                        <span className={collapsed ? "sr-only" : undefined}>{g.label}</span>
                    </GroupLabel>
                    {g.items.map((it) => {
                        const c = it.badge ? counts[it.badge] : null;
                        const countLabel = c?.n ? ` (${c.n} ${c.n === 1 ? "pendente" : "pendentes"}${c.alert ? ", há atrasadas" : ""})` : "";
                        return (
                            <ItemLink
                                key={it.id}
                                to={it.to}
                                $collapsed={collapsed}
                                aria-current={active === it.id ? "page" : undefined}
                                aria-label={collapsed || countLabel ? `${it.label}${countLabel}` : undefined}
                                title={collapsed ? it.label : undefined}
                                onClick={onNavigate}
                            >
                                <it.icon size={18} aria-hidden="true" />
                                {!collapsed && <span className="label">{it.label}</span>}
                                {c?.n > 0 &&
                                    (collapsed ? (
                                        <span className="dot" aria-hidden="true" />
                                    ) : (
                                        <span className={`count${c.alert ? " alert" : ""}`} aria-hidden="true">
                                            {c.n}
                                        </span>
                                    ))}
                            </ItemLink>
                        );
                    })}
                </Group>
            ))}
        </nav>
    );
}

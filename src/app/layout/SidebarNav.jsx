import { Link, useLocation } from "react-router-dom";
import styled, { css } from "styled-components";
import { NAV_GROUPS, activeNavId } from "../navigation";
import { interactiveItem } from "../../components/ui";
import { useFinance } from "../../state/contexts";
import { upcomingItems } from "../../domain/selectors";

/*
 * Navegação agrupada (sidebar do desktop e drawer do celular).
 * Estrutura no padrão do GCruz Lab Platform: rótulo de seção em caixa alta espaçada,
 * itens de 40 px, item ativo com superfície própria, ícone na cor de destaque e
 * barra indicadora encostada na borda esquerda da sidebar.
 */

const Group = styled.div`
    display: grid;
    gap: ${(p) => p.theme.layout.sidebarItemGap};
    & + & {
        margin-top: ${(p) => p.theme.layout.sidebarSectionGap};
    }
`;

const GroupLabel = styled.p`
    margin: 0 0 6px;
    padding-inline: ${(p) => p.theme.layout.sidebarSectionLabelInset};
    font-size: 0.65625rem;
    font-weight: ${(p) => p.theme.fontWeight.semibold};
    letter-spacing: 0.12em;
    line-height: 1.6;
    text-transform: uppercase;
    color: ${(p) => p.theme.colors.textMuted};
    ${(p) =>
        p.$collapsed &&
        css`
            padding: 0;
            margin-bottom: 8px;
            &::before {
                content: "";
                display: block;
                height: 1px;
                margin: 0 10px;
                background: ${p.theme.colors.border};
            }
        `}
`;

const ItemLink = styled(Link)`
    position: relative;
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.space(3)};
    min-height: ${(p) => p.theme.layout.sidebarItemHeight};
    padding-inline: ${(p) => p.theme.layout.sidebarItemPaddingInline};
    border-radius: ${(p) => p.theme.radius.md};
    text-decoration: none;
    font-size: ${(p) => p.theme.fontSize.md};
    font-weight: ${(p) => p.theme.fontWeight.medium};
    white-space: nowrap;
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
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    /* Barra indicadora do item ativo, encostada na borda esquerda da sidebar. */
    &[aria-current="page"]::before {
        content: "";
        position: absolute;
        left: calc(-1 * ${(p) => p.theme.layout.sidebarPaddingInline});
        top: 8px;
        bottom: 8px;
        width: 3px;
        border-radius: 0 3px 3px 0;
        background: ${(p) => p.theme.colors.indicator};
    }
    .count {
        margin-left: auto;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        display: inline-grid;
        place-items: center;
        border-radius: ${(p) => p.theme.radius.sm};
        border: 1px solid ${(p) => p.theme.colors.border};
        background: ${(p) => p.theme.colors.bgSurface};
        color: ${(p) => p.theme.colors.textSecondary};
        font-family: ${(p) => p.theme.fonts.mono};
        font-size: ${(p) => p.theme.fontSize.xs};
        font-weight: ${(p) => p.theme.fontWeight.medium};
    }
    .count.alert {
        border-color: transparent;
        background: ${(p) => p.theme.colors.expenseSoft};
        color: ${(p) => p.theme.colors.expense};
    }
    .dot {
        position: absolute;
        top: 8px;
        right: 10px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: ${(p) => p.theme.colors.expense};
    }
    ${(p) => p.theme.media.coarse} {
        min-height: ${(p) => p.theme.layout.touchTarget};
    }
`;

/** Lista de navegação agrupada. collapsed: só ícones (com rótulo acessível e dica). */
export function SidebarNav({ collapsed = false, onNavigate, label = "Navegação principal" }) {
    const location = useLocation();
    const active = activeNavId(location);
    const { store, today } = useFinance();
    // Contador de "A pagar e receber": atrasadas + próximos 7 dias (somente leitura).
    const bills = upcomingItems(store, today, 7);
    const counts = { bills: { n: bills.length, alert: bills.some((b) => b.overdue) } };
    const idp = label === "Menu" ? "m" : "s";
    return (
        <nav aria-label={label}>
            {NAV_GROUPS.map((g) => (
                <Group key={g.id} role="group" aria-labelledby={`nav-g-${idp}-${g.id}`}>
                    <GroupLabel id={`nav-g-${idp}-${g.id}`} $collapsed={collapsed}>
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

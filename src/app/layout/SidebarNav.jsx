import { Link, useLocation } from "react-router-dom";
import styled, { css } from "styled-components";
import { NAV_GROUPS, activeNavId } from "../navigation";
import { typeRole } from "../../components/ui";

const Group = styled.div`
    display: grid;
    gap: 2px;
    & + & {
        margin-top: ${(p) => p.theme.space(5)};
    }
`;

const GroupLabel = styled.p`
    ${typeRole("overline")}
    font-family: ${(p) => p.theme.fonts.mono};
    text-transform: uppercase;
    color: ${(p) => p.theme.colors.textMuted};
    padding: 0 12px 8px;
    ${(p) =>
        p.$collapsed &&
        css`
            padding: 0 0 8px;
            &::before {
                content: "";
                display: block;
                height: 1px;
                margin: 0 14px;
                background: ${p.theme.colors.border};
            }
        `}
`;

const ItemLink = styled(Link)`
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 36px;
    padding: 0 10px;
    border-radius: ${(p) => p.theme.radius.sm};
    color: ${(p) => p.theme.colors.textSecondary};
    text-decoration: none;
    font-weight: ${(p) => p.theme.fontWeight.medium};
    font-size: ${(p) => p.theme.fontSize.md};
    white-space: nowrap;
    overflow: hidden;
    transition: background ${(p) => p.theme.motion.fast}, color ${(p) => p.theme.motion.fast};
    ${(p) =>
        p.$collapsed &&
        css`
            justify-content: center;
            padding: 0;
        `}
    svg {
        flex-shrink: 0;
        color: ${(p) => p.theme.colors.textMuted};
        transition: color ${(p) => p.theme.motion.fast};
    }
    &:hover {
        background: ${(p) => p.theme.colors.bgHover};
        color: ${(p) => p.theme.colors.text};
        svg {
            color: ${(p) => p.theme.colors.text};
        }
    }
    &:focus-visible {
        outline: 2px solid ${(p) => p.theme.colors.focus};
        outline-offset: -2px;
    }
    /* Ativo: fundo Emerald Surface + indicador lateral Emerald (não depende só da cor: há o indicador e o peso). */
    &[aria-current="page"] {
        background: ${(p) => p.theme.colors.primarySoft};
        color: ${(p) => p.theme.colors.text};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        svg {
            color: ${(p) => p.theme.colors.indicator};
        }
        &::before {
            content: "";
            position: absolute;
            left: 0;
            top: 8px;
            bottom: 8px;
            width: 3px;
            border-radius: 0 3px 3px 0;
            background: ${(p) => p.theme.colors.indicator};
        }
    }
    ${(p) => p.theme.media.coarse} {
        min-height: 44px;
    }
`;

/** Navegação agrupada da sidebar (e do drawer no celular). collapsed: só ícones, com rótulo acessível e dica. */
export function SidebarNav({ collapsed = false, onNavigate, label = "Navegação principal" }) {
    const location = useLocation();
    const active = activeNavId(location);
    return (
        <nav aria-label={label}>
            {NAV_GROUPS.map((g) => (
                <Group key={g.id} role="group" aria-labelledby={`nav-g-${g.id}-${label.length}`}>
                    <GroupLabel id={`nav-g-${g.id}-${label.length}`} $collapsed={collapsed}>
                        <span className={collapsed ? "sr-only" : undefined}>{g.label}</span>
                    </GroupLabel>
                    {g.items.map((it) => (
                        <ItemLink
                            key={it.id}
                            to={it.to}
                            $collapsed={collapsed}
                            aria-current={active === it.id ? "page" : undefined}
                            aria-label={collapsed ? it.label : undefined}
                            title={collapsed ? it.label : undefined}
                            onClick={onNavigate}
                        >
                            <it.icon size={18} aria-hidden="true" />
                            {!collapsed && it.label}
                        </ItemLink>
                    ))}
                </Group>
            ))}
        </nav>
    );
}

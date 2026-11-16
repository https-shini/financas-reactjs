import { Link, useLocation } from "react-router-dom";
import styled, { css } from "styled-components";
import { NAV_GROUPS, activeNavId } from "../navigation";
import { typeRole } from "../../components/ui";

const Group = styled.div`
    display: grid;
    gap: 2px;
    & + & {
        margin-top: ${(p) => p.theme.space(3)};
    }
`;

const GroupLabel = styled.p`
    ${typeRole("overline")}
    text-transform: uppercase;
    color: ${(p) => p.theme.colors.textMuted};
    padding: 0 12px 6px;
    ${(p) =>
        p.$collapsed &&
        css`
            text-align: center;
            padding: 0 0 6px;
            &::before {
                content: "";
                display: block;
                height: 1px;
                margin: 0 20px;
                background: ${p.theme.colors.border};
            }
        `}
`;

const ItemLink = styled(Link)`
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 36px;
    padding: 0 12px;
    border-radius: ${(p) => p.theme.radius.md};
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
    &[aria-current="page"] {
        background: ${(p) => p.theme.colors.bgSurface};
        box-shadow: inset 0 0 0 1px ${(p) => p.theme.colors.border}, ${(p) => p.theme.shadows.sm};
        color: ${(p) => p.theme.colors.text};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        svg {
            color: ${(p) => p.theme.colors.indicator};
        }
        &::before {
            content: "";
            position: absolute;
            left: 0;
            top: 9px;
            bottom: 9px;
            width: 3px;
            border-radius: 0 3px 3px 0;
            background: ${(p) => p.theme.colors.indicator};
        }
    }
    ${(p) => p.theme.media.coarse} {
        min-height: 44px;
    }
`;

/** Lista de navegação agrupada. collapsed: só ícones (com rótulo acessível e dica). */
export function SidebarNav({ collapsed = false, onNavigate, label = "Navegação principal" }) {
    const location = useLocation();
    const active = activeNavId(location);
    return (
        <nav aria-label={label}>
            {NAV_GROUPS.map((g) => (
                <Group key={g.id} role="group" aria-labelledby={`nav-g-${g.id}`}>
                    <GroupLabel id={`nav-g-${g.id}`} $collapsed={collapsed}>
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

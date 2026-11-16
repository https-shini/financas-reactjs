import styled from "styled-components";
import { NavLink } from "react-router-dom";

const Bar = styled.div`
    display: flex;
    gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    margin-bottom: ${(p) => p.theme.space(5)};
    &::-webkit-scrollbar {
        display: none;
    }
`;

const TabStyle = styled.button`
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 12px;
    white-space: nowrap;
    font-weight: 500;
    font-size: ${(p) => p.theme.fontSize.md};
    color: ${(p) => p.theme.colors.textSecondary};
    text-decoration: none;
    border-radius: 8px 8px 0 0;
    &:hover {
        color: ${(p) => p.theme.colors.text};
        background: ${(p) => p.theme.colors.bgHover};
    }
    &[aria-selected="true"],
    &.active {
        color: ${(p) => p.theme.colors.text};
        font-weight: 600;
    }
    &[aria-selected="true"]::after,
    &.active::after {
        content: "";
        position: absolute;
        left: 8px;
        right: 8px;
        bottom: -1px;
        height: 2px;
        border-radius: 2px;
        background: ${(p) => p.theme.colors.primary};
    }
`;

/** Abas como rotas (navegação). tabs: [{ to, label, icon, badge }] */
export function RouteTabs({ tabs, label }) {
    return (
        <Bar as="nav" aria-label={label}>
            {tabs.map((t) => (
                <TabStyle as={NavLink} key={t.to} to={t.to} end={t.end}>
                    {t.icon && <t.icon size={16} aria-hidden="true" />}
                    {t.label}
                    {t.badge}
                </TabStyle>
            ))}
        </Bar>
    );
}

/** Abas locais (padrão tablist, setas navegam). */
export function Tabs({ tabs, value, onChange, label, idPrefix = "tab" }) {
    const onKey = (e, i) => {
        if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
        e.preventDefault();
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        onChange(next.value);
        document.getElementById(`${idPrefix}-${next.value}`)?.focus();
    };
    return (
        <Bar role="tablist" aria-label={label}>
            {tabs.map((t, i) => (
                <TabStyle
                    key={t.value}
                    id={`${idPrefix}-${t.value}`}
                    type="button"
                    role="tab"
                    aria-selected={value === t.value}
                    aria-controls={`${idPrefix}-panel-${t.value}`}
                    tabIndex={value === t.value ? 0 : -1}
                    onClick={() => onChange(t.value)}
                    onKeyDown={(e) => onKey(e, i)}
                >
                    {t.label}
                </TabStyle>
            ))}
        </Bar>
    );
}

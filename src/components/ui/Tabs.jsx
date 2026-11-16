import styled from "styled-components";
import { NavLink } from "react-router-dom";

// Abas em pílula (inspiradas em filtros de catálogo): inativas contornadas, ativa preenchida em Aurum.
const Bar = styled.div`
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 2px 2px 6px;
    margin: -2px -2px ${(p) => p.theme.space(5)};
    &::-webkit-scrollbar {
        display: none;
    }
`;

const TabStyle = styled.button`
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 16px;
    white-space: nowrap;
    font-weight: 600;
    font-size: ${(p) => p.theme.fontSize.sm};
    color: ${(p) => p.theme.colors.textSecondary};
    text-decoration: none;
    border-radius: ${(p) => p.theme.radius.full};
    border: 1px solid ${(p) => p.theme.colors.borderStrong};
    background: ${(p) => p.theme.colors.bgInput};
    transition: color ${(p) => p.theme.motion.fast}, background ${(p) => p.theme.motion.fast}, border-color ${(p) => p.theme.motion.fast}, transform 90ms;
    &:hover {
        color: ${(p) => p.theme.colors.text};
        border-color: ${(p) => p.theme.colors.textMuted};
    }
    &:active {
        transform: translateY(1px);
    }
    &[aria-selected="true"],
    &.active {
        color: ${(p) => p.theme.colors.onAccent};
        background: ${(p) => p.theme.colors.accent};
        border-color: transparent;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 2px 0 ${(p) => p.theme.colors.indicator};
    }
    @media (pointer: coarse) {
        min-height: 44px;
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

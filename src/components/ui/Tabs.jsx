import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { NavLink, useLocation } from "react-router-dom";

// Abas segmentadas (padrão Nexus): trilho em superfície secundária; aba ativa elevada com sombra leve.
const Bar = styled.div`
    display: flex;
    gap: 2px;
    width: fit-content;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 2px;
    border-radius: 8px;
    background: ${(p) => p.theme.colors.bgSurface};
    border: 1px solid ${(p) => p.theme.colors.border};
    margin-bottom: ${(p) => p.theme.space(5)};
    scroll-behavior: smooth;
    &::-webkit-scrollbar {
        display: none;
    }
    /* Esmaece as bordas quando há abas fora da área visível (indica rolagem). */
    &[data-fade="end"] {
        mask-image: linear-gradient(to right, #000 calc(100% - 32px), transparent);
    }
    &[data-fade="start"] {
        mask-image: linear-gradient(to left, #000 calc(100% - 32px), transparent);
    }
    &[data-fade="both"] {
        mask-image: linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 32px), transparent);
    }
    @media (prefers-reduced-motion: reduce) {
        scroll-behavior: auto;
    }
`;

const TabStyle = styled.button`
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    padding: 0 10px;
    white-space: nowrap;
    font-weight: ${(p) => p.theme.fontWeight.medium};
    font-size: 0.78125rem;
    color: ${(p) => p.theme.colors.textSecondary};
    text-decoration: none;
    border-radius: 6px;
    transition: color ${(p) => p.theme.motion.fast}, background ${(p) => p.theme.motion.fast};
    &:hover {
        color: ${(p) => p.theme.colors.text};
    }
    &:focus-visible {
        outline: 2px solid ${(p) => p.theme.colors.focus};
        outline-offset: -2px;
    }
    /* Ativa: superfície elevada + sombra leve + texto forte (não depende só da cor). */
    &[aria-selected="true"],
    &.active {
        color: ${(p) => p.theme.colors.text};
        background: ${(p) => p.theme.colors.bgElevated};
        box-shadow: 0 1px 2px rgba(15, 15, 17, 0.08), inset 0 0 0 1px ${(p) => p.theme.colors.border};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
    }
    svg {
        color: ${(p) => p.theme.colors.textMuted};
    }
    &.active svg,
    &[aria-selected="true"] svg {
        color: ${(p) => p.theme.colors.indicator};
    }
    @media (pointer: coarse) {
        min-height: 40px;
    }
`;

/**
 * Mantém a aba ativa visível (rola horizontalmente até ela) e marca as bordas com rolagem pendente.
 * Só rola o próprio trilho — nunca a página.
 */
function useTabStrip(activeKey) {
    const ref = useRef(null);
    const [fade, setFade] = useState("none");
    const update = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const start = el.scrollLeft > 4;
        const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
        setFade(start && end ? "both" : start ? "start" : end ? "end" : "none");
    }, []);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const active = el.querySelector('.active, [aria-selected="true"]');
        if (active && el.scrollWidth > el.clientWidth) {
            // Coordenadas relativas ao próprio trilho (offsetLeft seria relativo à página).
            const sr = el.getBoundingClientRect();
            const ar = active.getBoundingClientRect();
            const fullyVisible = ar.left >= sr.left && ar.right <= sr.right;
            if (!fullyVisible) el.scrollTo({ left: Math.max(0, el.scrollLeft + (ar.left - sr.left) - (sr.width - ar.width) / 2) });
        }
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [activeKey, update]);
    return { ref, onScroll: update, "data-fade": fade };
}

/** Abas como rotas (navegação). tabs: [{ to, label, icon, badge }] */
export function RouteTabs({ tabs, label }) {
    const { pathname } = useLocation();
    const strip = useTabStrip(pathname);
    return (
        <Bar as="nav" aria-label={label} {...strip}>
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
    const strip = useTabStrip(value);
    return (
        <Bar role="tablist" aria-label={label} {...strip}>
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

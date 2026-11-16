import styled from "styled-components";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { useFinance, useFinanceActions } from "../../state/contexts";

const OPTIONS = [
    { value: "light", label: "Tema claro", icon: Sun },
    { value: "dark", label: "Tema escuro", icon: Moon },
    { value: "system", label: "Tema do sistema", icon: MonitorSmartphone },
];

const Wrap = styled.div`
    display: ${(p) => (p.$vertical ? "grid" : "grid")};
    grid-template-columns: ${(p) => (p.$vertical ? "1fr" : "repeat(3, 1fr)")};
    gap: 2px;
    padding: 3px;
    border-radius: ${(p) => p.theme.radius.md};
    background: ${(p) => p.theme.colors.bgSurface};
    border: 1px solid ${(p) => p.theme.colors.border};
`;

const Opt = styled.button`
    display: grid;
    place-items: center;
    height: 32px;
    border-radius: 8px;
    color: ${(p) => p.theme.colors.textMuted};
    transition: background ${(p) => p.theme.motion.fast}, color ${(p) => p.theme.motion.fast};
    &:hover {
        color: ${(p) => p.theme.colors.text};
    }
    &[aria-checked="true"] {
        background: ${(p) => p.theme.colors.bgElevated};
        color: ${(p) => p.theme.colors.brand};
        box-shadow: ${(p) => p.theme.shadows.sm};
    }
    ${(p) => p.theme.media.coarse} {
        height: 40px;
    }
`;

/** Seletor de tema compacto (claro, escuro, sistema), com setas do teclado. */
export function ThemeSwitcher({ vertical = false }) {
    const { store } = useFinance();
    const { updateSettings } = useFinanceActions();
    const current = store.settings.theme;
    const onKey = (e, i) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault();
        const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
        const next = OPTIONS[(i + dir + OPTIONS.length) % OPTIONS.length];
        updateSettings({ theme: next.value });
        e.currentTarget.parentElement.querySelectorAll("button")[OPTIONS.indexOf(next)]?.focus();
    };
    return (
        <Wrap role="radiogroup" aria-label="Tema" $vertical={vertical}>
            {OPTIONS.map((o, i) => (
                <Opt
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={current === o.value}
                    aria-label={o.label}
                    title={o.label}
                    tabIndex={current === o.value ? 0 : -1}
                    onClick={() => updateSettings({ theme: o.value })}
                    onKeyDown={(e) => onKey(e, i)}
                >
                    <o.icon size={16} aria-hidden="true" />
                </Opt>
            ))}
        </Wrap>
    );
}

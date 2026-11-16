import { useEffect, useId, useRef, useState } from "react";
import styled from "styled-components";
import { MoreHorizontal } from "lucide-react";
import { IconButton } from "./Button";
import { floatingSurface, interactiveItem } from "./interaction";

const Wrap = styled.div`
    position: relative;
    display: inline-block;
`;

const List = styled.div`
    position: absolute;
    ${(p) => (p.$up ? "bottom: calc(100% + 4px);" : "top: calc(100% + 4px);")}
    ${(p) => (p.$align === "left" ? "left: 0;" : "right: 0;")}
    z-index: ${(p) => p.theme.z.dropdown};
    min-width: 200px;
    padding: 4px;
    ${floatingSurface}
    border-radius: ${(p) => p.theme.radius.md};
`;

const Item = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 36px;
    padding: 0 10px;
    border-radius: ${(p) => p.theme.radius.sm};
    text-align: left;
    font-size: ${(p) => p.theme.fontSize.md};
    ${interactiveItem}
    color: ${(p) => (p.$danger ? p.theme.colors.expense : p.theme.colors.text)};
    /* Navegação por setas: o item focado recebe a mesma camada do hover. */
    &:focus-visible {
        background: ${(p) => p.theme.colors.interactiveHover};
    }
    ${(p) =>
        p.$danger &&
        `
        svg { color: currentColor; }
        &:hover { color: ${p.theme.colors.expense}; background: ${p.theme.colors.expenseSoft}; }
    `}
    @media (pointer: coarse) {
        min-height: 44px;
    }
`;

/**
 * Menu de ações (botão "⋯"). items: [{ label, icon, onClick, danger, disabled }]
 * Teclado: setas navegam, Esc fecha, Enter ativa.
 */
export function Menu({ items, label = "Mais ações", icon = MoreHorizontal, align = "right", trigger, size = "sm" }) {
    const [open, setOpen] = useState(false);
    const [up, setUp] = useState(false);
    const wrapRef = useRef(null);
    const btnRef = useRef(null);
    const id = useId();
    const visible = items.filter(Boolean);

    useEffect(() => {
        if (!open) return undefined;
        const rect = btnRef.current?.getBoundingClientRect();
        if (rect) setUp(window.innerHeight - rect.bottom < 48 * visible.length + 24);
        const onDown = (e) => {
            if (!wrapRef.current?.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
                btnRef.current?.focus();
            }
        };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey, true);
        setTimeout(() => wrapRef.current?.querySelector("[role='menuitem']:not(:disabled)")?.focus(), 0);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey, true);
        };
    }, [open, visible.length]);

    const onListKey = (e) => {
        const nodes = [...wrapRef.current.querySelectorAll("[role='menuitem']:not(:disabled)")];
        const idx = nodes.indexOf(document.activeElement);
        if (e.key === "ArrowDown") {
            e.preventDefault();
            nodes[(idx + 1) % nodes.length]?.focus();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            nodes[(idx - 1 + nodes.length) % nodes.length]?.focus();
        } else if (e.key === "Tab") setOpen(false);
    };

    const toggleProps = {
        ref: btnRef,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": open ? id : undefined,
        onClick: (e) => {
            e.stopPropagation();
            setOpen((v) => !v);
        },
    };

    return (
        <Wrap ref={wrapRef} onClick={(e) => e.stopPropagation()}>
            {trigger ? trigger(toggleProps) : <IconButton icon={icon} label={label} size={size} {...toggleProps} />}
            {open && (
                <List role="menu" id={id} $align={align} $up={up} onKeyDown={onListKey}>
                    {visible.map((it) => (
                        <Item
                            key={it.label}
                            type="button"
                            role="menuitem"
                            $danger={it.danger}
                            disabled={it.disabled}
                            onClick={() => {
                                setOpen(false);
                                it.onClick();
                            }}
                        >
                            {it.icon && <it.icon size={16} aria-hidden="true" />}
                            {it.label}
                        </Item>
                    ))}
                </List>
            )}
        </Wrap>
    );
}

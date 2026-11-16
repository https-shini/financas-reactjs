import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import styled, { css, keyframes } from "styled-components";
import { X } from "lucide-react";
import { IconButton } from "./Button";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0;

const fadeIn = keyframes`from { opacity: 0 } to { opacity: 1 }`;
const rise = keyframes`from { opacity: 0; transform: translateY(12px) scale(0.99) } to { opacity: 1; transform: none }`;
const slideUp = keyframes`from { transform: translateY(100%) } to { transform: none }`;

const Backdrop = styled.div`
    position: fixed;
    inset: 0;
    z-index: ${(p) => p.theme.z.overlay};
    background: ${(p) => p.theme.colors.overlay};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: ${fadeIn} ${(p) => p.theme.motion.base} ease-out;
    ${(p) =>
        p.$sheet &&
        css`
            ${p.theme.media.mobile} {
                align-items: flex-end;
                padding: 0;
            }
        `}
`;

const sizes = { sm: "420px", md: "560px", lg: "720px", xl: "960px" };

const Panel = styled.div`
    position: relative;
    width: 100%;
    max-width: ${(p) => sizes[p.$size] ?? sizes.md};
    max-height: min(90vh, 900px);
    display: flex;
    flex-direction: column;
    background: ${(p) => p.theme.colors.bgElevated};
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.xl};
    box-shadow: ${(p) => p.theme.shadows.overlay};
    animation: ${rise} ${(p) => p.theme.motion.slow} ${(p) => p.theme.motion.easing};
    outline: none;
    ${(p) =>
        p.$sheet &&
        css`
            ${p.theme.media.mobile} {
                max-width: none;
                max-height: 92vh;
                border-radius: ${p.theme.radius.xl} ${p.theme.radius.xl} 0 0;
                border-bottom: 0;
                animation: ${slideUp} ${p.theme.motion.slow} ${p.theme.motion.easing};
                padding-bottom: env(safe-area-inset-bottom);
                &::before {
                    content: "";
                    display: block;
                    width: 40px;
                    height: 4px;
                    border-radius: 2px;
                    background: ${p.theme.colors.borderStrong};
                    margin: 8px auto 0;
                }
            }
        `}
`;

const Header = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px 8px;
    h2 {
        font-size: ${(p) => p.theme.fontSize.lg};
        font-weight: 600;
    }
    p {
        font-size: ${(p) => p.theme.fontSize.sm};
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

export const ModalBody = styled.div`
    padding: 8px 20px 20px;
    overflow-y: auto;
    overscroll-behavior: contain;
    flex: 1;
`;

export const ModalFooter = styled.footer`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px 16px;
    border-top: 1px solid ${(p) => p.theme.colors.border};
    flex-wrap: wrap;
    ${(p) => p.theme.media.mobile} {
        > button {
            flex: 1 1 auto;
        }
    }
`;

/**
 * Diálogo modal acessível. variant="sheet" vira bottom sheet em telas pequenas.
 */
export function Modal({ open, onClose, title, description, children, size = "md", variant = "modal", initialFocusRef, closeOnBackdrop = true }) {
    const titleId = useId();
    const descId = useId();
    const panelRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return undefined;
        const previouslyFocused = document.activeElement;
        openCount += 1;
        document.body.style.overflow = "hidden";
        const t = setTimeout(() => {
            const target = initialFocusRef?.current ?? panelRef.current?.querySelector("[data-autofocus]") ?? panelRef.current?.querySelector(FOCUSABLE) ?? panelRef.current;
            target?.focus();
        }, 20);

        const onKey = (e) => {
            if (!panelRef.current) return;
            // Somente o diálogo mais recente responde (diálogos empilhados).
            const dialogs = document.querySelectorAll("[data-modal-panel]");
            if (dialogs[dialogs.length - 1] !== panelRef.current) return;
            if (e.key === "Escape") {
                e.stopPropagation();
                onCloseRef.current?.();
            } else if (e.key === "Tab") {
                const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement);
                if (!nodes.length) return;
                const first = nodes[0];
                const last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            clearTimeout(t);
            document.removeEventListener("keydown", onKey);
            openCount -= 1;
            if (openCount <= 0) document.body.style.overflow = "";
            if (previouslyFocused && typeof previouslyFocused.focus === "function") previouslyFocused.focus();
        };
    }, [open, initialFocusRef]);

    if (!open) return null;
    const sheet = variant === "sheet";
    return createPortal(
        <Backdrop
            $sheet={sheet}
            onMouseDown={(e) => {
                if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
            }}
        >
            <Panel
                ref={panelRef}
                data-modal-panel
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descId : undefined}
                tabIndex={-1}
                $size={size}
                $sheet={sheet}
            >
                <Header>
                    <div>
                        <h2 id={titleId}>{title}</h2>
                        {description && <p id={descId}>{description}</p>}
                    </div>
                    <IconButton icon={X} label="Fechar" onClick={onClose} />
                </Header>
                {children}
            </Panel>
        </Backdrop>,
        document.body
    );
}

/** Bottom sheet: diálogo ancorado embaixo no celular e centralizado no desktop. */
export function BottomSheet(props) {
    return <Modal variant="sheet" {...props} />;
}

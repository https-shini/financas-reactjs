import { forwardRef } from "react";
import styled, { css } from "styled-components";
import { Loader2 } from "lucide-react";

const variants = {
    primary: css`
        background: ${(p) => p.theme.colors.primary};
        color: ${(p) => p.theme.colors.onPrimary};
        border-color: ${(p) => p.theme.colors.primary};
        &:hover:not(:disabled) {
            background: ${(p) => p.theme.colors.primaryHover};
            border-color: ${(p) => p.theme.colors.primaryHover};
        }
        &:active:not(:disabled) {
            background: ${(p) => p.theme.colors.primaryActive};
        }
    `,
    secondary: css`
        background: ${(p) => p.theme.colors.bgElevated};
        color: ${(p) => p.theme.colors.text};
        border-color: ${(p) => p.theme.colors.border};
        &:hover:not(:disabled) {
            background: ${(p) => p.theme.colors.bgHover};
            border-color: ${(p) => p.theme.colors.borderStrong};
        }
    `,
    ghost: css`
        background: transparent;
        color: ${(p) => p.theme.colors.textSecondary};
        border-color: transparent;
        &:hover:not(:disabled) {
            background: ${(p) => p.theme.colors.bgHover};
            color: ${(p) => p.theme.colors.text};
        }
    `,
    danger: css`
        background: ${(p) => p.theme.colors.expense};
        color: #fff;
        border-color: ${(p) => p.theme.colors.expense};
        &:hover:not(:disabled) {
            filter: brightness(0.95);
        }
    `,
    "danger-ghost": css`
        background: transparent;
        color: ${(p) => p.theme.colors.expense};
        border-color: transparent;
        &:hover:not(:disabled) {
            background: ${(p) => p.theme.colors.expenseSoft};
        }
    `,
};

const sizes = {
    sm: css`
        min-height: 36px;
        padding: 0 12px;
        font-size: ${(p) => p.theme.fontSize.sm};
        @media (pointer: coarse) {
            min-height: 44px;
        }
    `,
    md: css`
        min-height: 44px;
        padding: 0 16px;
        font-size: ${(p) => p.theme.fontSize.md};
    `,
    lg: css`
        min-height: 52px;
        padding: 0 20px;
        font-size: ${(p) => p.theme.fontSize.base};
    `,
};

const StyledButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid transparent;
    border-radius: ${(p) => p.theme.radius.md};
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    user-select: none;
    transition: background ${(p) => p.theme.motion.fast} ${(p) => p.theme.motion.easing}, border-color ${(p) => p.theme.motion.fast}, color ${(p) => p.theme.motion.fast}, transform ${(p) => p.theme.motion.fast};
    width: ${(p) => (p.$full ? "100%" : "auto")};
    &:active:not(:disabled) {
        transform: scale(0.98);
    }
    &:focus-visible {
        outline: 2px solid ${(p) => p.theme.colors.focus};
        outline-offset: 2px;
    }
    ${(p) => variants[p.$variant] ?? variants.secondary}
    ${(p) => sizes[p.$size] ?? sizes.md}
    &:disabled {
        opacity: ${(p) => p.theme.opacity.disabled};
        cursor: not-allowed;
    }
    svg {
        flex-shrink: 0;
    }
    .spin {
        animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

export const Button = forwardRef(function Button(
    { variant = "secondary", size = "md", icon: Icon, iconRight: IconRight, loading = false, full = false, children, type = "button", disabled, ...rest },
    ref
) {
    return (
        <StyledButton ref={ref} type={type} $variant={variant} $size={size} $full={full} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
            {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : Icon ? <Icon size={size === "sm" ? 16 : 18} aria-hidden="true" /> : null}
            {children}
            {IconRight && <IconRight size={16} aria-hidden="true" />}
        </StyledButton>
    );
});

const StyledIconButton = styled.button`
    display: inline-grid;
    place-items: center;
    width: ${(p) => (p.$size === "sm" ? "36px" : "44px")};
    height: ${(p) => (p.$size === "sm" ? "36px" : "44px")};
    flex-shrink: 0;
    border-radius: ${(p) => p.theme.radius.md};
    transition: background ${(p) => p.theme.motion.fast}, color ${(p) => p.theme.motion.fast}, transform ${(p) => p.theme.motion.fast};
    color: ${(p) => (p.$tone === "danger" ? p.theme.colors.expense : p.theme.colors.textSecondary)};
    border: 1px solid ${(p) => (p.$bordered ? p.theme.colors.border : "transparent")};
    background: ${(p) => (p.$bordered ? p.theme.colors.bgElevated : "transparent")};
    transition: background ${(p) => p.theme.motion.fast}, color ${(p) => p.theme.motion.fast};
    &:hover:not(:disabled) {
        background: ${(p) => (p.$tone === "danger" ? p.theme.colors.expenseSoft : p.theme.colors.bgHover)};
        color: ${(p) => (p.$tone === "danger" ? p.theme.colors.expense : p.theme.colors.text)};
    }
    &:active:not(:disabled) {
        transform: scale(0.96);
    }
    &:disabled {
        opacity: ${(p) => p.theme.opacity.disabled};
        cursor: not-allowed;
    }
    @media (pointer: coarse) {
        width: 44px;
        height: 44px;
    }
`;

/** Botão apenas com ícone. `label` é obrigatório (vira aria-label e dica). */
export const IconButton = forwardRef(function IconButton({ icon: Icon, label, size = "md", tone, bordered = false, type = "button", iconSize, ...rest }, ref) {
    if (!label) throw new Error("IconButton requer a prop label");
    return (
        <StyledIconButton ref={ref} type={type} aria-label={label} title={label} $size={size} $tone={tone} $bordered={bordered} {...rest}>
            <Icon size={iconSize ?? (size === "sm" ? 16 : 20)} aria-hidden="true" />
        </StyledIconButton>
    );
});

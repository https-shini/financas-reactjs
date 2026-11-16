import { css } from "styled-components";

/**
 * Padrões de interação do Design System (fonte única para hover, seleção, pressão, foco e desabilitado).
 * Inspirado na abordagem do Fluxer: uma camada translúcida de "hover/selected" aplicada por um único
 * contrato, em vez de cada componente escolher sua própria cor.
 *
 * Estados reconhecidos automaticamente:
 *  - hover:     :hover (somente em dispositivos com ponteiro fino, para não "grudar" no toque)
 *  - pressed:   :active
 *  - selected:  [aria-current="page"], [aria-selected="true"], [aria-checked="true"], .active
 *  - focus:     :focus-visible (anel de foco do tema, só para teclado)
 *  - disabled:  :disabled, [aria-disabled="true"]
 */

/** Anel de foco padrão (teclado). `inset`: desenha por dentro, para itens encostados nas bordas. */
export const focusRing = (inset = false) => css`
    &:focus-visible {
        outline: 2px solid ${(p) => p.theme.colors.focus};
        outline-offset: ${inset ? "-2px" : "2px"};
    }
`;

/**
 * Item interativo de lista/navegação (sidebar, menus, notificações, navegação inferior).
 * Define cor do texto, camadas de hover/seleção/pressão, foco e desabilitado.
 * O componente define apenas dimensões e layout.
 */
export const interactiveItem = css`
    color: ${(p) => p.theme.colors.interactiveText};
    background: transparent;
    transition:
        background ${(p) => p.theme.motion.fast},
        color ${(p) => p.theme.motion.fast};
    svg {
        color: ${(p) => p.theme.colors.textMuted};
        transition: color ${(p) => p.theme.motion.fast};
    }
    @media (hover: hover) {
        &:hover {
            background: ${(p) => p.theme.colors.interactiveHover};
            color: ${(p) => p.theme.colors.interactiveSelectedText};
            svg {
                color: ${(p) => p.theme.colors.interactiveSelectedText};
            }
        }
    }
    &:active {
        background: ${(p) => p.theme.colors.interactivePressed};
    }
    &[aria-current="page"],
    &[aria-selected="true"],
    &.active {
        background: ${(p) => p.theme.colors.interactiveSelected};
        color: ${(p) => p.theme.colors.interactiveSelectedText};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        svg {
            color: ${(p) => p.theme.colors.indicator};
        }
    }
    ${focusRing(true)}
    &:disabled,
    &[aria-disabled="true"] {
        opacity: ${(p) => p.theme.opacity.disabled};
        cursor: not-allowed;
        background: transparent;
    }
`;

/** Superfície flutuante (menus, popovers, painel de notificações): fundo elevado, borda e sombra. */
export const floatingSurface = css`
    background: ${(p) => p.theme.colors.bgElevated};
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.lg};
    box-shadow: ${(p) => p.theme.shadows.lg};
`;

/** Controle compacto (header, ações de card): altura única do DS, 44 px em telas de toque. */
export const compactControl = css`
    height: ${(p) => p.theme.layout.control};
    min-height: ${(p) => p.theme.layout.control};
    ${(p) => p.theme.media.coarse} {
        height: ${(p) => p.theme.layout.touchTarget};
        min-height: ${(p) => p.theme.layout.touchTarget};
    }
`;

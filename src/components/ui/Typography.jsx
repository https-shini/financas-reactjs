import styled, { css } from "styled-components";

/** Aplica um papel tipográfico do design system (display, h1, h2, h3, body, caption, overline, numeric). */
export const typeRole = (role) => css`
    ${(p) => {
        const r = p.theme.typeRoles[role];
        return css`
            font-family: ${p.theme.fonts[r.family]};
            font-size: ${p.theme.fontSize[r.size]};
            font-weight: ${p.theme.fontWeight[r.weight]};
            line-height: ${p.theme.lineHeight[r.lineHeight]};
            letter-spacing: ${p.theme.letterSpacing[r.letterSpacing]};
        `;
    }}
`;

const toneColor = (p) =>
    ({
        default: p.theme.colors.text,
        secondary: p.theme.colors.textSecondary,
        muted: p.theme.colors.textMuted,
        brand: p.theme.colors.primaryText,
        accent: p.theme.colors.accentText,
        income: p.theme.colors.income,
        expense: p.theme.colors.expense,
        warning: p.theme.colors.warning,
    })[p.$tone ?? "default"];

/** Texto com papel e tom: <Text variant="caption" tone="muted">. */
export const Text = styled.p`
    ${(p) => typeRole(p.$variant ?? "body")}
    color: ${toneColor};
    ${(p) =>
        p.$variant === "overline" &&
        css`
            text-transform: uppercase;
        `}
    ${(p) =>
        p.$numeric &&
        css`
            font-variant-numeric: tabular-nums;
        `}
`;

/** Título com papel tipográfico independente do nível semântico (h1..h4). */
export const Heading = styled.h2`
    ${(p) => typeRole(p.$role ?? "h2")}
    color: ${(p) => p.theme.colors.text};
`;

/** Valor financeiro em destaque: Geist Mono tabular, sem quebra. */
export const NumericDisplay = styled.span`
    ${typeRole("numeric")}
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    display: inline-block;
    ${(p) => p.theme.media.mobile} {
        font-size: ${(p) => p.theme.fontSize["2xl"]};
    }
`;

/** Rótulo pequeno em caixa alta para grupos (ex.: navegação). */
export const Overline = styled.span`
    ${typeRole("overline")}
    text-transform: uppercase;
    color: ${(p) => p.theme.colors.textMuted};
`;

/** Título de seção dentro de cards (ex.: "Atrasados", "Encerradas"). */
export const Subheading = styled.h3`
    ${typeRole("overline")}
    font-family: ${(p) => p.theme.fonts.sans};
    text-transform: uppercase;
    color: ${(p) => p.theme.colors.textMuted};
    margin: ${(p) => p.theme.space(4, 2, 1)};
`;

/** Rótulo de grupo de controles que não é um <label> (grade de categorias, cores, ícones). */
export const FieldLabel = styled.p`
    ${typeRole("caption")}
    font-weight: ${(p) => p.theme.fontWeight.medium};
    color: ${(p) => p.theme.colors.textSecondary};
    margin-bottom: ${(p) => p.theme.space(1.5)};
`;

/** Sobretítulo de página/seção: caixa alta na cor de destaque, precedido por um traço (ex.: "— Financeiro"). */
export const Eyebrow = styled.p`
    ${typeRole("overline")}
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: ${(p) => p.theme.fonts.mono};
    text-transform: uppercase;
    color: ${(p) => p.theme.colors.primaryText};
    &::before {
        content: "";
        width: 18px;
        height: 2px;
        border-radius: 2px;
        background: currentColor;
    }
`;

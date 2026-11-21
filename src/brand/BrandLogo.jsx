import { useId } from "react";
import styled from "styled-components";
import { BRAND_COLORS, PRODUCT_NAME, SIGNATURE, SYMBOL_GLYPH, SYMBOL_TILE, SYMBOL_VIEWBOX } from "./geometry";

const a11y = (title, id) => (title ? { role: "img", "aria-labelledby": id } : { "aria-hidden": true, focusable: "false" });

/**
 * Símbolo da marca (placa em gradiente violeta com o "F"). Funciona sozinho como favicon, ícone e avatar.
 * tone: "color" (padrão) | "mono" (recorte em currentColor, uma cor só).
 */
export function BrandMark({ size = 32, tone = "color", title, className, style }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox={SYMBOL_VIEWBOX} className={className} style={style} {...a11y(title, id)}>
            {title && <title id={id}>{title}</title>}
            {tone === "mono" ? (
                <path d={`${SYMBOL_TILE}${SYMBOL_GLYPH}`} fill="currentColor" fillRule="evenodd" />
            ) : (
                <>
                    <defs>
                        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor={BRAND_COLORS.tile} />
                            <stop offset="1" stopColor={BRAND_COLORS.tileEnd} />
                        </linearGradient>
                    </defs>
                    <path d={SYMBOL_TILE} fill={`url(#${id}-g)`} />
                    <path d={SYMBOL_GLYPH} fill={BRAND_COLORS.glyph} />
                </>
            )}
        </svg>
    );
}

const tone = (p, dark, light, auto) => (p.$tone === "onDark" ? dark : p.$tone === "onLight" ? light : auto);

const Lockup = styled.span`
    display: inline-flex;
    align-items: center;
    gap: ${(p) => Math.round(p.$size * 0.36)}px;
    color: inherit;
    line-height: 1;
    min-width: 0;
    .name {
        display: block;
        font-family: ${(p) => p.theme.fonts.sans};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        font-size: ${(p) => Math.round(p.$size * 0.5)}px;
        letter-spacing: -0.02em;
        color: ${(p) => tone(p, BRAND_COLORS.mist, BRAND_COLORS.ink, "currentColor")};
        white-space: nowrap;
    }
    .sig {
        display: block;
        margin-top: ${(p) => Math.max(3, Math.round(p.$size * 0.12))}px;
        font-family: ${(p) => p.theme.fonts.mono};
        font-weight: ${(p) => p.theme.fontWeight.medium};
        font-size: ${(p) => Math.max(9, Math.round(p.$size * 0.31))}px;
        color: ${(p) => tone(p, BRAND_COLORS.muted, "#5B5B63", p.theme.colors.textMuted)};
        white-space: nowrap;
    }
    .sig .n {
        color: ${(p) => tone(p, BRAND_COLORS.mist, BRAND_COLORS.ink, p.theme.colors.text)};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
    }
    .sig .b {
        color: ${(p) => tone(p, BRAND_COLORS.gcruzBracket, BRAND_COLORS.gcruzBracketLight, p.theme.mode === "light" ? BRAND_COLORS.gcruzBracketLight : BRAND_COLORS.gcruzBracket)};
    }
    .sig .d {
        color: ${(p) => tone(p, BRAND_COLORS.gcruzIndigo, BRAND_COLORS.gcruzIndigoLight, p.theme.colors.accentText)};
    }
`;

/**
 * Lockup horizontal: símbolo + "Finanças" + assinatura institucional "by <gcruz.dev/>".
 * size: altura do símbolo em px. tone: "color" (texto herda a cor) | "onDark" | "onLight" | "mono".
 * compact: só o nome, sem assinatura.
 */
export function BrandLockup({ size = 32, tone = "color", compact = false, title = `${PRODUCT_NAME} by GCruz.DEV`, className }) {
    return (
        <Lockup $size={size} $tone={tone} className={className} role={title ? "img" : undefined} aria-label={title || undefined}>
            <BrandMark size={size} tone={tone === "mono" ? "mono" : "color"} />
            <span aria-hidden="true" style={{ minWidth: 0 }}>
                <span className="name">{PRODUCT_NAME}</span>
                {!compact && (
                    <span className="sig">
                        {SIGNATURE.by} <span className="b">{SIGNATURE.open}</span>
                        <span className="n">{SIGNATURE.name}</span>
                        <span className="d">{SIGNATURE.suffix}</span>
                        <span className="b">{SIGNATURE.close}</span>
                    </span>
                )}
            </span>
        </Lockup>
    );
}

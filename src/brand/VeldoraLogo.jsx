import { useId } from "react";
import {
    APP_ICON_RADIUS,
    APP_ICON_SYMBOL_TRANSFORM,
    APP_ICON_VIEWBOX,
    BRAND_COLORS,
    HORIZONTAL_VIEWBOX,
    SYMBOL_BODY,
    SYMBOL_FACET,
    SYMBOL_VIEWBOX,
    WORDMARK_HEIGHT,
    WORDMARK_LETTERS,
    WORDMARK_OFFSET,
    WORDMARK_STROKE,
    WORDMARK_WIDTH,
} from "./geometry";

/**
 * tone:
 *  - "color": símbolo azul + faceta violeta; wordmark herda a cor do texto (funciona nos dois temas)
 *  - "onDark" / "onLight": wordmark fixo em Ice White / Ink
 *  - "mono": tudo em currentColor (uma cor só)
 */
function symbolFills(tone) {
    if (tone === "mono") return { body: "currentColor", facet: "currentColor", facetOpacity: 0.55 };
    return { body: BRAND_COLORS.blue, facet: BRAND_COLORS.violet, facetOpacity: 1 };
}

function wordColor(tone) {
    if (tone === "onDark") return BRAND_COLORS.iceWhite;
    if (tone === "onLight") return BRAND_COLORS.ink;
    return "currentColor";
}

function Glyphs({ tone }) {
    const f = symbolFills(tone);
    return (
        <>
            <path d={SYMBOL_BODY} fill={f.body} />
            <path d={SYMBOL_FACET} fill={f.facet} opacity={f.facetOpacity} />
        </>
    );
}

function Letters({ color }) {
    return (
        <g fill="none" stroke={color} strokeWidth={WORDMARK_STROKE} strokeMiterlimit={10}>
            {WORDMARK_LETTERS.map((l) => (
                <path key={l.letter + l.d} d={l.d} strokeLinejoin={l.join} />
            ))}
        </g>
    );
}

/** Acessibilidade: com `title` o SVG é uma imagem nomeada; sem título é decorativo. */
function a11y(title, id) {
    return title ? { role: "img", "aria-labelledby": id } : { "aria-hidden": true, focusable: "false" };
}

/** Símbolo independente (V). */
export function VeldoraSymbol({ size = 32, tone = "color", title, className, style }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox={SYMBOL_VIEWBOX} className={className} style={style} {...a11y(title, id)}>
            {title && <title id={id}>{title}</title>}
            <Glyphs tone={tone} />
        </svg>
    );
}

/** Logotipo (somente o nome). */
export function VeldoraWordmark({ height = 16, tone = "color", title, className, style }) {
    const id = useId();
    const pad = WORDMARK_STROKE;
    return (
        <svg
            height={height}
            viewBox={`${-pad / 2} ${-pad / 2} ${WORDMARK_WIDTH + pad} ${WORDMARK_HEIGHT + pad}`}
            className={className}
            style={style}
            {...a11y(title, id)}
        >
            {title && <title id={id}>{title}</title>}
            <Letters color={wordColor(tone)} />
        </svg>
    );
}

/** Logo horizontal (símbolo + nome). */
export function VeldoraLogo({ height = 32, tone = "color", title = "VELDORA", className, style }) {
    const id = useId();
    return (
        <svg height={height} viewBox={HORIZONTAL_VIEWBOX} className={className} style={style} {...a11y(title, id)}>
            {title && <title id={id}>{title}</title>}
            <Glyphs tone={tone} />
            <g transform={`translate(${WORDMARK_OFFSET.x} ${WORDMARK_OFFSET.y})`}>
                <Letters color={wordColor(tone)} />
            </g>
        </svg>
    );
}

/** Ícone do aplicativo (símbolo sobre quadrado Deep Black). */
export function VeldoraAppIcon({ size = 64, title, className, style }) {
    const id = useId();
    return (
        <svg width={size} height={size} viewBox={APP_ICON_VIEWBOX} className={className} style={style} {...a11y(title, id)}>
            {title && <title id={id}>{title}</title>}
            <rect width="64" height="64" rx={APP_ICON_RADIUS} fill={BRAND_COLORS.deepBlack} />
            <g transform={APP_ICON_SYMBOL_TRANSFORM}>
                <Glyphs tone="color" />
            </g>
        </svg>
    );
}

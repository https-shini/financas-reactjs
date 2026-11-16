import { useId } from "react";

/**
 * Minigráfico de linha (tendência) para cards de indicador. Decorativo: o valor e a variação
 * já aparecem em texto no card, então o SVG fica oculto para leitores de tela.
 * values: números (qualquer escala). color: cor CSS da linha.
 */
export function Sparkline({ values, color = "currentColor", width = 84, height = 28 }) {
    const id = useId();
    if (!values || values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = width / (values.length - 1);
    const pts = values.map((v, i) => [i * step, height - 2 - ((v - min) / span) * (height - 4)]);
    const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${line} L${width} ${height} L0 ${height} Z`;
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{ flexShrink: 0, color }}>
            <defs>
                <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
                    <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${id}-f)`} />
            <path d={line} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

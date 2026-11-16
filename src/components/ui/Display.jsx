import { NEUTRAL_COLOR } from "../../design/tokens";
import styled, { css, keyframes } from "styled-components";
import { useFormat } from "../../hooks/useFormat";
import { iconFor } from "./icons";

// ---------------- Amount ----------------

// Valores monetários sempre em JetBrains Mono com algarismos tabulares (alinhamento financeiro).
const AmountText = styled.span`
    font-family: ${(p) => p.theme.fonts.mono};
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    font-weight: ${(p) => p.$weight ?? 600};
    color: ${(p) => (p.$tone ? p.theme.colors[p.$tone] : "inherit")};
    letter-spacing: ${(p) => (p.$big ? "-0.03em" : "-0.01em")};
`;

/**
 * Valor monetário. type: "income" | "expense" | "transfer" | undefined.
 * sign: mostra +/− (não depende só de cor). private: respeita "ocultar saldos".
 */
export function Amount({ cents, type, sign = false, colored = true, private: isPrivate = false, big = false, weight, className, srLabel }) {
    const { money, hideBalances } = useFormat();
    if (isPrivate && hideBalances) {
        return (
            <AmountText className={className} aria-label="Valor oculto" $big={big}>
                ••••••
            </AmountText>
        );
    }
    let value = cents;
    let tone;
    if (type === "income") {
        tone = colored ? "income" : undefined;
        value = Math.abs(cents);
    } else if (type === "expense") {
        tone = colored ? "expense" : undefined;
        value = -Math.abs(cents);
    } else if (type === "transfer") {
        tone = colored ? "transfer" : undefined;
    } else if (colored && sign) {
        tone = cents > 0 ? "income" : cents < 0 ? "expense" : undefined;
    }
    const text = money(value, { signDisplay: sign || type === "income" || type === "expense" ? "exceptZero" : "auto" }).replace("-", "−");
    return (
        <AmountText className={className} $tone={tone} $big={big} $weight={weight} aria-label={srLabel ? `${srLabel}: ${text}` : undefined}>
            {text}
        </AmountText>
    );
}

// ---------------- Badge ----------------

const tones = {
    neutral: css`
        background: ${(p) => p.theme.colors.bgSurface};
        color: ${(p) => p.theme.colors.textSecondary};
    `,
    primary: css`
        background: ${(p) => p.theme.colors.primarySoft};
        color: ${(p) => p.theme.colors.primaryText};
    `,
    income: css`
        background: ${(p) => p.theme.colors.incomeSoft};
        color: ${(p) => p.theme.colors.income};
    `,
    expense: css`
        background: ${(p) => p.theme.colors.expenseSoft};
        color: ${(p) => p.theme.colors.expense};
    `,
    warning: css`
        background: ${(p) => p.theme.colors.warningSoft};
        color: ${(p) => p.theme.colors.warning};
    `,
    info: css`
        background: ${(p) => p.theme.colors.infoSoft};
        color: ${(p) => p.theme.colors.info};
    `,
    accent: css`
        background: ${(p) => p.theme.colors.accentSoft};
        color: ${(p) => p.theme.colors.accentText};
    `,
};

export const Badge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    border-radius: ${(p) => p.theme.radius.xs};
    font-family: ${(p) => p.theme.fonts.mono};
    font-size: ${(p) => p.theme.fontSize.xs};
    font-weight: 600;
    line-height: 1.6;
    white-space: nowrap;
    ${(p) => tones[p.$tone ?? "neutral"]}
`;

// ---------------- Category ----------------

const IconBubble = styled.span`
    display: inline-grid;
    place-items: center;
    flex-shrink: 0;
    width: ${(p) => p.$size}px;
    height: ${(p) => p.$size}px;
    border-radius: ${(p) => (p.$size > 32 ? "12px" : p.$size > 24 ? "9px" : "7px")};
    color: ${(p) => p.$color};
    background: ${(p) => `${p.$color}1f`};
    box-shadow: inset 0 0 0 1px ${(p) => `${p.$color}2e`};
`;

export function CategoryIcon({ category, size = 36 }) {
    const Icon = iconFor(category?.icon);
    const color = category?.color ?? NEUTRAL_COLOR;
    return (
        <IconBubble $size={size} $color={color} aria-hidden="true">
            <Icon size={Math.round(size * 0.5)} strokeWidth={1.9} />
        </IconBubble>
    );
}

const ChipWrap = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    font-size: ${(p) => p.theme.fontSize.sm};
    color: ${(p) => p.theme.colors.textSecondary};
    span:last-child {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

export function CategoryChip({ category }) {
    return (
        <ChipWrap>
            <CategoryIcon category={category} size={20} />
            <span>{category?.name ?? "Sem categoria"}</span>
        </ChipWrap>
    );
}

// ---------------- Progress ----------------

const Track = styled.div`
    height: ${(p) => p.$height}px;
    border-radius: 999px;
    background: ${(p) => p.theme.colors.bgSurface};
    overflow: hidden;
`;

const Fill = styled.div`
    height: 100%;
    width: ${(p) => p.$pct}%;
    border-radius: 999px;
    background: ${(p) => (p.$color ? p.$color : p.theme.colors[p.$tone] ?? p.theme.colors.primary)};
    transition: width ${(p) => p.theme.motion.slow} ${(p) => p.theme.motion.easing};
`;

/** Barra de progresso. tone: income | warning | expense | primary. */
export function Progress({ value, max = 100, tone = "primary", color, height = 8, label }) {
    const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
    return (
        <Track $height={height} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
            <Fill $pct={pct} $tone={tone} $color={color} />
        </Track>
    );
}

export const levelTone = (level) => (level === "exceeded" ? "expense" : level === "warning" ? "warning" : "income");

// ---------------- EmptyState ----------------

const EmptyWrap = styled.div`
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 8px;
    padding: ${(p) => (p.$compact ? "20px 12px" : "40px 16px")};
    color: ${(p) => p.theme.colors.textSecondary};
    .icon {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        border-radius: 15px;
        background: ${(p) => p.theme.colors.primarySoft};
        color: ${(p) => p.theme.colors.primaryText};
        border: 1px solid ${(p) => p.theme.colors.border};
        margin-bottom: 8px;
    }
    h3 {
        color: ${(p) => p.theme.colors.text};
        font-size: ${(p) => p.theme.fontSize.lg};
        font-weight: 600;
    }
    p {
        max-width: 420px;
        font-size: ${(p) => p.theme.fontSize.sm};
        line-height: 1.5;
    }
    .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 8px;
    }
`;

export function EmptyState({ icon: Icon, title, description, children, compact = false }) {
    return (
        <EmptyWrap $compact={compact}>
            {Icon && (
                <span className="icon" aria-hidden="true">
                    <Icon size={22} />
                </span>
            )}
            <h3>{title}</h3>
            {description && <p>{description}</p>}
            {children && <div className="actions">{children}</div>}
        </EmptyWrap>
    );
}

// ---------------- Skeleton ----------------

const shimmer = keyframes`0% { opacity: 0.55 } 50% { opacity: 1 } 100% { opacity: 0.55 }`;

export const Skeleton = styled.div.attrs({ "aria-hidden": true })`
    width: ${(p) => p.$w ?? "100%"};
    height: ${(p) => p.$h ?? "16px"};
    border-radius: ${(p) => p.$r ?? "8px"};
    background: ${(p) => p.theme.colors.bgSurface};
    animation: ${shimmer} 1.4s ease-in-out infinite;
`;

// ---------------- Stat / Delta ----------------

const DeltaText = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: ${(p) => p.theme.fontSize.xs};
    font-weight: 600;
    color: ${(p) => (p.$tone ? p.theme.colors[p.$tone] : p.theme.colors.textMuted)};
    font-variant-numeric: tabular-nums;
`;

/**
 * Variação percentual com seta e texto ("↑ 12% vs. mês anterior").
 * goodWhenUp: para despesas, subir é ruim.
 */
export function Delta({ value, goodWhenUp = true, suffix = "vs. mês anterior" }) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return <DeltaText>Sem base de comparação</DeltaText>;
    }
    const rounded = Math.round(value);
    if (rounded === 0) return <DeltaText>Estável {suffix}</DeltaText>;
    const up = value > 0;
    const good = up === goodWhenUp;
    const pct = Math.abs(value) >= 1000 ? ">999" : Math.abs(rounded);
    return (
        <DeltaText $tone={good ? "income" : "expense"}>
            <span aria-hidden="true">{up ? "↑" : "↓"}</span>
            <span className="sr-only">{up ? "Aumento de" : "Redução de"}</span>
            {pct}% <span style={{ fontWeight: 500, color: "var(--v-color-text-secondary)" }}>{suffix}</span>
        </DeltaText>
    );
}

export const Muted = styled.span`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: ${(p) => p.theme.fontSize.sm};
`;

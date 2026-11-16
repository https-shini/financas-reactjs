import { useId, useState } from "react";
import { Link } from "react-router-dom";
import styled, { css, keyframes } from "styled-components";
import { AlertTriangle, CheckCircle2, Info, XCircle, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { typeRole } from "./Typography";

// ---------------- Spinner (estado de carregamento) ----------------

const spin = keyframes`to { transform: rotate(360deg); }`;

const SpinnerRing = styled.span`
    display: inline-block;
    width: ${(p) => p.$size}px;
    height: ${(p) => p.$size}px;
    border-radius: 50%;
    border: 2px solid ${(p) => p.theme.colors.border};
    border-top-color: ${(p) => p.theme.colors.brand};
    animation: ${spin} 0.8s linear infinite;
`;

export function Spinner({ size = 20, label = "Carregando" }) {
    return <SpinnerRing $size={size} role="status" aria-label={label} />;
}

// ---------------- Alert ----------------

const ALERT_TONES = {
    info: { icon: Info, fg: "info", bg: "infoSoft" },
    success: { icon: CheckCircle2, fg: "income", bg: "incomeSoft" },
    warning: { icon: AlertTriangle, fg: "warning", bg: "warningSoft" },
    danger: { icon: XCircle, fg: "expense", bg: "expenseSoft" },
    accent: { icon: Info, fg: "accentText", bg: "accentSoft" },
};

const AlertBox = styled.div`
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 14px;
    border-radius: ${(p) => p.theme.radius.md};
    background: ${(p) => p.theme.colors[ALERT_TONES[p.$tone].bg]};
    color: ${(p) => p.theme.colors.text};
    svg {
        flex-shrink: 0;
        margin-top: 2px;
        color: ${(p) => p.theme.colors[ALERT_TONES[p.$tone].fg]};
    }
    strong {
        display: block;
        font-weight: 600;
        margin-bottom: 2px;
    }
    p {
        ${typeRole("caption")}
        color: ${(p) => p.theme.colors.textSecondary};
    }
`;

/** Alerta contextual. tone: info | success | warning | danger | accent. O ícone + título não dependem só da cor. */
export function Alert({ tone = "info", title, children, role }) {
    const Icon = ALERT_TONES[tone].icon;
    return (
        <AlertBox $tone={tone} role={role ?? (tone === "danger" || tone === "warning" ? "alert" : "status")}>
            <Icon size={18} aria-hidden="true" />
            <div>
                {title && <strong>{title}</strong>}
                {children && <p>{children}</p>}
            </div>
        </AlertBox>
    );
}

// ---------------- Tooltip ----------------

const TipWrap = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
`;

const TipBubble = styled.span`
    position: absolute;
    ${(p) => (p.$placement === "bottom" ? "top: calc(100% + 8px);" : "bottom: calc(100% + 8px);")}
    left: 50%;
    transform: translateX(-50%);
    z-index: ${(p) => p.theme.z.tooltip};
    width: max-content;
    max-width: 260px;
    padding: 8px 10px;
    border-radius: ${(p) => p.theme.radius.sm};
    background: ${(p) => (p.theme.mode === "dark" ? p.theme.colors.bgSurface : p.theme.colors.text)};
    color: ${(p) => (p.theme.mode === "dark" ? p.theme.colors.text : p.theme.colors.bg)};
    border: 1px solid ${(p) => p.theme.colors.borderStrong};
    box-shadow: ${(p) => p.theme.shadows.md};
    ${typeRole("caption")}
    text-align: left;
    white-space: normal;
    pointer-events: none;
    opacity: ${(p) => (p.$open ? 1 : 0)};
    visibility: ${(p) => (p.$open ? "visible" : "hidden")};
    transition: opacity ${(p) => p.theme.motion.fast} ${(p) => p.theme.motion.easing};
`;

const TipTrigger = styled.button`
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: ${(p) => p.theme.colors.textMuted};
    &:hover,
    &:focus-visible {
        color: ${(p) => p.theme.colors.text};
    }
    ${(p) => p.theme.media.coarse} {
        width: 36px;
        height: 36px;
    }
`;

/**
 * Tooltip acessível: abre com hover, foco e toque; o conteúdo é ligado por aria-describedby.
 * Sem `children`, renderiza um botão de ajuda (?) com o rótulo `label`.
 */
export function Tooltip({ content, children, label = "Mais informações", placement = "top" }) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const show = () => setOpen(true);
    const hide = () => setOpen(false);
    return (
        <TipWrap onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onKeyDown={(e) => e.key === "Escape" && hide()}>
            {children ?? (
                <TipTrigger type="button" aria-label={label} aria-describedby={id} onClick={() => setOpen((v) => !v)}>
                    <HelpCircle size={15} aria-hidden="true" />
                </TipTrigger>
            )}
            <TipBubble id={id} role="tooltip" $open={open} $placement={placement}>
                {content}
            </TipBubble>
        </TipWrap>
    );
}

// ---------------- StatCard ----------------

const StatBox = styled.section`
    position: relative;
    display: grid;
    gap: 6px;
    align-content: start;
    padding: ${(p) => p.theme.space(5)};
    background: ${(p) => p.theme.colors.bgElevated};
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.lg};
    box-shadow: ${(p) => p.theme.shadows.card};
    min-width: 0;
    ${(p) => p.theme.media.mobile} {
        padding: ${(p) => p.theme.space(4)};
    }
`;

const StatHead = styled.header`
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${(p) => p.theme.colors.textSecondary};
    ${typeRole("caption")}
    font-weight: 500;
    .icon {
        display: grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: ${(p) => p.theme.radius.sm};
        background: ${(p) => p.theme.colors.bgSurface};
        border: 1px solid ${(p) => p.theme.colors.border};
        color: ${(p) => p.theme.colors[p.$iconTone] ?? p.theme.colors.primaryText};
    }
    .tip {
        margin-left: auto;
    }
`;

/**
 * Cartão de indicador: rótulo, valor em destaque, variação e conteúdo complementar.
 * accent: barra superior com a cor de um token (brand, income, expense, accent).
 */
export function StatCard({ label, icon: Icon, iconTone = "primaryText", value, delta, hint, tooltip, accent, children, id, ...rest }) {
    const titleId = useId();
    return (
        <StatBox aria-labelledby={id ?? titleId} $accent={accent} {...rest}>
            <StatHead $iconTone={iconTone}>
                {Icon && (
                    <span className="icon" aria-hidden="true">
                        <Icon size={16} />
                    </span>
                )}
                <span id={id ?? titleId}>{label}</span>
                {tooltip && (
                    <span className="tip">
                        <Tooltip content={tooltip} label={`Sobre: ${label}`} />
                    </span>
                )}
            </StatHead>
            {value !== undefined && <div>{value}</div>}
            {delta}
            {hint && <Hint as="p">{hint}</Hint>}
            {children}
        </StatBox>
    );
}

const Hint = styled.span`
    ${typeRole("caption")}
    color: ${(p) => p.theme.colors.textMuted};
`;

// ---------------- DataTable (responsiva) ----------------

const TableWrap = styled.div`
    position: relative;
    overflow-x: auto;
    border-radius: ${(p) => p.theme.radius.md};
`;

const StyledTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    ${typeRole("caption")}
    font-variant-numeric: tabular-nums;
    th,
    td {
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid ${(p) => p.theme.colors.border};
        white-space: nowrap;
    }
    th {
        ${typeRole("overline")}
        text-transform: uppercase;
        color: ${(p) => p.theme.colors.textMuted};
        background: ${(p) => p.theme.colors.bgSurface};
    }
    th[data-align="right"],
    td[data-align="right"] {
        text-align: right;
    }
    td.wrap {
        white-space: normal;
    }
    tbody tr {
        transition: background ${(p) => p.theme.motion.fast};
    }
    tbody tr:hover {
        background: ${(p) => p.theme.colors.bgHover};
    }
    tfoot td {
        font-weight: 700;
    }
    /* No celular, cada linha vira um cartão com rótulos (data-label) */
    ${(p) =>
        p.$stack &&
        css`
            ${p.theme.media.mobile} {
                thead {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                }
                tbody tr {
                    display: grid;
                    gap: 4px;
                    padding: 10px 0;
                    border-bottom: 1px solid ${p.theme.colors.border};
                }
                td {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 2px 4px;
                    border: 0;
                    white-space: normal;
                    text-align: right !important;
                }
                td::before {
                    content: attr(data-label);
                    color: ${p.theme.colors.textMuted};
                    text-align: left;
                }
            }
        `}
`;

/**
 * Tabela padronizada. columns: [{ key, header, align, render(row), wrap }]; rows: array; getKey(row).
 * stackOnMobile: em telas pequenas, mostra cada linha como cartão (sem rolagem horizontal).
 */
export function DataTable({ columns, rows, getKey, caption, footer, stackOnMobile = true, empty }) {
    if (!rows.length && empty) return empty;
    return (
        <TableWrap>
            <StyledTable $stack={stackOnMobile}>
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead>
                    <tr>
                        {columns.map((c) => (
                            <th key={c.key} scope="col" data-align={c.align}>
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={getKey ? getKey(row) : i}>
                            {columns.map((c) => (
                                <td key={c.key} data-label={c.header} data-align={c.align} className={c.wrap ? "wrap" : undefined}>
                                    {c.render ? c.render(row) : row[c.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                {footer && (
                    <tfoot>
                        <tr>
                            {columns.map((c) => (
                                <td key={c.key} data-label={c.header} data-align={c.align}>
                                    {footer[c.key] ?? ""}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                )}
            </StyledTable>
        </TableWrap>
    );
}

// ---------------- Pagination ----------------

const PagNav = styled.nav`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex-wrap: wrap;
    button {
        min-width: 40px;
        min-height: 40px;
        padding: 0 10px;
        border-radius: ${(p) => p.theme.radius.sm};
        color: ${(p) => p.theme.colors.textSecondary};
        font-variant-numeric: tabular-nums;
        display: inline-grid;
        place-items: center;
        &:hover:not(:disabled) {
            background: ${(p) => p.theme.colors.bgHover};
            color: ${(p) => p.theme.colors.text};
        }
        &[aria-current="page"] {
            background: ${(p) => p.theme.colors.primarySoft};
            color: ${(p) => p.theme.colors.primaryText};
            font-weight: 700;
        }
        &:disabled {
            opacity: ${(p) => p.theme.opacity.disabled};
            cursor: not-allowed;
        }
    }
`;

/** Paginação numérica com reticências. */
export function Pagination({ page, pageCount, onChange, label = "Paginação" }) {
    if (pageCount <= 1) return null;
    const pages = [];
    for (let i = 1; i <= pageCount; i += 1) {
        if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) pages.push(i);
        else if (pages[pages.length - 1] !== "…") pages.push("…");
    }
    return (
        <PagNav aria-label={label}>
            <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Página anterior">
                <ChevronLeft size={16} aria-hidden="true" />
            </button>
            {pages.map((n, i) =>
                n === "…" ? (
                    <span key={`e${i}`} aria-hidden="true">
                        …
                    </span>
                ) : (
                    <button key={n} type="button" aria-current={n === page ? "page" : undefined} onClick={() => onChange(n)} aria-label={`Página ${n}`}>
                        {n}
                    </button>
                )
            )}
            <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pageCount} aria-label="Próxima página">
                <ChevronRight size={16} aria-hidden="true" />
            </button>
        </PagNav>
    );
}

// ---------------- Breadcrumbs ----------------

const Crumbs = styled.nav`
    ol {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        ${typeRole("caption")}
        color: ${(p) => p.theme.colors.textMuted};
    }
    li + li::before {
        content: "/";
        margin-right: 6px;
        color: ${(p) => p.theme.colors.borderStrong};
    }
    a {
        color: ${(p) => p.theme.colors.textSecondary};
        text-decoration: none;
        &:hover {
            color: ${(p) => p.theme.colors.text};
            text-decoration: underline;
        }
    }
    [aria-current="page"] {
        color: ${(p) => p.theme.colors.text};
        font-weight: 500;
    }
`;

/** items: [{ label, to? }] — o último é a página atual. */
export function Breadcrumbs({ items }) {
    return (
        <Crumbs aria-label="Trilha de navegação">
            <ol>
                {items.map((it, i) =>
                    i === items.length - 1 || !it.to ? (
                        <li key={it.label} aria-current={i === items.length - 1 ? "page" : undefined}>
                            {it.label}
                        </li>
                    ) : (
                        <li key={it.label}>
                            <Link to={it.to}>{it.label}</Link>
                        </li>
                    )
                )}
            </ol>
        </Crumbs>
    );
}

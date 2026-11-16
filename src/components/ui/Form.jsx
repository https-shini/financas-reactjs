import { forwardRef, useEffect, useId, useState } from "react";
import styled, { css } from "styled-components";
import { ChevronDown } from "lucide-react";
import { digitsToCents, formatDecimal, parseMoneyString } from "../../domain/money";
import { useFinance } from "../../state/contexts";

const FieldWrap = styled.div`
    display: grid;
    gap: 6px;
    min-width: 0;
`;

const Label = styled.label`
    font-size: ${(p) => p.theme.fontSize.sm};
    font-weight: ${(p) => p.theme.fontWeight.medium};
    color: ${(p) => p.theme.colors.textSecondary};
`;

const Hint = styled.p`
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: ${(p) => p.theme.fontSize.xs};
    color: ${(p) => (p.$error ? p.theme.colors.expense : p.theme.colors.textMuted)};
    ${(p) =>
        p.$error &&
        css`
            &::before {
                content: "!";
                display: inline-grid;
                place-items: center;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                font-size: 10px;
                font-weight: 800;
                color: ${p.theme.colors.bgElevated};
                background: ${p.theme.colors.expense};
                flex-shrink: 0;
            }
        `}
`;

/**
 * Campo com rótulo associado, dica e mensagem de erro anunciada por leitores de tela.
 * children é uma função ({ id, describedBy, invalid }) => elemento.
 */
export function Field({ label, hint, error, children, className, labelHidden = false, as }) {
    const id = useId();
    const hintId = `${id}-hint`;
    const describedBy = error || hint ? hintId : undefined;
    return (
        <FieldWrap className={className} as={as}>
            <Label htmlFor={id} className={labelHidden ? "sr-only" : undefined}>
                {label}
            </Label>
            {children({ id, describedBy, invalid: Boolean(error) })}
            {(error || hint) && (
                <Hint id={hintId} $error={Boolean(error)} role={error ? "alert" : undefined}>
                    {error || hint}
                </Hint>
            )}
        </FieldWrap>
    );
}

export const controlStyles = css`
    width: 100%;
    min-height: 36px;
    padding: 0 12px;
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => (p["aria-invalid"] ? p.theme.colors.expense : p.theme.colors.borderStrong)};
    background: ${(p) => p.theme.colors.bgInput};
    @media (pointer: coarse) {
        min-height: 44px;
    }
    color: ${(p) => p.theme.colors.text};
    font-size: 16px; /* evita zoom automático no iOS */
    transition: border-color ${(p) => p.theme.motion.fast} ${(p) => p.theme.motion.easing}, box-shadow ${(p) => p.theme.motion.fast} ${(p) => p.theme.motion.easing}, background ${(p) => p.theme.motion.fast};
    &::placeholder {
        color: ${(p) => p.theme.colors.textMuted};
    }
    &:hover:not(:disabled) {
        border-color: ${(p) => p.theme.colors.borderStrong};
    }
    &:focus,
    &:focus-visible {
        outline: none;
        border-color: ${(p) => (p["aria-invalid"] ? p.theme.colors.expense : p.theme.colors.brand)};
        box-shadow: ${(p) => p.theme.shadows.focus};
        background: ${(p) => p.theme.colors.bgElevated};
    }
    &:disabled {
        opacity: ${(p) => p.theme.opacity.disabled};
        cursor: not-allowed;
        background: ${(p) => p.theme.colors.bgSurface};
    }
    ${(p) => p.theme.media.desktop} {
        font-size: ${(p) => p.theme.fontSize.md};
    }
`;

export const Input = styled.input`
    ${controlStyles}
    &[type="date"] {
        min-width: 0;
    }
`;

export const Textarea = styled.textarea`
    ${controlStyles}
    padding: 10px 12px;
    min-height: 80px;
    resize: vertical;
    line-height: 1.5;
`;

const SelectWrap = styled.div`
    position: relative;
    svg {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

const StyledSelect = styled.select`
    ${controlStyles}
    appearance: none;
    padding-right: 36px;
    text-overflow: ellipsis;
`;

export const Select = forwardRef(function Select({ children, ...rest }, ref) {
    return (
        <SelectWrap>
            <StyledSelect ref={ref} {...rest}>
                {children}
            </StyledSelect>
            <ChevronDown size={16} aria-hidden="true" />
        </SelectWrap>
    );
});

/** Seletor de data nativo (teclado e leitores de tela funcionam sem bibliotecas). */
export const DatePicker = forwardRef(function DatePicker(props, ref) {
    return <Input ref={ref} type="date" {...props} />;
});

const MoneyWrap = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    span {
        position: absolute;
        left: 12px;
        color: ${(p) => p.theme.colors.textMuted};
        font-size: ${(p) => (p.$large ? p.theme.fontSize.xl : p.theme.fontSize.md)};
        pointer-events: none;
    }
    input {
        padding-left: ${(p) => (p.$large ? "52px" : "40px")};
        font-variant-numeric: tabular-nums;
        ${(p) =>
            p.$large &&
            css`
                min-height: 64px;
                font-size: ${p.theme.fontSize["3xl"]};
                font-weight: 600;
                letter-spacing: -0.02em;
            `}
    }
`;

const currencySymbol = (locale, currency) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;

/**
 * Campo monetário com máscara brasileira: digitar "8590" mostra "85,90".
 * Também aceita colar "R$ 1.234,56". value/onChange trabalham em centavos inteiros.
 */
export const MoneyInput = forwardRef(function MoneyInput({ value, onChange, large = false, allowZero = true, ...rest }, ref) {
    const { store } = useFinance();
    const { locale, currency } = store.settings;
    const [text, setText] = useState(() => (value ? formatDecimal(value, locale) : ""));

    useEffect(() => {
        const current = digitsToCents(text);
        if (value !== current) setText(value ? formatDecimal(value, locale) : "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, locale]);

    const handleChange = (e) => {
        const raw = e.target.value;
        const cents = digitsToCents(raw);
        setText(cents ? formatDecimal(cents, locale) : allowZero && /\d/.test(raw) ? "" : "");
        onChange?.(cents);
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData("text");
        const cents = parseMoneyString(pasted);
        if (cents !== null) {
            e.preventDefault();
            const abs = Math.abs(cents);
            setText(abs ? formatDecimal(abs, locale) : "");
            onChange?.(abs);
        }
    };

    return (
        <MoneyWrap $large={large}>
            <span aria-hidden="true">{currencySymbol(locale, currency)}</span>
            <Input ref={ref} inputMode="decimal" autoComplete="off" placeholder="0,00" value={text} onChange={handleChange} onPaste={handlePaste} {...rest} />
        </MoneyWrap>
    );
});

// Controle segmentado (padrão Nexus): trilho em superfície secundária, opção ativa elevada com sombra leve.
const SegWrap = styled.div`
    display: grid;
    grid-template-columns: repeat(${(p) => p.$count}, 1fr);
    gap: 4px;
    padding: 4px;
    padding: 2px;
    gap: 2px;
    border-radius: 8px;
    background: ${(p) => p.theme.colors.bgSurface};
    border: 1px solid ${(p) => p.theme.colors.border};
`;

const SegButton = styled.button`
    min-height: 32px;
    padding: 0 10px;
    border-radius: 6px;
    font-weight: 600;
    font-size: ${(p) => p.theme.fontSize.sm};
    color: ${(p) => (p["aria-checked"] ? p.theme.colors[p.$tone] ?? p.theme.colors.text : p.theme.colors.textSecondary)};
    background: ${(p) => (p["aria-checked"] ? p.theme.colors.bgElevated : "transparent")};
    border: 1px solid ${(p) => (p["aria-checked"] ? p.theme.colors.border : "transparent")};
    box-shadow: ${(p) => (p["aria-checked"] ? "0 1px 2px rgba(15, 15, 17, 0.08)" : "none")};
    transition: background ${(p) => p.theme.motion.fast}, color ${(p) => p.theme.motion.fast};
    &:hover {
        color: ${(p) => p.theme.colors.text};
    }
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
`;

/** Grupo de opções exclusivas com navegação por setas (padrão radiogroup). */
export function SegmentedControl({ options, value, onChange, label, id }) {
    const onKey = (e, idx) => {
        if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = options[(idx + dir + options.length) % options.length];
        onChange(next.value);
        e.currentTarget.parentElement.querySelectorAll("button")[options.indexOf(next)]?.focus();
    };
    return (
        <SegWrap role="radiogroup" aria-label={label} $count={options.length} id={id}>
            {options.map((o, i) => (
                <SegButton
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={value === o.value}
                    tabIndex={value === o.value ? 0 : -1}
                    $tone={o.tone}
                    onClick={() => onChange(o.value)}
                    onKeyDown={(e) => onKey(e, i)}
                >
                    {o.icon && <o.icon size={16} aria-hidden="true" />}
                    {o.label}
                </SegButton>
            ))}
        </SegWrap>
    );
}

const SwitchLabel = styled.label`
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    cursor: pointer;
    font-size: ${(p) => p.theme.fontSize.md};
    input {
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
    }
    .track {
        position: relative;
        width: 40px;
        height: 24px;
        border-radius: 999px;
        background: ${(p) => p.theme.colors.borderStrong};
        transition: background ${(p) => p.theme.motion.fast};
        flex-shrink: 0;
    }
    .track::after {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        transition: transform ${(p) => p.theme.motion.fast} ${(p) => p.theme.motion.easingOut};
    }
    input:checked + .track {
        background: ${(p) => p.theme.colors.primary};
    }
    input:checked + .track::after {
        transform: translateX(16px);
    }
    input:focus-visible + .track {
        outline: 2px solid ${(p) => p.theme.colors.focus};
        outline-offset: 2px;
    }
    input:disabled + .track {
        opacity: 0.5;
    }
`;

export function Switch({ checked, onChange, label, disabled, description }) {
    return (
        <SwitchLabel>
            <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
            <span className="track" aria-hidden="true" />
            <span>
                {label}
                {description && (
                    <span style={{ display: "block", fontSize: "var(--v-font-size-sm)", color: "var(--v-color-text-secondary)" }}>{description}</span>
                )}
            </span>
        </SwitchLabel>
    );
}

export const Checkbox = styled.input.attrs({ type: "checkbox" })`
    width: 18px;
    height: 18px;
    accent-color: ${(p) => p.theme.colors.primary};
    cursor: pointer;
    &:disabled {
        cursor: not-allowed;
        opacity: ${(p) => p.theme.opacity.disabled};
    }
`;

export const Radio = styled.input.attrs({ type: "radio" })`
    width: 18px;
    height: 18px;
    accent-color: ${(p) => p.theme.colors.primary};
    cursor: pointer;
    &:disabled {
        cursor: not-allowed;
        opacity: ${(p) => p.theme.opacity.disabled};
    }
`;

const RadioFieldset = styled.fieldset`
    border: 0;
    display: grid;
    gap: 4px;
    legend {
        font-size: ${(p) => p.theme.fontSize.sm};
        font-weight: ${(p) => p.theme.fontWeight.medium};
        color: ${(p) => p.theme.colors.textSecondary};
        margin-bottom: 6px;
    }
    label {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        cursor: pointer;
    }
`;

/** Grupo de opções nativas (teclado e leitor de tela funcionam sem código extra). */
export function RadioGroup({ legend, name, options, value, onChange }) {
    return (
        <RadioFieldset>
            <legend>{legend}</legend>
            {options.map((o) => (
                <label key={o.value}>
                    <Radio name={name} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} />
                    {o.label}
                </label>
            ))}
        </RadioFieldset>
    );
}

export const FormGrid = styled.div`
    display: grid;
    gap: ${(p) => p.theme.space(4)};
    grid-template-columns: ${(p) => (p.$cols ? `repeat(${p.$cols}, minmax(0, 1fr))` : "1fr")};
    ${(p) => p.theme.media.mobile} {
        grid-template-columns: 1fr;
    }
`;

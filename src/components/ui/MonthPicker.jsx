import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "./Button";
import { focusRing, compactControl } from "./interaction";
import { addMonthsToKey, currentMonthKey, formatMonthLabel } from "../../domain/dates";

const Root = styled.div`
    display: inline-flex;
    align-items: center;
    ${compactControl}
    padding: 0 2px;
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgElevated};
    max-width: 100%;
    .label {
        min-width: 128px;
        padding-inline: 4px;
        margin: 0;
        font-family: ${(p) => p.theme.fonts.sans};
        font-size: 0.8125rem;
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        letter-spacing: 0;
        white-space: nowrap;
        text-align: center;
    }
    .today {
        margin-inline: 2px 4px;
        padding: 3px 8px;
        border-radius: ${(p) => p.theme.radius.sm};
        font-size: ${(p) => p.theme.fontSize.xs};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        color: ${(p) => p.theme.colors.accentText};
        background: ${(p) => p.theme.colors.accentSoft};
        ${focusRing()}
    }
`;

/**
 * Seletor de mês compacto (‹ Novembro de 2026 › · Hoje). Controlado: `value` é "AAAA-MM".
 * Fica junto do conteúdo que ele filtra (calendário, relatórios, orçamentos, transações),
 * e não no header global.
 */
export function MonthPicker({ value, onChange, label = "Mês de referência" }) {
    const isCurrent = value === currentMonthKey();
    return (
        <Root role="group" aria-label={label}>
            <IconButton icon={ChevronLeft} label="Mês anterior" size="sm" onClick={() => onChange(addMonthsToKey(value, -1))} />
            <p className="label" aria-live="polite">
                {formatMonthLabel(value)}
            </p>
            <IconButton icon={ChevronRight} label="Próximo mês" size="sm" onClick={() => onChange(addMonthsToKey(value, 1))} />
            {!isCurrent && (
                <button type="button" className="today" onClick={() => onChange(currentMonthKey())}>
                    Hoje
                </button>
            )}
        </Root>
    );
}

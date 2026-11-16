// Dinheiro é sempre representado em centavos inteiros. Nenhuma conta usa float persistido.

export const MAX_CENTS = 99_999_999_999; // R$ 999.999.999,99

const formatterCache = new Map();

function getFormatter(locale, currency, signDisplay) {
    const key = `${locale}|${currency}|${signDisplay}`;
    if (!formatterCache.has(key)) {
        formatterCache.set(
            key,
            new Intl.NumberFormat(locale, {
                style: "currency",
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                signDisplay,
            })
        );
    }
    return formatterCache.get(key);
}

/**
 * Formata centavos como moeda. Usa divisão apenas para exibição.
 */
export function formatMoney(cents, { locale = "pt-BR", currency = "BRL", signDisplay = "auto" } = {}) {
    const value = Number.isFinite(cents) ? cents : 0;
    return getFormatter(locale, currency, signDisplay).format(value / 100);
}

/** Formata sem símbolo de moeda: 1234,56 */
export function formatDecimal(cents, locale = "pt-BR") {
    const value = Number.isFinite(cents) ? cents : 0;
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
}

/** Converte um número (reais) para centavos com arredondamento correto. */
export function numberToCents(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    // toFixed evita 1.005 * 100 = 100.49999
    return parseMoneyString(value.toFixed(6), { decimal: "." });
}

/**
 * Converte texto em centavos. Aceita "1.234,56", "1234.56", "R$ 85,90", "-10", "(10,00)".
 * decimal: "auto" | "," | "." — separador decimal esperado.
 * Retorna null quando o texto não representa um valor.
 */
export function parseMoneyString(input, { decimal = "auto" } = {}) {
    if (input === null || input === undefined) return null;
    let s = String(input).trim();
    if (!s) return null;

    let negative = false;
    if (/^\(.*\)$/.test(s)) {
        negative = true;
        s = s.slice(1, -1);
    }
    s = s.replace(/[R$\s\u00a0\u20ac\u00a3US]/g, "");
    if (s.startsWith("-")) {
        negative = !negative;
        s = s.slice(1);
    } else if (s.endsWith("-")) {
        negative = !negative;
        s = s.slice(0, -1);
    }
    if (s.startsWith("+")) s = s.slice(1);
    if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;

    let sep = decimal;
    if (sep === "auto") {
        const lastComma = s.lastIndexOf(",");
        const lastDot = s.lastIndexOf(".");
        if (lastComma >= 0 && lastDot >= 0) sep = lastComma > lastDot ? "," : ".";
        else if (lastComma >= 0) sep = s.split(",").length > 2 ? "none" : ",";
        else if (lastDot >= 0) {
            const parts = s.split(".");
            // "1.234.567" ou "1.200" (milhar pt-BR) vs "742.35" / "5000.5" (decimal)
            if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3 && parts[0] !== "0")) sep = "none";
            else sep = ".";
        } else sep = "none";
    }

    let intPart = s;
    let fracPart = "";
    if (sep !== "none") {
        const idx = s.lastIndexOf(sep);
        if (idx >= 0) {
            intPart = s.slice(0, idx);
            fracPart = s.slice(idx + 1);
        }
    }
    if (/[.,]/.test(intPart)) {
        // Separadores de milhar só são válidos em grupos de 3 dígitos: 1.234.567
        const groups = intPart.split(/[.,]/);
        const thousandSeps = new Set(intPart.replace(/\d/g, ""));
        if (thousandSeps.size > 1) return null;
        if (!/^\d{1,3}$/.test(groups[0]) || groups.slice(1).some((g) => !/^\d{3}$/.test(g))) return null;
    }
    intPart = intPart.replace(/[.,]/g, "");
    if (/[.,]/.test(fracPart)) return null;
    if (!intPart) intPart = "0";

    // Arredondamento half-up na terceira casa, sem float.
    const frac3 = (fracPart + "000").slice(0, 3);
    let cents = BigInt(intPart) * 100n + BigInt(frac3.slice(0, 2));
    if (Number(frac3[2]) >= 5) cents += 1n;
    if (cents > BigInt(MAX_CENTS)) return null;
    const result = Number(cents);
    return negative ? -result : result;
}

/** Soma uma lista de centavos (ignora valores inválidos). */
export function sumCents(values) {
    let total = 0;
    for (const v of values) if (Number.isInteger(v)) total += v;
    return total;
}

/**
 * Divide um total em N partes inteiras. O resto (centavos) vai para as primeiras parcelas.
 * splitCents(1000, 3) => [334, 333, 333]
 */
export function splitCents(total, parts) {
    if (!Number.isInteger(total) || !Number.isInteger(parts) || parts < 1) {
        throw new Error("splitCents: total e parts devem ser inteiros e parts >= 1");
    }
    const base = Math.trunc(total / parts);
    let remainder = total - base * parts;
    return Array.from({ length: parts }, () => {
        if (remainder > 0) {
            remainder -= 1;
            return base + 1;
        }
        return base;
    });
}

/** Percentual (0-100+) com proteção de divisão por zero. */
export function percentOf(part, whole) {
    if (!whole) return 0;
    return (part / whole) * 100;
}

/** Variação percentual entre dois valores. null quando não há base para comparar. */
export function variation(current, previous) {
    if (!previous) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
}

export function isValidCents(v) {
    return Number.isInteger(v) && v > 0 && v <= MAX_CENTS;
}

/** Máscara de digitação estilo app bancário: dígitos viram centavos. "8590" => 8590 (R$ 85,90). */
export function digitsToCents(text) {
    const digits = String(text ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 13);
    if (!digits) return 0;
    return Math.min(Number(digits), MAX_CENTS);
}

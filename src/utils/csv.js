// Utilitários de CSV com proteção contra injeção de fórmulas (CSV/Formula Injection).
// Planilhas executam células que começam com = + - @ (mesmo após espaços), tab ou CR.

const FORMULA_START = /^[\s\u00a0]*[=+\-@\uff1d\uff0b\uff0d\uff20]|^[\t\r\n]/;
// Valores puramente numéricos/monetários (ex.: "-R$ 1.234,56", "-12,5") não são fórmulas.
const PLAIN_NUMBER = /^[+-]?[\s\u00a0]*(?:R\$|US\$|\u20ac|\u00a3)?[\s\u00a0]*\d[\d.,]*%?$/;

/** Neutraliza texto que seria interpretado como fórmula, prefixando com apóstrofo. */
export function safeCell(value) {
    const s = String(value ?? "");
    return FORMULA_START.test(s) && !PLAIN_NUMBER.test(s) ? `'${s}` : s;
}

/** Campo CSV (separador ";") já protegido contra fórmulas. Números são formatados com vírgula decimal. */
export function csvField(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2).replace(".", ",");
    const s = safeCell(value);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Monta o texto CSV com BOM (para o Excel reconhecer UTF-8) e quebras CRLF. */
export function toCsv(rows) {
    return `\ufeff${rows.map((r) => r.map(csvField).join(";")).join("\r\n")}`;
}

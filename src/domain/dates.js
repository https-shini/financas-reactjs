// Datas de negócio são strings "YYYY-MM-DD" em horário local. Nunca usamos Date.toISOString()
// para obter o dia, pois isso converte para UTC e muda a data no fim do dia no Brasil.
import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    differenceInCalendarDays,
    differenceInCalendarMonths,
    endOfMonth,
    format,
    isValid,
    parse,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export function toISODate(date) {
    return format(date, "yyyy-MM-dd");
}

/** Converte "YYYY-MM-DD" para Date local ao meio-dia (imune a horário de verão). */
export function fromISODate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function isValidISODate(iso) {
    if (typeof iso !== "string" || !ISO_RE.test(iso)) return false;
    const d = fromISODate(iso);
    return isValid(d) && toISODate(d) === iso;
}

export function isValidMonthKey(key) {
    return typeof key === "string" && MONTH_RE.test(key) && Number(key.slice(5)) >= 1 && Number(key.slice(5)) <= 12;
}

export function todayISO(now = new Date()) {
    return toISODate(now);
}

export function monthKeyOf(iso) {
    return iso.slice(0, 7);
}

export function currentMonthKey(now = new Date()) {
    return format(now, "yyyy-MM");
}

export function addDaysISO(iso, n) {
    return toISODate(addDays(fromISODate(iso), n));
}

export function addMonthsISO(iso, n) {
    return toISODate(addMonths(fromISODate(iso), n));
}

export function addWeeksISO(iso, n) {
    return toISODate(addWeeks(fromISODate(iso), n));
}

export function addYearsISO(iso, n) {
    return toISODate(addYears(fromISODate(iso), n));
}

export function addMonthsToKey(key, n) {
    return format(addMonths(fromISODate(`${key}-01`), n), "yyyy-MM");
}

export function monthStart(key) {
    return `${key}-01`;
}

export function monthEnd(key) {
    return toISODate(endOfMonth(fromISODate(`${key}-01`)));
}

export function daysInMonth(key) {
    return Number(monthEnd(key).slice(8));
}

/** Data com dia fixo no mês, limitada ao último dia (ex.: dia 31 em fevereiro => 28/29). */
export function dateInMonth(key, day) {
    const d = Math.min(Math.max(1, day), daysInMonth(key));
    return `${key}-${String(d).padStart(2, "0")}`;
}

export function diffDays(a, b) {
    return differenceInCalendarDays(fromISODate(a), fromISODate(b));
}

export function diffMonths(a, b) {
    return differenceInCalendarMonths(fromISODate(a), fromISODate(b));
}

export function isBetween(iso, start, end) {
    return iso >= start && iso <= end;
}

/** Lista de chaves de mês terminando em endKey (inclusive), em ordem crescente. */
export function lastMonths(endKey, count) {
    return Array.from({ length: count }, (_, i) => addMonthsToKey(endKey, i - count + 1));
}

export function monthsBetween(startKey, endKey) {
    const out = [];
    let k = startKey;
    let guard = 0;
    while (k <= endKey && guard < 1200) {
        out.push(k);
        k = addMonthsToKey(k, 1);
        guard += 1;
    }
    return out;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatMonthLabel(key, style = "long") {
    const d = fromISODate(`${key}-01`);
    if (style === "short") return cap(format(d, "MMM yy", { locale: ptBR }).replace(".", ""));
    return cap(format(d, "MMMM 'de' yyyy", { locale: ptBR }));
}

export function formatDateBR(iso, pattern = "dd/MM/yyyy") {
    if (!isValidISODate(iso)) return "";
    return format(fromISODate(iso), pattern, { locale: ptBR });
}

/** Rótulo amigável para agrupamento por dia: Hoje, Ontem, "seg., 10 de nov." */
export function formatDayHeading(iso, today = todayISO()) {
    const diff = diffDays(iso, today);
    if (diff === 0) return "Hoje";
    if (diff === -1) return "Ontem";
    if (diff === 1) return "Amanhã";
    const sameYear = iso.slice(0, 4) === today.slice(0, 4);
    return cap(format(fromISODate(iso), sameYear ? "EEEE, d 'de' MMMM" : "d 'de' MMMM 'de' yyyy", { locale: ptBR }));
}

/** Aceita "dd/mm/aaaa", "dd/mm/aa", "aaaa-mm-dd", "dd-mm-aaaa", serial do Excel. Retorna ISO ou null. */
export function parseFlexibleDate(value) {
    if (value === null || value === undefined || value === "") return null;
    if (value instanceof Date && isValid(value)) return toISODate(value);
    if (typeof value === "number" && Number.isFinite(value) && value > 20000 && value < 80000) {
        // Serial do Excel (base 1899-12-30)
        const base = new Date(1899, 11, 30, 12);
        return toISODate(addDays(base, Math.floor(value)));
    }
    const s = String(value).trim();
    if (ISO_RE.test(s)) return isValidISODate(s) ? s : null;
    if (/^\d{8}/.test(s)) {
        // OFX: 20261116 ou 20261116120000[-3:BRT]
        const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
        return isValidISODate(iso) ? iso : null;
    }
    for (const pattern of ["dd/MM/yyyy", "d/M/yyyy", "dd/MM/yy", "d/M/yy", "dd-MM-yyyy", "dd.MM.yyyy"]) {
        const d = parse(s, pattern, new Date(2000, 0, 1, 12));
        if (isValid(d) && d.getFullYear() > 1900 && d.getFullYear() < 2200) return toISODate(d);
    }
    return null;
}

// Captura rápida: interpreta frases como "Mercado 85,90 ontem" ou "recebi salário 5.000 dia 5".
// O resultado é sempre uma PRÉVIA — o usuário confirma antes de salvar.
import { addDaysISO, dateInMonth, isValidISODate, monthKeyOf, parseFlexibleDate } from "./dates";
import { parseMoneyString } from "./money";
import { normalizeForMatch, cleanText } from "./transactions";
import { isCard } from "./cards";

const INCOME_HINTS = ["recebi", "receita", "ganhei", "entrada", "salario", "rendimento", "reembolso", "pix recebido"];
const DATE_WORDS = { hoje: 0, ontem: -1, anteontem: -2, amanha: 1 };

const MONEY_RE = /(?:r\$\s*)?[+-]?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|(?:r\$\s*)?[+-]?\d+(?:[.,]\d{1,2})?/i;

export function parseQuickEntry(text, store, today) {
    const original = cleanText(text, 200);
    let rest = ` ${original} `;
    const notes = [];

    // Data: "dia 5", dd/mm(/aaaa), palavras.
    let date = today;
    let dateFound = false;
    const full = rest.match(/\s(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s/);
    if (full) {
        const raw = full[1].split("/").length === 2 ? `${full[1]}/${today.slice(0, 4)}` : full[1];
        const iso = parseFlexibleDate(raw);
        if (iso) {
            date = iso;
            dateFound = true;
            rest = rest.replace(full[0], " ");
        }
    }
    if (!dateFound) {
        const day = rest.match(/\sdia\s(\d{1,2})\s/i);
        if (day) {
            const d = Number(day[1]);
            if (d >= 1 && d <= 31) {
                date = dateInMonth(monthKeyOf(today), d);
                dateFound = true;
                rest = rest.replace(day[0], " ");
            }
        }
    }
    if (!dateFound) {
        for (const [word, offset] of Object.entries(DATE_WORDS)) {
            const re = new RegExp(`\\s(${word === "amanha" ? "amanh[aã]" : word})\\s`, "i");
            const m = rest.match(re);
            if (m) {
                date = addDaysISO(today, offset);
                dateFound = true;
                rest = rest.replace(m[0], " ");
                break;
            }
        }
    }

    // Valor
    let amountCents = 0;
    let negative = false;
    const money = rest.match(MONEY_RE);
    if (money) {
        const cents = parseMoneyString(money[0]);
        if (cents !== null) {
            amountCents = Math.abs(cents);
            negative = cents < 0;
            rest = rest.replace(money[0], " ");
        }
    }
    if (!amountCents) notes.push("Não encontrei o valor.");

    // Conta mencionada pelo nome
    let accountId = (store.accounts.find((a) => !a.archived && !isCard(a)) ?? store.accounts[0]).id;
    const normRest = normalizeForMatch(rest);
    for (const acc of [...store.accounts].sort((a, b) => b.name.length - a.name.length)) {
        if (acc.archived) continue;
        const n = normalizeForMatch(acc.name);
        if (n.length >= 3 && normRest.includes(n)) {
            accountId = acc.id;
            break;
        }
    }

    // Tipo
    const words = normalizeForMatch(rest);
    let type = negative ? "expense" : original.trim().startsWith("+") ? "income" : "expense";
    if (INCOME_HINTS.some((h) => words.includes(h))) type = "income";

    // Categoria: maior palavra-chave ou nome encontrado
    let best = null;
    for (const c of store.categories) {
        if (c.archived) continue;
        for (const kw of [c.name, ...(c.keywords ?? [])]) {
            const k = normalizeForMatch(kw);
            if (k.length < 2) continue;
            const re = new RegExp(`(^| )${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`);
            if (re.test(words) && (!best || k.length > best.len)) best = { category: c, len: k.length };
        }
    }
    let categoryId = best?.category.id ?? null;
    if (best && best.category.kind === "income" && !negative) type = "income";
    if (best && best.category.kind !== type && best.category.kind !== "both") categoryId = null;

    const description = cleanText(rest.replace(/\s(?:no|na|em|de|com|pra|para)\s*$/i, " "));
    const finalDescription = description ? description.charAt(0).toUpperCase() + description.slice(1) : best?.category.name ?? "";
    if (!finalDescription) notes.push("Inclua uma descrição.");

    const input = {
        type,
        amountCents,
        description: finalDescription,
        date: isValidISODate(date) ? date : today,
        categoryId,
        accountId,
        status: date > today ? "pending" : "paid",
    };
    return { input, ok: amountCents > 0 && Boolean(finalDescription), notes, guessedCategory: Boolean(best) };
}

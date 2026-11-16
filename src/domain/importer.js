// Importação: lê CSV/OFX (texto) e linhas de planilhas, sugere o mapeamento de colunas,
// valida cada linha e marca possíveis duplicados. Nenhuma linha é descartada em silêncio.
import { parseFlexibleDate } from "./dates";
import { parseMoneyString } from "./money";
import { buildTransaction, cleanText, DESCRIPTION_MAX, fingerprint, normalizeForMatch } from "./transactions";

export const MAX_IMPORT_ROWS = 20000;

/** Divide CSV respeitando aspas. Detecta ; , ou tab pelo cabeçalho. */
export function parseCSV(text) {
    const clean = text.replace(/^\ufeff/, "");
    const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
    const counts = { ";": (firstLine.match(/;/g) ?? []).length, ",": (firstLine.match(/,/g) ?? []).length, "\t": (firstLine.match(/\t/g) ?? []).length };
    const delimiter = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][1] > 0 ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] : ",";
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < clean.length; i += 1) {
        const ch = clean[i];
        if (quoted) {
            if (ch === '"') {
                if (clean[i + 1] === '"') {
                    field += '"';
                    i += 1;
                } else quoted = false;
            } else field += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === delimiter) {
            row.push(field);
            field = "";
        } else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && clean[i + 1] === "\n") i += 1;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else field += ch;
    }
    if (field !== "" || row.length) {
        row.push(field);
        rows.push(row);
    }
    return { delimiter, rows: rows.filter((r) => r.some((c) => String(c).trim() !== "")) };
}

/** Lê extrato OFX (SGML ou XML). Retorna linhas no formato tabular com cabeçalho. */
export function parseOFX(text) {
    const blocks = text.split(/<STMTTRN>/i).slice(1);
    const tag = (block, name) => {
        const m = block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, "i"));
        return m ? m[1].trim() : "";
    };
    const header = ["Data", "Descrição", "Valor", "Tipo", "Identificador"];
    const rows = blocks.map((b) => {
        const body = b.split(/<\/STMTTRN>/i)[0];
        const amount = tag(body, "TRNAMT");
        const memo = tag(body, "MEMO") || tag(body, "NAME") || "Sem descrição";
        return [tag(body, "DTPOSTED"), memo, amount, Number(amount.replace(",", ".")) < 0 ? "Despesa" : "Receita", tag(body, "FITID")];
    });
    return { rows: [header, ...rows] };
}

const GUESS = {
    date: ["data", "date", "dt", "data lancamento", "data do lancamento", "vencimento", "dia"],
    description: ["descricao", "description", "historico", "memo", "lancamento", "estabelecimento", "titulo", "nome"],
    amount: ["valor", "amount", "quantia", "montante", "valor r$", "valor (r$)", "preco"],
    type: ["tipo", "type", "tipo (entrada/saida)", "natureza", "entrada/saida"],
    category: ["categoria", "category"],
    notes: ["observacoes", "observacao", "notas", "notes", "obs"],
    status: ["status", "situacao"],
};

/** Sugere o mapeamento campo → índice da coluna a partir do cabeçalho. */
export function guessMapping(header) {
    const norm = header.map((h) => normalizeForMatch(h));
    const mapping = {};
    for (const [field, names] of Object.entries(GUESS)) {
        let idx = norm.findIndex((h) => names.includes(h));
        if (idx < 0) idx = norm.findIndex((h) => names.some((n) => h.startsWith(n)));
        if (idx >= 0 && !Object.values(mapping).includes(idx)) mapping[field] = idx;
    }
    return mapping;
}

function detectType(raw, cents) {
    const t = normalizeForMatch(raw);
    if (/(saida|despesa|debito|debit|gasto|pagamento|expense|^d$|^-$)/.test(t)) return "expense";
    if (/(entrada|receita|credito|credit|income|deposito|^c$|^\+$)/.test(t)) return "income";
    if (/(transfer)/.test(t)) return null;
    return cents < 0 ? "expense" : "income";
}

/**
 * Constrói a prévia da importação.
 * options: { mapping, hasHeader, defaultDate, accountId, store }
 * Retorna { rows: [{ line, ok, errors, input, duplicate, raw }], stats }
 */
export function buildImportPreview(table, { mapping, hasHeader = true, defaultDate, accountId, store }) {
    const body = (hasHeader ? table.slice(1) : table).slice(0, MAX_IMPORT_ROWS);
    const categoryByName = new Map(store.categories.map((c) => [normalizeForMatch(c.name), c]));
    const existing = new Set(store.transactions.map(fingerprint));
    const seenInFile = new Set();
    const get = (row, field) => (mapping[field] === undefined || mapping[field] === null || mapping[field] === "" ? undefined : row[Number(mapping[field])]);

    const rows = body.map((raw, i) => {
        const line = i + (hasHeader ? 2 : 1);
        const errors = [];
        const warnings = [];

        const amountRaw = get(raw, "amount");
        const cents = typeof amountRaw === "number" ? Math.round(amountRaw * 100) : parseMoneyString(amountRaw);
        if (cents === null || cents === undefined) errors.push("Valor ausente ou inválido");
        else if (cents === 0) errors.push("Valor igual a zero");

        let date = defaultDate;
        const dateRaw = get(raw, "date");
        if (mapping.date !== undefined && mapping.date !== null && mapping.date !== "") {
            date = parseFlexibleDate(dateRaw);
            if (!date) errors.push(`Data inválida: "${String(dateRaw ?? "").slice(0, 20)}"`);
        }

        const description = cleanText(get(raw, "description"), DESCRIPTION_MAX) || "Sem descrição";
        if (description === "Sem descrição") warnings.push("Sem descrição");

        const type = cents ? detectType(get(raw, "type") ?? "", cents) : "expense";
        if (type === null) errors.push("Transferências não são importadas (registre-as manualmente)");

        let categoryId = null;
        const catRaw = get(raw, "category");
        if (catRaw) {
            const cat = categoryByName.get(normalizeForMatch(catRaw));
            if (cat) categoryId = cat.id;
            else warnings.push(`Categoria "${String(catRaw).slice(0, 30)}" não encontrada`);
        }

        const statusRaw = normalizeForMatch(get(raw, "status") ?? "");
        const status = /pendente|aberto|a pagar|a receber|pending/.test(statusRaw) ? "pending" : "paid";

        const input = {
            type: type ?? "expense",
            amountCents: cents ? Math.abs(cents) : 0,
            description,
            date,
            categoryId,
            accountId,
            status,
            notes: cleanText(get(raw, "notes"), 500) || undefined,
        };
        let duplicate = false;
        if (!errors.length) {
            const fp = fingerprint(input);
            duplicate = existing.has(fp) || seenInFile.has(fp);
            seenInFile.add(fp);
        }
        return { line, ok: errors.length === 0, errors, warnings, input, duplicate, raw };
    });

    return {
        rows,
        stats: {
            total: rows.length,
            valid: rows.filter((r) => r.ok).length,
            invalid: rows.filter((r) => !r.ok).length,
            duplicates: rows.filter((r) => r.ok && r.duplicate).length,
            truncated: (hasHeader ? table.length - 1 : table.length) > MAX_IMPORT_ROWS,
        },
    };
}

/** Cria as transações das linhas escolhidas. */
export function rowsToTransactions(rows, now = new Date().toISOString()) {
    return rows.map((r) => buildTransaction(r.input, { now }));
}

// Importação simples (Fase 0). A importação completa com prévia fica em features/data.
import { parseMoneyString } from "../domain/money";
import { buildTransaction, cleanText } from "../domain/transactions";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const data = [
        { Data: "05/11/2026", Descrição: "Salário", Valor: "5000,00", Tipo: "Receita", Categoria: "Salário" },
        { Data: "06/11/2026", Descrição: "Aluguel", Valor: "1200,00", Tipo: "Despesa", Categoria: "Moradia" },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo_importacao.xlsx");
}

export async function processImportFile(file, { today, accountId }) {
    if (file.size > MAX_IMPORT_BYTES) throw new Error("Arquivo maior que 5 MB.");
    const XLSX = await import("xlsx");
    const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: "" });
    const transactions = [];
    const invalid = [];
    rows.forEach((row, i) => {
        const valueRaw = row["Valor"];
        const cents = parseMoneyString(valueRaw);
        if (cents === null || cents === 0) {
            invalid.push(i + 2);
            return;
        }
        const typeRaw = String(row["Tipo (Entrada/Saída)"] ?? row["Tipo"] ?? "").toLowerCase();
        const isExpense = /sa[ií]da|despesa|d[eé]bito/.test(typeRaw) || (!typeRaw && cents < 0);
        transactions.push(
            buildTransaction({
                type: isExpense ? "expense" : "income",
                amountCents: Math.abs(cents),
                description: cleanText(row["Descrição"]) || "Sem descrição",
                date: today,
                accountId,
                categoryId: null,
                status: "paid",
            })
        );
    });
    return { transactions, invalid };
}

// Exportação de transações. As bibliotecas pesadas são carregadas sob demanda (import dinâmico).
import { formatMoney } from "../domain/money";
import { formatDateBR } from "../domain/dates";
import { TYPE_LABEL } from "../domain/transactions";
import { downloadText } from "../storage/backup";

const STATUS_LABEL = { paid: "Pago", pending: "Pendente" };

/** Evita injeção de fórmulas ao abrir no Excel/Planilhas (=, +, -, @ no início). */
export function safeCell(value) {
    const s = String(value ?? "");
    return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

/** Linhas tabulares com nomes de categoria e conta resolvidos. */
export function toRows(transactions, store) {
    const cats = new Map((store?.categories ?? []).map((c) => [c.id, c.name]));
    const accs = new Map((store?.accounts ?? []).map((a) => [a.id, a.name]));
    return transactions.map((t) => ({
        Data: formatDateBR(t.date),
        Descrição: safeCell(t.description),
        Tipo: TYPE_LABEL[t.type],
        Valor: (t.type === "expense" ? -t.amountCents : t.amountCents) / 100,
        Categoria: t.categoryId ? cats.get(t.categoryId) ?? "" : "",
        Conta: accs.get(t.accountId) ?? "",
        "Conta destino": t.toAccountId ? accs.get(t.toAccountId) ?? "" : "",
        Status: STATUS_LABEL[t.status],
        Observações: safeCell(t.notes ?? ""),
    }));
}

const stamp = () => new Date().toISOString().slice(0, 10);

export async function exportToExcel(transactions, store, filename = `financas-${stamp()}.xlsx`) {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(toRows(transactions, store));
    ws["!cols"] = [{ wch: 11 }, { wch: 40 }, { wch: 13 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transações");
    XLSX.writeFile(wb, filename);
}

export function exportToCsv(transactions, store, filename = `financas-${stamp()}.csv`) {
    const rows = toRows(transactions, store);
    const headers = Object.keys(rows[0] ?? { Data: "", Descrição: "", Tipo: "", Valor: "" });
    const esc = (v) => {
        const s = typeof v === "number" ? v.toFixed(2).replace(".", ",") : String(v ?? "");
        return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\r\n");
    // BOM para o Excel reconhecer UTF-8; ";" é o separador padrão no Brasil.
    downloadText(`\ufeff${csv}`, filename, "text/csv");
}

export async function exportToPDF(transactions, store, { title = "Relatório de movimentações", subtitle = "", filename = `financas-${stamp()}.pdf` } = {}) {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    if (subtitle) {
        doc.setFontSize(10);
        doc.text(subtitle, 14, 22);
    }
    const rows = toRows(transactions, store);
    autoTable(doc, {
        head: [["Data", "Descrição", "Categoria", "Tipo", "Status", "Valor"]],
        body: rows.map((r, i) => [r.Data, r.Descrição, r.Categoria, r.Tipo, r.Status, formatMoney(transactions[i].type === "expense" ? -transactions[i].amountCents : transactions[i].amountCents)]),
        startY: subtitle ? 27 : 22,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: { 5: { halign: "right" } },
    });
    doc.save(filename);
}

export async function exportToWord(transactions, store, { title = "Relatório de movimentações", filename = `financas-${stamp()}.docx` } = {}) {
    const [{ Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun, HeadingLevel }, { saveAs }] = await Promise.all([
        import("docx"),
        import("file-saver"),
    ]);
    const rows = toRows(transactions, store);
    const cell = (text, bold = false) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(text), bold })] })] });
    const header = new TableRow({ children: ["Data", "Descrição", "Categoria", "Tipo", "Valor"].map((h) => cell(h, true)) });
    const body = rows.map(
        (r, i) =>
            new TableRow({
                children: [
                    cell(r.Data),
                    cell(r.Descrição),
                    cell(r.Categoria),
                    cell(r.Tipo),
                    cell(formatMoney(transactions[i].type === "expense" ? -transactions[i].amountCents : transactions[i].amountCents)),
                ],
            })
    );
    const doc = new Document({
        sections: [
            {
                children: [
                    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: "" }),
                    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...body] }),
                ],
            },
        ],
    });
    saveAs(await Packer.toBlob(doc), filename);
}

// Exportação de transações. As bibliotecas pesadas são carregadas sob demanda (import dinâmico).
import { formatMoney } from "../domain/money";
import { formatDateBR } from "../domain/dates";
import { TYPE_LABEL } from "../domain/transactions";
import { downloadText } from "../storage/backup";
import { safeCell, toCsv } from "./csv";

export { safeCell };

const STATUS_LABEL = { paid: "Pago", pending: "Pendente" };

/**
 * Linhas tabulares com nomes de categoria e conta resolvidos.
 * safe: protege textos contra injeção de fórmulas (CSV/XLSX). PDF e Word usam o texto original.
 */
export function toRows(transactions, store, { safe = true } = {}) {
    const txt = safe ? safeCell : (v) => String(v ?? "");
    const cats = new Map((store?.categories ?? []).map((c) => [c.id, c.name]));
    const accs = new Map((store?.accounts ?? []).map((a) => [a.id, a.name]));
    return transactions.map((t) => ({
        Data: formatDateBR(t.date),
        Descrição: txt(t.description),
        Tipo: TYPE_LABEL[t.type],
        Valor: (t.type === "expense" ? -t.amountCents : t.amountCents) / 100,
        Categoria: txt(t.categoryId ? cats.get(t.categoryId) ?? "" : ""),
        Conta: txt(accs.get(t.accountId) ?? ""),
        "Conta destino": txt(t.toAccountId ? accs.get(t.toAccountId) ?? "" : ""),
        Status: STATUS_LABEL[t.status],
        Observações: txt(t.notes ?? ""),
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
    // ";" é o separador padrão no Brasil; toCsv inclui BOM e protege contra fórmulas.
    downloadText(toCsv([headers, ...rows.map((r) => headers.map((h) => r[h]))]), filename, "text/csv");
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
    const rows = toRows(transactions, store, { safe: false });
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
    const rows = toRows(transactions, store, { safe: false });
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

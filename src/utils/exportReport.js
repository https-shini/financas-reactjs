// Exportação de relatórios (tabelas já formatadas) para PDF e CSV.
import { downloadText } from "../storage/backup";
import { toCsv } from "./csv";

/** sections: [{ heading, head: [...], body: [[...]] }] */
export async function exportReportPDF({ title, subtitle, sections, filename }) {
    const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.text(title, 14, 16);
    let y = 22;
    if (subtitle) {
        doc.setFontSize(10);
        doc.text(subtitle, 14, y);
        y += 6;
    }
    for (const s of sections) {
        if (!s.body.length) continue;
        doc.setFontSize(11);
        doc.text(s.heading, 14, y + 4);
        autoTable(doc, {
            head: [s.head],
            body: s.body,
            startY: y + 7,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] },
            columnStyles: Object.fromEntries(s.head.map((_, i) => [i, { halign: i === 0 ? "left" : "right" }])),
        });
        y = doc.lastAutoTable.finalY + 8;
        if (y > 260) {
            doc.addPage();
            y = 16;
        }
    }
    doc.save(filename);
}

export function exportReportCSV({ sections, filename }) {
    const rows = [];
    for (const s of sections) rows.push([s.heading], s.head, ...s.body, []);
    downloadText(toCsv(rows), filename, "text/csv");
}

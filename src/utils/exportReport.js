// Exportação de relatórios (tabelas já formatadas) para PDF e CSV.
import { downloadText } from "../storage/backup";

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
    const esc = (v) => {
        const s = String(v ?? "");
        return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [];
    for (const s of sections) {
        lines.push(esc(s.heading));
        lines.push(s.head.map(esc).join(";"));
        for (const row of s.body) lines.push(row.map(esc).join(";"));
        lines.push("");
    }
    downloadText(`\ufeff${lines.join("\r\n")}`, filename, "text/csv");
}

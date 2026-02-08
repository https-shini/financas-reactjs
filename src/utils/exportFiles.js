import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export const exportToExcel = (data) => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
        Descrição: item.desc,
        Valor: item.amount,
        Tipo: item.expense ? 'Saída' : 'Entrada'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finanças");
    XLSX.writeFile(workbook, "controle_financeiro.xlsx");
};

export const exportToPDF = (data) => {
    const doc = new jsPDF();
    doc.text("Relatório de Controle Financeiro", 14, 15);
    
    const tableData = data.map(item => [
        item.desc,
        `R$ ${parseFloat(item.amount).toFixed(2)}`,
        item.expense ? 'Saída' : 'Entrada'
    ]);

    doc.autoTable({
        head: [['Descrição', 'Valor', 'Tipo']],
        body: tableData,
        startY: 25,
        theme: 'grid',
        headStyles: { fillStyle: '#dc2626' }
    });

    doc.save("controle_financeiro.pdf");
};

export const exportToWord = async (data) => {
    const tableRows = [
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Descrição", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Valor", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tipo", bold: true })] })] }),
            ],
        }),
        ...data.map(item => new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(item.desc)] }),
                new TableCell({ children: [new Paragraph(`R$ ${parseFloat(item.amount).toFixed(2)}`)] }),
                new TableCell({ children: [new Paragraph(item.expense ? 'Saída' : 'Entrada')] }),
            ],
        }))
    ];

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    text: "Relatório de Controle Financeiro",
                    heading: "Heading1",
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ text: "" }), // Spacer
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: tableRows,
                }),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "controle_financeiro.docx");
};

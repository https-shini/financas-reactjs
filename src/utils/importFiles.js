import * as XLSX from 'xlsx';
import DOMPurify from 'dompurify';

export const downloadTemplate = () => {
    const data = [
        { "Descrição": "Exemplo Salário", "Valor": 5000, "Tipo (Entrada/Saída)": "Entrada" },
        { "Descrição": "Exemplo Aluguel", "Valor": 1200, "Tipo (Entrada/Saída)": "Saída" }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo");
    XLSX.writeFile(workbook, "modelo_importacao.xlsx");
};

export const processImportFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const validatedData = jsonData.map(item => {
                    const desc = DOMPurify.sanitize(String(item["Descrição"] || "Sem descrição"));
                    const amount = parseFloat(item["Valor"]);
                    const type = String(item["Tipo (Entrada/Saída)"]).toLowerCase();
                    
                    if (isNaN(amount)) return null;

                    return {
                        id: Math.round(Math.random() * 1000000),
                        desc,
                        amount: Math.abs(amount),
                        expense: type === 'saída' || type === 'saida'
                    };
                }).filter(item => item !== null);

                resolve(validatedData);
            } catch (error) {
                reject("Erro ao processar o arquivo. Verifique o formato.");
            }
        };
        reader.onerror = () => reject("Erro na leitura do arquivo.");
        reader.readAsArrayBuffer(file);
    });
};

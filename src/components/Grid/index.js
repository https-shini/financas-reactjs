import React, { useRef } from "react";
import GridItem from "../GridItem";
import * as C from "./styles";
import { useFinance } from "../../contexts/FinanceContext";
import { exportToExcel, exportToPDF, exportToWord } from "../../utils/exportFiles";
import { downloadTemplate, processImportFile } from "../../utils/importFiles";
import { FileSpreadsheet, FileText, File as FileIcon, Upload, Download } from "lucide-react";
import { toast } from "react-toastify";

const Grid = () => {
    const { transactionsList, addTransactionsBatch, deleteTransaction } = useFinance();
    const fileInputRef = useRef(null);

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const data = await processImportFile(file);
                if (data.length > 0) {
                    addTransactionsBatch(data);
                    toast.success(`${data.length} registros importados com sucesso!`);
                } else {
                    toast.warning("Nenhum registro válido encontrado no arquivo.");
                }
            } catch (error) {
                toast.error(error);
            }
        }
        e.target.value = null; // Reset input
    };

    return (
        <C.Container>
            <C.ExportContainer>
                <C.Button onClick={downloadTemplate} title="Baixar Modelo de Planilha">
                    <Download size={18} /> Modelo
                </C.Button>
                <C.Button onClick={() => fileInputRef.current.click()} title="Importar Planilha">
                    <Upload size={18} /> Importar
                </C.Button>
                <C.ImportInput 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    accept=".xlsx, .xls"
                />
                <div style={{ width: '1px', background: 'var(--clr-border)', margin: '0 5px' }} />
                <C.Button onClick={() => exportToExcel(transactionsList)} title="Exportar para Excel">
                    <FileSpreadsheet size={18} /> Excel
                </C.Button>
                <C.Button onClick={() => exportToPDF(transactionsList)} title="Exportar para PDF">
                    <FileIcon size={18} /> PDF
                </C.Button>
                <C.Button onClick={() => exportToWord(transactionsList)} title="Exportar para Word">
                    <FileText size={18} /> Word
                </C.Button>
            </C.ExportContainer>

            <C.TableWrapper>
                <C.Table>
                    <C.Thead>
                        <C.Tr>
                            <C.Th>Descrição</C.Th>
                            <C.Th>Valor</C.Th>
                            <C.Th alignCenter>Tipo</C.Th>
                            <C.Th></C.Th>
                        </C.Tr>
                    </C.Thead>
                    <C.Tbody>
                        {transactionsList?.map((item, index) => (
                            <GridItem key={item.id || index} item={item} onDelete={deleteTransaction} />
                        ))}
                    </C.Tbody>
                </C.Table>
            </C.TableWrapper>
        </C.Container>
    );
};

export default Grid;

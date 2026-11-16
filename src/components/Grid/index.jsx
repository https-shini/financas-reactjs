import { useMemo, useRef } from "react";
import GridItem from "../GridItem";
import * as C from "./styles";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { exportToExcel, exportToPDF, exportToWord } from "../../utils/exportFiles";
import { downloadTemplate, processImportFile } from "../../utils/importFiles";
import { downloadBackup, parseBackupText } from "../../storage/backup";
import { sortTransactions } from "../../domain/selectors";
import { FileSpreadsheet, FileText, File as FileIcon, Upload, Download, DatabaseBackup, ArchiveRestore } from "lucide-react";
import { toast } from "react-toastify";

const Grid = () => {
    const { store, today } = useFinance();
    const actions = useFinanceActions();
    const fileInputRef = useRef(null);
    const backupInputRef = useRef(null);
    const list = useMemo(() => sortTransactions(store.transactions, "date-desc"), [store.transactions]);

    const handleImport = async (e) => {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;
        try {
            const { transactions, invalid } = await processImportFile(file, { today, accountId: store.accounts[0].id });
            if (transactions.length > 0) {
                actions.addTransactions(transactions);
                toast.success(`${transactions.length} registros importados.`);
            }
            if (invalid.length) toast.warning(`${invalid.length} linha(s) ignoradas por valor inválido (linhas ${invalid.slice(0, 10).join(", ")}).`);
            if (!transactions.length && !invalid.length) toast.warning("Nenhum registro encontrado no arquivo.");
        } catch (error) {
            toast.error(error.message ?? String(error));
        }
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;
        const result = parseBackupText(await file.text());
        if (!result.ok) {
            toast.error(result.errors.join(" "));
            return;
        }
        const s = result.summary;
        const ok = window.confirm(
            `Restaurar backup com ${s.transactions} transações, ${s.accounts} contas e ${s.categories} categorias?\n\nOs dados atuais serão substituídos (uma cópia de segurança local será criada antes).`
        );
        if (!ok) return;
        try {
            actions.replaceStore(result.store, { backupReason: "antes-restauracao" });
            toast.success("Backup restaurado.");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = (item) => {
        const removed = actions.deleteTransactions([item.id]);
        toast.info(
            ({ closeToast }) => (
                <span>
                    Transação excluída.{" "}
                    <button
                        type="button"
                        style={{ textDecoration: "underline", fontWeight: 600, color: "inherit" }}
                        onClick={() => {
                            actions.restoreTransactions(removed);
                            closeToast();
                        }}
                    >
                        Desfazer
                    </button>
                </span>
            ),
            { autoClose: 6000 }
        );
    };

    return (
        <C.Container>
            <C.ExportContainer role="toolbar" aria-label="Arquivos">
                <C.Button type="button" onClick={downloadTemplate}>
                    <Download size={18} aria-hidden="true" /> Modelo
                </C.Button>
                <C.Button type="button" onClick={() => fileInputRef.current.click()}>
                    <Upload size={18} aria-hidden="true" /> Importar
                </C.Button>
                <C.ImportInput type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls,.csv" aria-label="Arquivo para importar" />
                <C.Button type="button" onClick={() => exportToExcel(list)}>
                    <FileSpreadsheet size={18} aria-hidden="true" /> Excel
                </C.Button>
                <C.Button type="button" onClick={() => exportToPDF(list)}>
                    <FileIcon size={18} aria-hidden="true" /> PDF
                </C.Button>
                <C.Button type="button" onClick={() => exportToWord(list)}>
                    <FileText size={18} aria-hidden="true" /> Word
                </C.Button>
                <C.Button
                    type="button"
                    onClick={() => {
                        downloadBackup(store);
                        actions.updateSettings({ lastBackupAt: new Date().toISOString() });
                    }}
                >
                    <DatabaseBackup size={18} aria-hidden="true" /> Backup
                </C.Button>
                <C.Button type="button" onClick={() => backupInputRef.current.click()}>
                    <ArchiveRestore size={18} aria-hidden="true" /> Restaurar
                </C.Button>
                <C.ImportInput type="file" ref={backupInputRef} onChange={handleRestore} accept=".json,application/json" aria-label="Arquivo de backup" />
            </C.ExportContainer>

            <C.TableWrapper>
                {list.length === 0 ? (
                    <C.Empty>Nenhuma transação ainda. Adicione a primeira usando o formulário acima ou importe uma planilha.</C.Empty>
                ) : (
                    <C.Table>
                        <caption className="sr-only">Transações</caption>
                        <C.Thead>
                            <C.Tr>
                                <C.Th scope="col">Descrição</C.Th>
                                <C.Th scope="col">Data</C.Th>
                                <C.Th scope="col">Valor</C.Th>
                                <C.Th scope="col" alignCenter>
                                    Tipo
                                </C.Th>
                                <C.Th scope="col">
                                    <span className="sr-only">Ações</span>
                                </C.Th>
                            </C.Tr>
                        </C.Thead>
                        <C.Tbody>
                            {list.map((item) => (
                                <GridItem key={item.id} item={item} onDelete={handleDelete} />
                            ))}
                        </C.Tbody>
                    </C.Table>
                )}
            </C.TableWrapper>
        </C.Container>
    );
};

export default Grid;

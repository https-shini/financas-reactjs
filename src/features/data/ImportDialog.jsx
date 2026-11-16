import { useMemo, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { Upload, FileDown } from "lucide-react";
import { Modal, ModalBody, ModalFooter, Button, Field, Select, DatePicker, Badge, Checkbox, Muted } from "../../components/ui";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { buildImportPreview, guessMapping, parseCSV, parseOFX, rowsToTransactions } from "../../domain/importer";
import { formatDateBR } from "../../domain/dates";
import { formatMoney } from "../../domain/money";
import { isCard } from "../../domain/cards";
import { downloadText } from "../../storage/backup";
import { toCsv } from "../../utils/csv";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

const FIELDS = [
    ["date", "Data"],
    ["description", "Descrição"],
    ["amount", "Valor"],
    ["type", "Tipo (receita/despesa)"],
    ["category", "Categoria"],
    ["status", "Status"],
    ["notes", "Observações"],
];

const TableWrap = styled.div`
    position: relative;
    overflow: auto;
    max-height: 340px;
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: ${(p) => p.theme.fontSize.sm};
    }
    th,
    td {
        padding: 8px 10px;
        text-align: left;
        border-bottom: 1px solid ${(p) => p.theme.colors.border};
        white-space: nowrap;
    }
    th {
        position: sticky;
        top: 0;
        background: ${(p) => p.theme.colors.bgSurface};
        font-weight: 600;
    }
    td.desc {
        white-space: normal;
        min-width: 160px;
    }
    tr.bad td {
        color: ${(p) => p.theme.colors.expense};
    }
`;

const Stats = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 12px 0;
`;

const Drop = styled.label`
    display: grid;
    justify-items: center;
    gap: 8px;
    padding: 32px 16px;
    border: 2px dashed ${(p) => p.theme.colors.borderStrong};
    border-radius: ${(p) => p.theme.radius.lg};
    text-align: center;
    cursor: pointer;
    color: ${(p) => p.theme.colors.textSecondary};
    &:hover,
    &:focus-within {
        border-color: ${(p) => p.theme.colors.primary};
        background: ${(p) => p.theme.colors.primarySoft};
    }
    input {
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
    }
`;

async function readTable(file) {
    const name = file.name.toLowerCase();
    if (file.size > MAX_FILE_BYTES) throw new Error("Arquivo maior que 5 MB.");
    if (name.endsWith(".ofx") || name.endsWith(".qfx")) return { table: parseOFX(await file.text()).rows, kind: "OFX" };
    if (name.endsWith(".csv") || name.endsWith(".txt")) return { table: parseCSV(await file.text()).rows, kind: "CSV" };
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".ods")) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const table = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "", blankrows: false });
        return { table: table.filter((r) => r.some((c) => String(c).trim() !== "")), kind: "Planilha" };
    }
    throw new Error("Formato não suportado. Use CSV, XLSX ou OFX.");
}

export async function downloadImportTemplate() {
    const XLSX = await import("xlsx");
    const rows = [
        ["Data", "Descrição", "Valor", "Tipo", "Categoria", "Status", "Observações"],
        ["05/11/2026", "Salário", "5000,00", "Receita", "Salário", "Pago", ""],
        ["06/11/2026", "Aluguel", "1800,00", "Despesa", "Moradia", "Pago", ""],
        ["20/11/2026", "Conta de luz", "180,50", "Despesa", "Moradia", "Pendente", "Vence dia 20"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "modelo-importacao-financas.xlsx");
}

/** Importação com prévia obrigatória: mapeamento, linhas inválidas, duplicados e confirmação. */
export function ImportDialog({ open, onClose }) {
    const { store, today } = useFinance();
    const { addTransactions, createLocalBackup } = useFinanceActions();
    const [file, setFile] = useState(null);
    const [table, setTable] = useState(null);
    const [kind, setKind] = useState("");
    const [mapping, setMapping] = useState({});
    const [hasHeader, setHasHeader] = useState(true);
    const [defaultDate, setDefaultDate] = useState(today);
    const [accountId, setAccountId] = useState(() => (store.accounts.find((a) => !a.archived && !isCard(a)) ?? store.accounts[0]).id);
    const [includeDuplicates, setIncludeDuplicates] = useState(false);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const onFile = async (e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        setBusy(true);
        setError(null);
        try {
            const { table: t, kind: k } = await readTable(f);
            if (!t.length) throw new Error("O arquivo não contém linhas.");
            setFile(f);
            setTable(t);
            setKind(k);
            setMapping(guessMapping(t[0].map(String)));
        } catch (err) {
            setError(err.message ?? String(err));
        } finally {
            setBusy(false);
        }
    };

    const preview = useMemo(
        () => (table ? buildImportPreview(table, { mapping, hasHeader, defaultDate, accountId, store }) : null),
        [table, mapping, hasHeader, defaultDate, accountId, store]
    );
    const header = table ? (hasHeader ? table[0].map((h, i) => String(h || `Coluna ${i + 1}`)) : table[0].map((_, i) => `Coluna ${i + 1}`)) : [];
    const toImport = preview ? preview.rows.filter((r) => r.ok && (includeDuplicates || !r.duplicate)) : [];
    const invalid = preview ? preview.rows.filter((r) => !r.ok) : [];

    const confirm = () => {
        if (!toImport.length) return;
        try {
            createLocalBackup("antes-importacao");
        } catch {
            /* sem espaço para cópia local: a importação continua, pois pode ser desfeita excluindo os lançamentos */
        }
        addTransactions(rowsToTransactions(toImport));
        toast.success(`${toImport.length} transações importadas.${invalid.length ? ` ${invalid.length} linha(s) inválida(s) não foram importadas.` : ""}`);
        onClose();
    };

    const downloadInvalid = () => {
        const rows = [["Linha", "Motivo", "Conteúdo"], ...invalid.map((r) => [String(r.line), r.errors.join(", "), r.raw.join(" | ")])];
        downloadText(toCsv(rows), "linhas-nao-importadas.csv", "text/csv");
    };

    return (
        <Modal open={open} onClose={onClose} title="Importar movimentações" description="CSV, XLSX ou OFX (extrato bancário). Nada é gravado antes da sua confirmação." size="xl">
            <ModalBody>
                {!table ? (
                    <div style={{ display: "grid", gap: 12 }}>
                        <Drop>
                            <Upload size={28} aria-hidden="true" />
                            <strong>{busy ? "Lendo arquivo…" : "Escolher arquivo"}</strong>
                            <span>CSV, XLSX ou OFX · até 5 MB</span>
                            <input type="file" accept=".csv,.txt,.xlsx,.xls,.ods,.ofx,.qfx" onChange={onFile} aria-label="Arquivo para importar" />
                        </Drop>
                        <Button icon={FileDown} onClick={downloadImportTemplate} style={{ justifySelf: "start" }}>
                            Baixar planilha modelo
                        </Button>
                        {error && (
                            <p role="alert" style={{ color: "var(--v-color-error)" }}>
                                {error}
                            </p>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        <p>
                            <strong>{file?.name}</strong> <Badge>{kind}</Badge> · {table.length} linha(s)
                        </p>
                        <fieldset style={{ border: 0, display: "grid", gap: 12 }}>
                            <legend style={{ fontWeight: 600, marginBottom: 8 }}>Colunas</legend>
                            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <Checkbox checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} /> A primeira linha é o cabeçalho
                            </label>
                            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                                {FIELDS.map(([key, label]) => (
                                    <Field key={key} label={label}>
                                        {({ id }) => (
                                            <Select id={id} value={mapping[key] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value === "" ? undefined : Number(e.target.value) }))}>
                                                <option value="">— não usar —</option>
                                                {header.map((h, i) => (
                                                    <option key={i} value={i}>
                                                        {h}
                                                    </option>
                                                ))}
                                            </Select>
                                        )}
                                    </Field>
                                ))}
                                {mapping.date === undefined && (
                                    <Field label="Data para todas as linhas">{({ id }) => <DatePicker id={id} value={defaultDate} onChange={(e) => setDefaultDate(e.target.value)} />}</Field>
                                )}
                                <Field label="Conta de destino">
                                    {({ id }) => (
                                        <Select id={id} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                                            {store.accounts
                                                .filter((a) => !a.archived)
                                                .map((a) => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.name}
                                                    </option>
                                                ))}
                                        </Select>
                                    )}
                                </Field>
                            </div>
                        </fieldset>

                        {preview && (
                            <>
                                <Stats aria-live="polite">
                                    <Badge $tone="income">{preview.stats.valid} válidas</Badge>
                                    <Badge $tone={preview.stats.invalid ? "expense" : "neutral"}>{preview.stats.invalid} inválidas</Badge>
                                    <Badge $tone={preview.stats.duplicates ? "warning" : "neutral"}>{preview.stats.duplicates} possíveis duplicadas</Badge>
                                    {preview.stats.truncated && <Badge $tone="warning">Limite de 20.000 linhas</Badge>}
                                </Stats>
                                {preview.stats.duplicates > 0 && (
                                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <Checkbox checked={includeDuplicates} onChange={(e) => setIncludeDuplicates(e.target.checked)} /> Importar também as possíveis duplicadas (mesma data, valor, tipo e descrição)
                                    </label>
                                )}
                                <TableWrap>
                                    <table>
                                        <caption className="sr-only">Prévia da importação</caption>
                                        <thead>
                                            <tr>
                                                <th scope="col">Linha</th>
                                                <th scope="col">Data</th>
                                                <th scope="col">Descrição</th>
                                                <th scope="col">Valor</th>
                                                <th scope="col">Situação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.rows.slice(0, 300).map((r) => (
                                                <tr key={r.line} className={r.ok ? "" : "bad"}>
                                                    <td>{r.line}</td>
                                                    <td>{r.ok ? formatDateBR(r.input.date) : "—"}</td>
                                                    <td className="desc">{r.input.description}</td>
                                                    <td>{r.input.amountCents ? formatMoney(r.input.type === "expense" ? -r.input.amountCents : r.input.amountCents) : "—"}</td>
                                                    <td>
                                                        {!r.ok ? (
                                                            r.errors.join("; ")
                                                        ) : r.duplicate ? (
                                                            <Badge $tone="warning">Possível duplicada</Badge>
                                                        ) : r.warnings.length ? (
                                                            <Muted>{r.warnings.join("; ")}</Muted>
                                                        ) : (
                                                            <Badge $tone="income">OK</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </TableWrap>
                                {preview.rows.length > 300 && <Muted>Mostrando as primeiras 300 linhas da prévia.</Muted>}
                                {invalid.length > 0 && (
                                    <Button size="sm" variant="ghost" icon={FileDown} onClick={downloadInvalid} style={{ justifySelf: "start" }}>
                                        Baixar linhas não importadas ({invalid.length})
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                {table && (
                    <Button
                        onClick={() => {
                            setTable(null);
                            setFile(null);
                        }}
                    >
                        Trocar arquivo
                    </Button>
                )}
                <Button variant="primary" disabled={!toImport.length} onClick={confirm}>
                    Importar {toImport.length || ""} transação(ões)
                </Button>
            </ModalFooter>
        </Modal>
    );
}

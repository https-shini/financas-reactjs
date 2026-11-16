import { describe, expect, it } from "vitest";
import { buildImportPreview, guessMapping, parseCSV, parseOFX, rowsToTransactions } from "./importer";
import { storeWith, tx } from "../test/helpers";
import { DEFAULT_ACCOUNT_ID } from "./defaults";

const store = storeWith({ transactions: [tx({ description: "Mercado", amountCents: 8590, date: "2026-11-10" })] });
const opts = (table) => ({ mapping: guessMapping(table[0]), defaultDate: "2026-11-16", accountId: DEFAULT_ACCOUNT_ID, store });

describe("CSV", () => {
    it("detecta ponto e vírgula, aspas e quebras de linha", () => {
        const { delimiter, rows } = parseCSV('\ufeffData;Descrição;Valor\r\n10/11/2026;"Mercado; padaria";-85,90\n11/11/2026;"Diz ""oi""";1.200,00\n');
        expect(delimiter).toBe(";");
        expect(rows).toEqual([
            ["Data", "Descrição", "Valor"],
            ["10/11/2026", "Mercado; padaria", "-85,90"],
            ["11/11/2026", 'Diz "oi"', "1.200,00"],
        ]);
    });
});

describe("prévia de importação", () => {
    const table = [
        ["Data", "Descrição", "Valor", "Tipo", "Categoria"],
        ["10/11/2026", "Mercado", "85,90", "Despesa", "mercado"],
        ["12/11/2026", "Salário", "5.000,00", "Receita", "Salário"],
        ["13/11/2026", "Sem valor", "", "Despesa", ""],
        ["32/11/2026", "Data ruim", "10", "Despesa", ""],
        ["14/11/2026", "Café", "-7,50", "", "Lanches"],
        ["14/11/2026", "Café", "-7,50", "", "Lanches"],
    ];

    it("mapeia colunas automaticamente", () => {
        expect(guessMapping(table[0])).toEqual({ date: 0, description: 1, amount: 2, type: 3, category: 4 });
    });

    it("valida linhas, marca duplicados e preserva inválidas com motivo", () => {
        const { rows, stats } = buildImportPreview(table, opts(table));
        expect(stats).toMatchObject({ total: 6, valid: 4, invalid: 2, duplicates: 2 });
        expect(rows[0]).toMatchObject({ duplicate: true, input: { categoryId: "cat-mercado", amountCents: 8590, type: "expense" } });
        expect(rows[1].input).toMatchObject({ type: "income", amountCents: 500000, categoryId: "cat-salario" });
        expect(rows[2].errors[0]).toMatch(/Valor/);
        expect(rows[3].errors[0]).toMatch(/Data inválida/);
        expect(rows[4].input.type).toBe("expense"); // sinal negativo sem coluna de tipo
        expect(rows[4].warnings[0]).toMatch(/Lanches/);
        expect(rows[5].duplicate).toBe(true); // repetida no próprio arquivo
        expect(rows[2].line).toBe(4);
    });

    it("sem coluna de data usa a data escolhida", () => {
        const t = [["Descrição", "Valor"], ["X", "10"]];
        const { rows } = buildImportPreview(t, opts(t));
        expect(rows[0].input.date).toBe("2026-11-16");
        expect(rowsToTransactions(rows)[0].amountCents).toBe(1000);
    });
});

describe("OFX", () => {
    it("lê transações de extrato bancário", () => {
        const ofx = `OFXHEADER:100\n<OFX><BANKTRANLIST>\n<STMTTRN>\n<TRNTYPE>DEBIT\n<DTPOSTED>20261110120000[-3:BRT]\n<TRNAMT>-85.90\n<FITID>1\n<MEMO>COMPRA MERCADO\n</STMTTRN>\n<STMTTRN>\n<TRNTYPE>CREDIT\n<DTPOSTED>20261105\n<TRNAMT>5000.00\n<FITID>2\n<MEMO>SALARIO\n</STMTTRN>\n</BANKTRANLIST></OFX>`;
        const { rows } = parseOFX(ofx);
        expect(rows).toHaveLength(3);
        const preview = buildImportPreview(rows, opts(rows));
        expect(preview.rows.map((r) => [r.input.date, r.input.type, r.input.amountCents])).toEqual([
            ["2026-11-10", "expense", 8590],
            ["2026-11-05", "income", 500000],
        ]);
    });
});

import { useState } from "react";
import * as C from "./styles";
import { toast } from "react-toastify";
import { PlusCircle } from "lucide-react";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { parseMoneyString } from "../../domain/money";
import { buildTransaction, validateTransactionInput } from "../../domain/transactions";
import { DEFAULT_ACCOUNT_ID } from "../../domain/defaults";

const Form = () => {
    const { store, today } = useFinance();
    const { addTransactions } = useFinanceActions();
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(today);
    const [isExpense, setExpense] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const amountCents = parseMoneyString(amount, { decimal: "auto" });
        const input = {
            type: isExpense ? "expense" : "income",
            amountCents: amountCents ?? 0,
            description: desc,
            date,
            accountId: store.accounts.find((a) => !a.archived && a.type !== "credit")?.id ?? DEFAULT_ACCOUNT_ID,
            categoryId: null,
            status: "paid",
        };
        const v = validateTransactionInput(input, store);
        if (!v.ok) {
            toast.error(Object.values(v.errors)[0]);
            return;
        }
        addTransactions([buildTransaction(input)]);
        toast.success("Transação adicionada!");
        setDesc("");
        setAmount("");
    };

    return (
        <C.Container as="form" onSubmit={handleSubmit} aria-label="Nova transação">
            <C.InputsRow>
                <C.InputContent>
                    <C.Label htmlFor="tx-desc">Descrição</C.Label>
                    <C.Input id="tx-desc" value={desc} maxLength={120} onChange={(e) => setDesc(e.target.value)} placeholder="Ex: Aluguel, Salário..." />
                </C.InputContent>
                <C.InputContent>
                    <C.Label htmlFor="tx-amount">Valor (R$)</C.Label>
                    <C.Input id="tx-amount" value={amount} inputMode="decimal" onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
                </C.InputContent>
                <C.InputContent>
                    <C.Label htmlFor="tx-date">Data</C.Label>
                    <C.Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </C.InputContent>
                <C.InputContent style={{ flex: "0 0 auto" }}>
                    <C.Label as="span" id="tx-type">Tipo</C.Label>
                    <C.RadioGroup role="radiogroup" aria-labelledby="tx-type">
                        <label>
                            <input type="radio" name="tx-type" checked={!isExpense} onChange={() => setExpense(false)} />
                            Entrada
                        </label>
                        <label>
                            <input type="radio" name="tx-type" checked={isExpense} onChange={() => setExpense(true)} />
                            Saída
                        </label>
                    </C.RadioGroup>
                </C.InputContent>
                <C.Button type="submit">
                    <PlusCircle size={20} aria-hidden="true" style={{ marginRight: 8, verticalAlign: "middle" }} />
                    Adicionar
                </C.Button>
            </C.InputsRow>
        </C.Container>
    );
};

export default Form;

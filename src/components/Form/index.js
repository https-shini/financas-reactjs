import React, { useState } from "react";
import * as C from "./styles";
import { useFinance } from "../../contexts/FinanceContext";
import { toast } from "react-toastify";
import { PlusCircle } from "lucide-react";

const Form = () => {
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [isExpense, setExpense] = useState(false);

    const { addTransaction } = useFinance();

    const handleSave = () => {
        if (!desc || !amount) {
            toast.error("Informe a descrição e o valor!");
            return;
        } else if (amount <= 0) {
            toast.error("O valor tem que ser positivo!");
            return;
        }

        const transaction = {
            id: Math.round(Math.random() * 1000),
            desc: desc,
            amount: amount,
            expense: isExpense,
        };

        addTransaction(transaction);
        toast.success("Transação adicionada!");

        setDesc("");
        setAmount("");
    };

    return (
        <C.Container>
            <C.InputsRow>
                <C.InputContent>
                    <C.Label>Descrição</C.Label>
                    <C.Input 
                        value={desc} 
                        onChange={(e) => setDesc(e.target.value)} 
                        placeholder="Ex: Aluguel, Salário..."
                    />
                </C.InputContent>
                <C.InputContent>
                    <C.Label>Valor</C.Label>
                    <C.Input
                        value={amount}
                        type="number"
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                    />
                </C.InputContent>
                <C.InputContent style={{ flex: '0 0 auto' }}>
                    <C.Label>Tipo</C.Label>
                    <C.RadioGroup>
                        <label>
                            <input
                                type="radio"
                                id="rIncome"
                                checked={!isExpense}
                                name="group1"
                                onChange={() => setExpense(false)}
                            />
                            Entrada
                        </label>
                        <label>
                            <input
                                type="radio"
                                id="rExpenses"
                                checked={isExpense}
                                name="group1"
                                onChange={() => setExpense(true)}
                            />
                            Saída
                        </label>
                    </C.RadioGroup>
                </C.InputContent>
                <C.Button onClick={handleSave}>
                    <PlusCircle size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Adicionar
                </C.Button>
            </C.InputsRow>
        </C.Container>
    );
};

export default Form;

import React, { createContext, useState, useEffect, useContext } from 'react';
import DOMPurify from 'dompurify';

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
    const [transactionsList, setTransactionsList] = useState(() => {
        const data = localStorage.getItem("transactions");
        return data ? JSON.parse(data) : [];
    });
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const amountExpense = transactionsList
            .filter((item) => item.expense)
            .map((transaction) => Number(transaction.amount));

        const amountIncome = transactionsList
            .filter((item) => !item.expense)
            .map((transaction) => Number(transaction.amount));

        const totalExpense = amountExpense.reduce((acc, cur) => acc + cur, 0);
        const totalIncome = amountIncome.reduce((acc, cur) => acc + cur, 0);

        const totalValue = totalIncome - totalExpense;

        setIncome(totalIncome.toFixed(2));
        setExpense(totalExpense.toFixed(2));
        setTotal(totalValue.toFixed(2));

        localStorage.setItem("transactions", JSON.stringify(transactionsList));
    }, [transactionsList]);

    const addTransaction = (transaction) => {
        const sanitizedTransaction = {
            ...transaction,
            desc: DOMPurify.sanitize(transaction.desc),
            id: transaction.id || Math.round(Math.random() * 1000)
        };
        setTransactionsList([...transactionsList, sanitizedTransaction]);
    };

    const addTransactionsBatch = (newTransactions) => {
        setTransactionsList([...transactionsList, ...newTransactions]);
    };

    const deleteTransaction = (id) => {
        const newArray = transactionsList.filter((transaction) => transaction.id !== id);
        setTransactionsList(newArray);
    };

    return (
        <FinanceContext.Provider value={{ 
            transactionsList, 
            income, 
            expense, 
            total, 
            addTransaction, 
            addTransactionsBatch,
            deleteTransaction 
        }}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error("useFinance deve ser usado dentro de um FinanceProvider");
    }
    return context;
};

import React from "react";
import * as C from "./styles";
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from "lucide-react";

const GridItem = ({ item, onDelete }) => {
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(item.amount);

    return (
        <C.Tr>
            <C.Td>{item.desc}</C.Td>
            <C.Td>
                <C.Value>{formattedAmount}</C.Value>
            </C.Td>
            <C.Td alignCenter>
                {item.expense ? (
                    <ArrowDownCircle color="#dc2626" size={22} />
                ) : (
                    <ArrowUpCircle color="#22c55e" size={22} />
                )}
            </C.Td>
            <C.Td alignCenter>
                <Trash2 
                    onClick={() => onDelete(item.id)} 
                    style={{ color: '#ef4444', cursor: 'pointer' }} 
                />
            </C.Td>
        </C.Tr>
    );
};

export default GridItem;

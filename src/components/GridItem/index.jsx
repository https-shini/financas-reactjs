import * as C from "./styles";
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from "lucide-react";
import { formatMoney } from "../../domain/money";
import { formatDateBR } from "../../domain/dates";

const GridItem = ({ item, onDelete }) => (
    <C.Tr>
        <C.Td>{item.description}</C.Td>
        <C.Td>{formatDateBR(item.date)}</C.Td>
        <C.Td>
            <C.Value>{formatMoney(item.amountCents)}</C.Value>
        </C.Td>
        <C.Td alignCenter>
            {item.type === "expense" ? (
                <ArrowDownCircle color="#dc2626" size={22} aria-label="Saída" role="img" />
            ) : (
                <ArrowUpCircle color="#16a34a" size={22} aria-label="Entrada" role="img" />
            )}
        </C.Td>
        <C.Td alignCenter>
            <C.DeleteButton type="button" onClick={() => onDelete(item)} aria-label={`Excluir ${item.description}`}>
                <Trash2 aria-hidden="true" />
            </C.DeleteButton>
        </C.Td>
    </C.Tr>
);

export default GridItem;

import { BillsModule } from "./BillsModule";

/** Módulo Contas a Receber: receitas previstas, atrasadas e recebidas. */
export default function ReceivablesPage() {
    return <BillsModule kind="receivable" />;
}

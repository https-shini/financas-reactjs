import { BillsModule } from "./BillsModule";

/** Módulo Contas a Pagar: despesas pendentes, faturas de cartão e pagamentos realizados. */
export default function PayablesPage() {
    return <BillsModule kind="payable" />;
}

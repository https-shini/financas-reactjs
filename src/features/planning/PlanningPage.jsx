import { Navigate, Route, Routes } from "react-router-dom";
import { CalendarClock, Target, Flag, Repeat, CreditCard, Calculator } from "lucide-react";
import { Badge, RouteTabs } from "../../components/ui";
import { PageHeader } from "../../components/layout/Page";
import { useFinance } from "../../state/contexts";
import { upcomingItems } from "../../domain/selectors";
import { BillsSection } from "./BillsSection";
import { BudgetsSection } from "./BudgetsSection";
import { GoalsSection } from "./GoalsSection";
import { RecurrencesSection } from "./RecurrencesSection";
import { CardsSection } from "./CardsSection";
import { SimulatorSection } from "./SimulatorSection";

export default function PlanningPage() {
    const { store, today } = useFinance();
    const overdue = upcomingItems(store, today, 0).filter((i) => i.overdue).length;
    const tabs = [
        { to: "/planejamento/vencimentos", label: "Vencimentos", icon: CalendarClock, badge: overdue ? <Badge $tone="expense">{overdue}</Badge> : null },
        { to: "/planejamento/orcamentos", label: "Orçamentos", icon: Target },
        { to: "/planejamento/metas", label: "Metas", icon: Flag },
        { to: "/planejamento/recorrencias", label: "Recorrências", icon: Repeat },
        { to: "/planejamento/cartoes", label: "Cartões", icon: CreditCard },
        { to: "/planejamento/simulador", label: "Simulador", icon: Calculator },
    ];
    return (
        <>
            <PageHeader title="Planejamento" group="planning" description="Contas a pagar, orçamentos, metas, recorrências, cartões e simulações" />
            <RouteTabs tabs={tabs} label="Seções de planejamento" />
            <Routes>
                <Route index element={<Navigate to="vencimentos" replace />} />
                <Route path="vencimentos" element={<BillsSection />} />
                <Route path="orcamentos" element={<BudgetsSection />} />
                <Route path="metas" element={<GoalsSection />} />
                <Route path="recorrencias" element={<RecurrencesSection />} />
                <Route path="cartoes" element={<CardsSection />} />
                <Route path="simulador" element={<SimulatorSection />} />
                <Route path="*" element={<Navigate to="vencimentos" replace />} />
            </Routes>
        </>
    );
}

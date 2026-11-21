import { Navigate, Route, Routes } from "react-router-dom";
import { Target, Flag, Repeat, CreditCard, Calculator } from "lucide-react";
import { RouteTabs } from "../../components/ui";
import { PageHeader } from "../../components/layout/Page";
import { BudgetsSection } from "./BudgetsSection";
import { GoalsSection } from "./GoalsSection";
import { RecurrencesSection } from "./RecurrencesSection";
import { CardsSection } from "./CardsSection";
import { SimulatorSection } from "./SimulatorSection";

export default function PlanningPage() {
    const tabs = [
        { to: "/planejamento/orcamentos", label: "Orçamentos", icon: Target },
        { to: "/planejamento/metas", label: "Metas", icon: Flag },
        { to: "/planejamento/recorrencias", label: "Recorrências", icon: Repeat },
        { to: "/planejamento/cartoes", label: "Cartões", icon: CreditCard },
        { to: "/planejamento/simulador", label: "Simulador", icon: Calculator },
    ];
    return (
        <>
            <PageHeader title="Planejamento" description="Orçamentos, metas, recorrências, cartões e simulações" />
            <RouteTabs tabs={tabs} label="Seções de planejamento" />
            <Routes>
                <Route index element={<Navigate to="orcamentos" replace />} />
                                <Route path="orcamentos" element={<BudgetsSection />} />
                <Route path="metas" element={<GoalsSection />} />
                <Route path="recorrencias" element={<RecurrencesSection />} />
                <Route path="cartoes" element={<CardsSection />} />
                <Route path="simulador" element={<SimulatorSection />} />
                <Route path="*" element={<Navigate to="orcamentos" replace />} />
            </Routes>
        </>
    );
}

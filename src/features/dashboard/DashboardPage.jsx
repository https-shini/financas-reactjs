import { Link } from "react-router-dom";
import { Plus, Sparkles, Upload, Zap } from "lucide-react";
import { Button, Card, EmptyState, MonthPicker } from "../../components/ui";
import { PageHeader, Grid, Span } from "../../components/layout/Page";
import { useFinance } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { formatMonthLabel } from "../../domain/dates";
import { OnboardingCard } from "./OnboardingCard";
import { MonthCalendar } from "./MonthCalendar";
import { HeadlineKpis } from "./widgets/HeadlineKpis";
import { CashflowChart } from "./widgets/CashflowChart";
import { DueSoonCard } from "./widgets/DueSoonCard";
import { RecentActivity } from "./widgets/RecentActivity";
import { CategorySpend } from "./widgets/CategorySpend";

/*
 * Visão geral — painel de controle financeiro. Hierarquia (do mais ao menos importante):
 *
 *   1. Posição: Saldo atual · Total a pagar · Total a receber · Resultado do mês
 *   2. Desempenho e alertas: Receitas × despesas (8)  │  Próximos vencimentos (4)
 *   3. Atividade: Movimentações recentes (8)          │  Despesas por categoria (4)
 *   4. Agenda: Calendário do mês (12)
 *
 * Um único seletor de mês (no cabeçalho da página) controla resultado, gráfico, categorias e calendário.
 * Orçamentos, metas, faturas, previsões detalhadas e insights continuam em suas páginas próprias.
 */
export default function DashboardPage() {
    const { store, today } = useFinance();
    const { month, setMonth, openTransaction, openQuickCapture } = useUI();
    const isEmpty = store.transactions.length === 0;
    const showOnboarding = !store.settings.onboardingDone && isEmpty;

    return (
        <>
            <PageHeader
                title="Visão geral"
                description={isEmpty ? "Bem-vindo ao Finanças. Comece registrando sua primeira transação." : `Situação financeira consolidada · ${formatMonthLabel(month).toLowerCase()}`}
                meta={<MonthPicker value={month} onChange={setMonth} label="Mês de referência do painel" />}
                actions={
                    <>
                        <Button icon={Zap} onClick={() => openQuickCapture()} title="Captura rápida (Q)">
                            Captura rápida
                        </Button>
                        {/* No celular o botão "+" da navegação inferior já cria transações. */}
                        <Button variant="primary" icon={Plus} onClick={() => openTransaction()} className="hide-mobile" title="Nova transação (N)">
                            Nova transação
                        </Button>
                    </>
                }
            />
            {showOnboarding && <OnboardingCard />}
            {!showOnboarding && isEmpty && (
                <Card style={{ marginBottom: 20 }}>
                    <EmptyState icon={Sparkles} title="Nenhuma movimentação ainda" description="Adicione receitas e despesas ou importe uma planilha para ver seu painel ganhar vida.">
                        <Button variant="primary" icon={Plus} onClick={() => openTransaction()}>
                            Nova transação
                        </Button>
                        <Button as={Link} to="/configuracoes/dados#importar" icon={Upload}>
                            Importar dados
                        </Button>
                    </EmptyState>
                </Card>
            )}
            <Grid>
                <Span $desktop={12}>
                    <HeadlineKpis store={store} today={today} month={month} />
                </Span>
                <Span $desktop={8}>
                    <CashflowChart store={store} month={month} onPickMonth={setMonth} />
                </Span>
                <Span $desktop={4}>
                    <DueSoonCard store={store} today={today} />
                </Span>
                <Span $desktop={8}>
                    <RecentActivity store={store} today={today} />
                </Span>
                <Span $desktop={4}>
                    <CategorySpend store={store} month={month} />
                </Span>
                <Span $desktop={12}>
                    <MonthCalendar store={store} today={today} month={month} onMonthChange={setMonth} showPicker={false} />
                </Span>
            </Grid>
        </>
    );
}

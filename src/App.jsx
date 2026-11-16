import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useTheme } from "styled-components";
import "react-toastify/dist/ReactToastify.css";
import GlobalStyle from "./styles/global";
import { FinanceProvider } from "./state/FinanceProvider";
import { useFinance } from "./state/contexts";
import { AppThemeProvider } from "./app/AppThemeProvider";
import { UIProvider } from "./app/UIContext";
import { AppShell } from "./app/AppShell";
import { StorageAlerts } from "./app/StorageAlerts";
import { RecoveryScreen } from "./features/recovery/RecoveryScreen";
import { ConfirmProvider, Skeleton } from "./components/ui";
import { ErrorBoundary } from "./components/ErrorBoundary";

const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const TransactionsPage = lazy(() => import("./features/transactions/TransactionsPage"));
const PlanningPage = lazy(() => import("./features/planning/PlanningPage"));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));

function PageFallback() {
    return (
        <div aria-busy="true" aria-label="Carregando" style={{ display: "grid", gap: 16 }}>
            <Skeleton $h="32px" $w="240px" />
            <Skeleton $h="160px" />
            <Skeleton $h="260px" />
        </div>
    );
}

const page = (Component) => (
    <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
            <Component />
        </Suspense>
    </ErrorBoundary>
);

function ThemedToasts() {
    const theme = useTheme();
    return <ToastContainer position="bottom-right" autoClose={4000} theme={theme.mode} newestOnTop limit={4} />;
}

function Root() {
    const { status } = useFinance();
    if (status === "recovery") return <RecoveryScreen />;
    return (
        <BrowserRouter>
            <ConfirmProvider>
                <UIProvider>
                    <StorageAlerts />
                    <Routes>
                        <Route element={<AppShell />}>
                            <Route index element={page(DashboardPage)} />
                            <Route path="movimentacoes" element={page(TransactionsPage)} />
                            <Route path="planejamento/*" element={page(PlanningPage)} />
                            <Route path="relatorios/*" element={page(ReportsPage)} />
                            <Route path="configuracoes/*" element={page(SettingsPage)} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                </UIProvider>
            </ConfirmProvider>
        </BrowserRouter>
    );
}

const App = () => (
    <FinanceProvider>
        <AppThemeProvider>
            <GlobalStyle />
            <Root />
            <ThemedToasts />
        </AppThemeProvider>
    </FinanceProvider>
);

export default App;

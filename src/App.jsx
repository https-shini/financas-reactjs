import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GlobalStyle from "./styles/global";
import Header from "./components/Header";
import Resume from "./components/Resume";
import Form from "./components/Form";
import Grid from "./components/Grid";
import Chart from "./components/Chart";
import { FinanceProvider } from "./state/FinanceProvider";
import { useFinance } from "./state/contexts";
import { AppThemeProvider } from "./app/AppThemeProvider";
import { RecoveryScreen } from "./features/recovery/RecoveryScreen";
import { StorageAlerts } from "./app/StorageAlerts";

function Content() {
    const { status } = useFinance();
    if (status === "recovery") return <RecoveryScreen />;
    return (
        <main>
            <StorageAlerts />
            <Header />
            <Resume />
            <Form />
            <Grid />
            <Chart />
        </main>
    );
}

const App = () => (
    <FinanceProvider>
        <AppThemeProvider>
            <GlobalStyle />
            <Content />
            <ToastContainer position="top-right" autoClose={4000} />
        </AppThemeProvider>
    </FinanceProvider>
);

export default App;

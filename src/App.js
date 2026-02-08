import React from "react";
import GlobalStyle from "./styles/global";
import Header from "./components/Header";
import Resume from "./components/Resume";
import Form from "./components/Form";
import Grid from "./components/Grid";
import Chart from "./components/Chart";
import { FinanceProvider } from "./contexts/FinanceContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
    return (
        <ThemeProvider>
            <FinanceProvider>
                <GlobalStyle />
                <Header />
                <Resume />
                <Form />
                <Grid />
                <Chart />
                <ToastContainer 
                    theme="colored"
                    position="top-right"
                    autoClose={3000} 
                />
            </FinanceProvider>
        </ThemeProvider>
    );
};

export default App;

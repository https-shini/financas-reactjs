import { useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "../styles/theme";
import { useFinance } from "../state/contexts";

function useSystemDark() {
    const query = "(prefers-color-scheme: dark)";
    const [dark, setDark] = useState(() => window.matchMedia?.(query).matches ?? false);
    useEffect(() => {
        const mq = window.matchMedia?.(query);
        if (!mq) return undefined;
        const on = (e) => setDark(e.matches);
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    return dark;
}

/** Aplica o tema escolhido nas configurações (claro, escuro ou automático pelo sistema). */
export function AppThemeProvider({ children }) {
    const { store } = useFinance();
    const systemDark = useSystemDark();
    const pref = store.settings.theme;
    const mode = pref === "system" ? (systemDark ? "dark" : "light") : pref;
    const theme = mode === "dark" ? darkTheme : lightTheme;

    useEffect(() => {
        document.documentElement.dataset.theme = mode;
        document.documentElement.style.colorScheme = mode;
    }, [mode]);

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

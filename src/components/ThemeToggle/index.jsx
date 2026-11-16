import styled from "styled-components";
import { Sun, Moon } from "lucide-react";
import { useFinanceActions } from "../../state/contexts";

const ToggleButton = styled.button`
    position: absolute;
    top: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: ${(props) => props.theme.colors.bgElevated};
    color: ${(props) => props.theme.colors.text};
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid ${(props) => props.theme.colors.border};
    &:focus-visible {
        outline: 2px solid ${(props) => props.theme.colors.primary};
        outline-offset: 2px;
    }
`;

const ThemeToggle = () => {
    const { updateSettings } = useFinanceActions();
    const isDark = document.documentElement.dataset.theme === "dark";
    const label = isDark ? "Mudar para tema claro" : "Mudar para tema escuro";
    return (
        <ToggleButton type="button" onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })} aria-label={label} title={label}>
            {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
        </ToggleButton>
    );
};

export default ThemeToggle;

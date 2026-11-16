import React from "react";
import * as C from "./styles";
import ThemeToggle from "../ThemeToggle";

const Header = () => {
    return (
        <C.Container>
            <C.Header>
                <C.Title>Controle Financeiro</C.Title>
            </C.Header>
            <ThemeToggle />
        </C.Container>
    );
};

export default Header;

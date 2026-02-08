import React from "react";
import * as C from "./styles";

const ResumeItem = ({ title, Icon, value, color }) => {
    return (
        <C.Container>
            <C.Header color={color}>
                <C.HeaderTitle>{title}</C.HeaderTitle>
                <Icon />
            </C.Header>
            <C.Total>{value}</C.Total>
        </C.Container>
    );
};

export default ResumeItem;

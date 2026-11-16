import * as C from "./styles";

const ResumeItem = ({ title, Icon, value, color }) => (
    <C.Container color={color}>
        <C.Header color={color}>
            <C.HeaderTitle>{title}</C.HeaderTitle>
            <Icon aria-hidden="true" />
        </C.Header>
        <C.Total>{value}</C.Total>
    </C.Container>
);

export default ResumeItem;

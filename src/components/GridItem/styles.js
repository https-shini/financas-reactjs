import styled from "styled-components";

export const Tr = styled.tr`
    &:hover {
        background-color: ${(props) => props.theme.colors.bgSurface};
    }
`;

export const Td = styled.td`
    padding: 16px 20px;
    text-align: ${(props) => (props.alignCenter ? "center" : "start")};
    overflow-wrap: anywhere;
    color: ${(props) => props.theme.colors.text};
    font-size: 0.95rem;
    font-weight: 500;
`;

export const Value = styled.span`
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    font-weight: 600;
`;

export const DeleteButton = styled.button`
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 8px;
    color: ${(props) => props.theme.colors.textSecondary};
    svg {
        width: 20px;
        height: 20px;
    }
    &:hover {
        color: ${(props) => props.theme.colors.error};
        background: ${(props) => props.theme.colors.bgSurface};
    }
    &:focus-visible {
        outline: 2px solid ${(props) => props.theme.colors.primary};
        outline-offset: 2px;
    }
`;

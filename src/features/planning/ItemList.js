import styled from "styled-components";

/** Lista de itens das seções de planejamento (recorrências). */
export const ItemList = styled.ul`
    list-style: none;
    display: grid;
    gap: 2px;
    li {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 60px;
        padding: 6px 8px;
        border-radius: ${(p) => p.theme.radius.md};
        flex-wrap: wrap;
        &:hover {
            background: ${(p) => p.theme.colors.bgHover};
        }
    }
    .grow {
        flex: 1;
        min-width: 160px;
        display: grid;
    }
    .grow > span:first-child {
        font-weight: 500;
    }
    .actions {
        display: flex;
        gap: 4px;
        margin-left: auto;
    }
`;

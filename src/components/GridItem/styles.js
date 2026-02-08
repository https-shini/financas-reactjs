import styled from "styled-components";

export const Tr = styled.tr`
  &:hover {
    background-color: ${props => props.theme.colors.bgSurface};
  }
`;

export const Td = styled.td`
  padding: 16px 20px;
  text-align: ${(props) => (props.alignCenter ? "center" : "start")};
  word-break: break-all;
  color: ${props => props.theme.colors.text};
  font-size: 0.95rem;
  font-weight: 500;

  svg {
    width: 20px;
    height: 20px;
    cursor: pointer;
    transition: all 0.2s;
    opacity: 0.7;

    &:hover {
      opacity: 1;
      transform: scale(1.2);
    }
  }
`;

export const Value = styled.span`
  font-family: ${props => props.theme.fonts.mono || 'monospace'};
  font-weight: 600;
`;

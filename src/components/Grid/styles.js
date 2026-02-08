import styled from "styled-components";

export const Container = styled.div`
  max-width: 1120px;
  width: 95%;
  margin: 20px auto 40px;
  background-color: ${props => props.theme.colors.bgElevated};
  border-radius: ${props => props.theme.radius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.md};
  overflow: hidden;
`;

export const ExportContainer = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
  background-color: ${props => props.theme.colors.bgSurface};

  @media (max-width: 600px) {
    justify-content: center;
  }
`;

export const Button = styled.button`
  padding: 10px 18px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  background-color: ${props => props.theme.colors.bgElevated};
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background-color: ${props => props.theme.colors.bg};
    color: ${props => props.theme.colors.primary};
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.base};
  }

  svg {
    font-size: 1.1rem;
  }
`;

export const ImportInput = styled.input`
  display: none;
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const Thead = styled.thead`
  background-color: ${props => props.theme.colors.bgSurface};
`;

export const Tbody = styled.tbody``;

export const Tr = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.border};
  transition: background-color 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
`;

export const Th = styled.th`
  text-align: ${(props) => (props.alignCenter ? "center" : "start")};
  padding: 18px 20px;
  color: ${props => props.theme.colors.textMuted};
  font-family: ${props => props.theme.fonts.display};
  text-transform: uppercase;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 1px;
`;

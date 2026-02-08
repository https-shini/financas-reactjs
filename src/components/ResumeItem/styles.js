import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${props => props.theme.colors.bgElevated};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.lg};
  padding: 25px;
  box-shadow: ${props => props.theme.shadows.md};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: ${(props) => props.color || props.theme.colors.primary};
    opacity: 0.8;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: ${props => props.theme.shadows.lg};
    border-color: ${(props) => props.color || props.theme.colors.primary};
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;

  svg {
    width: 28px;
    height: 28px;
    color: ${(props) => props.color || props.theme.colors.primary};
    filter: drop-shadow(0 0 8px ${(props) => props.color || props.theme.colors.primary}33);
  }
`;

export const HeaderTitle = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const Total = styled.span`
  font-size: 2.2rem;
  font-weight: 800;
  font-family: ${props => props.theme.fonts.display};
  color: ${props => props.theme.colors.text};
  letter-spacing: -0.5px;
  
  @media (max-width: 750px) {
    font-size: 1.8rem;
  }
`;

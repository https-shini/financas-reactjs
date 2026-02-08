import styled from "styled-components";

export const Container = styled.div`
  height: 180px;
  text-align: center;
  background: ${props => props.theme.colors.bgElevated};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  @media (max-width: 750px) {
    height: 140px;
  }
`;

export const Header = styled.header`
  width: 100%;
`;

export const Title = styled.h1`
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.display};
  font-size: 3rem;
  text-transform: uppercase;
  letter-spacing: 4px;
  text-shadow: ${props => props.theme.shadows.glow};
  margin: 0;
  
  @media (max-width: 750px) {
    font-size: 1.8rem;
    letter-spacing: 2px;
  }
`;

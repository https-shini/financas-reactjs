import styled from "styled-components";

export const Container = styled.div`
  max-width: 1120px;
  margin: 40px auto;
  width: 95%;
  background-color: ${props => props.theme.colors.bgElevated};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.lg};
  display: flex;
  flex-direction: column;
  padding: 30px;
  gap: 25px;
  box-shadow: ${props => props.theme.shadows.md};
`;

export const InputsRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-end;

  @media (max-width: 850px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const InputContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const Label = styled.label`
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const Input = styled.input`
  outline: none;
  border-radius: ${props => props.theme.radius.md};
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.bg};
  color: ${props => props.theme.colors.text};
  transition: all 0.2s;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 4px ${props => props.theme.colors.primary}15;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }
`;

export const RadioGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 0;

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: ${props => props.theme.colors.textSecondary};
    font-weight: 500;
  }

  input {
    width: 18px;
    height: 18px;
    accent-color: ${props => props.theme.colors.primary};
  }
`;

export const Button = styled.button`
  padding: 14px 30px;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.theme.shadows.md};

  &:hover {
    background-color: ${props => props.theme.colors.primaryLight};
    box-shadow: ${props => props.theme.shadows.glow};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 850px) {
    width: 100%;
  }
`;

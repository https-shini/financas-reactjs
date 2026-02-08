import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const ToggleButton = styled(motion.button)`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: ${props => props.theme.colors.bgElevated};
  color: ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
  z-index: 1000;
  
  &:hover {
    background: ${props => props.theme.colors.bgSurface};
    color: ${props => props.theme.colors.primaryLight};
  }

  @media (max-width: 750px) {
    top: 15px;
    right: 15px;
    width: 40px;
    height: 40px;
  }
`;

const ThemeToggle = () => {
  const { themeName, toggleTheme } = useTheme();

  return (
    <ToggleButton 
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={themeName === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
    >
      {themeName === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </ToggleButton>
  );
};

export default ThemeToggle;

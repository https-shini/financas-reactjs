import { createGlobalStyle } from "styled-components";

const Global = createGlobalStyle`
  @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Rajdhani:wght@500;600;700&display=swap");

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${props => props.theme.fonts.sans};
    background-color: ${props => props.theme.colors.bg};
    color: ${props => props.theme.colors.text};
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    transition: background-color 0.3s ease, color 0.3s ease;
    overflow-x: hidden;
  }

  button {
    cursor: pointer;
    font-family: ${props => props.theme.fonts.sans};
    border: none;
    outline: none;
    background: none;
  }

  input, select, textarea {
    font-family: ${props => props.theme.fonts.sans};
    outline: none;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.bg};
  }
  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.bgSurface};
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.primary};
  }

  .toast-container {
    border-radius: ${props => props.theme.radius.md};
  }
`;

export default Global;

import { createGlobalStyle } from "styled-components";

const Global = createGlobalStyle`
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    font-family: ${(props) => props.theme.fonts.sans};
    background-color: ${(props) => props.theme.colors.bg};
    color: ${(props) => props.theme.colors.text};
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    overflow-x: hidden;
    line-height: 1.5;
  }

  button {
    cursor: pointer;
    font: inherit;
    color: inherit;
    border: none;
    background: none;
  }

  input, select, textarea {
    font: inherit;
    color: inherit;
  }

  a {
    color: inherit;
  }

  :focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.focus ?? props.theme.colors.primary};
    outline-offset: 2px;
  }

  .sr-only {
    position: absolute !important;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  h1, h2, h3, h4 {
    line-height: 1.25;
  }

  ::selection {
    background: ${(props) => props.theme.colors.primarySoft};
  }

  .only-mobile {
    ${(props) => props.theme.media.desktop} {
      display: none !important;
    }
  }

  .hide-mobile {
    ${(props) => props.theme.media.mobile} {
      display: none !important;
    }
  }

  /* Toasts acima da navegação inferior no celular e com a tipografia do app */
  .Toastify__toast-container {
    z-index: ${(props) => props.theme.z.toast};
  }
  .Toastify__toast {
    font-family: ${(props) => props.theme.fonts.sans};
    font-size: ${(props) => props.theme.fontSize.md};
    border-radius: ${(props) => props.theme.radius.md};
    border: 1px solid ${(props) => props.theme.colors.border};
  }
  ${(props) => props.theme.media.belowDesktop} {
    .Toastify__toast-container--bottom-right {
      bottom: calc(${(props) => props.theme.layout.bottomNav} + 12px + env(safe-area-inset-bottom));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default Global;

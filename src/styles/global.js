import { createGlobalStyle } from "styled-components";
import { themeToCssVars } from "../design/themes";

const cssVars = (theme) =>
    Object.entries(themeToCssVars(theme))
        .map(([k, v]) => `${k}: ${v};`)
        .join("\n");

const Global = createGlobalStyle`
  :root {
    ${(p) => cssVars(p.theme)}
    color-scheme: ${(p) => p.theme.mode};
  }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
    text-rendering: optimizeLegibility;
  }

  body {
    font-family: ${(p) => p.theme.fonts.sans};
    font-size: ${(p) => p.theme.fontSize.md};
    background-color: ${(p) => p.theme.colors.bg};
    /* Fundo ambiente opcional (desligado na linguagem Nexus: token ambient = none) */
    background-image: ${(p) => p.theme.colors.ambient};
    background-attachment: fixed;
    background-repeat: no-repeat;
    color: ${(p) => p.theme.colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
    overflow-x: hidden;
    line-height: ${(p) => p.theme.lineHeight.normal};
    /* Transição suave ao trocar de tema */
    transition: background-color ${(p) => p.theme.motion.base} ${(p) => p.theme.motion.easing}, color ${(p) => p.theme.motion.base} ${(p) => p.theme.motion.easing};
  }

  h1, h2, h3, h4 {
    font-family: ${(p) => p.theme.fonts.display};
    font-weight: ${(p) => p.theme.fontWeight.bold};
    line-height: ${(p) => p.theme.lineHeight.snug};
    letter-spacing: ${(p) => p.theme.letterSpacing.tight};
    color: ${(p) => p.theme.colors.text};
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
    color: ${(p) => p.theme.colors.primaryText};
    text-underline-offset: 3px;
  }

  /* Valores numéricos e tabelas: algarismos tabulares, alinhados */
  table, .num, [data-numeric] {
    font-variant-numeric: tabular-nums;
  }
  /* Valores financeiros e indicadores em Geist Mono */
  .num, [data-numeric], code, kbd {
    font-family: ${(p) => p.theme.fonts.mono};
  }

  :focus-visible {
    outline: 2px solid ${(p) => p.theme.colors.focus};
    outline-offset: 2px;
  }

  ::selection {
    background: ${(p) => p.theme.colors.primary};
    color: ${(p) => p.theme.colors.onPrimary};
  }

  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  ::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.colors.borderStrong};
    border-radius: 10px;
    border: 3px solid ${(p) => p.theme.colors.bg};
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

  .only-mobile {
    ${(p) => p.theme.media.desktop} {
      display: none !important;
    }
  }

  .hide-mobile {
    ${(p) => p.theme.media.mobile} {
      display: none !important;
    }
  }

  /* Toasts com a identidade do Finanças */
  :root {
    --toastify-color-light: ${(p) => p.theme.colors.bgElevated};
    --toastify-color-dark: ${(p) => p.theme.colors.bgElevated};
    --toastify-text-color-light: ${(p) => p.theme.colors.text};
    --toastify-text-color-dark: ${(p) => p.theme.colors.text};
    --toastify-color-info: ${(p) => p.theme.colors.brand};
    --toastify-color-success: ${(p) => p.theme.colors.success};
    --toastify-color-warning: ${(p) => p.theme.colors.warning};
    --toastify-color-error: ${(p) => p.theme.colors.error};
    --toastify-color-progress-light: ${(p) => p.theme.colors.brand};
    --toastify-color-progress-dark: ${(p) => p.theme.colors.brand};
    --toastify-font-family: ${(p) => p.theme.fonts.sans};
  }
  .Toastify__toast-container {
    z-index: ${(p) => p.theme.z.toast};
  }
  .Toastify__toast {
    font-size: ${(p) => p.theme.fontSize.md};
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => p.theme.colors.border};
    box-shadow: ${(p) => p.theme.shadows.lg};
  }
  ${(p) => p.theme.media.belowDesktop} {
    .Toastify__toast-container--bottom-right {
      bottom: calc(${(p) => p.theme.layout.bottomNav} + 12px + env(safe-area-inset-bottom));
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

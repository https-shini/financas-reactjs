import { Component } from "react";
import { palette, radius, typography } from "../design/tokens";
import { VeldoraLogo } from "../brand/VeldoraLogo";

// Renderizado fora do ThemeProvider (o app pode ter falhado): usa os tokens primitivos diretamente.
const c = { text: palette.ink[975], secondary: palette.ink[600], surface: palette.ink[0], subtle: palette.ink[50], border: palette.ink[100], strong: palette.ink[200], primary: palette.blue[600] };

const box = {
    maxWidth: 520,
    margin: "10vh auto",
    padding: 24,
    fontFamily: typography.fontFamily.sans,
    lineHeight: typography.lineHeight.normal,
    color: c.text,
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: radius.lg,
};

const btn = {
    padding: "10px 16px",
    borderRadius: radius.md,
    border: `1px solid ${c.strong}`,
    background: c.surface,
    color: c.text,
    cursor: "pointer",
    font: "inherit",
    minHeight: 44,
};

/**
 * Captura erros de renderização para que o app nunca fique em tela branca.
 * Os dados no navegador não são alterados por este componente.
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("Erro não tratado na interface:", error, info?.componentStack);
    }

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;
        if (this.props.fallback) return this.props.fallback({ error, reset: () => this.setState({ error: null }) });
        return (
            <div role="alert" style={box}>
                <div style={{ color: c.text, marginBottom: 16 }}>
                    <VeldoraLogo height={22} tone="onLight" />
                </div>
                <h1 style={{ fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, margin: "0 0 8px" }}>Algo deu errado nesta tela</h1>
                <p style={{ margin: "0 0 16px", color: c.secondary }}>
                    Seus dados continuam salvos no navegador. Tente recarregar a página. Se o problema persistir, faça um backup em Configurações › Dados assim que
                    possível.
                </p>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: typography.fontSize.xs, background: c.subtle, padding: 12, borderRadius: radius.sm, color: c.secondary }}>
                    {String(error?.message ?? error)}
                </pre>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button type="button" onClick={() => this.setState({ error: null })} style={btn}>
                        Tentar novamente
                    </button>
                    <button type="button" onClick={() => window.location.reload()} style={{ ...btn, background: c.primary, color: palette.ink[0], borderColor: c.primary }}>
                        Recarregar
                    </button>
                </div>
            </div>
        );
    }
}

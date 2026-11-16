import { Component } from "react";

const box = {
    maxWidth: 520,
    margin: "10vh auto",
    padding: 24,
    fontFamily: "system-ui, sans-serif",
    lineHeight: 1.5,
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
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
                <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Algo deu errado nesta tela</h1>
                <p style={{ margin: "0 0 16px", color: "#475569" }}>
                    Seus dados continuam salvos no navegador. Tente recarregar a página. Se o problema persistir, faça um backup em
                    Configurações › Dados assim que possível.
                </p>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f1f5f9", padding: 12, borderRadius: 8, color: "#334155" }}>
                    {String(error?.message ?? error)}
                </pre>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button type="button" onClick={() => this.setState({ error: null })} style={btn}>
                        Tentar novamente
                    </button>
                    <button type="button" onClick={() => window.location.reload()} style={{ ...btn, background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }}>
                        Recarregar
                    </button>
                </div>
            </div>
        );
    }
}

const btn = {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "#fff",
    cursor: "pointer",
    font: "inherit",
    minHeight: 44,
};

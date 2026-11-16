// Navegação VELDORA: grupos por finalidade, mapeados para as páginas reais do app.
import {
    LayoutDashboard, ArrowLeftRight, ArrowUpCircle, ArrowDownCircle, Landmark, CreditCard, CalendarClock, Target, Flag, Repeat,
    Calculator, BarChart3, HeartPulse, Upload, DatabaseBackup, Settings,
} from "lucide-react";

export const NAV_GROUPS = [
    {
        id: "overview",
        label: "Visão geral",
        items: [{ id: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard }],
    },
    {
        id: "financial",
        label: "Financeiro",
        items: [
            { id: "transactions", label: "Movimentações", to: "/movimentacoes", icon: ArrowLeftRight },
            { id: "income", label: "Receitas", to: "/movimentacoes?tipo=income&periodo=tudo", icon: ArrowUpCircle },
            { id: "expenses", label: "Despesas", to: "/movimentacoes?tipo=expense&periodo=tudo", icon: ArrowDownCircle },
            { id: "accounts", label: "Contas", to: "/configuracoes/contas", icon: Landmark },
            { id: "cards", label: "Cartões e faturas", to: "/planejamento/cartoes", icon: CreditCard },
            { id: "bills", label: "Vencimentos", to: "/planejamento/vencimentos", icon: CalendarClock },
        ],
    },
    {
        id: "planning",
        label: "Planejamento",
        items: [
            { id: "budgets", label: "Orçamentos", to: "/planejamento/orcamentos", icon: Target },
            { id: "goals", label: "Metas", to: "/planejamento/metas", icon: Flag },
            { id: "recurrences", label: "Recorrências", to: "/planejamento/recorrencias", icon: Repeat },
            { id: "simulator", label: "Simulador", to: "/planejamento/simulador", icon: Calculator },
        ],
    },
    {
        id: "analytics",
        label: "Análises",
        items: [
            { id: "reports", label: "Relatórios", to: "/relatorios/mensal", icon: BarChart3 },
            { id: "health", label: "Saúde financeira", to: "/relatorios/saude", icon: HeartPulse },
        ],
    },
    {
        id: "system",
        label: "Sistema",
        items: [
            { id: "data", label: "Importar e exportar", to: "/configuracoes/dados#importar", icon: Upload },
            { id: "backup", label: "Backup", to: "/configuracoes/dados#backup", icon: DatabaseBackup },
            { id: "settings", label: "Configurações", to: "/configuracoes/aparencia", icon: Settings },
        ],
    },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/**
 * Decide o item ativo a partir da localização atual (pathname, search, hash).
 * Retorna o id do item mais específico.
 */
export function activeNavId({ pathname, search = "", hash = "" }) {
    const params = new URLSearchParams(search);
    if (pathname === "/") return "dashboard";
    if (pathname.startsWith("/movimentacoes")) {
        const tipo = params.get("tipo");
        if (tipo === "income") return "income";
        if (tipo === "expense") return "expenses";
        return "transactions";
    }
    if (pathname.startsWith("/configuracoes/contas")) return "accounts";
    if (pathname.startsWith("/configuracoes/dados")) return hash === "#backup" ? "backup" : "data";
    if (pathname.startsWith("/configuracoes")) return "settings";
    if (pathname.startsWith("/relatorios/saude")) return "health";
    if (pathname.startsWith("/relatorios")) return "reports";
    const map = {
        "/planejamento/cartoes": "cards",
        "/planejamento/vencimentos": "bills",
        "/planejamento/orcamentos": "budgets",
        "/planejamento/metas": "goals",
        "/planejamento/recorrencias": "recurrences",
        "/planejamento/simulador": "simulator",
    };
    for (const [prefix, id] of Object.entries(map)) if (pathname.startsWith(prefix)) return id;
    if (pathname.startsWith("/planejamento")) return "bills";
    return null;
}

/** Título contextual (grupo › página) para o cabeçalho e breadcrumbs. */
export function navContext(location) {
    const id = activeNavId(location);
    for (const g of NAV_GROUPS) {
        const item = g.items.find((i) => i.id === id);
        if (item) return { group: g, item };
    }
    return null;
}

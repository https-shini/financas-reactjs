// Navegação do Finanças (padrão Nexus): seções ANÁLISE · FINANCEIRO · OPERAÇÕES · AJUDA,
// mapeadas para as páginas reais do app.
import { House, BarChart3, ArrowLeftRight, WalletCards, CalendarClock, Target, Flag, Repeat, Calculator, Tags, Upload, Download, BookOpen, Settings } from "lucide-react";

export const NAV_GROUPS = [
    {
        id: "analysis",
        label: "Análise",
        items: [
            { id: "dashboard", label: "Visão geral", to: "/", icon: House },
            { id: "reports", label: "Relatórios", to: "/relatorios/mensal", icon: BarChart3 },
        ],
    },
    {
        id: "financial",
        label: "Financeiro",
        items: [
            { id: "transactions", label: "Transações", to: "/movimentacoes", icon: ArrowLeftRight },
            { id: "accounts", label: "Contas e cartões", to: "/configuracoes/contas", icon: WalletCards },
            { id: "bills", label: "A pagar e receber", to: "/planejamento/vencimentos", icon: CalendarClock, badge: "bills" },
            { id: "budgets", label: "Orçamentos", to: "/planejamento/orcamentos", icon: Target },
            { id: "goals", label: "Metas financeiras", to: "/planejamento/metas", icon: Flag },
        ],
    },
    {
        id: "operations",
        label: "Operações",
        items: [
            { id: "recurrences", label: "Recorrências", to: "/planejamento/recorrencias", icon: Repeat },
            { id: "simulator", label: "Simulador", to: "/planejamento/simulador", icon: Calculator },
            { id: "categories", label: "Categorias", to: "/configuracoes/categorias", icon: Tags },
            { id: "import", label: "Importar", to: "/configuracoes/dados#importar", icon: Upload },
            { id: "export", label: "Exportar", to: "/configuracoes/dados#exportar", icon: Download },
        ],
    },
    {
        id: "help",
        label: "Ajuda",
        items: [
            { id: "help", label: "Manual e atalhos", to: "/configuracoes/sobre", icon: BookOpen },
            { id: "settings", label: "Configurações", to: "/configuracoes/aparencia", icon: Settings },
        ],
    },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/** Raiz dos breadcrumbs ("Finanças › Visão geral"). */
export const BREADCRUMB_ROOT = { label: "Finanças", to: "/" };

/**
 * Decide o item ativo a partir da localização atual (pathname e hash).
 * Seções sem item próprio acendem o item que as reúne (ex.: Cartões e faturas → "Contas e cartões").
 */
export function activeNavId({ pathname, hash = "" }) {
    if (pathname === "/") return "dashboard";
    if (pathname.startsWith("/relatorios")) return "reports";
    if (pathname.startsWith("/movimentacoes")) return "transactions";
    if (pathname.startsWith("/configuracoes/contas") || pathname.startsWith("/planejamento/cartoes")) return "accounts";
    if (pathname.startsWith("/planejamento/orcamentos")) return "budgets";
    if (pathname.startsWith("/planejamento/metas")) return "goals";
    if (pathname.startsWith("/planejamento/recorrencias")) return "recurrences";
    if (pathname.startsWith("/planejamento/simulador")) return "simulator";
    if (pathname.startsWith("/planejamento")) return "bills";
    if (pathname.startsWith("/configuracoes/categorias")) return "categories";
    if (pathname.startsWith("/configuracoes/dados")) return hash === "#importar" ? "import" : hash === "#exportar" ? "export" : "settings";
    if (pathname.startsWith("/configuracoes/sobre")) return "help";
    if (pathname.startsWith("/configuracoes")) return "settings";
    return null;
}

/** Contexto (seção › página) para breadcrumbs. */
export function navContext(location) {
    const id = activeNavId(location);
    for (const g of NAV_GROUPS) {
        const item = g.items.find((i) => i.id === id);
        if (item) return { group: g, item };
    }
    return null;
}

/** Itens do breadcrumb: "Finanças › <página>". */
export function breadcrumbItems(location) {
    const ctx = navContext(location);
    if (!ctx) return [{ label: BREADCRUMB_ROOT.label }];
    return [BREADCRUMB_ROOT, { label: ctx.item.label }];
}

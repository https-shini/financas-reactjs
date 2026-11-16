// Navegação do Finanças: grupos da especificação de marca, mapeados para as páginas reais do app.
import { LayoutDashboard, ArrowLeftRight, WalletCards, Tags, Target, CalendarRange, BarChart3, Flag, Settings, LifeBuoy } from "lucide-react";

export const NAV_GROUPS = [
    {
        id: "financial",
        label: "Financeiro",
        items: [
            { id: "dashboard", label: "Visão geral", to: "/", icon: LayoutDashboard },
            { id: "transactions", label: "Transações", to: "/movimentacoes", icon: ArrowLeftRight },
            { id: "accounts", label: "Contas e cartões", to: "/configuracoes/contas", icon: WalletCards },
            { id: "categories", label: "Categorias", to: "/configuracoes/categorias", icon: Tags },
            { id: "budgets", label: "Orçamentos", to: "/planejamento/orcamentos", icon: Target },
        ],
    },
    {
        id: "planning",
        label: "Planejamento",
        items: [
            { id: "planning", label: "Planejamento", to: "/planejamento/vencimentos", icon: CalendarRange },
            { id: "reports", label: "Relatórios", to: "/relatorios/mensal", icon: BarChart3 },
            { id: "goals", label: "Metas financeiras", to: "/planejamento/metas", icon: Flag },
        ],
    },
    {
        id: "system",
        label: "Sistema",
        items: [
            { id: "settings", label: "Configurações", to: "/configuracoes/aparencia", icon: Settings },
            { id: "help", label: "Ajuda", to: "/configuracoes/sobre", icon: LifeBuoy },
        ],
    },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/** Raiz dos breadcrumbs ("Finanças / Visão geral"). */
export const BREADCRUMB_ROOT = { label: "Finanças", to: "/" };

/**
 * Decide o item ativo a partir da localização atual (pathname, search, hash).
 * Seções sem item próprio no menu acendem o item que as reúne
 * (ex.: Cartões e faturas → "Contas e cartões"; Vencimentos, Recorrências e Simulador → "Planejamento").
 */
export function activeNavId({ pathname }) {
    if (pathname === "/") return "dashboard";
    if (pathname.startsWith("/movimentacoes")) return "transactions";
    if (pathname.startsWith("/configuracoes/contas") || pathname.startsWith("/planejamento/cartoes")) return "accounts";
    if (pathname.startsWith("/configuracoes/categorias")) return "categories";
    if (pathname.startsWith("/configuracoes/sobre")) return "help";
    if (pathname.startsWith("/configuracoes")) return "settings";
    if (pathname.startsWith("/planejamento/orcamentos")) return "budgets";
    if (pathname.startsWith("/planejamento/metas")) return "goals";
    if (pathname.startsWith("/planejamento")) return "planning";
    if (pathname.startsWith("/relatorios")) return "reports";
    return null;
}

/** Contexto (grupo › página) para breadcrumbs e sobretítulo. */
export function navContext(location) {
    const id = activeNavId(location);
    for (const g of NAV_GROUPS) {
        const item = g.items.find((i) => i.id === id);
        if (item) return { group: g, item };
    }
    return null;
}

/** Itens do breadcrumb: "Finanças / <página>". */
export function breadcrumbItems(location) {
    const ctx = navContext(location);
    if (!ctx) return [{ label: BREADCRUMB_ROOT.label }];
    return [BREADCRUMB_ROOT, { label: ctx.item.label }];
}

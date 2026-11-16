export const SCHEMA_VERSION = 2;

export const ACCOUNT_TYPES = {
    checking: "Conta corrente",
    savings: "Poupança",
    cash: "Dinheiro",
    investment: "Investimentos",
    other: "Outra",
    credit: "Cartão de crédito",
};

export const GOAL_KINDS = {
    emergency: "Reserva de emergência",
    travel: "Viagem",
    home: "Compra de imóvel",
    vehicle: "Compra de veículo",
    investment: "Investimentos",
    other: "Outro objetivo",
};

export const FREQUENCIES = {
    daily: "Diária",
    weekly: "Semanal",
    monthly: "Mensal",
    yearly: "Anual",
};

export const CATEGORY_ICONS = [
    "Home", "Utensils", "ShoppingCart", "Car", "HeartPulse", "GraduationCap", "PartyPopper", "Repeat",
    "ShoppingBag", "Briefcase", "Laptop", "TrendingUp", "Tag", "Plane", "Gift", "PawPrint", "Baby",
    "Shirt", "Fuel", "Smartphone", "Wifi", "Zap", "Droplet", "Dumbbell", "Coffee", "Film", "Music",
    "BookOpen", "Wrench", "Landmark", "PiggyBank", "Receipt", "Bus", "Bike", "Pill", "Scissors",
];

export const CATEGORY_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#f59e0b", "#84cc16",
    "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#64748b",
];

const now = "2026-01-01T00:00:00.000Z";

// IDs fixos para que categorias padrão sejam estáveis entre instalações e backups.
export const DEFAULT_CATEGORIES = [
    { id: "cat-moradia", name: "Moradia", kind: "expense", icon: "Home", color: "#6366f1", keywords: ["aluguel", "condominio", "condomínio", "iptu", "luz", "energia", "agua", "água", "gas", "gás"] },
    { id: "cat-alimentacao", name: "Alimentação", kind: "expense", icon: "Utensils", color: "#f97316", keywords: ["restaurante", "lanche", "ifood", "almoço", "almoco", "jantar", "padaria", "café", "cafe", "delivery"] },
    { id: "cat-mercado", name: "Mercado", kind: "expense", icon: "ShoppingCart", color: "#22c55e", keywords: ["mercado", "supermercado", "feira", "hortifruti", "atacadão", "atacadao"] },
    { id: "cat-transporte", name: "Transporte", kind: "expense", icon: "Car", color: "#3b82f6", keywords: ["uber", "99", "gasolina", "combustivel", "combustível", "estacionamento", "ônibus", "onibus", "metro", "metrô", "pedagio", "pedágio"] },
    { id: "cat-saude", name: "Saúde", kind: "expense", icon: "HeartPulse", color: "#f43f5e", keywords: ["farmacia", "farmácia", "remedio", "remédio", "medico", "médico", "consulta", "plano de saude", "dentista", "exame"] },
    { id: "cat-educacao", name: "Educação", kind: "expense", icon: "GraduationCap", color: "#8b5cf6", keywords: ["curso", "faculdade", "escola", "livro", "mensalidade"] },
    { id: "cat-lazer", name: "Lazer", kind: "expense", icon: "PartyPopper", color: "#ec4899", keywords: ["cinema", "show", "bar", "viagem", "passeio", "ingresso"] },
    { id: "cat-assinaturas", name: "Assinaturas", kind: "expense", icon: "Repeat", color: "#06b6d4", keywords: ["netflix", "spotify", "assinatura", "prime", "disney", "youtube", "icloud", "internet", "celular"] },
    { id: "cat-compras", name: "Compras", kind: "expense", icon: "ShoppingBag", color: "#f59e0b", keywords: ["roupa", "loja", "shopping", "amazon", "mercado livre", "presente"] },
    { id: "cat-salario", name: "Salário", kind: "income", icon: "Briefcase", color: "#14b8a6", keywords: ["salario", "salário", "pagamento", "holerite", "13º", "ferias", "férias"] },
    { id: "cat-freelance", name: "Freelance", kind: "income", icon: "Laptop", color: "#84cc16", keywords: ["freela", "freelance", "projeto", "cliente"] },
    { id: "cat-investimentos", name: "Investimentos", kind: "both", icon: "TrendingUp", color: "#0ea5e9", keywords: ["rendimento", "dividendo", "investimento", "cdb", "tesouro", "aporte"] },
    { id: "cat-outros", name: "Outros", kind: "both", icon: "Tag", color: "#64748b", keywords: [] },
].map((c) => ({ ...c, archived: false, createdAt: now, updatedAt: now }));

export const DEFAULT_ACCOUNT_ID = "acc-principal";

export const DEFAULT_ACCOUNTS = [
    {
        id: DEFAULT_ACCOUNT_ID,
        name: "Conta principal",
        type: "checking",
        color: "#6366f1",
        initialBalanceCents: 0,
        archived: false,
        createdAt: now,
        updatedAt: now,
    },
];

export const DEFAULT_SETTINGS = {
    theme: "system", // "light" | "dark" | "system"
    locale: "pt-BR",
    currency: "BRL",
    onboardingDone: false,
    lastBackupAt: null,
    sidebarCollapsed: false,
    hideBalances: false,
    aiConsent: false,
    dismissedSuggestions: [],
};

export function createEmptyStore() {
    return {
        schemaVersion: SCHEMA_VERSION,
        transactions: [],
        categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, keywords: [...c.keywords] })),
        accounts: DEFAULT_ACCOUNTS.map((a) => ({ ...a })),
        budgets: [],
        goals: [],
        recurrences: [],
        settings: { ...DEFAULT_SETTINGS },
        meta: { migrations: [] },
    };
}

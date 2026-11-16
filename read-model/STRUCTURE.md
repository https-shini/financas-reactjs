# Estrutura do projeto e decisões arquiteturais

## Estrutura

```
src/
├── domain/        Regras de negócio puras e testadas (sem React)
│   ├── money.js            centavos, parse e formatação
│   ├── dates.js            datas locais "YYYY-MM-DD"
│   ├── transactions.js     validação, criação, efeitos no saldo
│   ├── selectors.js        saldos, resumos, categorias, filtros, vencimentos
│   ├── cards.js            faturas e limite de cartões
│   ├── installments.js     parcelamento
│   ├── recurrence.js       recorrências idempotentes
│   ├── budgets.js · goals.js  (limite zero com gasto = estourado)
│   ├── projection.js       saldo projetado e "quanto posso gastar"
│   ├── insights.js         insights por regras
│   ├── intelligence.js     assinaturas, saúde financeira, simulador
│   ├── importer.js         CSV/OFX/planilhas, mapeamento, duplicados
│   └── quickCapture.js     "Mercado 85,90 ontem"
├── storage/       schema (Zod), migrações, repositório, backup
├── state/         FinanceProvider + operações puras (store => store) + contextos
├── components/
│   ├── ui/        design system (Button, Card, MoneyInput, Modal/BottomSheet, Amount, Progress…)
│   └── layout/    PageHeader e grade responsiva
├── app/           AppShell (sidebar, topbar, navegação inferior), tema, UIContext, alertas
├── features/      dashboard, transactions, planning, reports, settings, data, recovery
├── hooks/         useFormat, useMediaQuery, useHotkeys
├── styles/        tokens (theme.js) e estilos globais
└── utils/         exportação (Excel, CSV, PDF, Word, relatórios)
```

## Decisões

- **Domínio separado da interface.** Todas as contas financeiras estão em `src/domain` e são testadas sem React. Dashboard, movimentações e relatórios chamam as mesmas funções.
- **Operações puras.** Cada alteração é uma função `(store, ...args) => store` em `state/operations.js`. O provider aplica, persiste e reporta erros. Isso dispensa bibliotecas de estado e mantém o histórico de ações testável.
- **Persistência resiliente.** O repositório valida com Zod, corrige problemas recuperáveis (IDs duplicados, referências quebradas), migra versões e entra em modo de recuperação quando os dados são ilegíveis, sem sobrescrever nada.
- **Local-first.** Sem backend; depois de carregado, o app não depende de servidor. Fontes self-hosted (`@fontsource-variable/inter`), sem requisições externas em tempo de execução.
- **Segurança em produção.** `vercel.json` define CSP restritiva (somente a própria origem, sem `unsafe-eval`; o Zod roda em modo `jitless`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` e `Permissions-Policy`. `npm run preview` aplica os mesmos cabeçalhos. Exportações CSV/XLSX passam por `utils/csv.js` (proteção contra injeção de fórmulas).
- **Vite** substituiu o Create React App (descontinuado). O build continua em `build/` para manter o deploy existente.
- **Dependências seguras.** `xlsx` vem da CDN oficial da SheetJS (0.20.3, com correções que não existem no npm); jsPDF 4, zod 4 e react-router 7 sem vulnerabilidades conhecidas (`npm audit`: 0). Bibliotecas de exportação são carregadas sob demanda.
- **Design system próprio** com Styled Components e tokens com contraste WCAG AA verificado nos dois temas.
- **Acessibilidade**: landmarks, link "pular para o conteúdo", foco visível, rótulos associados, `aria-label` obrigatório em botões de ícone, diálogos com foco preso e Esc, tabelas alternativas para gráficos, `prefers-reduced-motion`, `lang="pt-BR"`, alvos de toque de 44 px.
- **Responsividade**: < 640 px celular (navegação inferior, bottom sheets), 640–1024 px tablet (grade de 2 colunas), > 1024 px desktop (sidebar recolhível, grade de 12 colunas).

## Testes e CI

`npm test` executa os testes de domínio, armazenamento, operações e interface. O workflow `.github/workflows/ci.yml` roda lint, testes e build em cada push e pull request.

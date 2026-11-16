# Análise do Fluxer e evolução do Design System

Referências: repositório [fluxerapp/fluxer](https://github.com/fluxerapp/fluxer) (lido localmente, sem executar código) e a aplicação em [fluxer.com](https://fluxer.com). O objetivo não foi copiar a interface do Fluxer. Foi entender **como** ele organiza e implementa a estrutura da UI e aplicar as boas decisões à arquitetura e à identidade do Finanças.

## 1. Como o Fluxer está organizado

| Área | O que encontramos | Por que funciona |
| --- | --- | --- |
| Monorepo | `fluxer_app` (React + TypeScript + rspack), `packages/*` compartilhados e serviços em Rust e TS separados por domínio | Front-end isolado e versionado com os pacotes de UI |
| Front-end | `src/app` (bootstrap, rotas, `globals.css`), `src/features/<domínio>` (channel, guild, user, theme, ui, navigation…) e `src/lib` | Organização **por funcionalidade**: cada domínio tem componentes, estilos (`*.module.css`) e hooks |
| Biblioteca de UI | `src/features/ui`: primitivos (Scroller, Spinner, Avatar, Slider, Pagination), `focus_ring`, `action_menu`, `sheet`, `segmented_tabs` e hooks (`usePrefersReducedMotion`, `usePopout`, `useResizablePane`) | Primitivos reutilizáveis separados dos componentes de cada funcionalidade |
| Tokens | `globals.css` com escalas (`--spacing-*`, `--radius-*`, `--z-index-*`, `--transition-*`), **tokens de layout** (`--layout-sidebar-width`, `--layout-header-height`, `--content-padding`) e **tokens por componente** (`--channel-header-gap`, `--channel-header-action-size`, `--member-list-item-*`) derivados da escala | Três camadas (escala → layout → componente): mudar uma medida estrutural não exige caçar valores soltos |
| Cores | Geradas por script (`GenerateColorSystem.ts`) para vários temas, com superfícies em camadas (`--background-primary`, `-secondary`, `-tertiary`) e **modificadores translúcidos de interação** (`--background-modifier-hover` e `-selected`, `--surface-interactive-*`) | Hover e seleção funcionam sobre qualquer superfície e são definidos uma única vez |
| Manifesto | `ThemeVariableManifest.ts` gerado, com todas as variáveis tipadas e agrupadas | O tema é auditável e tipado |
| Estrutura | `GuildLayout`: grid `var(--layout-sidebar-width) minmax(0, 1fr)`; `GuildSidebar` = `header` + `content`; `ChannelHeader`: grid `minmax(0, 1fr) auto` com altura `--layout-header-height` | Sidebar e header compartilham a mesma altura de faixa; `minmax(0, …)` evita estouro de texto |
| Estados | `ChannelItem`: não selecionado (texto atenuado), hover (modificador), selecionado (modificador + texto forte); hover só com a janela focada; `FocusRing` próprio, visível só no modo teclado | Estados previsíveis e o mesmo padrão em listas, menus e ações |
| Responsividade | `--layout-header-height-mobile`; abaixo de 768 px, `MobileBottomNav` fixa (ícone de 24 px e rótulo de 10 px) e a navegação completa em um painel | O celular tem navegação própria, não é o desktop espremido |

## 2. Diagnóstico do Finanças antes desta etapa

| Problema | Onde |
| --- | --- |
| `AppShell.jsx` com **660 linhas** misturando sidebar, header, navegação inferior, drawer, atalhos e estilos | `src/app/AppShell.jsx` |
| Controle de recolher a sidebar **duplicado** (no header e no rodapé da sidebar) | AppShell |
| Hover e seleção **com a mesma cor** (`bgSurface`) na sidebar: o item em hover parecia selecionado | SidebarNav |
| Estados de interação reimplementados em **8 lugares**, com cores diferentes (`bgHover`, `bgSurface`) | SidebarNav, SidebarUser, Notifications, Menu e AppShell |
| Medidas soltas (36/34/32 px, recuos de 16/24/32 px) sem token | Header, sidebar e controles |
| Breadcrumbs do header **desalinhados** do título da página quando o conteúdo é centralizado (área > 1320 px) | Header × Content |
| Invólucros de visibilidade (`OnlyDesktop`, `HideMobile`…) definidos dentro do AppShell, sem reuso | AppShell |
| `IconButton sm` com 36 px e `Button sm` com 32 px no mesmo header (alturas diferentes lado a lado) | Button |

## 3. O que foi implementado

### 3.1 Tokens de layout em camadas (`src/design/tokens.js`)

`theme.layout` passou de 6 valores soltos para tokens organizados em três grupos:

- **estrutura:** `sidebar`, `sidebarCollapsed`, `header`, `bottomNav`, `content`, `contentPaddingInline` (e versões para tablet e celular), `contentPaddingBlock`;
- **controles:** `control` (34 px, altura única dos controles compactos) e `touchTarget` (44 px);
- **componentes:** `sidebarItemHeight`, `sidebarItemGap`, `sidebarItemPaddingInline`, `sidebarIcon`, `sidebarSectionGap`, `sidebarFooterMinHeight`, `headerGap`, `headerActionsGap` e `headerSearchWidth`.

Todos derivam da escala `space()` e também são exportados como `--v-layout-*`.

### 3.2 Tokens de interação (`src/design/themes.js`)

`interactiveHover`, `interactiveSelected`, `interactivePressed`, `interactiveText` e `interactiveSelectedText` são camadas translúcidas, como os *modifiers* do Fluxer, e funcionam sobre a sidebar, os cards e os menus. Um teste compõe as camadas sobre as superfícies e garante:

- texto AA em repouso, no hover e na seleção;
- seleção mais visível que o hover.

### 3.3 Padrões de interação (`src/components/ui/interaction.js`)

- `interactiveItem`: repouso, hover (só com ponteiro fino, para não "grudar" no toque), pressionado, selecionado (`aria-current`, `aria-selected` ou `.active`), foco por teclado e desabilitado.
- `focusRing(inset)`, `floatingSurface` e `compactControl`.

**Uso:** SidebarNav, SidebarUser, rodapé da sidebar, Notifications e Menu, que antes tinham oito implementações diferentes.

### 3.4 Componentes estruturais (`src/app/layout/`)

| Componente | Responsabilidade |
| --- | --- |
| `AppShell.jsx` (**130 linhas**, antes 660) | Apenas composição e atalhos globais (`N`, `Q`, `/`, `Ctrl K`, `←` `→`) |
| `Sidebar.jsx` | Três regiões: **SidebarHeader** (marca, altura = `layout.header`), **SidebarBody** (única área com rolagem, `overscroll-behavior: contain`), **SidebarFooter** (perfil e o único controle de recolher, com `aria-expanded`) |
| `Header.jsx` | Três zonas: **Leading** (onde estou: breadcrumbs ou marca), **Tools** (o que estou vendo: mês e busca), **Actions** (o que posso fazer). O recuo horizontal é o mesmo do conteúdo, inclusive com o conteúdo centralizado. |
| `MobileNav.jsx` | Barra inferior + drawer. Reutiliza `SidebarNav` e `SidebarUser`: os mesmos itens, estados e contadores no desktop e no celular. |
| `SidebarNav.jsx` / `SidebarUser.jsx` | Itens com medidas de `theme.layout` e estados do `interactiveItem` |
| `responsive.js` | `OnlyDesktop`, `OnlyBelowDesktop`, `HideMobile`, `OnlyWide` e `BelowWide`, compartilhados |

### 3.5 Integração Sidebar × Header × conteúdo

```
┌──────────────┬───────────────────────────────────────┐
│ SidebarHeader│ Header (Leading · Tools · Actions)    │ ← 60 px nas duas colunas
├──────────────┼───────────────────────────────────────┤
│ SidebarBody  │ Content                               │
│  (rola)      │  breadcrumbs, título e cards na mesma │
├──────────────┤  coluna; ações do header na mesma     │
│ SidebarFooter│  borda direita dos cards              │
└──────────────┴───────────────────────────────────────┘
```

Medido em 1280, 1440 e 1920 px, com a sidebar aberta e recolhida:

- a borda inferior da faixa da marca e a do header coincidem (60 px);
- os breadcrumbs ficam na mesma coordenada X do título da página;
- a última ação do header fica na mesma borda direita dos cards;
- todos os controles do header têm 34 px.

## 4. O que não foi copiado (e por quê)

- **Lista de servidores (*guild list*) e área de voz:** o Finanças não tem esses conceitos.
- **Geração de cores por script e manifesto tipado:** o projeto usa JavaScript com styled-components. Os tokens já são uma fonte única em JS e exportados como variáveis CSS, e um script de geração seria complexidade sem ganho aqui.
- **Identidade visual do Fluxer** (índigo, Radio Canada Big, ilustrações): a identidade do Finanças (padrão Nexus, violeta, Geist) foi preservada.

## 5. Validação

- **Visual:** 18 páginas × 4 cenários (desktop e celular, claro e escuro) e as larguras 320, 360, 768 e 1024 px, sem problemas (rolagem, cortes, sobreposição, aba ativa, H1, console). Estados vazios, de erro, modais e drawer também sem problemas.
- **Teclado:** a ordem de foco é pular para o conteúdo → marca → navegação → rodapé da sidebar → header, com anel de foco em todos os elementos.
- **Testes:** contraste das camadas de interação, `--v-layout-*` e controle único de recolher (`aria-expanded`), além dos testes anteriores.
- **Camadas financeiras:** nenhuma alteração em `src/domain`, `src/storage`, `src/state` ou `src/utils`.

# Auditoria funcional e bateria de testes

Data: 21/11/2026 · Branch `claude/awesome-darwin-8e30fc`

## 1. Escopo e método

O Finanças é *local-first*: não há servidor, banco remoto nem APIs externas. A "camada de banco de dados" é o repositório em `src/storage` (chave `financas:store` no `localStorage`, esquema v2 validado com Zod, migrações e backup). Por isso a validação de integração foi feita contra essa camada.

Cada funcionalidade foi verificada em três níveis:

1. **Operação real no navegador:** Chromium via Playwright, com cliques, digitação, downloads e upload de arquivos, como um usuário faria.
2. **Estado persistido:** leitura direta do `localStorage` após cada operação, para confirmar o que foi gravado, e não apenas o que aparece na tela.
3. **O que é exibido:** indicadores, listas, gráficos e mensagens, conferidos contra os valores calculados a partir dos dados gravados.

A bateria E2E fica versionada em `e2e/` (60 testes) e pode ser executada de novo com `node e2e/run.cjs` (instruções no README).

## 2. Testes executados e resultados

| Bateria | Tipo | Resultado final |
| --- | --- | --- |
| Vitest (25 arquivos) | Unitários de domínio, integração de estado, armazenamento e interface (jsdom) | **263 aprovados · 0 reprovados** |
| E2E em navegador real, rodada 1 (sem animações) | Funcionais, integração, regressão, validação, consistência, erros e interface | **60 aprovados · 0 reprovados** |
| E2E em navegador real, rodada 2 (com animações) | Mesma bateria, para confirmar estabilidade | **60 aprovados · 0 reprovados** |
| Auditoria visual automatizada | 19 páginas × desktop/celular × claro/escuro, e larguras 320, 360, 768 e 1024 px | **152 combinações · 0 problemas** |
| Estados especiais | Vazios, erros de validação, modais, folha de filtros e drawer | **38 estados · 0 problemas** |
| ESLint | Análise estática | 0 erros · 0 avisos |
| Build de produção | Vite | Concluído |
| `npm audit` | Dependências | 0 vulnerabilidades |

**Durante a auditoria**, antes das correções, a bateria E2E encontrou 7 defeitos reais no aplicativo (seção 4). As demais reprovações intermediárias vieram de seletores ou dados de teste mal escritos (por exemplo, um CSV com `;` sem aspas), e foram corrigidas no próprio teste. Nenhuma regra do aplicativo foi afrouxada para um teste passar.

## 3. Funcionalidades testadas (E2E)

| Módulo | Testes | O que foi verificado |
| --- | --- | --- |
| Transações | 12 | Criar (valor, categoria, data e status gravados), máscara de valor, campos obrigatórios, editar (id e `createdAt` preservados), excluir com **desfazer** (registro idêntico), duplicar, seleção em lote (pagar e excluir), parcelamento (soma = total), série recorrente, busca, filtros refletidos na URL, totais do filtro, captura rápida, regressões F1 e F5 |
| Painel (Visão geral) | 1 + 2 de consistência | Saldo atual, Total a pagar, Total a receber e Resultado do mês **iguais aos cálculos feitos a partir do armazenado**; resumo do gráfico; calendário, despesas por categoria e movimentações recentes conferidos com os lançamentos |
| Contas a pagar | 5 | Só compromissos (sem receitas; compra no cartão entra só pela fatura); indicadores; marcar como pago, com o indicador do módulo e o saldo do painel **atualizados automaticamente**; reabrir; nova conta a pagar já pendente; filtros (busca, tipo, horizonte); "Pagar fatura" abre a fatura certa |
| Contas a receber | 2 | Só receitas; indicadores próprios; marcar como recebido aumenta o saldo atual e reduz o total a receber |
| Contas | 2 | Criar com saldo inicial (refletido no saldo atual), editar, excluir; transferência não altera o consolidado nem o resultado |
| Categorias | 1 | Criar, impedir nome duplicado, excluir categoria em uso **movendo as transações** |
| Cartões e faturas | 2 | Criar cartão; compra entra na fatura; pagamento parcial e total atualizam fatura, Contas a pagar e saldo; compra conta como despesa **uma única vez**; pagamento acima do saldo bloqueado |
| Orçamentos | 1 | Criar, percentual de uso, categoria já orçada não é oferecida de novo |
| Metas | 1 | Criar, aportar, resgatar, **resgate acima do acumulado bloqueado**, progresso |
| Recorrências | 1 + 1 de regras | Encerrar série remove pendências e preserva o histórico; editar a série altera só pendentes, e os pagos mantêm o valor |
| Parcelas | 1 de regras | Editar todas as parcelas preserva o total e não duplica |
| Configurações | 1 | Tema e "Ocultar valores" persistem após recarregar e se aplicam |
| Importação | 1 | CSV com prévia, linha inválida apontada, texto com fórmula importado como texto, **duplicadas detectadas** na segunda importação |
| Exportação | 2 | CSV com BOM, separador `;`, valor correto e **fórmula neutralizada**; Excel, PDF e Word gerados |
| Backup | 2 | Baixar e restaurar devolve exatamente os dados; arquivo inválido é recusado sem alterar nada |
| Resiliência | 2 + 3 de integridade | JSON corrompido abre a recuperação **sem apagar o original**; rota inexistente; **duas abas** sincronizam sem uma sobrescrever a outra; **armazenamento cheio** avisa e não corrompe; conta com movimentações não é excluída |
| Relatórios e simulador | 2 | Relatório mensal confere com os lançamentos; as cinco abas carregam; o simulador **não altera os dados reais** |
| Navegação | 3 | Todos os itens do menu abrem a página certa, marcam o item ativo e não geram erros; contadores e notificações; atalhos `N`, `/` e `→` |
| Validação | 5 | Valor trava no limite do domínio; observação com até 500 caracteres; nome de conta obrigatório e único; dias do cartão entre 1 e 31; meta e orçamento sem valor; recorrência com datas invertidas |
| Responsivo e celular | 6 + 1 | 17 páginas em 320, 390, 768, 1024, 1440 e 1920 px, sem rolagem horizontal e com um H1 por página; no celular, criar pelo "+" e pagar conta pela aba "Contas" |

Todo teste E2E também falha se aparecer qualquer erro no console do navegador.

## 4. Problemas encontrados e correções

| # | Problema | Causa | Impacto | Correção | Reteste |
| --- | --- | --- | --- | --- | --- |
| F1 | Em Transações, digitar na busca e trocar outro filtro em menos de 250 ms **descartava o texto digitado** | O efeito que sincroniza o campo com a URL sobrescrevia o rascunho da busca ainda no atraso | Busca perdida sem aviso; resultado diferente do esperado | Ao aplicar qualquer filtro, a busca pendente vai junto | Teste "regressão F1" ✔ |
| F1b | No mesmo fluxo, o temporizador da busca **desfazia o filtro de status** escolhido logo depois | O temporizador usava uma cópia antiga (*closure*) dos parâmetros da URL | Filtro aplicado e revertido sozinho | `update` e o temporizador passam a ler sempre os parâmetros mais recentes (refs) | Teste de filtros ✔ |
| F2 | Era possível **pagar uma fatura com valor maior que o saldo em aberto** | O diálogo não tinha limite superior | O excedente não é levado à fatura seguinte: o cartão ficava com crédito enquanto Contas a pagar continuava cobrando as próximas faturas por inteiro (**inconsistência entre saldo e compromissos**) | O valor fica limitado ao saldo em aberto, com mensagem que mostra esse saldo. Removido também um código sem efeito na data padrão (`today < dueDate ? today : today`) | Teste "pagamento acima do saldo" ✔ |
| F3 | Com **"Ocultar valores"** ligado, valores continuavam em textos só para leitores de tela | Tabelas e resumos acessíveis usavam o formatador sem checar a preferência (gráfico do painel, patrimônio e projeção nos relatórios, simulador, resumo de Transações) | Privacidade: valores lidos em voz alta ou copiados ao selecionar o texto | Novo `privateMoney` em `useFormat`, aplicado nos 5 pontos | Teste "ocultar valores" (texto e `aria-label`) ✔ |
| F4 | Era possível criar **duas contas ou cartões com o mesmo nome** | Só categorias checavam nomes duplicados | Seleção ambígua no cadastro, no pagamento de fatura e na importação | Validação de nome único (sem diferenciar maiúsculas nem espaços) nos diálogos de conta e de cartão | Teste "conta duplicada" ✔ e teste unitário |
| F5 | Ao abrir "Nova transação", **o primeiro clique em Receita ou Transferência podia não funcionar**, e aparecia um erro antes de o usuário digitar | Ao sair do campo Valor vazio, a mensagem de erro era inserida acima do seletor de tipo e o deslocava 23 px no meio do clique | Usabilidade: clique perdido e erro prematuro | Campo vazio só acusa erro ao salvar; ao sair de um campo preenchido, a validação continua | Teste "regressão F5" ✔ (deslocamento medido: 23 px antes, 0 px depois) |
| F6 | O formulário de transação dizia que a transação pendente "Fica em **Vencimentos**" | Texto anterior à separação dos módulos | Orientação errada ao usuário | Texto atualizado para "Fica em Contas a pagar ou a receber" | Verificado |

Nenhuma correção alterou `src/domain`, `src/storage`, `src/state` ou `src/utils`. As regras financeiras não mudaram: as correções ficaram na interface e nas validações dos formulários.

## 5. Pendências e limitações conhecidas

- **Pagador ou cliente em Contas a receber:** o modelo de dados não tem esse campo; hoje a "origem" é a categoria da receita. Criar o campo exige mudar o esquema em `src/domain` e `src/storage`, o que depende de autorização.
- **Crédito em cartão:** o modelo de faturas não leva excedentes para a fatura seguinte. Com a F2 isso não acontece mais por pagamento, mas também não é suportado como funcionalidade. Estornos continuam funcionando como receita no cartão.
- **Cobertura do Vitest na interface:** é de 67% das linhas; as telas de cadastro (Configurações, Cartões, Orçamentos, Metas, Recorrências, Relatórios) têm pouca cobertura em jsdom. Essas telas passaram a ser cobertas pela bateria E2E, que não entra na métrica.
- **Instabilidade observada:** sob instrumentação de cobertura, um teste de interface do Vitest passou do tempo uma vez e passou ao repetir. Na suíte normal, 263/263 em todas as execuções.

## 6. O que não pôde ser testado

| Item | Motivo |
| --- | --- |
| Integração com servidor, banco remoto ou APIs | Não existem na arquitetura (app local-first) |
| Firefox e Safari, aparelhos físicos | Ambiente com apenas Chromium; celular emulado (iPhone 13) |
| Leitor de tela real (NVDA, VoiceOver) | Sem tecnologia assistiva no ambiente; validados papéis, nomes acessíveis e `aria-*` |
| Conteúdo interno de Excel, PDF e Word | Verificados geração, extensão e tamanho; o conteúdo do CSV foi conferido linha a linha |
| Importação de XLSX e OFX em navegador | Coberta por testes unitários (`importer.test.js`); o E2E cobriu CSV |
| Produção (Vercel) | Fora do escopo autorizado: não publicar nem alterar a produção |
| Grandes volumes de dados na interface | Coberto pelo teste de invariante com 2.000 operações aleatórias no domínio; sem medição de desempenho da interface |

## 7. Avaliação geral

- **Integridade dos dados: alta.** Todas as operações conferidas gravam exatamente o esperado. Desfazer restaura o registro idêntico. Backup e restauração reproduzem os dados. Dados corrompidos e armazenamento cheio não destroem nada, e duas abas não se sobrescrevem.
- **Consistência dos cálculos: alta.** Os indicadores do painel, de Contas a pagar e a receber, dos relatórios, do calendário e das categorias batem com os valores recalculados a partir do armazenado. Transferências e pagamentos de fatura não duplicam despesas.
- **Separação Pagar × Receber: correta**, sem mistura de dados, com indicadores atualizados automaticamente após cada operação.
- **Estabilidade:** depois das correções, 263 testes unitários e de integração e 60 testes E2E (duas rodadas) aprovados, sem erros de console e sem problemas de layout em seis larguras de tela.

Os 7 defeitos encontrados foram corrigidos e retestados. Os pontos em aberto (campo de pagador e crédito em cartão) são evoluções de modelo que dependem de decisão.

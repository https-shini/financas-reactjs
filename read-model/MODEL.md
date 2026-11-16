# Modelo de dados, regras de negócio e backup

## Armazenamento

| Chave do localStorage | Conteúdo |
| --- | --- |
| `financas:store` | Store atual (schema v2), validado com Zod a cada carregamento |
| `financas:backup:<data>:<motivo>` | Cópias de segurança automáticas (as 3 mais recentes) |
| `financas:corrupted:<data>` | Cópia bruta de dados que falharam na leitura |
| `transactions`, `theme` | Dados da v1 — **mantidos intactos** após a migração |

Toda leitura e gravação passa por `src/storage/repository.js`. Erros de gravação (cota cheia, armazenamento bloqueado) são exibidos ao usuário; nunca são silenciados.

## Store (schema v2)

```js
{
  schemaVersion: 2,
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],      // contas e cartões (type: "credit")
  budgets: Budget[],
  goals: Goal[],
  recurrences: Recurrence[],
  settings: { theme, locale, currency, onboardingDone, lastBackupAt, sidebarCollapsed, hideBalances, aiConsent, dismissedSuggestions },
  meta: { migrations: [], legacyRejected?: [] }
}
```

### Transaction

```js
{
  id: string,                        // crypto.randomUUID()
  type: "income" | "expense" | "transfer",
  amountCents: number,               // inteiro positivo; o tipo define o sinal
  description: string,
  date: "YYYY-MM-DD",                // data local, sem fuso
  categoryId: string | null,         // sempre null em transferências
  accountId: string,                 // origem (ou conta/cartão do lançamento)
  toAccountId?: string,              // destino (somente transferências)
  status: "paid" | "pending",
  notes?: string,
  recurrenceId?: string, occurrenceDate?: "YYYY-MM-DD",
  installment?: { group: string, n: number, of: number, totalCents?: number },
  invoiceRef?: { cardId: string, month: "YYYY-MM" },   // pagamento de fatura
  createdAt: string, updatedAt: string
}
```

Account: `{ id, name, type: checking|savings|cash|investment|other|credit, color, initialBalanceCents, archived, limitCents?, closingDay?, dueDay?, paymentAccountId? }`
Budget: `{ id, categoryId, limitCents, overrides: { "YYYY-MM": cents } }`
Goal: `{ id, name, kind, targetCents, deadline, color, contributions: [{ id, date, amountCents, note? }], archived }`
Recurrence: `{ id, type, amountCents, description, categoryId, accountId, frequency: daily|weekly|monthly|yearly, interval, startDate, endDate, active, skippedDates[] }`

## Regras de negócio (implementadas em `src/domain`, com testes)

1. Receitas aumentam o saldo; despesas diminuem.
2. Transferências movem dinheiro entre contas e **não** contam como receita/despesa; o consolidado não muda.
3. **Saldo realizado** = saldo inicial + lançamentos `paid` com data até hoje. Pendentes e lançamentos futuros ficam de fora.
4. Lançamentos futuros e pendentes entram nas **projeções** (`projection.js`), assim como recorrências ainda não geradas e faturas de cartão.
5. **Cartão de crédito**: compra = despesa no cartão (conta na data da compra); estorno = receita no cartão; pagamento de fatura = transferência conta → cartão com `invoiceRef`. Assim o pagamento **não duplica** a despesa. Compras após o dia de fechamento vão para a fatura seguinte.
6. **Parcelamento**: N transações ligadas por `installment.group`; o resto dos centavos vai para as primeiras parcelas. Na edição em grupo, parcelas já pagas (ou de faturas pagas) mantêm o valor.
7. **Recorrências**: ocorrências pendentes geradas até o fim do mês seguinte, de forma **idempotente** pela chave `(recurrenceId, occurrenceDate)`. Ocorrências excluídas vão para `skippedDates` e não voltam. Editar a série altera apenas pendentes a partir de hoje; mudar a periodicidade regenera os pendentes futuros.
8. Valores sempre em **centavos inteiros**; `parseMoneyString` aceita formatos brasileiros e internacionais sem usar float.
9. Toda exclusão tem **desfazer** ou **confirmação**.
10. Toda importação tem **prévia**; linhas inválidas são listadas com o motivo (nunca descartadas em silêncio) e podem ser baixadas.
11. Toda restauração **valida** o arquivo e cria uma cópia de segurança dos dados atuais antes de substituir.
12. Relatórios e dashboard usam as mesmas funções de `selectors.js` (competência = data do lançamento).

Decisões adotadas onde o requisito era aberto:
- Registros antigos (v1) sem data recebem a **data da migração** e status `paid`, na conta principal e sem categoria.
- Resultado mensal inclui lançamentos pendentes do mês (competência); o saldo em contas não.
- Ocorrências de recorrência com data passada são criadas como **pendentes** para o usuário confirmar.
- "Quanto posso gastar hoje" = (saldo previsto no fim do mês − aportes de metas pendentes no mês) ÷ dias restantes.
- Saúde financeira: 4 critérios de 25 pontos (poupança, orçamentos, reserva, despesas fixas); critérios sem dados não são avaliados e a nota é proporcional aos avaliados.

## Histórico de migrações

| Versão | Mudança |
| --- | --- |
| v1 → v2 | `transactions` (`{id, desc, amount, expense}`) vira o store v2. Valores → centavos; IDs aleatórios de 0–1000 (que colidiam) → UUID; descrições com `&amp;`/`&lt;` gravadas pelo DOMPurify são decodificadas; registros sem valor válido são preservados em `meta.legacyRejected`; tema antigo é mantido. Antes de migrar, uma cópia é salva em `financas:backup:*:pre-migracao-v1`. |

Versões futuras devem adicionar uma função em `src/storage/migrations.js` e um teste em `src/storage/storage.test.js`. Dados de versão mais nova que o app abrem a tela de recuperação em vez de serem sobrescritos.

## Backup

Arquivo JSON: `{ app: "financas-reactjs", kind: "backup", backupVersion: 1, schemaVersion: 2, exportedAt, data: Store }`. A restauração aceita também um store cru e a lista exportada pela v1.

## Limitações que dependem de backend

Sincronização entre dispositivos, backup automático na nuvem, contas de usuário, notificações fora do app (e-mail/push), Open Finance e assistente com IA. O assistente só será integrado com servidor seguro e consentimento explícito (`settings.aiConsent`); hoje nenhum dado sai do navegador.

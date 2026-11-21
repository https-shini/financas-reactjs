import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Wallet, ArrowUpRight, ArrowDownLeft, Scale, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Amount, Delta, NumericDisplay, StatCard } from "../../../components/ui";
import { balancesByAccount, consolidatedBalance, monthComparison } from "../../../domain/selectors";
import { forecastEndOfMonth } from "../../../domain/projection";
import { isCard } from "../../../domain/cards";
import { formatDateBR } from "../../../domain/dates";
import { billEntries, billSummary } from "../../bills/billsModel";

const Grid = styled.div`
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
    }
    > section {
        height: 100%;
    }
    ${(p) => p.theme.media.mobile} {
        section {
            padding: 12px 14px;
            gap: 8px;
        }
        .kpi-value > span {
            font-size: 1.25rem;
        }
    }
`;

const Foot = styled.div`
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid ${(p) => p.theme.colors.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.75rem;
    color: ${(p) => p.theme.colors.textMuted};
    min-height: 32px;
    a,
    button {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        color: ${(p) => p.theme.colors.primaryText};
        text-decoration: none;
        white-space: nowrap;
        background: none;
        border: 0;
        padding: 0;
        cursor: pointer;
    }
    .late {
        white-space: nowrap;
        color: ${(p) => p.theme.colors.expense};
        font-weight: ${(p) => p.theme.fontWeight.medium};
    }
    ${(p) => p.theme.media.mobile} {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const Accounts = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
    font-size: 0.8125rem;
    li {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        min-width: 0;
    }
    .n {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 2px;
        margin-right: 6px;
    }
`;

const Value = ({ children }) => (
    <span className="kpi-value">
        <NumericDisplay>{children}</NumericDisplay>
    </span>
);

/**
 * Indicadores principais da Visão geral, em ordem de importância:
 * saldo atual → total a pagar → total a receber → resultado do mês.
 */
export function HeadlineKpis({ store, today, month }) {
    const [showAccounts, setShowAccounts] = useState(false);
    const balance = consolidatedBalance(store, today);
    const forecast = forecastEndOfMonth(store, today);
    const accounts = balancesByAccount(store, today).filter((b) => !b.account.archived || b.balanceCents !== 0);
    const pay = billSummary(billEntries(store, today, "payable"), today, month);
    const rec = billSummary(billEntries(store, today, "receivable"), today, month);
    const cmp = monthComparison(store, month);

    return (
        <Grid>
            <StatCard
                label="Saldo atual"
                icon={Wallet}
                iconTone="primaryText"
                tooltip="Dinheiro em contas (exceto cartões), considerando apenas lançamentos pagos até hoje."
                value={
                    <Value>
                        <Amount cents={balance.cashCents} private colored={false} weight={600} big />
                    </Value>
                }
                hint={
                    <>
                        Previsto em {formatDateBR(forecast.endDate, "dd/MM")}: <Amount cents={forecast.endBalanceCents} private colored={false} weight={500} />
                    </>
                }
            >
                {showAccounts && (
                    <Accounts aria-label="Saldo por conta">
                        {accounts.map(({ account, balanceCents }) => (
                            <li key={account.id}>
                                <span className="n">
                                    <span className="dot" style={{ background: account.color }} aria-hidden="true" />
                                    {account.name}
                                </span>
                                <Amount cents={balanceCents} private sign={isCard(account)} colored={isCard(account)} />
                            </li>
                        ))}
                    </Accounts>
                )}
                <Foot>
                    <span>{balance.cardDebtCents > 0 ? <>Cartões: <Amount cents={balance.cardDebtCents} private colored={false} /></> : "Sem dívida de cartão"}</span>
                    {accounts.length > 1 && (
                        <button type="button" aria-expanded={showAccounts} onClick={() => setShowAccounts((v) => !v)}>
                            {showAccounts ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />} Por conta
                        </button>
                    )}
                </Foot>
            </StatCard>

            <StatCard
                label="Total a pagar"
                icon={ArrowUpRight}
                iconTone="expense"
                tooltip="Despesas pendentes, faturas de cartão em aberto e pagamentos de fatura agendados."
                value={
                    <Value>
                        <Amount cents={pay.openCents} private colored={false} weight={600} big />
                    </Value>
                }
                hint={`${pay.openCount} ${pay.openCount === 1 ? "conta em aberto" : "contas em aberto"} · ${pay.weekCount} em 7 dias`}
            >
                <Foot>
                    {pay.overdueCount ? (
                        <span className="late">
                            <Amount cents={pay.overdueCents} private colored={false} /> em atraso
                        </span>
                    ) : (
                        <span>Nada em atraso</span>
                    )}
                    <Link to="/contas-a-pagar" aria-label="Abrir contas a pagar">
                        Abrir <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                </Foot>
            </StatCard>

            <StatCard
                label="Total a receber"
                icon={ArrowDownLeft}
                iconTone="income"
                tooltip="Receitas pendentes, inclusive as atrasadas."
                value={
                    <Value>
                        <Amount cents={rec.openCents} private colored={false} weight={600} big />
                    </Value>
                }
                hint={`${rec.openCount} ${rec.openCount === 1 ? "recebimento previsto" : "recebimentos previstos"} · ${rec.weekCount} em 7 dias`}
            >
                <Foot>
                    {rec.overdueCount ? (
                        <span className="late">
                            <Amount cents={rec.overdueCents} private colored={false} /> em atraso
                        </span>
                    ) : (
                        <span>Nada em atraso</span>
                    )}
                    <Link to="/contas-a-receber" aria-label="Abrir contas a receber">
                        Abrir <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                </Foot>
            </StatCard>

            <StatCard
                label="Resultado do mês"
                icon={Scale}
                iconTone="accentText"
                tooltip="Receitas menos despesas do mês de referência (competência, incluindo pendentes). Transferências não entram."
                value={
                    <Value>
                        <Amount cents={cmp.current.resultCents} sign private weight={600} big />
                    </Value>
                }
                delta={<Delta value={cmp.resultVariation} suffix="vs. mês ant." />}
            >
                <Foot>
                    <span>
                        Receitas <Amount cents={cmp.current.incomeCents} type="income" private />
                    </span>
                    <span>
                        Despesas <Amount cents={cmp.current.expenseCents} type="expense" private />
                    </span>
                </Foot>
            </StatCard>
        </Grid>
    );
}

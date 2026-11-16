import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { Plus, Upload, ArchiveRestore, Check } from "lucide-react";
import { Card, Button, Field, Input, MoneyInput } from "../../components/ui";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../../app/UIContext";
import { DEFAULT_ACCOUNT_ID } from "../../domain/defaults";

const Steps = styled.ol`
    list-style: none;
    display: grid;
    gap: 16px;
    margin-top: 16px;
    counter-reset: step;
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    li {
        counter-increment: step;
        display: grid;
        gap: 10px;
        align-content: start;
        padding: 16px;
        border-radius: ${(p) => p.theme.radius.md};
        background: ${(p) => p.theme.colors.bgSurface};
    }
    li h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: ${(p) => p.theme.fontSize.md};
    }
    li h3::before {
        content: counter(step);
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${(p) => p.theme.colors.primary};
        color: #fff;
        font-size: 12px;
    }
    p {
        font-size: ${(p) => p.theme.fontSize.sm};
        color: ${(p) => p.theme.colors.textSecondary};
        line-height: 1.5;
    }
`;

/** Onboarding em 3 passos para quem ainda não tem dados. */
export function OnboardingCard() {
    const { store } = useFinance();
    const { upsertAccount, updateSettings } = useFinanceActions();
    const { openTransaction } = useUI();
    const main = store.accounts.find((a) => a.id === DEFAULT_ACCOUNT_ID) ?? store.accounts[0];
    const [name, setName] = useState(main.name);
    const [balance, setBalance] = useState(main.initialBalanceCents);
    const [saved, setSaved] = useState(false);

    const saveAccount = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Dê um nome à conta.");
            return;
        }
        upsertAccount({ ...main, name: name.trim(), initialBalanceCents: balance, updatedAt: new Date().toISOString() });
        setSaved(true);
        toast.success("Conta configurada.");
    };

    return (
        <Card style={{ marginBottom: 20 }} aria-labelledby="onb-title">
            <h2 id="onb-title" style={{ fontSize: "var(--v-font-size-lg)" }}>
                Vamos configurar suas finanças
            </h2>
            <p style={{ marginTop: 4, color: "var(--v-color-text-secondary)" }}>Seus dados ficam apenas neste navegador. Faça backups regulares em Configurações › Dados.</p>
            <Steps>
                <li>
                    <h3>Sua conta principal</h3>
                    <form onSubmit={saveAccount} style={{ display: "grid", gap: 10 }}>
                        <Field label="Nome da conta">{({ id }) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
                        <Field label="Saldo atual" hint="Quanto há na conta hoje">
                            {({ id, describedBy }) => <MoneyInput id={id} value={Math.abs(balance)} onChange={setBalance} aria-describedby={describedBy} />}
                        </Field>
                        <Button type="submit" icon={saved ? Check : undefined}>
                            {saved ? "Salvo" : "Salvar"}
                        </Button>
                    </form>
                </li>
                <li>
                    <h3>Primeira movimentação</h3>
                    <p>Registre uma receita ou despesa. Você pode marcar como recorrente ou parcelar.</p>
                    <Button variant="primary" icon={Plus} onClick={() => openTransaction()}>
                        Nova transação
                    </Button>
                </li>
                <li>
                    <h3>Já tem dados?</h3>
                    <p>Importe uma planilha (CSV, XLSX ou OFX do banco) ou restaure um backup.</p>
                    <Button as={Link} to="/configuracoes/dados" icon={Upload}>
                        Importar planilha
                    </Button>
                    <Button as={Link} to="/configuracoes/dados" icon={ArchiveRestore} variant="ghost">
                        Restaurar backup
                    </Button>
                </li>
            </Steps>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="ghost" onClick={() => updateSettings({ onboardingDone: true })}>
                    Concluir configuração
                </Button>
            </div>
        </Card>
    );
}

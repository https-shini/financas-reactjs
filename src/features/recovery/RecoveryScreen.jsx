import { useRef, useState } from "react";
import styled from "styled-components";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { downloadText, parseBackupText } from "../../storage/backup";
import { createEmptyStore } from "../../domain/defaults";
import { BrandLockup } from "../../brand/BrandLogo";

const REASONS = {
    "invalid-json": "Os dados salvos no navegador estão corrompidos e não puderam ser lidos.",
    "invalid-schema": "Parte dos dados salvos está em formato inválido.",
    version: "Os dados foram gravados por uma versão diferente do aplicativo.",
    unavailable: "O armazenamento do navegador não está disponível (modo privado ou bloqueado).",
    "legacy-corrupted": "Os dados da versão anterior estão corrompidos.",
    "migration-invalid": "A migração dos dados antigos encontrou registros inválidos.",
};

/**
 * Exibida quando os dados salvos não puderam ser carregados. Nada é sobrescrito até o usuário escolher.
 */
export function RecoveryScreen() {
    const { recovery } = useFinance();
    const { replaceStore } = useFinanceActions();
    const fileRef = useRef(null);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);
    const [confirmEmpty, setConfirmEmpty] = useState(false);

    const salvage = recovery?.salvage;
    const droppedTotal = salvage ? Object.values(salvage.dropped ?? {}).reduce((s, n) => s + n, 0) : 0;

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const result = parseBackupText(await file.text());
        if (!result.ok) {
            setError(result.errors.join(" "));
            setPreview(null);
        } else {
            setError(null);
            setPreview(result);
        }
    };

    return (
        <Wrap>
            <Card role="alertdialog" aria-labelledby="recovery-title" aria-describedby="recovery-desc">
                <div style={{ marginBottom: 20 }}>
                    <BrandLockup size={30} />
                </div>
                <h1 id="recovery-title">Recuperação de dados</h1>
                <p id="recovery-desc">{REASONS[recovery?.reason] ?? "Não foi possível carregar seus dados."}</p>
                {recovery?.message && <Detail>{recovery.message}</Detail>}
                <p>
                    Nenhum dado foi apagado. Uma cópia do conteúdo original foi preservada no navegador
                    {recovery?.raw ? " e você pode baixá-la abaixo" : ""}. Escolha como continuar:
                </p>

                <Options>
                    {recovery?.raw && (
                        <Option>
                            <strong>1. Baixar os dados originais</strong>
                            <span>Guarde o conteúdo bruto antes de qualquer decisão.</span>
                            <Button type="button" onClick={() => downloadText(recovery.raw, "financas-dados-originais.txt", "text/plain")}>
                                Baixar cópia
                            </Button>
                        </Option>
                    )}

                    {salvage && salvage.kept > 0 && (
                        <Option>
                            <strong>Aproveitar os dados válidos</strong>
                            <span>
                                {salvage.store.transactions.length} transações e demais cadastros válidos serão mantidos;{" "}
                                {droppedTotal} registro(s) inválido(s) ficarão de fora (a cópia original continua disponível).
                            </span>
                            <Button $primary type="button" onClick={() => replaceStore(salvage.store)}>
                                Usar dados válidos
                            </Button>
                        </Option>
                    )}

                    <Option>
                        <strong>Restaurar de um arquivo de backup</strong>
                        <span>Selecione um arquivo .json gerado em Configurações › Dados.</span>
                        <Button type="button" onClick={() => fileRef.current?.click()}>
                            Escolher arquivo
                        </Button>
                        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} aria-label="Arquivo de backup" />
                        {preview && (
                            <PreviewBox>
                                Backup válido: {preview.summary.transactions} transações, {preview.summary.accounts} contas, {preview.summary.categories} categorias.
                                <Button $primary type="button" onClick={() => replaceStore(preview.store)}>
                                    Restaurar este backup
                                </Button>
                            </PreviewBox>
                        )}
                        {error && <ErrorText role="alert">{error}</ErrorText>}
                    </Option>

                    <Option>
                        <strong>Começar do zero</strong>
                        <span>Inicia um cadastro vazio. Os dados originais continuam guardados como cópia no navegador.</span>
                        {!confirmEmpty ? (
                            <Button type="button" onClick={() => setConfirmEmpty(true)}>
                                Começar do zero
                            </Button>
                        ) : (
                            <Row>
                                <Button $danger type="button" onClick={() => replaceStore(createEmptyStore())}>
                                    Confirmar
                                </Button>
                                <Button type="button" onClick={() => setConfirmEmpty(false)}>
                                    Cancelar
                                </Button>
                            </Row>
                        )}
                    </Option>
                </Options>
            </Card>
        </Wrap>
    );
}

const Wrap = styled.main`
    min-height: 100vh;
    display: grid;
    place-items: start center;
    padding: 48px 16px;
    background: ${(p) => p.theme.colors.bg};
    color: ${(p) => p.theme.colors.text};
`;
const Card = styled.section`
    width: 100%;
    max-width: 620px;
    background: ${(p) => p.theme.colors.bgElevated};
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: 16px;
    padding: 24px;
    line-height: 1.5;
    h1 {
        font-family: ${(p) => p.theme.fonts.display};
        font-size: ${(p) => p.theme.fontSize.xl};
        margin: 0 0 8px;
    }
    p {
        color: ${(p) => p.theme.colors.textSecondary};
        margin: 0 0 12px;
    }
`;
const Detail = styled.pre`
    white-space: pre-wrap;
    font-size: 0.8125rem;
    background: ${(p) => p.theme.colors.bgSurface};
    padding: 12px;
    border-radius: 8px;
    margin: 0 0 12px;
`;
const Options = styled.div`
    display: grid;
    gap: 12px;
    margin-top: 16px;
`;
const Option = styled.div`
    display: grid;
    gap: 6px;
    padding: 16px;
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: 12px;
    span {
        color: ${(p) => p.theme.colors.textSecondary};
        font-size: 0.9375rem;
    }
`;
const Row = styled.div`
    display: flex;
    gap: 8px;
`;
const PreviewBox = styled.div`
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 8px;
    background: ${(p) => p.theme.colors.bgSurface};
`;
const ErrorText = styled.p`
    color: ${(p) => p.theme.colors.error} !important;
`;
const Button = styled.button`
    justify-self: start;
    min-height: 44px;
    padding: 0 16px;
    border-radius: 10px;
    font-weight: 600;
    border: 1px solid ${(p) => (p.$primary ? p.theme.colors.primary : p.$danger ? p.theme.colors.error : p.theme.colors.border)};
    background: ${(p) => (p.$primary ? p.theme.colors.primary : p.$danger ? p.theme.colors.error : "transparent")};
    color: ${(p) => (p.$primary || p.$danger ? p.theme.colors.onPrimary : p.theme.colors.text)};
    &:focus-visible {
        outline: 2px solid ${(p) => p.theme.colors.primary};
        outline-offset: 2px;
    }
`;

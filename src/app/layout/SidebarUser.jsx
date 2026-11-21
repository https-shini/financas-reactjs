import { Link } from "react-router-dom";
import styled from "styled-components";
import { ShieldCheck, ShieldAlert, DatabaseBackup } from "lucide-react";
import { useFinance } from "../../state/contexts";
import { focusRing } from "../../components/ui";
import { diffDays, todayISO } from "../../domain/dates";

/*
 * Cartão de perfil do rodapé da sidebar (padrão Lab Platform: avatar, nome, linha de contexto
 * e uma ação à direita). O app não tem contas de usuário: o perfil é local (dados neste navegador),
 * a linha de contexto mostra o status do backup e a ação leva a Backup e dados.
 */

const Card = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgElevated};
    justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
    ${(p) => p.$collapsed && "border-color: transparent; background: transparent; padding: 0;"}
`;

const Avatar = styled(Link)`
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border-radius: ${(p) => p.theme.radius.full};
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgSurface};
    color: ${(p) => p.theme.colors.text};
    font-family: ${(p) => p.theme.fonts.mono};
    font-size: ${(p) => p.theme.fontSize.sm};
    font-weight: ${(p) => p.theme.fontWeight.semibold};
    text-decoration: none;
    ${focusRing()}
`;

const Meta = styled.div`
    min-width: 0;
    flex: 1;
    display: grid;
    line-height: 1.35;
    .name {
        font-size: 0.8125rem;
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        color: ${(p) => p.theme.colors.text};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .status {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => (p.$warn ? p.theme.colors.warning : p.theme.colors.textMuted)};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const Action = styled(Link)`
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => p.theme.colors.border};
    color: ${(p) => p.theme.colors.textSecondary};
    transition: background ${(p) => p.theme.motion.fast}, color ${(p) => p.theme.motion.fast};
    &:hover {
        background: ${(p) => p.theme.colors.interactiveHover};
        color: ${(p) => p.theme.colors.text};
    }
    ${focusRing()}
`;

export function SidebarUser({ collapsed = false, onNavigate }) {
    const { store, today } = useFinance();
    const last = store.settings.lastBackupAt;
    const days = last ? diffDays(today, todayISO(new Date(last))) : null;
    const warn = days === null || days > 30;
    const status = last ? (days === 0 ? "Backup feito hoje" : `Backup há ${days} dia(s)`) : "Sem backup ainda";
    const Icon = warn ? ShieldAlert : ShieldCheck;
    const label = `Perfil local: dados neste navegador. ${status}. Abrir backup e dados`;
    if (collapsed) {
        return (
            <Card $collapsed>
                <Avatar to="/configuracoes/dados#backup" aria-label={label} title={`Perfil local · ${status}`} onClick={onNavigate}>
                    PL
                </Avatar>
            </Card>
        );
    }
    return (
        <Card>
            <Avatar to="/configuracoes/dados#backup" aria-label={label} onClick={onNavigate}>
                PL
            </Avatar>
            <Meta $warn={warn}>
                <span className="name">Perfil local</span>
                <span className="status">
                    <Icon size={12} aria-hidden="true" /> {status}
                </span>
            </Meta>
            <Action to="/configuracoes/dados#backup" aria-label="Backup e dados" title="Backup e dados" onClick={onNavigate}>
                <DatabaseBackup size={16} aria-hidden="true" />
            </Action>
        </Card>
    );
}

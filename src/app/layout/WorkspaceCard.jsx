import { Link } from "react-router-dom";
import styled from "styled-components";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { VeldoraSymbol } from "../../brand/VeldoraLogo";
import { useFinance } from "../../state/contexts";
import { diffDays, todayISO } from "../../domain/dates";

const Card = styled(Link)`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: ${(p) => p.theme.radius.md};
    text-decoration: none;
    color: ${(p) => p.theme.colors.text};
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgSurface};
    transition: border-color ${(p) => p.theme.motion.fast};
    &:hover {
        border-color: ${(p) => p.theme.colors.borderStrong};
    }
    .avatar {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: ${(p) => p.theme.colors.bg};
        border: 1px solid ${(p) => p.theme.colors.border};
        flex-shrink: 0;
    }
    .txt {
        min-width: 0;
        display: grid;
        line-height: 1.3;
    }
    .name {
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        font-size: ${(p) => p.theme.fontSize.sm};
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

/**
 * Perfil local: o app não tem contas de usuário — os dados pertencem a este navegador.
 * Mostra o status do último backup e leva à área de backup.
 */
export function WorkspaceCard({ collapsed = false, onNavigate }) {
    const { store, today } = useFinance();
    const last = store.settings.lastBackupAt;
    const days = last ? diffDays(today, todayISO(new Date(last))) : null;
    const warn = days === null || days > 30;
    const status = last ? (days === 0 ? "Backup feito hoje" : `Backup há ${days} dia(s)`) : "Sem backup ainda";
    const Icon = warn ? ShieldAlert : ShieldCheck;
    return (
        <Card to="/configuracoes/dados#backup" $warn={warn} aria-label={`Meu espaço local. ${status}. Abrir backup`} title={collapsed ? status : undefined} onClick={onNavigate}>
            <span className="avatar" aria-hidden="true">
                <VeldoraSymbol size={20} />
            </span>
            {!collapsed && (
                <span className="txt">
                    <span className="name">Meu espaço</span>
                    <span className="status">
                        <Icon size={12} aria-hidden="true" /> {status}
                    </span>
                </span>
            )}
        </Card>
    );
}

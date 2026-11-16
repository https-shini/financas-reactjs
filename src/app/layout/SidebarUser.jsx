import { Link } from "react-router-dom";
import styled from "styled-components";
import { ShieldCheck, ShieldAlert, UserRound } from "lucide-react";
import { useFinance } from "../../state/contexts";
import { diffDays, todayISO } from "../../domain/dates";

const Card = styled(Link)`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: ${(p) => p.theme.radius.md};
    text-decoration: none;
    color: ${(p) => p.theme.colors.text};
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgElevated};
    transition: border-color ${(p) => p.theme.motion.fast}, background ${(p) => p.theme.motion.fast};
    justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
    &:hover {
        border-color: ${(p) => p.theme.colors.borderStrong};
    }
    .avatar {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: ${(p) => p.theme.radius.full};
        background: ${(p) => p.theme.colors.primarySoft};
        color: ${(p) => p.theme.colors.primaryText};
        border: 1px solid ${(p) => p.theme.colors.border};
        flex-shrink: 0;
    }
    .txt {
        min-width: 0;
        display: grid;
        line-height: 1.35;
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
 * Perfil da sidebar. O app não tem contas de usuário — o perfil é local (dados neste navegador).
 * Mostra o status do último backup e leva à área de backup e dados.
 */
export function SidebarUser({ collapsed = false, onNavigate }) {
    const { store, today } = useFinance();
    const last = store.settings.lastBackupAt;
    const days = last ? diffDays(today, todayISO(new Date(last))) : null;
    const warn = days === null || days > 30;
    const status = last ? (days === 0 ? "Backup feito hoje" : `Backup há ${days} dia(s)`) : "Sem backup ainda";
    const Icon = warn ? ShieldAlert : ShieldCheck;
    return (
        <Card
            to="/configuracoes/dados#backup"
            $warn={warn}
            $collapsed={collapsed}
            aria-label={`Perfil local: dados neste navegador. ${status}. Abrir backup e dados`}
            title={collapsed ? `Perfil local · ${status}` : undefined}
            onClick={onNavigate}
        >
            <span className="avatar" aria-hidden="true">
                <UserRound size={16} />
            </span>
            {!collapsed && (
                <span className="txt">
                    <span className="name">Perfil local</span>
                    <span className="status">
                        <Icon size={12} aria-hidden="true" /> {status}
                    </span>
                </span>
            )}
        </Card>
    );
}

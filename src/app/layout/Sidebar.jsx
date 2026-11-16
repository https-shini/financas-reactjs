import { Link } from "react-router-dom";
import styled, { css } from "styled-components";
import { PanelLeftClose, PanelLeftOpen, ArrowUpRight } from "lucide-react";
import { interactiveItem, focusRing } from "../../components/ui";
import { BrandLockup, BrandMark } from "../../brand/BrandLogo";
import { SidebarNav } from "./SidebarNav";
import { SidebarUser } from "./SidebarUser";

const GCRUZ_URL = "https://gcruz.dev.br";

/*
 * Sidebar (desktop ≥ 1024 px) — três regiões, como no Fluxer:
 *   1. SidebarHeader: faixa fixa com a marca, mesma altura do Header (as bordas inferiores se alinham).
 *   2. SidebarBody:   única área com rolagem (navegação).
 *   3. SidebarFooter: faixa fixa com o perfil e o controle de recolher (fonte única desse controle).
 * Todas as medidas vêm de theme.layout.
 */

const Root = styled.aside`
    display: none;
    ${(p) => p.theme.media.desktop} {
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        height: 100vh;
        min-width: 0;
        border-right: 1px solid ${(p) => p.theme.colors.border};
        background: ${(p) => p.theme.colors.bgSidebar};
    }
`;

const SidebarHeader = styled(Link)`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    height: ${(p) => p.theme.layout.header};
    padding-inline: ${(p) => (p.$collapsed ? "0" : p.theme.space(4.5))};
    justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    color: ${(p) => p.theme.colors.text};
    text-decoration: none;
    ${focusRing(true)}
`;

const SidebarBody = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: ${(p) => p.theme.space(1.5)} ${(p) => p.theme.layout.sidebarPaddingInline} ${(p) => p.theme.space(4)};
    scrollbar-width: thin;
`;

const SidebarFooter = styled.div`
    display: grid;
    gap: ${(p) => p.theme.space(1)};
    flex-shrink: 0;
    min-height: ${(p) => p.theme.layout.sidebarFooterMinHeight};
    padding: ${(p) => p.theme.layout.sidebarPaddingInline};
    border-top: 1px solid ${(p) => p.theme.colors.border};
`;

const FooterRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: ${(p) => (p.$collapsed ? "center" : "space-between")};
    gap: ${(p) => p.theme.space(1)};
`;

const footerAction = css`
    display: inline-flex;
    align-items: center;
    gap: ${(p) => p.theme.space(1.5)};
    height: 30px;
    padding-inline: ${(p) => p.theme.space(2)};
    border-radius: ${(p) => p.theme.radius.sm};
    font-size: ${(p) => p.theme.fontSize.sm};
    text-decoration: none;
    ${interactiveItem}
    color: ${(p) => p.theme.colors.textMuted};
    font-weight: ${(p) => p.theme.fontWeight.medium};
    ${(p) => p.theme.media.coarse} {
        height: ${(p) => p.theme.layout.touchTarget};
    }
`;

const FooterButton = styled.button`
    ${footerAction}
`;

const FooterLink = styled.a`
    ${footerAction}
    font-family: ${(p) => p.theme.fonts.mono};
    font-size: ${(p) => p.theme.fontSize.xs};
`;

/** Barra lateral do desktop. `collapsed`: só ícones (64 px). */
export function Sidebar({ collapsed, onToggleCollapsed }) {
    return (
        <Root aria-label="Barra lateral">
            <SidebarHeader to="/" $collapsed={collapsed} aria-label="Finanças by GCruz.DEV — ir para a Visão geral">
                {collapsed ? <BrandMark size={28} /> : <BrandLockup size={28} title={null} />}
            </SidebarHeader>
            <SidebarBody>
                <SidebarNav collapsed={collapsed} />
            </SidebarBody>
            <SidebarFooter>
                <SidebarUser collapsed={collapsed} />
                <FooterRow $collapsed={collapsed}>
                    <FooterButton
                        type="button"
                        onClick={onToggleCollapsed}
                        aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                        aria-expanded={!collapsed}
                        title={collapsed ? "Expandir menu lateral" : undefined}
                    >
                        {collapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
                        {!collapsed && "Recolher"}
                    </FooterButton>
                    {!collapsed && (
                        <FooterLink href={GCRUZ_URL} target="_blank" rel="noopener noreferrer">
                            gcruz.dev <ArrowUpRight size={12} aria-hidden="true" />
                            <span className="sr-only">(abre em nova aba)</span>
                        </FooterLink>
                    )}
                </FooterRow>
            </SidebarFooter>
        </Root>
    );
}

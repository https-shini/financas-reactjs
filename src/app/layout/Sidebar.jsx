import { Link } from "react-router-dom";
import styled from "styled-components";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { focusRing } from "../../components/ui";
import { BrandLockup, BrandMark } from "../../brand/BrandLogo";
import { SidebarNav } from "./SidebarNav";

/*
 * Sidebar do desktop (≥ 1024 px), no padrão do GCruz Lab Platform:
 *   ┌ marca (altura = header, borda inferior contínua com o header)
 *   ├ navegação por seções (única área com rolagem)
 *   └ rodapé: apenas o controle "Recolher"
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

const Brand = styled(Link)`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    height: ${(p) => p.theme.layout.header};
    padding-inline: ${(p) => (p.$collapsed ? "0" : "18px")};
    justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    color: ${(p) => p.theme.colors.text};
    text-decoration: none;
    ${focusRing(true)}
`;

const Body = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 20px ${(p) => p.theme.layout.sidebarPaddingInline} 20px;
    scrollbar-width: thin;
`;

const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
    flex-shrink: 0;
    height: 52px;
    padding-inline: ${(p) => p.theme.layout.sidebarPaddingInline};
    border-top: 1px solid ${(p) => p.theme.colors.border};
`;

const CollapseButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding-inline: ${(p) => p.theme.space(2)};
    border-radius: ${(p) => p.theme.radius.sm};
    font-size: ${(p) => p.theme.fontSize.sm};
    font-weight: ${(p) => p.theme.fontWeight.medium};
    color: ${(p) => p.theme.colors.textMuted};
    transition: color ${(p) => p.theme.motion.fast}, background ${(p) => p.theme.motion.fast};
    &:hover {
        color: ${(p) => p.theme.colors.text};
        background: ${(p) => p.theme.colors.interactiveHover};
    }
    ${focusRing()}
    ${(p) => p.theme.media.coarse} {
        height: ${(p) => p.theme.layout.touchTarget};
    }
`;

/** Barra lateral do desktop. `collapsed`: só ícones (64 px). */
export function Sidebar({ collapsed, onToggleCollapsed }) {
    return (
        <Root aria-label="Barra lateral">
            <Brand to="/" $collapsed={collapsed} aria-label="Finanças by GCruz.DEV — ir para a Visão geral">
                {collapsed ? <BrandMark size={30} /> : <BrandLockup size={32} title={null} />}
            </Brand>
            <Body>
                <SidebarNav collapsed={collapsed} />
            </Body>
            <Footer $collapsed={collapsed}>
                <CollapseButton
                    type="button"
                    onClick={onToggleCollapsed}
                    aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                    aria-expanded={!collapsed}
                    title={collapsed ? "Expandir menu lateral" : undefined}
                >
                    {collapsed ? <PanelLeftOpen size={15} aria-hidden="true" /> : <PanelLeftClose size={15} aria-hidden="true" />}
                    {!collapsed && "Recolher"}
                </CollapseButton>
            </Footer>
        </Root>
    );
}

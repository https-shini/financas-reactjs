import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useFinance, useFinanceActions } from "../state/contexts";
import { useUI } from "./UIContext";
import { addMonthsToKey } from "../domain/dates";
import { useHotkeys } from "../hooks/useHotkeys";
import { Sidebar } from "./layout/Sidebar";
import { Header } from "./layout/Header";
import { MobileNav } from "./layout/MobileNav";

/*
 * App Shell — apenas composição e comportamento global (atalhos). Cada região estrutural é um
 * componente próprio em ./layout, com medidas vindas de theme.layout:
 *
 *   ┌──────────────┬───────────────────────────────────────┐
 *   │ Marca        │ Header (layout · breadcrumbs │ busca · ícones) │  ← mesma altura: layout.header
 *   ├──────────────┼───────────────────────────────────────┤
 *   │ SidebarBody  │ Content (recuo = recuo do Header)     │
 *   │  (rola)      │                                       │
 *   ├──────────────┤                                       │
 *   │ SidebarFooter│                                       │
 *   └──────────────┴───────────────────────────────────────┘
 *   Abaixo de 1024 px: Sidebar → MobileNav (barra inferior + drawer).
 */

const Shell = styled.div`
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: ${(p) => (p.$collapsed ? p.theme.layout.sidebarCollapsed : p.theme.layout.sidebar)} minmax(0, 1fr);
        transition: grid-template-columns ${(p) => p.theme.motion.base} ${(p) => p.theme.motion.easing};
    }
    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

const SkipLink = styled.a`
    position: absolute;
    left: 8px;
    top: -100px;
    z-index: 100;
    padding: 10px 14px;
    border-radius: ${(p) => p.theme.radius.sm};
    background: ${(p) => p.theme.colors.primary};
    color: ${(p) => p.theme.colors.onPrimary};
    font-weight: ${(p) => p.theme.fontWeight.semibold};
    &:focus {
        top: 8px;
    }
`;

const Main = styled.div`
    min-width: 0;
    display: flex;
    flex-direction: column;
`;

const Content = styled.main`
    flex: 1;
    width: 100%;
    max-width: ${(p) => p.theme.layout.content};
    padding: 20px ${(p) => p.theme.layout.contentPaddingInlineMobile} calc(${(p) => p.theme.layout.bottomNav} + 32px + env(safe-area-inset-bottom));
    overflow-x: clip;
    &:focus {
        outline: none;
    }
    ${(p) => p.theme.media.tablet} {
        padding-left: ${(p) => p.theme.layout.contentPaddingInlineTablet};
        padding-right: ${(p) => p.theme.layout.contentPaddingInlineTablet};
    }
    ${(p) => p.theme.media.desktop} {
        padding: ${(p) => p.theme.layout.contentPaddingBlock} ${(p) => p.theme.layout.contentPaddingInline} 56px;
    }
`;

export function AppShell() {
    const { store } = useFinance();
    const { updateSettings } = useFinanceActions();
    const { openTransaction, openQuickCapture, month, setMonth } = useUI();
    const navigate = useNavigate();
    const searchRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const collapsed = store.settings.sidebarCollapsed;

    const focusSearch = () => {
        if (searchRef.current && searchRef.current.offsetParent !== null) searchRef.current.focus();
        else navigate("/movimentacoes?focus=busca");
    };

    useHotkeys({
        n: () => openTransaction(),
        "/": focusSearch,
        q: () => openQuickCapture(),
        ArrowLeft: () => setMonth(addMonthsToKey(month, -1)),
        ArrowRight: () => setMonth(addMonthsToKey(month, 1)),
    });

    // Ctrl+K / ⌘K: busca global (funciona também com o foco em um campo).
    const focusSearchRef = useRef(focusSearch);
    focusSearchRef.current = focusSearch;
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                if (document.querySelector("[role='dialog'][aria-modal='true']")) return;
                e.preventDefault();
                focusSearchRef.current();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <Shell $collapsed={collapsed}>
            <SkipLink href="#conteudo">Pular para o conteúdo</SkipLink>
            <Sidebar collapsed={collapsed} onToggleCollapsed={() => updateSettings({ sidebarCollapsed: !collapsed })} />
            <Main>
                <Header
                    searchRef={searchRef}
                    collapsed={collapsed}
                    onToggleSidebar={() => updateSettings({ sidebarCollapsed: !collapsed })}
                    onOpenMenu={() => setMenuOpen(true)}
                />
                <Content id="conteudo" tabIndex={-1}>
                    <Outlet />
                </Content>
            </Main>
            <MobileNav menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
        </Shell>
    );
}

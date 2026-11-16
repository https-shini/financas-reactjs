import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
    LayoutDashboard, ArrowLeftRight, CalendarRange, Plus, Search, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Eye, EyeOff, Zap,
    Menu as MenuIcon, ArrowUpRight,
} from "lucide-react";
import { Button, IconButton, Drawer, ModalBody, Breadcrumbs } from "../components/ui";
import { useFinance, useFinanceActions } from "../state/contexts";
import { useUI } from "./UIContext";
import { addMonthsToKey, currentMonthKey, formatMonthLabel } from "../domain/dates";
import { useHotkeys } from "../hooks/useHotkeys";
import { BrandLockup, BrandMark } from "../brand/BrandLogo";
import { SidebarNav } from "./layout/SidebarNav";
import { SidebarUser } from "./layout/SidebarUser";
import { ThemeToggle } from "./layout/ThemeToggle";
import { Notifications } from "./layout/Notifications";
import { breadcrumbItems } from "./navigation";

// ---------------- Estrutura ----------------

const Shell = styled.div`
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr;
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: ${(p) => (p.$collapsed ? p.theme.layout.sidebarCollapsed : p.theme.layout.sidebar)} minmax(0, 1fr);
        transition: grid-template-columns ${(p) => p.theme.motion.base} ${(p) => p.theme.motion.easing};
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

// ---------------- Sidebar ----------------

const Side = styled.aside`
    display: none;
    ${(p) => p.theme.media.desktop} {
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        height: 100vh;
        border-right: 1px solid ${(p) => p.theme.colors.border};
        background: ${(p) => p.theme.colors.bgSidebar};
    }
`;

const SideBrand = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
    height: ${(p) => p.theme.layout.topbar};
    padding: 0 ${(p) => (p.$collapsed ? "0" : "16px")};
    flex-shrink: 0;
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    color: ${(p) => p.theme.colors.text};
    text-decoration: none;
    &:focus-visible {
        outline: 2px solid ${(p) => p.theme.colors.focus};
        outline-offset: -2px;
    }
`;

const NavScroll = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 16px ${(p) => (p.$collapsed ? "10px" : "10px")} 20px;
    scrollbar-width: thin;
`;

const SideFooter = styled.div`
    display: grid;
    gap: 8px;
    padding: 10px;
    border-top: 1px solid ${(p) => p.theme.colors.border};
`;

const SideActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: ${(p) => (p.$collapsed ? "center" : "space-between")};
    gap: 6px;
    button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 32px;
        padding: 0 8px;
        border-radius: ${(p) => p.theme.radius.sm};
        color: ${(p) => p.theme.colors.textMuted};
        font-size: ${(p) => p.theme.fontSize.sm};
        &:hover {
            color: ${(p) => p.theme.colors.text};
            background: ${(p) => p.theme.colors.bgHover};
        }
    }
    a {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 32px;
        padding: 0 8px;
        border-radius: ${(p) => p.theme.radius.sm};
        font-family: ${(p) => p.theme.fonts.mono};
        font-size: ${(p) => p.theme.fontSize.xs};
        color: ${(p) => p.theme.colors.textMuted};
        text-decoration: none;
        &:hover {
            color: ${(p) => p.theme.colors.text};
        }
    }
`;

// ---------------- Header ----------------

const Main = styled.div`
    min-width: 0;
    display: flex;
    flex-direction: column;
`;

const Top = styled.header`
    position: sticky;
    top: 0;
    z-index: ${(p) => p.theme.z.nav};
    display: flex;
    align-items: center;
    gap: 8px;
    height: ${(p) => p.theme.layout.topbar};
    padding: 0 12px;
    background: ${(p) => p.theme.colors.bgGlass};
    backdrop-filter: blur(12px);
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    ${(p) => p.theme.media.tablet} {
        padding: 0 16px;
    }
    ${(p) => p.theme.media.desktop} {
        padding: 0 24px 0 16px;
    }
    @media (max-width: 374px) {
        gap: 2px;
        padding: 0 6px;
    }
`;

const OnlyDesktop = styled.span`
    display: none;
    ${(p) => p.theme.media.desktop} {
        display: contents;
    }
`;

const OnlyBelowDesktop = styled.span`
    display: contents;
    ${(p) => p.theme.media.desktop} {
        display: none;
    }
`;

const HideMobile = styled.span`
    display: contents;
    ${(p) => p.theme.media.mobile} {
        display: none;
    }
`;

const MobileBrand = styled(Link)`
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: ${(p) => p.theme.radius.sm};
    flex-shrink: 0;
    @media (max-width: 349px) {
        display: none;
    }
`;

const Crumbs = styled.div`
    display: none;
    white-space: nowrap;
    padding-left: 4px;
    ${(p) => p.theme.media.wide} {
        display: block;
        margin-right: 8px;
    }
    ol {
        font-size: ${(p) => p.theme.fontSize.md};
    }
`;

const MonthBox = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    padding: 2px;
    border-radius: ${(p) => p.theme.radius.sm};
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgElevated};
    h2 {
        font-family: ${(p) => p.theme.fonts.sans};
        font-size: ${(p) => p.theme.fontSize.md};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        letter-spacing: 0;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
        ${(p) => p.theme.media.tablet} {
            min-width: 150px;
        }
    }
    .short {
        display: none;
    }
    ${(p) => p.theme.media.mobile} {
        .long {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
        }
        .short {
            display: inline;
        }
    }
`;

const SearchForm = styled.form`
    position: relative;
    flex: 1;
    max-width: 360px;
    min-width: 160px;
    margin-left: auto;
    svg {
        position: absolute;
        left: 11px;
        top: 50%;
        transform: translateY(-50%);
        color: ${(p) => p.theme.colors.textMuted};
    }
    input {
        width: 100%;
        min-height: 36px;
        padding: 0 64px 0 34px;
        border-radius: ${(p) => p.theme.radius.sm};
        border: 1px solid ${(p) => p.theme.colors.border};
        background: ${(p) => p.theme.colors.bgElevated};
        font-size: ${(p) => p.theme.fontSize.md};
        transition: border-color ${(p) => p.theme.motion.fast}, box-shadow ${(p) => p.theme.motion.fast};
        &:hover {
            border-color: ${(p) => p.theme.colors.borderStrong};
        }
        &:focus {
            outline: none;
            border-color: ${(p) => p.theme.colors.brand};
            box-shadow: ${(p) => p.theme.shadows.focus};
        }
        &::placeholder {
            color: ${(p) => p.theme.colors.textMuted};
        }
    }
    kbd {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-family: ${(p) => p.theme.fonts.mono};
        font-size: 10px;
        padding: 2px 6px;
        border-radius: ${(p) => p.theme.radius.xs};
        border: 1px solid ${(p) => p.theme.colors.border};
        background: ${(p) => p.theme.colors.bgSurface};
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

const TopActions = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    ${(p) => p.theme.media.desktop} {
        margin-left: 4px;
        gap: 4px;
    }
    .divider {
        width: 1px;
        height: 22px;
        margin: 0 4px;
        background: ${(p) => p.theme.colors.border};
    }
`;

// ---------------- Conteúdo ----------------

const Content = styled.main`
    flex: 1;
    width: 100%;
    max-width: ${(p) => p.theme.layout.content};
    margin: 0 auto;
    padding: 20px 16px calc(${(p) => p.theme.layout.bottomNav} + 32px + env(safe-area-inset-bottom));
    overflow-x: clip;
    &:focus {
        outline: none;
    }
    ${(p) => p.theme.media.tablet} {
        padding-left: 24px;
        padding-right: 24px;
    }
    ${(p) => p.theme.media.desktop} {
        padding: 32px 40px 56px;
    }
`;

// ---------------- Navegação inferior (celular e tablet) ----------------

const Bottom = styled.nav`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: ${(p) => p.theme.z.nav};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
    height: calc(${(p) => p.theme.layout.bottomNav} + env(safe-area-inset-bottom));
    padding: 0 6px env(safe-area-inset-bottom);
    background: ${(p) => p.theme.colors.bgGlass};
    backdrop-filter: blur(12px);
    border-top: 1px solid ${(p) => p.theme.colors.border};
    > * {
        flex: 1 1 auto;
        min-width: 0;
    }
    ${(p) => p.theme.media.desktop} {
        display: none;
    }
    @media (max-width: 374px) {
        gap: 0;
        padding-left: 2px;
        padding-right: 2px;
        letter-spacing: -0.01em;
    }
`;

const bottomItem = `
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 3px;
    min-height: 52px;
    padding: 0 6px;
    white-space: nowrap;
    font-size: 11px;
    text-decoration: none;
`;

const BottomLink = styled(NavLink)`
    ${bottomItem}
    position: relative;
    font-weight: ${(p) => p.theme.fontWeight.medium};
    color: ${(p) => p.theme.colors.textMuted};
    &.active {
        color: ${(p) => p.theme.colors.text};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        svg {
            color: ${(p) => p.theme.colors.indicator};
        }
        &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 30%;
            right: 30%;
            height: 2px;
            border-radius: 0 0 2px 2px;
            background: ${(p) => p.theme.colors.indicator};
        }
    }
    @media (max-width: 374px) {
        font-size: 10px;
        padding: 0 3px;
    }
`;

const BottomButton = styled.button`
    ${bottomItem}
    font-weight: ${(p) => p.theme.fontWeight.medium};
    color: ${(p) => p.theme.colors.textMuted};
    @media (max-width: 374px) {
        font-size: 10px;
        padding: 0 3px;
    }
`;

const Fab = styled.button`
    flex: 0 0 48px !important;
    justify-self: center;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: ${(p) => p.theme.radius.lg};
    background: ${(p) => p.theme.colors.primary};
    color: ${(p) => p.theme.colors.onPrimary};
    box-shadow: ${(p) => p.theme.shadows.brand};
    transition: background ${(p) => p.theme.motion.fast}, transform ${(p) => p.theme.motion.fast};
    &:hover {
        background: ${(p) => p.theme.colors.primaryHover};
    }
    &:active {
        transform: scale(0.96);
        background: ${(p) => p.theme.colors.primaryActive};
    }
`;

const DrawerBody = styled(ModalBody)`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 4px;
    .quick {
        display: flex;
        gap: 8px;
    }
`;

// ---------------- Peças ----------------

function MonthSwitcher() {
    const { month, setMonth } = useUI();
    const isCurrent = month === currentMonthKey();
    return (
        <MonthBox>
            <IconButton icon={ChevronLeft} label="Mês anterior" size="sm" onClick={() => setMonth(addMonthsToKey(month, -1))} />
            <h2 aria-live="polite">
                <span className="long">{formatMonthLabel(month)}</span>
                <span className="short" aria-hidden="true">
                    {formatMonthLabel(month, "short")}
                </span>
            </h2>
            <IconButton icon={ChevronRight} label="Próximo mês" size="sm" onClick={() => setMonth(addMonthsToKey(month, 1))} />
            {!isCurrent && (
                <Button size="sm" variant="ghost" onClick={() => setMonth(currentMonthKey())}>
                    Hoje
                </Button>
            )}
        </MonthBox>
    );
}

const GCRUZ_URL = "https://gcruz.dev.br";

/**
 * App Shell: sidebar (220 px; 64 px recolhida) + header (58 px) com breadcrumbs, mês, busca global (Ctrl+K),
 * tema e notificações. No celular e tablet: header compacto, navegação inferior e menu em drawer.
 */
export function AppShell() {
    const { store } = useFinance();
    const { updateSettings } = useFinanceActions();
    const { openTransaction, openQuickCapture, month, setMonth } = useUI();
    const navigate = useNavigate();
    const location = useLocation();
    const searchRef = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const collapsed = store.settings.sidebarCollapsed;
    const hide = store.settings.hideBalances;
    const toggleSidebar = () => updateSettings({ sidebarCollapsed: !collapsed });

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

    const submitSearch = (e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q")?.toString().trim();
        navigate(q ? `/movimentacoes?q=${encodeURIComponent(q)}` : "/movimentacoes");
        e.currentTarget.reset();
    };

    const hideToggle = <IconButton icon={hide ? EyeOff : Eye} size="sm" label={hide ? "Mostrar valores" : "Ocultar valores"} onClick={() => updateSettings({ hideBalances: !hide })} />;

    return (
        <Shell $collapsed={collapsed}>
            <SkipLink href="#conteudo">Pular para o conteúdo</SkipLink>
            <Side aria-label="Barra lateral">
                <SideBrand to="/" $collapsed={collapsed} aria-label="Finanças by GCruz.DEV — ir para a Visão geral">
                    {collapsed ? <BrandMark size={30} /> : <BrandLockup size={32} title={null} />}
                </SideBrand>
                <NavScroll $collapsed={collapsed}>
                    <SidebarNav collapsed={collapsed} />
                </NavScroll>
                <SideFooter>
                    <SidebarUser collapsed={collapsed} />
                    <SideActions $collapsed={collapsed}>
                        <button type="button" onClick={toggleSidebar} aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"} title={collapsed ? "Expandir" : undefined}>
                            {collapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
                            {!collapsed && "Recolher"}
                        </button>
                        {!collapsed && (
                            <a href={GCRUZ_URL} target="_blank" rel="noopener noreferrer">
                                gcruz.dev <ArrowUpRight size={12} aria-hidden="true" />
                                <span className="sr-only">(abre em nova aba)</span>
                            </a>
                        )}
                    </SideActions>
                </SideFooter>
            </Side>

            <Main>
                <Top>
                    <OnlyDesktop>
                        <IconButton icon={collapsed ? PanelLeftOpen : PanelLeftClose} size="sm" bordered label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"} onClick={toggleSidebar} />
                        <Crumbs>
                            <Breadcrumbs items={breadcrumbItems(location)} />
                        </Crumbs>
                    </OnlyDesktop>
                    <OnlyBelowDesktop>
                        <MobileBrand to="/" aria-label="Finanças — ir para a Visão geral">
                            <BrandMark size={28} />
                        </MobileBrand>
                    </OnlyBelowDesktop>
                    <MonthSwitcher />
                    <OnlyDesktop>
                        <SearchForm role="search" onSubmit={submitSearch}>
                            <Search size={15} aria-hidden="true" />
                            <label htmlFor="global-search" className="sr-only">
                                Buscar transações
                            </label>
                            <input ref={searchRef} id="global-search" name="q" type="search" placeholder="Buscar transações" autoComplete="off" />
                            <kbd aria-hidden="true">Ctrl K</kbd>
                        </SearchForm>
                    </OnlyDesktop>
                    <TopActions>
                        <OnlyBelowDesktop>
                            {location.pathname !== "/movimentacoes" && <IconButton icon={Search} size="sm" label="Buscar transações" onClick={() => navigate("/movimentacoes?focus=busca")} />}
                        </OnlyBelowDesktop>
                        <HideMobile>{hideToggle}</HideMobile>
                        <IconButton icon={Zap} size="sm" label="Captura rápida (Q)" onClick={openQuickCapture} />
                        <HideMobile>
                            <ThemeToggle />
                        </HideMobile>
                        <Notifications />
                        <OnlyDesktop>
                            <span className="divider" aria-hidden="true" />
                            <Button variant="primary" size="sm" icon={Plus} onClick={() => openTransaction()} title="Nova transação (N)">
                                Nova transação
                            </Button>
                        </OnlyDesktop>
                    </TopActions>
                </Top>
                <Content id="conteudo" tabIndex={-1}>
                    <Outlet />
                </Content>
            </Main>

            <Bottom aria-label="Navegação rápida">
                <BottomLink to="/" end>
                    <LayoutDashboard size={21} aria-hidden="true" />
                    Visão geral
                </BottomLink>
                <BottomLink to="/movimentacoes">
                    <ArrowLeftRight size={21} aria-hidden="true" />
                    Transações
                </BottomLink>
                <Fab type="button" aria-label="Nova transação" onClick={() => openTransaction()}>
                    <Plus size={24} aria-hidden="true" />
                </Fab>
                <BottomLink to="/planejamento">
                    <CalendarRange size={21} aria-hidden="true" />
                    Planejamento
                </BottomLink>
                <BottomButton type="button" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
                    <MenuIcon size={21} aria-hidden="true" />
                    Menu
                </BottomButton>
            </Bottom>

            <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={<BrandLockup size={30} title={null} />}>
                <DrawerBody>
                    <SidebarNav onNavigate={() => setMenuOpen(false)} label="Menu" />
                    <div className="quick">
                        <ThemeToggle size="md" />
                        <IconButton icon={hide ? EyeOff : Eye} label={hide ? "Mostrar valores" : "Ocultar valores"} onClick={() => updateSettings({ hideBalances: !hide })} />
                    </div>
                    <SidebarUser onNavigate={() => setMenuOpen(false)} />
                </DrawerBody>
            </Drawer>
        </Shell>
    );
}

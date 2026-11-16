import { useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { LayoutDashboard, ArrowLeftRight, Target, Plus, Search, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Eye, EyeOff, Zap, Menu as MenuIcon } from "lucide-react";
import { Button, IconButton, Drawer, ModalBody } from "../components/ui";
import { useFinance, useFinanceActions } from "../state/contexts";
import { useUI } from "./UIContext";
import { addMonthsToKey, currentMonthKey, formatMonthLabel } from "../domain/dates";
import { useHotkeys } from "../hooks/useHotkeys";
import { VeldoraLogo, VeldoraSymbol } from "../brand/VeldoraLogo";
import { SidebarNav } from "./layout/SidebarNav";
import { ThemeSwitcher } from "./layout/ThemeSwitcher";
import { WorkspaceCard } from "./layout/WorkspaceCard";
import { navContext } from "./navigation";

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
    padding: 12px 16px;
    border-radius: ${(p) => p.theme.radius.md};
    background: ${(p) => p.theme.colors.primary};
    color: ${(p) => p.theme.colors.onPrimary};
    font-weight: ${(p) => p.theme.fontWeight.semibold};
    &:focus {
        top: 8px;
    }
`;

const Side = styled.aside`
    display: none;
    ${(p) => p.theme.media.desktop} {
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        height: 100vh;
        border-right: 1px solid ${(p) => p.theme.colors.border};
        background: ${(p) => p.theme.colors.bgElevated};
        padding: 18px ${(p) => (p.$collapsed ? "12px" : "14px")} 14px;
        gap: 18px;
    }
`;

const BrandLink = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: ${(p) => (p.$collapsed ? "center" : "flex-start")};
    gap: 10px;
    min-height: 40px;
    padding: 0 6px;
    color: ${(p) => p.theme.colors.text};
    text-decoration: none;
    border-radius: ${(p) => p.theme.radius.md};
`;

const NavScroll = styled.div`
    flex: 1;
    overflow-y: auto;
    margin: 0 -6px;
    padding: 0 6px;
    scrollbar-width: thin;
`;

const SideFooter = styled.div`
    display: grid;
    gap: 10px;
`;

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
    background: color-mix(in srgb, ${(p) => p.theme.colors.bg} 88%, transparent);
    backdrop-filter: saturate(180%) blur(14px);
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    ${(p) => p.theme.media.tablet} {
        padding: 0 16px;
    }
    ${(p) => p.theme.media.desktop} {
        padding: 0 28px;
    }
`;

const MobileBrand = styled(Link)`
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: ${(p) => p.theme.radius.md};
    flex-shrink: 0;
    ${(p) => p.theme.media.desktop} {
        display: none;
    }
`;

const Context = styled.p`
    display: none;
    font-size: ${(p) => p.theme.fontSize.sm};
    color: ${(p) => p.theme.colors.textMuted};
    white-space: nowrap;
    span {
        color: ${(p) => p.theme.colors.text};
        font-weight: ${(p) => p.theme.fontWeight.medium};
    }
    ${(p) => p.theme.media.wide} {
        display: block;
        margin-right: 12px;
        padding-right: 16px;
        border-right: 1px solid ${(p) => p.theme.colors.border};
    }
`;

const MonthBox = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    h2 {
        font-family: ${(p) => p.theme.fonts.display};
        font-size: ${(p) => p.theme.fontSize.md};
        font-weight: ${(p) => p.theme.fontWeight.bold};
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
        ${(p) => p.theme.media.tablet} {
            min-width: 168px;
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
    display: none;
    flex: 1;
    max-width: 380px;
    margin-left: auto;
    ${(p) => p.theme.media.desktop} {
        display: block;
    }
    svg {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: ${(p) => p.theme.colors.textMuted};
    }
    input {
        width: 100%;
        min-height: 40px;
        padding: 0 40px 0 36px;
        border-radius: ${(p) => p.theme.radius.md};
        border: 1px solid ${(p) => p.theme.colors.border};
        background: ${(p) => p.theme.colors.bgElevated};
        font-size: ${(p) => p.theme.fontSize.md};
        transition: border-color ${(p) => p.theme.motion.fast}, box-shadow ${(p) => p.theme.motion.fast};
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
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        font: inherit;
        font-size: ${(p) => p.theme.fontSize.xs};
        padding: 1px 6px;
        border-radius: 4px;
        border: 1px solid ${(p) => p.theme.colors.border};
        color: ${(p) => p.theme.colors.textMuted};
    }
`;

const TopActions = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    ${(p) => p.theme.media.desktop} {
        margin-left: 0;
    }
    .new-label {
        display: none;
        ${(p) => p.theme.media.desktop} {
            display: inline-flex;
        }
    }
`;

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
        padding: 32px 36px 56px;
    }
`;

const Bottom = styled.nav`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: ${(p) => p.theme.z.nav};
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-items: center;
    height: calc(${(p) => p.theme.layout.bottomNav} + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    background: color-mix(in srgb, ${(p) => p.theme.colors.bgElevated} 94%, transparent);
    backdrop-filter: blur(14px);
    border-top: 1px solid ${(p) => p.theme.colors.border};
    ${(p) => p.theme.media.desktop} {
        display: none;
    }
`;

const BottomLink = styled(NavLink)`
    display: grid;
    justify-items: center;
    gap: 2px;
    min-height: 56px;
    align-content: center;
    font-size: 11px;
    font-weight: ${(p) => p.theme.fontWeight.medium};
    color: ${(p) => p.theme.colors.textMuted};
    text-decoration: none;
    &.active {
        color: ${(p) => p.theme.colors.primaryText};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
    }
`;

const BottomButton = styled.button`
    display: grid;
    justify-items: center;
    gap: 2px;
    min-height: 56px;
    width: 100%;
    align-content: center;
    font-size: 11px;
    font-weight: ${(p) => p.theme.fontWeight.medium};
    color: ${(p) => p.theme.colors.textMuted};
`;

const Fab = styled.button`
    justify-self: center;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: ${(p) => p.theme.colors.primary};
    color: ${(p) => p.theme.colors.onPrimary};
    box-shadow: ${(p) => p.theme.shadows.brand};
    transform: translateY(-10px);
    transition: background ${(p) => p.theme.motion.fast}, transform ${(p) => p.theme.motion.fast};
    &:active {
        transform: translateY(-10px) scale(0.96);
        background: ${(p) => p.theme.colors.primaryActive};
    }
`;

const DrawerBody = styled(ModalBody)`
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 4px;
`;

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
    const ctx = navContext(location);

    useHotkeys({
        n: () => openTransaction(),
        "/": () => {
            if (searchRef.current && searchRef.current.offsetParent !== null) searchRef.current.focus();
            else navigate("/movimentacoes?focus=busca");
        },
        q: () => openQuickCapture(),
        ArrowLeft: () => setMonth(addMonthsToKey(month, -1)),
        ArrowRight: () => setMonth(addMonthsToKey(month, 1)),
    });

    const submitSearch = (e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q")?.toString().trim();
        navigate(q ? `/movimentacoes?q=${encodeURIComponent(q)}` : "/movimentacoes");
        e.currentTarget.reset();
    };

    return (
        <Shell $collapsed={collapsed}>
            <SkipLink href="#conteudo">Pular para o conteúdo</SkipLink>
            <Side $collapsed={collapsed} aria-label="Barra lateral">
                <BrandLink to="/" $collapsed={collapsed} aria-label="VELDORA — ir para o Dashboard">
                    {collapsed ? <VeldoraSymbol size={30} /> : <VeldoraLogo height={28} title={null} />}
                </BrandLink>
                <NavScroll>
                    <SidebarNav collapsed={collapsed} />
                </NavScroll>
                <SideFooter>
                    <ThemeSwitcher vertical={collapsed} />
                    <WorkspaceCard collapsed={collapsed} />
                    <IconButton
                        icon={collapsed ? PanelLeftOpen : PanelLeftClose}
                        label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                        onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
                    />
                </SideFooter>
            </Side>

            <Main>
                <Top>
                    <MobileBrand to="/" aria-label="VELDORA — ir para o Dashboard">
                        <VeldoraSymbol size={26} />
                    </MobileBrand>
                    {ctx && (
                        <Context>
                            {ctx.group.label} / <span>{ctx.item.label}</span>
                        </Context>
                    )}
                    <MonthSwitcher />
                    <SearchForm role="search" onSubmit={submitSearch}>
                        <Search size={16} aria-hidden="true" />
                        <label htmlFor="global-search" className="sr-only">
                            Buscar movimentações
                        </label>
                        <input ref={searchRef} id="global-search" name="q" type="search" placeholder="Buscar movimentações" autoComplete="off" />
                        <kbd aria-hidden="true">/</kbd>
                    </SearchForm>
                    <TopActions>
                        {location.pathname !== "/movimentacoes" && (
                            <span className="only-mobile" style={{ display: "contents" }}>
                                <IconButton icon={Search} label="Buscar" onClick={() => navigate("/movimentacoes?focus=busca")} />
                            </span>
                        )}
                        <IconButton icon={hide ? EyeOff : Eye} label={hide ? "Mostrar valores" : "Ocultar valores"} onClick={() => updateSettings({ hideBalances: !hide })} />
                        <IconButton icon={Zap} label="Captura rápida (Q)" onClick={openQuickCapture} />
                        <span className="new-label">
                            <Button variant="primary" icon={Plus} onClick={() => openTransaction()} title="Nova transação (N)">
                                Nova transação
                            </Button>
                        </span>
                    </TopActions>
                </Top>
                <Content id="conteudo" tabIndex={-1}>
                    <Outlet />
                </Content>
            </Main>

            <Bottom aria-label="Navegação rápida">
                <BottomLink to="/" end>
                    <LayoutDashboard size={22} aria-hidden="true" />
                    Dashboard
                </BottomLink>
                <BottomLink to="/movimentacoes">
                    <ArrowLeftRight size={22} aria-hidden="true" />
                    Movimentações
                </BottomLink>
                <Fab type="button" aria-label="Nova transação" onClick={() => openTransaction()}>
                    <Plus size={26} aria-hidden="true" />
                </Fab>
                <BottomLink to="/planejamento">
                    <Target size={22} aria-hidden="true" />
                    Planejamento
                </BottomLink>
                <BottomButton type="button" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
                    <MenuIcon size={22} aria-hidden="true" />
                    Menu
                </BottomButton>
            </Bottom>

            <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={<VeldoraLogo height={24} />}>
                <DrawerBody>
                    <SidebarNav onNavigate={() => setMenuOpen(false)} label="Menu" />
                    <ThemeSwitcher />
                    <WorkspaceCard onNavigate={() => setMenuOpen(false)} />
                </DrawerBody>
            </Drawer>
        </Shell>
    );
}

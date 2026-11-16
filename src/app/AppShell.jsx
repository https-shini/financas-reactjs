import { useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
    LayoutDashboard, ArrowLeftRight, Target, BarChart3, Settings, Plus, Search, ChevronLeft, ChevronRight,
    PanelLeftClose, PanelLeftOpen, Eye, EyeOff, Zap, MoreHorizontal, Wallet,
} from "lucide-react";
import { Button, IconButton, Menu } from "../components/ui";
import { useFinance, useFinanceActions } from "../state/contexts";
import { useUI } from "./UIContext";
import { addMonthsToKey, currentMonthKey, formatMonthLabel } from "../domain/dates";
import { useHotkeys } from "../hooks/useHotkeys";

export const NAV_ITEMS = [
    { to: "/", label: "Início", icon: LayoutDashboard, end: true },
    { to: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
    { to: "/planejamento", label: "Planejamento", icon: Target },
    { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
];

const Shell = styled.div`
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr;
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: ${(p) => (p.$collapsed ? p.theme.layout.sidebarCollapsed : p.theme.layout.sidebar)} minmax(0, 1fr);
    }
`;

const SkipLink = styled.a`
    position: absolute;
    left: 8px;
    top: -100px;
    z-index: 100;
    padding: 12px 16px;
    border-radius: 8px;
    background: ${(p) => p.theme.colors.primary};
    color: #fff;
    font-weight: 600;
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
        padding: 16px 12px;
        gap: 8px;
    }
`;

const Brand = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 8px 16px;
    font-weight: 700;
    font-size: ${(p) => p.theme.fontSize.lg};
    letter-spacing: -0.01em;
    .logo {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: ${(p) => p.theme.colors.primary};
        color: #fff;
        flex-shrink: 0;
    }
`;

const NavList = styled.ul`
    list-style: none;
    display: grid;
    gap: 2px;
`;

const SideLink = styled(NavLink)`
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 0 12px;
    border-radius: ${(p) => p.theme.radius.md};
    color: ${(p) => p.theme.colors.textSecondary};
    text-decoration: none;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    &:hover {
        background: ${(p) => p.theme.colors.bgHover};
        color: ${(p) => p.theme.colors.text};
    }
    &.active {
        background: ${(p) => p.theme.colors.primarySoft};
        color: ${(p) => p.theme.colors.primaryText};
        font-weight: 600;
    }
    svg {
        flex-shrink: 0;
    }
`;

const SideFooter = styled.div`
    margin-top: auto;
    display: grid;
    gap: 8px;
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
    padding: 0 16px;
    background: ${(p) => p.theme.colors.bg}e6;
    backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    ${(p) => p.theme.media.desktop} {
        padding: 0 24px;
    }
`;

const MonthBox = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    h2 {
        font-size: ${(p) => p.theme.fontSize.md};
        font-weight: 600;
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
    max-width: 360px;
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
    }
    kbd {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        font: inherit;
        font-size: 11px;
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
        padding: 28px 32px 48px;
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
    background: ${(p) => p.theme.colors.bgElevated};
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
    font-weight: 500;
    color: ${(p) => p.theme.colors.textMuted};
    text-decoration: none;
    &.active {
        color: ${(p) => p.theme.colors.primaryText};
        font-weight: 600;
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
    font-weight: 500;
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
    color: #fff;
    box-shadow: ${(p) => p.theme.shadows.md};
    transform: translateY(-10px);
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
    const collapsed = store.settings.sidebarCollapsed;
    const hide = store.settings.hideBalances;

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
            <Side aria-label="Navegação principal">
                <Brand>
                    <span className="logo" aria-hidden="true">
                        <Wallet size={18} />
                    </span>
                    {!collapsed && <span>Finanças</span>}
                </Brand>
                <nav aria-label="Seções">
                    <NavList>
                        {NAV_ITEMS.map((it) => (
                            <li key={it.to}>
                                <SideLink to={it.to} end={it.end} title={collapsed ? it.label : undefined} aria-label={collapsed ? it.label : undefined}>
                                    <it.icon size={20} aria-hidden="true" />
                                    {!collapsed && it.label}
                                </SideLink>
                            </li>
                        ))}
                    </NavList>
                </nav>
                <SideFooter>
                    <IconButton
                        icon={collapsed ? PanelLeftOpen : PanelLeftClose}
                        label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
                        onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
                    />
                </SideFooter>
            </Side>

            <Main>
                <Top>
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
                            <span className="mobile-search" style={{ display: "contents" }}>
                                <IconButton icon={Search} label="Buscar" onClick={() => navigate("/movimentacoes?focus=busca")} className="only-mobile" />
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

            <Bottom aria-label="Navegação">
                <BottomLink to="/" end>
                    <LayoutDashboard size={22} aria-hidden="true" />
                    Início
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
                <Menu
                    label="Mais"
                    align="right"
                    items={[
                        { label: "Relatórios", icon: BarChart3, onClick: () => navigate("/relatorios") },
                        { label: "Configurações", icon: Settings, onClick: () => navigate("/configuracoes") },
                    ]}
                    trigger={(props) => (
                        <BottomButton type="button" {...props} aria-label="Mais opções">
                            <MoreHorizontal size={22} aria-hidden="true" />
                            Mais
                        </BottomButton>
                    )}
                />
            </Bottom>
        </Shell>
    );
}

import { NavLink } from "react-router-dom";
import styled, { css } from "styled-components";
import { LayoutDashboard, ArrowLeftRight, CalendarRange, Plus, Menu as MenuIcon, Eye, EyeOff } from "lucide-react";
import { Drawer, ModalBody, IconButton, focusRing } from "../../components/ui";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../UIContext";
import { BrandLockup } from "../../brand/BrandLogo";
import { SidebarNav } from "./SidebarNav";
import { ThemeToggle } from "./ThemeToggle";

/*
 * Navegação abaixo de 1024 px (padrão do Fluxer: barra inferior fixa com destinos principais
 * + a navegação completa em um painel). O drawer reutiliza SidebarNav: uma única
 * fonte de itens, estados e contadores para desktop e celular.
 */

const Bar = styled.nav`
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

const item = css`
    position: relative;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 3px;
    min-height: 52px;
    padding: 0 6px;
    border-radius: ${(p) => p.theme.radius.md};
    white-space: nowrap;
    font-size: 11px;
    font-weight: ${(p) => p.theme.fontWeight.medium};
    text-decoration: none;
    color: ${(p) => p.theme.colors.interactiveText};
    ${focusRing(true)}
    @media (max-width: 374px) {
        font-size: 10px;
        padding: 0 3px;
    }
`;

const Item = styled(NavLink)`
    ${item}
    &.active {
        color: ${(p) => p.theme.colors.interactiveSelectedText};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        svg {
            color: ${(p) => p.theme.colors.indicator};
        }
        &::before {
            content: "";
            position: absolute;
            top: -6px;
            left: 30%;
            right: 30%;
            height: 2px;
            border-radius: 0 0 2px 2px;
            background: ${(p) => p.theme.colors.indicator};
        }
    }
`;

const ItemButton = styled.button`
    ${item}
`;

const Fab = styled.button`
    flex: 0 0 48px !important;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: ${(p) => p.theme.radius.lg};
    background: ${(p) => p.theme.colors.primary};
    color: ${(p) => p.theme.colors.onPrimary};
    box-shadow: ${(p) => p.theme.shadows.brand};
    transition: background ${(p) => p.theme.motion.fast}, transform ${(p) => p.theme.motion.fast};
    ${focusRing()}
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
    gap: ${(p) => p.theme.space(4)};
    padding-top: 4px;
    .quick {
        display: flex;
        gap: ${(p) => p.theme.space(2)};
    }
`;

/** Barra inferior + menu completo em drawer (celular e tablet). */
export function MobileNav({ menuOpen, onMenuOpenChange }) {
    const { store } = useFinance();
    const { updateSettings } = useFinanceActions();
    const { openTransaction } = useUI();
    const hide = store.settings.hideBalances;
    const close = () => onMenuOpenChange(false);
    return (
        <>
            <Bar aria-label="Navegação rápida">
                <Item to="/" end>
                    <LayoutDashboard size={21} aria-hidden="true" />
                    Visão geral
                </Item>
                <Item to="/movimentacoes">
                    <ArrowLeftRight size={21} aria-hidden="true" />
                    Transações
                </Item>
                <Fab type="button" aria-label="Nova transação" onClick={() => openTransaction()}>
                    <Plus size={24} aria-hidden="true" />
                </Fab>
                <Item to="/planejamento">
                    <CalendarRange size={21} aria-hidden="true" />
                    Planejamento
                </Item>
                <ItemButton type="button" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => onMenuOpenChange(true)}>
                    <MenuIcon size={21} aria-hidden="true" />
                    Menu
                </ItemButton>
            </Bar>

            <Drawer open={menuOpen} onClose={close} title={<BrandLockup size={30} title={null} />}>
                <DrawerBody>
                    <SidebarNav onNavigate={close} label="Menu" />
                    <div className="quick">
                        <ThemeToggle size="md" />
                        <IconButton icon={hide ? EyeOff : Eye} label={hide ? "Mostrar valores" : "Ocultar valores"} onClick={() => updateSettings({ hideBalances: !hide })} />
                    </div>
                </DrawerBody>
            </Drawer>
        </>
    );
}

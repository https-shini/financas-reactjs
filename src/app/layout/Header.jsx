import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Search, Eye, EyeOff, LayoutGrid, Menu as MenuIcon } from "lucide-react";
import { IconButton, Breadcrumbs, focusRing, compactControl } from "../../components/ui";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { BrandMark } from "../../brand/BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { Notifications } from "./Notifications";
import { breadcrumbItems } from "../navigation";
import { OnlyDesktop, OnlyBelowDesktop, HideMobile } from "./responsive";

/*
 * Header global, no padrão do GCruz Lab Platform:
 *   esquerda — botão de layout (recolhe a sidebar no desktop; abre o menu abaixo de 1024 px) + breadcrumbs
 *   direita  — busca (Ctrl K) │ ocultar valores · tema · notificações
 * O mês de referência não fica no header: cada página o controla junto do conteúdo (calendário na Visão geral).
 * Altura = theme.layout.header (a borda inferior continua a da faixa da marca na sidebar).
 * Ações de página ("Nova transação", "Captura rápida") ficam no cabeçalho de cada página.
 */

const Root = styled.header`
    position: sticky;
    top: 0;
    z-index: ${(p) => p.theme.z.nav};
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.space(2)};
    height: ${(p) => p.theme.layout.header};
    padding-inline: ${(p) => p.theme.layout.contentPaddingInlineMobile};
    background: ${(p) => p.theme.colors.bgGlass};
    backdrop-filter: blur(12px);
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    ${(p) => p.theme.media.tablet} {
        padding-inline: ${(p) => p.theme.layout.contentPaddingInlineTablet};
    }
    ${(p) => p.theme.media.desktop} {
        gap: ${(p) => p.theme.space(3)};
        padding-inline: ${(p) => p.theme.layout.headerPaddingInline};
    }
    @media (max-width: 374px) {
        gap: 4px;
        padding-inline: 8px;
    }
`;

const Left = styled.div`
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.space(3)};
    min-width: 0;
    flex: 1;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.space(2)};
    flex-shrink: 0;
    min-width: 0;
    .divider {
        width: 1px;
        height: 22px;
        margin-inline: ${(p) => p.theme.space(1)};
        background: ${(p) => p.theme.colors.border};
    }
    .icons {
        display: flex;
        align-items: center;
        gap: 2px;
    }
    @media (max-width: 374px) {
        gap: 2px;
    }
`;

const Crumbs = styled.div`
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    ol {
        flex-wrap: nowrap;
        font-size: ${(p) => p.theme.fontSize.md};
    }
    [aria-current="page"] {
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        color: ${(p) => p.theme.colors.text};
    }
`;

const BrandLink = styled(Link)`
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: ${(p) => p.theme.radius.sm};
    ${focusRing()}
    @media (max-width: 359px) {
        display: none;
    }
`;

const SearchForm = styled.form`
    position: relative;
    width: ${(p) => p.theme.layout.headerSearchWidth};
    min-width: 180px;
    svg {
        position: absolute;
        left: 11px;
        top: 50%;
        transform: translateY(-50%);
        color: ${(p) => p.theme.colors.textMuted};
        pointer-events: none;
    }
    input {
        width: 100%;
        ${compactControl}
        padding: 0 62px 0 34px;
        border-radius: ${(p) => p.theme.radius.md};
        border: 1px solid ${(p) => p.theme.colors.border};
        background: ${(p) => p.theme.colors.bgElevated};
        font-size: 0.8125rem;
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
        pointer-events: none;
    }
    ${(p) => p.theme.media.belowDesktop} {
        display: none;
    }
    @media (max-width: 1180px) {
        width: 220px;
    }
`;

/**
 * Cabeçalho global. `searchRef`: campo usado pelos atalhos `/` e Ctrl+K.
 * `collapsed`/`onToggleSidebar`: botão de layout no desktop. `onOpenMenu`: abre o menu no celular.
 */
export function Header({ searchRef, collapsed, onToggleSidebar, onOpenMenu }) {
    const { store } = useFinance();
    const { updateSettings } = useFinanceActions();
    const navigate = useNavigate();
    const location = useLocation();
    const hide = store.settings.hideBalances;

    const submitSearch = (e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q")?.toString().trim();
        navigate(q ? `/movimentacoes?q=${encodeURIComponent(q)}` : "/movimentacoes");
        e.currentTarget.reset();
    };

    return (
        <Root>
            <Left>
                <OnlyDesktop>
                    <IconButton
                        icon={LayoutGrid}
                        size="sm"
                        bordered
                        label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                        aria-expanded={!collapsed}
                        onClick={onToggleSidebar}
                    />
                    <Crumbs>
                        <Breadcrumbs items={breadcrumbItems(location)} />
                    </Crumbs>
                </OnlyDesktop>
                <OnlyBelowDesktop>
                    <IconButton icon={MenuIcon} size="sm" bordered label="Abrir menu" aria-haspopup="dialog" onClick={onOpenMenu} />
                    <BrandLink to="/" aria-label="Finanças — ir para a Visão geral">
                        <BrandMark size={28} />
                    </BrandLink>
                </OnlyBelowDesktop>
            </Left>

            <Right>
                <SearchForm role="search" onSubmit={submitSearch}>
                    <Search size={15} aria-hidden="true" />
                    <label htmlFor="global-search" className="sr-only">
                        Buscar transações
                    </label>
                    <input ref={searchRef} id="global-search" name="q" type="search" placeholder="Buscar transações" autoComplete="off" />
                    <kbd aria-hidden="true">Ctrl K</kbd>
                </SearchForm>
                <HideMobile>
                    <span className="divider" aria-hidden="true" />
                </HideMobile>
                <div className="icons">
                    <OnlyBelowDesktop>
                        {location.pathname !== "/movimentacoes" && <IconButton icon={Search} size="sm" label="Buscar transações" onClick={() => navigate("/movimentacoes?focus=busca")} />}
                    </OnlyBelowDesktop>
                    <HideMobile>
                        <IconButton icon={hide ? EyeOff : Eye} size="sm" label={hide ? "Mostrar valores" : "Ocultar valores"} onClick={() => updateSettings({ hideBalances: !hide })} />
                        <ThemeToggle />
                    </HideMobile>
                    <Notifications />
                </div>
            </Right>
        </Root>
    );
}

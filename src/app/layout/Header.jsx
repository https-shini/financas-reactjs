import { Link, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, EyeOff, Zap, CircleHelp } from "lucide-react";
import { Button, IconButton, Breadcrumbs, focusRing, compactControl } from "../../components/ui";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { useUI } from "../UIContext";
import { addMonthsToKey, currentMonthKey, formatMonthLabel } from "../../domain/dates";
import { BrandMark } from "../../brand/BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { Notifications } from "./Notifications";
import { breadcrumbItems } from "../navigation";
import { OnlyDesktop, OnlyBelowDesktop, HideMobile, OnlyWide, BelowWide } from "./responsive";

/*
 * Header — três zonas, inspiradas na organização do cabeçalho do Fluxer
 * (contexto à esquerda, ferramentas ao centro, ações à direita):
 *   Leading:  onde estou (breadcrumbs no desktop; símbolo da marca abaixo de 1024 px).
 *   Tools:    o que estou vendo (mês de referência e busca global).
 *   Actions:  o que posso fazer (alternâncias, ajuda, notificações, tema e ação primária).
 * Altura = theme.layout.header (igual à faixa da marca na Sidebar). O recuo horizontal é o mesmo do
 * conteúdo, então os breadcrumbs ficam alinhados ao título da página.
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
    background: ${(p) => p.theme.colors.bgSidebar};
    border-bottom: 1px solid ${(p) => p.theme.colors.border};
    ${(p) => p.theme.media.tablet} {
        padding-inline: ${(p) => p.theme.layout.contentPaddingInlineTablet};
    }
    ${(p) => p.theme.media.desktop} {
        gap: ${(p) => p.theme.layout.headerGap};
        /* Mesmo recuo do conteúdo, inclusive quando ele é centralizado (área > layout.content). */
        padding-inline: max(
            ${(p) => p.theme.layout.contentPaddingInline},
            calc((100% - ${(p) => p.theme.layout.content}) / 2 + ${(p) => p.theme.layout.contentPaddingInline})
        );
    }
    @media (max-width: 374px) {
        gap: 2px;
        padding-inline: 6px;
    }
`;

const Leading = styled.div`
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.space(2)};
    min-width: 0;
    flex-shrink: 1;
`;

const Crumbs = styled.div`
    display: none;
    min-width: 0;
    white-space: nowrap;
    ${(p) => p.theme.media.wide} {
        display: block;
    }
    ol {
        font-size: 0.8125rem;
        flex-wrap: nowrap;
    }
    [aria-current="page"] {
        font-weight: ${(p) => p.theme.fontWeight.semibold};
    }
`;

const MobileBrand = styled(Link)`
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: ${(p) => p.theme.radius.sm};
    flex-shrink: 0;
    ${focusRing()}
    @media (max-width: 349px) {
        display: none;
    }
`;

const Tools = styled.div`
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.layout.headerGap};
    min-width: 0;
    flex: 1;
    ${(p) => p.theme.media.desktop} {
        justify-content: flex-end;
    }
`;

const MonthBox = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    padding: 1px;
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgElevated};
    h2 {
        font-family: ${(p) => p.theme.fonts.sans};
        font-size: 0.8125rem;
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        letter-spacing: 0;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: center;
        ${(p) => p.theme.media.tablet} {
            min-width: 136px;
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
    flex: 0 1 ${(p) => p.theme.layout.headerSearchWidth};
    min-width: 160px;
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
        padding: 0 64px 0 32px;
        border-radius: ${(p) => p.theme.radius.md};
        border: 1px solid ${(p) => p.theme.colors.border};
        background: ${(p) => p.theme.colors.bgSurface};
        font-size: 0.8125rem;
        transition: border-color ${(p) => p.theme.motion.fast}, box-shadow ${(p) => p.theme.motion.fast}, background ${(p) => p.theme.motion.fast};
        &:hover {
            border-color: ${(p) => p.theme.colors.borderStrong};
        }
        &:focus {
            outline: none;
            background: ${(p) => p.theme.colors.bgElevated};
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
        background: ${(p) => p.theme.colors.bgElevated};
        color: ${(p) => p.theme.colors.textMuted};
        pointer-events: none;
    }
`;

const Actions = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    flex-shrink: 0;
    ${(p) => p.theme.media.desktop} {
        margin-left: 0;
        gap: ${(p) => p.theme.layout.headerActionsGap};
    }
    .divider {
        width: 1px;
        height: 20px;
        margin-inline: ${(p) => p.theme.space(1)};
        background: ${(p) => p.theme.colors.border};
    }
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

/** Cabeçalho global. `searchRef` é exposto ao AppShell para os atalhos `/` e Ctrl+K. */
export function Header({ searchRef }) {
    const { store } = useFinance();
    const { updateSettings } = useFinanceActions();
    const { openTransaction, openQuickCapture } = useUI();
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
            <Leading>
                <OnlyDesktop>
                    <Crumbs>
                        <Breadcrumbs items={breadcrumbItems(location)} />
                    </Crumbs>
                </OnlyDesktop>
                <OnlyBelowDesktop>
                    <MobileBrand to="/" aria-label="Finanças — ir para a Visão geral">
                        <BrandMark size={28} />
                    </MobileBrand>
                </OnlyBelowDesktop>
            </Leading>

            <Tools>
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
            </Tools>

            <Actions>
                <OnlyBelowDesktop>
                    {location.pathname !== "/movimentacoes" && <IconButton icon={Search} size="sm" label="Buscar transações" onClick={() => navigate("/movimentacoes?focus=busca")} />}
                </OnlyBelowDesktop>
                <HideMobile>
                    <IconButton icon={hide ? EyeOff : Eye} size="sm" label={hide ? "Mostrar valores" : "Ocultar valores"} onClick={() => updateSettings({ hideBalances: !hide })} />
                </HideMobile>
                <IconButton icon={Zap} size="sm" label="Captura rápida (Q)" onClick={openQuickCapture} />
                <HideMobile>
                    <IconButton icon={CircleHelp} size="sm" label="Ajuda e atalhos" onClick={() => navigate("/configuracoes/sobre")} />
                </HideMobile>
                <Notifications />
                <HideMobile>
                    <ThemeToggle />
                </HideMobile>
                <OnlyDesktop>
                    <span className="divider" aria-hidden="true" />
                    <OnlyWide>
                        <Button variant="primary" size="sm" icon={Plus} onClick={() => openTransaction()} title="Nova transação (N)">
                            Nova transação
                        </Button>
                    </OnlyWide>
                    <BelowWide>
                        <IconButton icon={Plus} size="sm" bordered label="Nova transação (N)" onClick={() => openTransaction()} />
                    </BelowWide>
                </OnlyDesktop>
            </Actions>
        </Root>
    );
}

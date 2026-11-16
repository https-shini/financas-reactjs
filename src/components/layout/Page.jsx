import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import { Breadcrumbs } from "../ui/Feedback";
import { navContext } from "../../app/navigation";

const Head = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: ${(p) => p.theme.space(5)};
    h1 {
        font-family: ${(p) => p.theme.fonts.display};
        font-size: ${(p) => p.theme.fontSize["2xl"]};
        font-weight: ${(p) => p.theme.fontWeight.bold};
        letter-spacing: ${(p) => p.theme.letterSpacing.tight};
        line-height: ${(p) => p.theme.lineHeight.tight};
        margin-top: 6px;
        ${(p) => p.theme.media.desktop} {
            font-size: 1.75rem;
        }
    }
    .desc {
        color: ${(p) => p.theme.colors.textSecondary};
        margin-top: 6px;
        font-size: ${(p) => p.theme.fontSize.md};
    }
    .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
`;

/** Cabeçalho de página: trilha (breadcrumbs) automática, título (h1), descrição e ações. Atualiza o título da aba. */
export function PageHeader({ title, description, actions, docTitle, breadcrumbs = true }) {
    const location = useLocation();
    const ctx = navContext(location);
    useEffect(() => {
        document.title = `${docTitle ?? title} · VELDORA`;
    }, [title, docTitle]);
    const crumbs = breadcrumbs && ctx && ctx.item.id !== "dashboard" ? [{ label: "Dashboard", to: "/" }, { label: ctx.group.label }, { label: ctx.item.label }] : null;
    return (
        <Head>
            <div>
                {crumbs && <Breadcrumbs items={crumbs} />}
                <h1>{title}</h1>
                {description && <p className="desc">{description}</p>}
            </div>
            {actions && <div className="actions">{actions}</div>}
        </Head>
    );
}

/** Grade responsiva de 12 colunas no desktop, 2 no tablet e 1 no celular. */
export const Grid = styled.div`
    display: grid;
    gap: ${(p) => p.theme.space(4)};
    grid-template-columns: minmax(0, 1fr);
    ${(p) => p.theme.media.tablet} {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    ${(p) => p.theme.media.desktop} {
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: ${(p) => p.theme.space(5)};
    }
`;

export const Span = styled.div`
    min-width: 0;
    display: grid;
    ${(p) => p.theme.media.tablet} {
        grid-column: span ${(p) => p.$tablet ?? 2};
    }
    ${(p) => p.theme.media.desktop} {
        grid-column: span ${(p) => p.$desktop ?? 12};
    }
`;

export const Stack = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${(p) => p.theme.space(p.$gap ?? 4)};
    min-width: 0;
`;

export const Row = styled.div`
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.space(p.$gap ?? 2)};
    flex-wrap: ${(p) => (p.$wrap ? "wrap" : "nowrap")};
    justify-content: ${(p) => p.$justify ?? "flex-start"};
    min-width: 0;
`;

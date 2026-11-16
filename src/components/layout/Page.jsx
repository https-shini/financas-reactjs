import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import { Eyebrow } from "../ui/Typography";
import { navContext, NAV_GROUPS } from "../../app/navigation";

const Head = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: ${(p) => p.theme.space(5)};
    margin-top: ${(p) => p.theme.space(2)};
    h1 {
        font-family: ${(p) => p.theme.fonts.display};
        font-size: ${(p) => p.theme.fontSize["3xl"]};
        font-weight: ${(p) => p.theme.fontWeight.bold};
        letter-spacing: ${(p) => p.theme.letterSpacing.tighter};
        line-height: ${(p) => p.theme.lineHeight.tight};
        margin-top: 10px;
        ${(p) => p.theme.media.desktop} {
            font-size: ${(p) => p.theme.fontSize["4xl"]};
        }
    }
    .desc {
        color: ${(p) => p.theme.colors.textSecondary};
        margin-top: 8px;
        font-size: ${(p) => p.theme.fontSize.base};
        max-width: 64ch;
    }
    .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
`;

/**
 * Cabeçalho de página: sobretítulo numerado do grupo de navegação ("— 02 · Financeiro"),
 * título (h1) em display, descrição e ações. Atualiza o título da aba.
 * A trilha (breadcrumbs) fica na barra superior.
 */
export function PageHeader({ title, description, actions, docTitle, eyebrow }) {
    const location = useLocation();
    const ctx = navContext(location);
    useEffect(() => {
        document.title = `${docTitle ?? title} · VELDORA`;
    }, [title, docTitle]);
    const groupIndex = ctx ? NAV_GROUPS.indexOf(ctx.group) + 1 : 0;
    const eyebrowText = eyebrow ?? (ctx ? `${String(groupIndex).padStart(2, "0")} · ${ctx.group.label}` : null);
    return (
        <Head>
            <div>
                {eyebrowText && <Eyebrow>{eyebrowText}</Eyebrow>}
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

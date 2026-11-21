import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { navContext } from "../../app/navigation";
import styled from "styled-components";
import { Eyebrow } from "../ui/Typography";

const Head = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 22px;
    h1 {
        font-family: ${(p) => p.theme.fonts.display};
        font-size: ${(p) => p.theme.fontSize.xl};
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        letter-spacing: -0.03em;
        line-height: ${(p) => p.theme.lineHeight.tight};
        margin-top: 10px;
        ${(p) => p.theme.media.tablet} {
            font-size: 2rem;
        }
    }
    .desc {
        color: ${(p) => p.theme.colors.textSecondary};
        margin-top: 8px;
        font-size: ${(p) => p.theme.fontSize.md};
        max-width: 72ch;
    }
    .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    /* Celular: ações ocupam a linha inteira em colunas iguais (sem quebrar em duas linhas). */
    ${(p) => p.theme.media.mobile} {
        > div:first-child {
            width: 100%;
        }
        .actions {
            width: 100%;
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: minmax(0, 1fr);
        }
        .actions > *,
        .actions > div > button[aria-haspopup] {
            width: 100%;
            min-width: 0;
        }
        .actions button {
            padding-left: 12px;
            padding-right: 12px;
        }
    }
`;

/**
 * Cabeçalho de página (padrão Lab Platform): sobretítulo com a seção do menu ("— FINANCEIRO"),
 * título (h1), descrição e ações alinhadas à direita. `eyebrow` substitui o sobretítulo automático.
 * A trilha (breadcrumbs) fica no header global. Atualiza o título da aba.
 */
export function PageHeader({ title, description, actions, docTitle, eyebrow }) {
    const location = useLocation();
    const section = navContext(location)?.group.label;
    useEffect(() => {
        document.title = `${docTitle ?? title} · Finanças`;
    }, [title, docTitle]);
    const eyebrowText = eyebrow ?? section ?? null;
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

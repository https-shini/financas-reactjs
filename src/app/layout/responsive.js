import styled from "styled-components";

/**
 * Invólucros de visibilidade por breakpoint (display: contents — não criam caixa nem quebram o layout).
 * Fonte única para Header, Sidebar e navegação móvel; antes cada arquivo definia os seus.
 */
export const OnlyDesktop = styled.span`
    display: none;
    ${(p) => p.theme.media.desktop} {
        display: contents;
    }
`;

export const OnlyBelowDesktop = styled.span`
    display: contents;
    ${(p) => p.theme.media.desktop} {
        display: none;
    }
`;

export const HideMobile = styled.span`
    display: contents;
    ${(p) => p.theme.media.mobile} {
        display: none;
    }
`;

export const OnlyWide = styled.span`
    display: none;
    ${(p) => p.theme.media.wide} {
        display: contents;
    }
`;

export const BelowWide = styled.span`
    display: contents;
    ${(p) => p.theme.media.wide} {
        display: none;
    }
`;

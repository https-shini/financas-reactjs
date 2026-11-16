import styled from "styled-components";

export const Card = styled.section`
    background: ${(p) => p.theme.colors.bgElevated};
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.lg};
    box-shadow: ${(p) => p.theme.shadows.sm};
    padding: ${(p) => (p.$flush ? "0" : p.theme.space(5))};
    min-width: 0;
    ${(p) => p.theme.media.mobile} {
        padding: ${(p) => (p.$flush ? "0" : p.theme.space(4))};
    }
`;

const HeaderWrap = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: ${(p) => p.theme.space(4)};
    padding: ${(p) => (p.$flush ? p.theme.space(4, 5, 0) : 0)};
    min-height: 32px;
    h2,
    h3 {
        font-size: ${(p) => p.theme.fontSize.md};
        font-weight: 600;
        line-height: 1.3;
    }
    p {
        color: ${(p) => p.theme.colors.textMuted};
        font-size: ${(p) => p.theme.fontSize.sm};
        margin-top: 2px;
    }
`;

export function CardHeader({ title, subtitle, actions, as: Heading = "h2", id, flush }) {
    return (
        <HeaderWrap $flush={flush}>
            <div style={{ minWidth: 0 }}>
                <Heading id={id}>{title}</Heading>
                {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>{actions}</div>}
        </HeaderWrap>
    );
}

export const Divider = styled.hr`
    border: 0;
    border-top: 1px solid ${(p) => p.theme.colors.border};
    margin: ${(p) => p.theme.space(3)} 0;
`;

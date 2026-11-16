import { useState } from "react";
import styled, { useTheme } from "styled-components";
import { toast } from "react-toastify";
import { Plus, Download, Trash2, Pencil, Wallet, TrendingUp, Inbox, Bell, Settings } from "lucide-react";
import { PageHeader, Stack, Grid, Span, Row } from "../../components/layout/Page";
import {
    Button,
    IconButton,
    Card,
    CardHeader,
    Field,
    Input,
    Select,
    DatePicker,
    MoneyInput,
    SegmentedControl,
    Switch,
    Checkbox,
    RadioGroup,
    Modal,
    ModalBody,
    ModalFooter,
    Drawer,
    Amount,
    Badge,
    Progress,
    EmptyState,
    Skeleton,
    Delta,
    Menu,
    Tabs,
    Text,
    Heading,
    NumericDisplay,
    Overline,
    Subheading,
    Spinner,
    Alert,
    Tooltip,
    StatCard,
    DataTable,
    Pagination,
    Breadcrumbs,
} from "../../components/ui";
import { BrandLockup, BrandMark } from "../../brand/BrandLogo";
import { TAGLINE, CATEGORY } from "../../brand/geometry";
import { brand } from "../../design/tokens";

/**
 * Página interna do Design System do Finanças (rota /design-system, fora da navegação principal).
 * Demonstra marca, paleta, tipografia e todos os componentes com seus estados.
 * Não lê nem grava dados financeiros.
 */
export default function DesignSystemPage() {
    const theme = useTheme();
    const [modal, setModal] = useState(false);
    const [drawer, setDrawer] = useState(false);
    const [seg, setSeg] = useState("expense");
    const [sw, setSw] = useState(true);
    const [radio, setRadio] = useState("mensal");
    const [tab, setTab] = useState("a");
    const [page, setPage] = useState(2);
    const [money, setMoney] = useState(125000);
    const [loading, setLoading] = useState(false);

    const semantic = ["bg", "bgSidebar", "bgElevated", "bgSurface", "border", "text", "textSecondary", "textMuted", "brand", "primary", "primaryText", "primarySoft", "income", "expense", "warning", "info"];

    return (
        <Stack $gap={6}>
            <PageHeader title="Design System" description="Finanças by GCruz.DEV — componentes, tokens e identidade visual (Emerald Finance)" eyebrow="Sistema interno" />

            {/* Marca */}
            <Card aria-labelledby="ds-brand">
                <CardHeader id="ds-brand" title="Identidade" subtitle={`${CATEGORY} · ${TAGLINE}`} />
                <Grid>
                    <Span $desktop={6}>
                        <Swatch $bg={brand.darkBackground}>
                            <BrandLockup size={40} tone="onDark" title="Finanças sobre fundo escuro" />
                        </Swatch>
                    </Span>
                    <Span $desktop={6}>
                        <Swatch $bg="#FFFFFF" $border>
                            <BrandLockup size={40} tone="onLight" title="Finanças sobre fundo claro" />
                        </Swatch>
                    </Span>
                    <Span $desktop={4}>
                        <Swatch $bg={theme.colors.bgSurface}>
                            <BrandMark size={56} title="Símbolo do Finanças (favicon, ícone e avatar)" />
                        </Swatch>
                    </Span>
                    <Span $desktop={4}>
                        <Swatch $bg={theme.colors.bgSurface}>
                            <span style={{ color: theme.colors.text }}>
                                <BrandLockup size={36} tone="mono" title="Finanças monocromático" />
                            </span>
                        </Swatch>
                    </Span>
                    <Span $desktop={4}>
                        <Swatch $bg={theme.colors.bgSurface}>
                            <span style={{ display: "flex", gap: 12, alignItems: "center", color: theme.colors.text }}>
                                <BrandMark size={16} title="Símbolo em 16 px" />
                                <BrandMark size={32} title="Símbolo em 32 px" />
                                <BrandMark size={48} tone="mono" title="Símbolo monocromático" />
                            </span>
                        </Swatch>
                    </Span>
                </Grid>
            </Card>

            {/* Paleta */}
            <Card aria-labelledby="ds-colors">
                <CardHeader id="ds-colors" title="Cores" subtitle={`Tokens semânticos do tema ${theme.mode === "dark" ? "escuro" : "claro"}`} />
                <ColorGrid>
                    {semantic.map((k) => (
                        <li key={k}>
                            <span className="chip" style={{ background: theme.colors[k] }} />
                            <span className="name">{k}</span>
                            <code>{theme.colors[k]}</code>
                        </li>
                    ))}
                </ColorGrid>
            </Card>

            {/* Tipografia */}
            <Card aria-labelledby="ds-type">
                <CardHeader id="ds-type" title="Tipografia" subtitle="Space Grotesk (display e números) · Inter (texto) · numerais tabulares" />
                <Stack $gap={3}>
                    <Text as="p" $variant="display">
                        Display 40
                    </Text>
                    <Heading as="p" $role="h1">
                        H1 — Visão financeira
                    </Heading>
                    <Heading as="p" $role="h2">
                        H2 — Resumo do mês
                    </Heading>
                    <Heading as="p" $role="h3">
                        H3 — Despesas por categoria
                    </Heading>
                    <Text>Body — Seu dinheiro organizado com clareza, sem planilhas.</Text>
                    <Text $variant="caption" $tone="muted">
                        Caption — atualizado agora
                    </Text>
                    <Overline>Overline</Overline>
                    <NumericDisplay>R$ 12.345,67</NumericDisplay>
                </Stack>
            </Card>

            <Grid>
                {/* Botões */}
                <Span $desktop={6}>
                    <Card aria-labelledby="ds-buttons">
                        <CardHeader id="ds-buttons" title="Botões" />
                        <Stack $gap={3}>
                            <Row $wrap $gap={2}>
                                <Button variant="primary" icon={Plus}>
                                    Primário
                                </Button>
                                <Button>Secundário</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="accent">Informação</Button>
                                <Button variant="danger" icon={Trash2}>
                                    Excluir
                                </Button>
                            </Row>
                            <Row $wrap $gap={2}>
                                <Button variant="primary" size="sm">
                                    Pequeno
                                </Button>
                                <Button variant="primary" size="lg">
                                    Grande
                                </Button>
                                <Button variant="primary" disabled>
                                    Desabilitado
                                </Button>
                                <Button
                                    variant="primary"
                                    loading={loading}
                                    onClick={() => {
                                        setLoading(true);
                                        setTimeout(() => setLoading(false), 1500);
                                    }}
                                >
                                    {loading ? "Salvando…" : "Carregar"}
                                </Button>
                            </Row>
                            <Row $wrap $gap={2}>
                                <IconButton icon={Pencil} label="Editar" />
                                <IconButton icon={Download} label="Baixar" bordered />
                                <IconButton icon={Trash2} label="Excluir" tone="danger" />
                                <IconButton icon={Settings} label="Desabilitado" disabled />
                                <Menu
                                    items={[
                                        { label: "Editar", icon: Pencil, onClick: () => toast.info("Editar") },
                                        { label: "Excluir", icon: Trash2, danger: true, onClick: () => toast.error("Excluir") },
                                    ]}
                                    label="Menu suspenso"
                                />
                                <Tooltip content="Dicas explicam indicadores. Abrem com mouse, foco ou toque." />
                            </Row>
                        </Stack>
                    </Card>
                </Span>

                {/* Formulários */}
                <Span $desktop={6}>
                    <Card aria-labelledby="ds-forms">
                        <CardHeader id="ds-forms" title="Formulários" />
                        <Stack $gap={3}>
                            <Field label="Descrição" hint="Texto de apoio">
                                {(f) => <Input id={f.id} aria-describedby={f.describedBy} placeholder="Ex.: Mercado" />}
                            </Field>
                            <Field label="Valor" error="Informe um valor maior que zero">
                                {(f) => <MoneyInput id={f.id} aria-describedby={f.describedBy} aria-invalid={f.invalid} value={money} onChange={setMoney} />}
                            </Field>
                            <Row $gap={3} $wrap>
                                <Field label="Conta">
                                    {(f) => (
                                        <Select id={f.id} defaultValue="1">
                                            <option value="1">Conta corrente</option>
                                            <option value="2">Carteira</option>
                                        </Select>
                                    )}
                                </Field>
                                <Field label="Data">
                                    {(f) => <DatePicker id={f.id} defaultValue="2026-11-16" />}
                                </Field>
                            </Row>
                            <Field label="Desabilitado">
                                {(f) => <Input id={f.id} disabled value="Somente leitura" readOnly />}
                            </Field>
                            <SegmentedControl
                                label="Tipo"
                                value={seg}
                                onChange={setSeg}
                                options={[
                                    { value: "expense", label: "Despesa" },
                                    { value: "income", label: "Receita" },
                                    { value: "transfer", label: "Transferência" },
                                ]}
                            />
                            <Switch checked={sw} onChange={setSw} label="Lembretes de vencimento" description="Mostra alertas no dashboard" />
                            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <Checkbox defaultChecked /> Marcar como pago
                            </label>
                            <RadioGroup
                                legend="Período"
                                name="ds-period"
                                value={radio}
                                onChange={setRadio}
                                options={[
                                    { value: "mensal", label: "Mensal" },
                                    { value: "anual", label: "Anual" },
                                ]}
                            />
                        </Stack>
                    </Card>
                </Span>

                {/* Indicadores */}
                <Span $desktop={4}>
                    <StatCard label="Saldo disponível" icon={Wallet} accent="brand" tooltip="Soma das contas, sem cartões." value={<Amount cents={3337125} big />} hint="3 contas" />
                </Span>
                <Span $desktop={4}>
                    <StatCard
                        label="Receitas"
                        icon={TrendingUp}
                        iconTone="income"
                        accent="income"
                        value={<Amount cents={650000} type="income" sign big />}
                        delta={<Delta value={12.4} />}
                    />
                </Span>
                <Span $desktop={4}>
                    <StatCard label="Despesas" iconTone="expense" accent="expense" value={<Amount cents={395883} type="expense" sign big />} delta={<Delta value={3.2} goodWhenUp={false} />}>
                        <Progress value={72} tone="warning" label="Orçamento usado: 72%" />
                    </StatCard>
                </Span>

                {/* Badges / alertas */}
                <Span $desktop={6}>
                    <Card aria-labelledby="ds-feedback">
                        <CardHeader id="ds-feedback" title="Badges, alertas e progresso" />
                        <Stack $gap={3}>
                            <Row $wrap $gap={2}>
                                <Badge>Neutro</Badge>
                                <Badge $tone="primary">Primário</Badge>
                                <Badge $tone="income">Pago</Badge>
                                <Badge $tone="expense">Atrasado</Badge>
                                <Badge $tone="warning">Vence hoje</Badge>
                                <Badge $tone="info">Info</Badge>
                                <Badge $tone="accent">Insight</Badge>
                            </Row>
                            <Alert tone="info" title="Informação">
                                Seus dados ficam apenas neste navegador.
                            </Alert>
                            <Alert tone="success" title="Backup concluído" role="status" />
                            <Alert tone="warning" title="Orçamento em 85%">
                                Faltam 12 dias para o fim do mês.
                            </Alert>
                            <Alert tone="danger" title="Falha na importação" role="status">
                                Linha 4: data inválida.
                            </Alert>
                            <Progress value={40} tone="income" label="Meta: 40%" />
                            <Progress value={100} tone="expense" label="Orçamento: 100%" />
                            <Row $gap={3}>
                                <Spinner />
                                <Button onClick={() => toast.success("Transação salva.")}>Toast sucesso</Button>
                                <Button onClick={() => toast.error("Não foi possível salvar.")}>Toast erro</Button>
                            </Row>
                        </Stack>
                    </Card>
                </Span>

                {/* Navegação */}
                <Span $desktop={6}>
                    <Card aria-labelledby="ds-nav">
                        <CardHeader id="ds-nav" title="Navegação e sobreposições" />
                        <Stack $gap={4}>
                            <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: "Planejamento" }, { label: "Metas" }]} />
                            <Tabs
                                label="Exemplo de abas"
                                idPrefix="ds-tab"
                                value={tab}
                                onChange={setTab}
                                tabs={[
                                    { value: "a", label: "Resumo" },
                                    { value: "b", label: "Detalhes" },
                                    { value: "c", label: "Histórico" },
                                ]}
                            />
                            <Pagination page={page} pageCount={8} onChange={setPage} />
                            <Row $wrap $gap={2}>
                                <Button onClick={() => setModal(true)}>Abrir modal</Button>
                                <Button onClick={() => setDrawer(true)}>Abrir drawer</Button>
                            </Row>
                            <Subheading>Carregamento</Subheading>
                            <Skeleton $h="16px" $w="60%" />
                            <Skeleton $h="48px" />
                        </Stack>
                    </Card>
                </Span>

                {/* Tabela */}
                <Span $desktop={8}>
                    <Card aria-labelledby="ds-table">
                        <CardHeader id="ds-table" title="Tabela" subtitle="Em telas pequenas, cada linha vira um cartão" />
                        <DataTable
                            caption="Exemplo de tabela"
                            getKey={(r) => r.id}
                            columns={[
                                { key: "desc", header: "Descrição", render: (r) => r.desc },
                                { key: "status", header: "Status", render: (r) => <Badge $tone={r.tone}>{r.status}</Badge> },
                                { key: "value", header: "Valor", align: "right", render: (r) => <Amount cents={r.cents} type={r.type} sign /> },
                            ]}
                            rows={[
                                { id: 1, desc: "Salário", status: "Recebido", tone: "income", cents: 650000, type: "income" },
                                { id: 2, desc: "Aluguel", status: "Pago", tone: "income", cents: 200036, type: "expense" },
                                { id: 3, desc: "Internet", status: "Vence hoje", tone: "warning", cents: 9990, type: "expense" },
                            ]}
                        />
                    </Card>
                </Span>
                <Span $desktop={4}>
                    <Card>
                        <EmptyState icon={Inbox} title="Nada por aqui" description="Estados vazios explicam o próximo passo.">
                            <Button variant="primary" icon={Bell} size="sm">
                                Criar lembrete
                            </Button>
                        </EmptyState>
                    </Card>
                </Span>
            </Grid>

            <Modal open={modal} onClose={() => setModal(false)} title="Exemplo de modal" description="Foco preso, Esc fecha.">
                <ModalBody>Conteúdo do modal.</ModalBody>
                <ModalFooter>
                    <Button onClick={() => setModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={() => setModal(false)}>
                        Confirmar
                    </Button>
                </ModalFooter>
            </Modal>
            <Drawer open={drawer} onClose={() => setDrawer(false)} title="Exemplo de drawer">
                <ModalBody>Painel lateral usado no menu móvel.</ModalBody>
            </Drawer>
        </Stack>
    );
}

const Swatch = styled.div`
    display: grid;
    place-items: center;
    min-height: 120px;
    padding: ${(p) => p.theme.space(5)};
    border-radius: ${(p) => p.theme.radius.lg};
    background: ${(p) => p.$bg};
    border: 1px solid ${(p) => (p.$border ? p.theme.colors.border : "transparent")};
`;

const ColorGrid = styled.ul`
    list-style: none;
    display: grid;
    gap: ${(p) => p.theme.space(3)};
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    li {
        display: grid;
        gap: 2px;
    }
    .chip {
        height: 48px;
        border-radius: ${(p) => p.theme.radius.md};
        border: 1px solid ${(p) => p.theme.colors.border};
        margin-bottom: 6px;
    }
    .name {
        font-weight: ${(p) => p.theme.fontWeight.semibold};
        font-size: ${(p) => p.theme.fontSize.sm};
    }
    code {
        color: ${(p) => p.theme.colors.textMuted};
        font-size: ${(p) => p.theme.fontSize.xs};
    }
`;

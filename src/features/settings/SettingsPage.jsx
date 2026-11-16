import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import {
    Palette, Globe2, Tags, Landmark, Database, Info, Plus, Pencil, Archive, ArchiveRestore, Trash2, Download, Upload, ShieldCheck,
    FileSpreadsheet, FileText, File as FileIcon, HardDrive, Sun, Moon, MonitorSmartphone,
} from "lucide-react";
import {
    Card, CardHeader, Button, Menu, Modal, ModalBody, ModalFooter, Field, Input, Select, MoneyInput, SegmentedControl, Switch,
    CategoryIcon, Badge, Amount, Muted, RouteTabs, useConfirm, CATEGORY_ICON_COMPONENTS, Divider, FieldLabel } from "../../components/ui";
import { PageHeader, Stack, Row } from "../../components/layout/Page";
import { useFinance, useFinanceActions } from "../../state/contexts";
import { ACCOUNT_TYPES, CATEGORY_COLORS, CATEGORY_ICONS, createEmptyStore, SCHEMA_VERSION } from "../../domain/defaults";
import { accountBalance, categoryUsage } from "../../domain/selectors";
import { isCard } from "../../domain/cards";
import { newId } from "../../domain/ids";
import { cleanText } from "../../domain/transactions";
import { downloadBackup, parseBackupText, summarizeStore } from "../../storage/backup";
import { exportToCsv, exportToExcel, exportToPDF, exportToWord } from "../../utils/exportFiles";
import { ImportDialog, downloadImportTemplate } from "../data/ImportDialog";
import { formatDateBR, diffDays, todayISO } from "../../domain/dates";
import { formatMoney } from "../../domain/money";

const TABS = [
    { to: "/configuracoes/aparencia", label: "Aparência", icon: Palette },
    { to: "/configuracoes/regional", label: "Regional", icon: Globe2 },
    { to: "/configuracoes/categorias", label: "Categorias", icon: Tags },
    { to: "/configuracoes/contas", label: "Contas", icon: Landmark },
    { to: "/configuracoes/dados", label: "Dados", icon: Database },
    { to: "/configuracoes/sobre", label: "Sobre", icon: Info },
];

const List = styled.ul`
    list-style: none;
    display: grid;
    gap: 2px;
    li {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 60px;
        padding: 6px 8px;
        border-radius: ${(p) => p.theme.radius.md};
        &:hover {
            background: ${(p) => p.theme.colors.bgHover};
        }
    }
    .grow {
        flex: 1;
        min-width: 0;
        display: grid;
    }
    .grow > span:first-child {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const Swatches = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    button {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid transparent;
        @media (pointer: coarse) {
            width: 44px;
            height: 44px;
        }
    }
    button[aria-checked="true"] {
        border-color: ${(p) => p.theme.colors.text};
    }
`;

const IconGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 6px;
    button {
        display: grid;
        place-items: center;
        height: 44px;
        border-radius: 10px;
        border: 1px solid ${(p) => p.theme.colors.border};
        color: ${(p) => p.theme.colors.textSecondary};
    }
    button[aria-checked="true"] {
        border-color: ${(p) => p.theme.colors.primary};
        background: ${(p) => p.theme.colors.primarySoft};
        color: ${(p) => p.theme.colors.primaryText};
    }
`;

const ActionGrid = styled.div`
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
`;

const Kbd = styled.kbd`
    font: inherit;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid ${(p) => p.theme.colors.border};
    background: ${(p) => p.theme.colors.bgSurface};
`;

// ---------------- Aparência ----------------

function AppearanceSection() {
    const { store } = useFinance();
    const { updateSettings } = useFinanceActions();
    return (
        <Card aria-labelledby="ap-title">
            <CardHeader id="ap-title" title="Aparência" subtitle="Tema e privacidade dos valores" />
            <Stack $gap={5}>
                <div>
                    <FieldLabel id="theme-label">
                        Tema
                    </FieldLabel>
                    <SegmentedControl
                        label="Tema"
                        value={store.settings.theme}
                        onChange={(theme) => updateSettings({ theme })}
                        options={[
                            { value: "light", label: "Claro", icon: Sun },
                            { value: "dark", label: "Escuro", icon: Moon },
                            { value: "system", label: "Automático", icon: MonitorSmartphone },
                        ]}
                    />
                    <Muted style={{ display: "block", marginTop: 6 }}>Automático acompanha a preferência do seu sistema.</Muted>
                </div>
                <Switch
                    checked={store.settings.hideBalances}
                    onChange={(v) => updateSettings({ hideBalances: v })}
                    label="Ocultar valores"
                    description="Esconde saldos e totais na tela (útil em locais públicos)."
                />
            </Stack>
        </Card>
    );
}

// ---------------- Regional ----------------

const LOCALES = { "pt-BR": "Português (Brasil)", "pt-PT": "Português (Portugal)", "en-US": "English (US)", "es-ES": "Español" };
const CURRENCIES = { BRL: "Real (R$)", USD: "Dólar americano (US$)", EUR: "Euro (€)", GBP: "Libra (£)", ARS: "Peso argentino", CLP: "Peso chileno" };

function RegionalSection() {
    const { store } = useFinance();
    const { updateSettings } = useFinanceActions();
    const { locale, currency } = store.settings;
    return (
        <Card aria-labelledby="rg-title">
            <CardHeader id="rg-title" title="Preferências regionais" subtitle="Formato de números e moeda exibida" />
            <Stack $gap={4} style={{ maxWidth: 480 }}>
                <Field label="Formato de números">
                    {({ id }) => (
                        <Select id={id} value={locale} onChange={(e) => updateSettings({ locale: e.target.value })}>
                            {Object.entries(LOCALES).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>
                <Field label="Moeda" hint="Altera apenas a exibição. Os valores não são convertidos.">
                    {({ id, describedBy }) => (
                        <Select id={id} value={currency} aria-describedby={describedBy} onChange={(e) => updateSettings({ currency: e.target.value })}>
                            {Object.entries(CURRENCIES).map(([k, v]) => (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>
                <p>
                    Exemplo: <strong>{formatMoney(123456, { locale, currency })}</strong>
                </p>
            </Stack>
        </Card>
    );
}

// ---------------- Categorias ----------------

function CategoryDialog({ open, onClose, category }) {
    const { upsertCategory } = useFinanceActions();
    const [name, setName] = useState(category?.name ?? "");
    const [kind, setKind] = useState(category?.kind ?? "expense");
    const [icon, setIcon] = useState(category?.icon ?? "Tag");
    const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0]);
    const [keywords, setKeywords] = useState((category?.keywords ?? []).join(", "));
    const [submitted, setSubmitted] = useState(false);
    const nameError = !cleanText(name) ? "Informe um nome." : undefined;

    const save = (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (nameError) return;
        const now = new Date().toISOString();
        try {
            upsertCategory({
                id: category?.id ?? newId(),
                name: cleanText(name, 60),
                kind,
                icon,
                color,
                keywords: keywords
                    .split(",")
                    .map((k) => cleanText(k, 60))
                    .filter(Boolean)
                    .slice(0, 100),
                archived: category?.archived ?? false,
                createdAt: category?.createdAt ?? now,
                updatedAt: now,
            });
            toast.success(category ? "Categoria atualizada." : "Categoria criada.");
            onClose();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={category ? "Editar categoria" : "Nova categoria"} variant="sheet">
            <form onSubmit={save}>
                <ModalBody style={{ display: "grid", gap: 16 }}>
                    <Row $gap={3}>
                        <CategoryIcon category={{ icon, color }} size={44} />
                        <Field label="Nome" error={submitted ? nameError : undefined} className="grow">
                            {({ id, describedBy, invalid }) => <Input id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid || undefined} data-autofocus />}
                        </Field>
                    </Row>
                    <div>
                        <FieldLabel>Usada em</FieldLabel>
                        <SegmentedControl
                            label="Tipo de categoria"
                            value={kind}
                            onChange={setKind}
                            options={[
                                { value: "expense", label: "Despesas" },
                                { value: "income", label: "Receitas" },
                                { value: "both", label: "Ambas" },
                            ]}
                        />
                    </div>
                    <div>
                        <FieldLabel id="icon-l">
                            Ícone
                        </FieldLabel>
                        <IconGrid role="radiogroup" aria-labelledby="icon-l">
                            {CATEGORY_ICONS.map((n) => {
                                const I = CATEGORY_ICON_COMPONENTS[n];
                                return (
                                    <button key={n} type="button" role="radio" aria-checked={icon === n} aria-label={n} onClick={() => setIcon(n)}>
                                        <I size={18} aria-hidden="true" />
                                    </button>
                                );
                            })}
                        </IconGrid>
                    </div>
                    <div>
                        <FieldLabel id="color-l">
                            Cor
                        </FieldLabel>
                        <Swatches role="radiogroup" aria-labelledby="color-l">
                            {CATEGORY_COLORS.map((c) => (
                                <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Cor ${c}`} style={{ background: c }} onClick={() => setColor(c)} />
                            ))}
                        </Swatches>
                    </div>
                    <Field label="Palavras-chave" hint="Separadas por vírgula. Usadas na captura rápida e importação (ex.: uber, 99, gasolina).">
                        {({ id, describedBy }) => <Input id={id} value={keywords} onChange={(e) => setKeywords(e.target.value)} aria-describedby={describedBy} />}
                    </Field>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="primary">
                        Salvar
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

function DeleteCategoryDialog({ category, usage, onClose }) {
    const { store } = useFinance();
    const { deleteCategory } = useFinanceActions();
    const [target, setTarget] = useState("");
    const options = store.categories.filter((c) => c.id !== category.id);
    const doDelete = () => {
        try {
            deleteCategory(category.id, { reassignTo: target || null });
            toast.success(`Categoria excluída. ${usage?.count ?? 0} movimentação(ões) movida(s).`);
            onClose();
        } catch (e) {
            toast.error(e.message);
        }
    };
    return (
        <Modal open onClose={onClose} title={`Excluir “${category.name}”`} size="sm">
            <ModalBody style={{ display: "grid", gap: 12 }}>
                <p>
                    Esta categoria tem <strong>{usage.count}</strong> movimentação(ões). Escolha para onde movê-las antes de excluir. Recorrências também serão movidas e o orçamento da categoria será removido.
                </p>
                <Field label="Mover movimentações para">
                    {({ id }) => (
                        <Select id={id} value={target} onChange={(e) => setTarget(e.target.value)}>
                            <option value="">Sem categoria</option>
                            {options.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </Select>
                    )}
                </Field>
                <Muted>Se preferir manter o histórico, arquive a categoria em vez de excluir.</Muted>
            </ModalBody>
            <ModalFooter>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="danger" onClick={doDelete}>
                    Mover e excluir
                </Button>
            </ModalFooter>
        </Modal>
    );
}

function CategoriesSection() {
    const { store } = useFinance();
    const { setCategoryArchived, deleteCategory } = useFinanceActions();
    const confirm = useConfirm();
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const usage = categoryUsage(store);
    const list = store.categories.filter((c) => showArchived || !c.archived).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const kindLabel = { expense: "Despesas", income: "Receitas", both: "Ambas" };

    const remove = async (c) => {
        const u = usage.get(c.id);
        const refs = u || store.recurrences.some((r) => r.categoryId === c.id) || store.budgets.some((b) => b.categoryId === c.id);
        if (refs) {
            setDeleting({ category: c, usage: u ?? { count: 0 } });
            return;
        }
        if (await confirm({ title: "Excluir categoria", message: `Excluir “${c.name}”? Ela não tem movimentações.`, confirmLabel: "Excluir" })) {
            deleteCategory(c.id);
            toast.success("Categoria excluída.");
        }
    };

    return (
        <Card aria-labelledby="cat-title">
            <CardHeader
                id="cat-title"
                title="Categorias"
                subtitle="Organize receitas e despesas. Totais consideram todo o histórico."
                actions={
                    <Button variant="primary" size="sm" icon={Plus} onClick={() => setEditing({})}>
                        Nova
                    </Button>
                }
            />
            <Switch checked={showArchived} onChange={setShowArchived} label="Mostrar arquivadas" />
            <List>
                {list.map((c) => {
                    const u = usage.get(c.id);
                    return (
                        <li key={c.id}>
                            <CategoryIcon category={c} />
                            <span className="grow">
                                <span>
                                    {c.name} {c.archived && <Badge>Arquivada</Badge>}
                                </span>
                                <Muted>
                                    {kindLabel[c.kind]} · {u?.count ?? 0} lançamento(s)
                                </Muted>
                            </span>
                            {u?.expenseCents > 0 && <Amount cents={u.expenseCents} type="expense" private />}
                            {u?.incomeCents > 0 && <Amount cents={u.incomeCents} type="income" private />}
                            <Menu
                                label={`Ações para ${c.name}`}
                                items={[
                                    { label: "Editar", icon: Pencil, onClick: () => setEditing(c) },
                                    { label: c.archived ? "Reativar" : "Arquivar", icon: c.archived ? ArchiveRestore : Archive, onClick: () => setCategoryArchived(c.id, !c.archived) },
                                    { label: "Excluir", icon: Trash2, danger: true, onClick: () => remove(c) },
                                ]}
                            />
                        </li>
                    );
                })}
            </List>
            {editing && <CategoryDialog open onClose={() => setEditing(null)} category={editing.id ? editing : null} />}
            {deleting && <DeleteCategoryDialog {...deleting} onClose={() => setDeleting(null)} />}
        </Card>
    );
}

// ---------------- Contas ----------------

export function AccountDialog({ open, onClose, account }) {
    const { upsertAccount } = useFinanceActions();
    const [name, setName] = useState(account?.name ?? "");
    const [type, setType] = useState(account?.type ?? "checking");
    const [color, setColor] = useState(account?.color ?? CATEGORY_COLORS[10]);
    const [balance, setBalance] = useState(Math.abs(account?.initialBalanceCents ?? 0));
    const [negative, setNegative] = useState((account?.initialBalanceCents ?? 0) < 0);
    const [submitted, setSubmitted] = useState(false);
    const nameError = !cleanText(name) ? "Informe um nome." : undefined;

    const save = (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (nameError) return;
        const now = new Date().toISOString();
        try {
            upsertAccount({
                ...(account ?? {}),
                id: account?.id ?? newId(),
                name: cleanText(name, 60),
                type,
                color,
                initialBalanceCents: negative ? -balance : balance,
                archived: account?.archived ?? false,
                createdAt: account?.createdAt ?? now,
                updatedAt: now,
            });
            toast.success(account ? "Conta atualizada." : "Conta criada.");
            onClose();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={account ? "Editar conta" : "Nova conta"} variant="sheet">
            <form onSubmit={save}>
                <ModalBody style={{ display: "grid", gap: 16 }}>
                    <Field label="Nome" error={submitted ? nameError : undefined}>
                        {({ id, describedBy, invalid }) => <Input id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid || undefined} placeholder="Ex.: Nubank, Carteira" data-autofocus />}
                    </Field>
                    <Field label="Tipo">
                        {({ id }) => (
                            <Select id={id} value={type} onChange={(e) => setType(e.target.value)}>
                                {Object.entries(ACCOUNT_TYPES)
                                    .filter(([k]) => k !== "credit")
                                    .map(([k, v]) => (
                                        <option key={k} value={k}>
                                            {v}
                                        </option>
                                    ))}
                            </Select>
                        )}
                    </Field>
                    <Field label="Saldo inicial" hint="Saldo da conta antes do primeiro lançamento registrado aqui.">
                        {({ id, describedBy }) => <MoneyInput id={id} value={balance} onChange={setBalance} aria-describedby={describedBy} />}
                    </Field>
                    <Switch checked={negative} onChange={setNegative} label="Saldo inicial negativo" />
                    <div>
                        <FieldLabel id="acc-color">
                            Cor
                        </FieldLabel>
                        <Swatches role="radiogroup" aria-labelledby="acc-color">
                            {CATEGORY_COLORS.map((c) => (
                                <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Cor ${c}`} style={{ background: c }} onClick={() => setColor(c)} />
                            ))}
                        </Swatches>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="primary">
                        Salvar
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}

function AccountsSection() {
    const { store, today } = useFinance();
    const { setAccountArchived, deleteAccount } = useFinanceActions();
    const confirm = useConfirm();
    const [editing, setEditing] = useState(null);
    const accounts = store.accounts.filter((a) => !isCard(a));

    const run = (fn, ok) => {
        try {
            fn();
            if (ok) toast.success(ok);
        } catch (e) {
            toast.error(e.message);
        }
    };

    return (
        <Card aria-labelledby="acc-title">
            <CardHeader
                id="acc-title"
                title="Contas e carteiras"
                subtitle="Cada conta tem saldo próprio. Transferências entre contas não contam como receita ou despesa."
                actions={
                    <Button variant="primary" size="sm" icon={Plus} onClick={() => setEditing({})}>
                        Nova
                    </Button>
                }
            />
            <List>
                {accounts.map((a) => (
                    <li key={a.id}>
                        <CategoryIcon category={{ icon: "Landmark", color: a.color }} />
                        <span className="grow">
                            <span>
                                {a.name} {a.archived && <Badge>Arquivada</Badge>}
                            </span>
                            <Muted>{ACCOUNT_TYPES[a.type]}</Muted>
                        </span>
                        <Amount cents={accountBalance(store, a.id, today)} private colored={false} />
                        <Menu
                            label={`Ações para ${a.name}`}
                            items={[
                                { label: "Editar", icon: Pencil, onClick: () => setEditing(a) },
                                { label: a.archived ? "Reativar" : "Arquivar", icon: a.archived ? ArchiveRestore : Archive, onClick: () => run(() => setAccountArchived(a.id, !a.archived), a.archived ? "Conta reativada." : "Conta arquivada.") },
                                {
                                    label: "Excluir",
                                    icon: Trash2,
                                    danger: true,
                                    onClick: async () => {
                                        if (await confirm({ title: "Excluir conta", message: `Excluir “${a.name}”? Só é possível excluir contas sem movimentações.`, confirmLabel: "Excluir" })) run(() => deleteAccount(a.id), "Conta excluída.");
                                    },
                                },
                            ]}
                        />
                    </li>
                ))}
            </List>
            <Muted style={{ display: "block", marginTop: 12 }}>
                Cartões de crédito são gerenciados em <Link to="/planejamento/cartoes">Planejamento › Cartões</Link>.
            </Muted>
            {editing && <AccountDialog open onClose={() => setEditing(null)} account={editing.id ? editing : null} />}
        </Card>
    );
}

// ---------------- Dados ----------------

function RestoreDialog({ preview, onClose }) {
    const { replaceStore, updateSettings } = useFinanceActions();
    const s = preview.summary;
    const restore = () => {
        try {
            replaceStore(preview.store, { backupReason: "antes-restauracao" });
            updateSettings({ onboardingDone: true });
            toast.success("Backup restaurado. Uma cópia dos dados anteriores foi guardada no navegador.");
            onClose();
        } catch (e) {
            toast.error(e.message);
        }
    };
    return (
        <Modal open onClose={onClose} title="Restaurar backup" size="sm">
            <ModalBody style={{ display: "grid", gap: 12 }}>
                <p>O arquivo é válido e contém:</p>
                <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>{s.transactions} transações{s.firstDate ? ` (${formatDateBR(s.firstDate)} a ${formatDateBR(s.lastDate)})` : ""}</li>
                    <li>
                        {s.accounts} conta(s) e {s.cards} cartão(ões)
                    </li>
                    <li>
                        {s.categories} categorias, {s.budgets} orçamentos, {s.goals} metas, {s.recurrences} recorrências
                    </li>
                </ul>
                {preview.meta.exportedAt && <Muted>Backup gerado em {new Date(preview.meta.exportedAt).toLocaleString("pt-BR")}.</Muted>}
                {preview.meta.source === "legacy-v1" && <Badge $tone="info">Arquivo da versão anterior: será convertido para o novo formato.</Badge>}
                <p>
                    <strong>Os dados atuais serão substituídos.</strong> Antes disso, guardamos uma cópia de segurança no navegador.
                </p>
            </ModalBody>
            <ModalFooter>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="danger" onClick={restore}>
                    Substituir e restaurar
                </Button>
            </ModalFooter>
        </Modal>
    );
}

function DataSection() {
    const { store, storageBytes, today } = useFinance();
    const actions = useFinanceActions();
    const confirm = useConfirm();
    const fileRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [importOpen, setImportOpen] = useState(false);
    const [locals, setLocals] = useState(() => actions.listLocalBackups());
    const last = store.settings.lastBackupAt;
    const daysSince = last ? diffDays(today, todayISO(new Date(last))) : null;
    const all = [...store.transactions].sort((a, b) => b.date.localeCompare(a.date));
    const { hash } = useLocation();

    // Atalhos da navegação (#backup, #importar) levam direto à seção correspondente.
    useEffect(() => {
        if (!hash) return;
        const el = document.getElementById(hash.slice(1));
        if (el) {
            el.scrollIntoView({ block: "start", behavior: "smooth" });
            el.querySelector("button")?.focus({ preventScroll: true });
        }
    }, [hash]);

    const doBackup = () => {
        downloadBackup(store);
        actions.updateSettings({ lastBackupAt: new Date().toISOString() });
        toast.success("Backup baixado. Guarde o arquivo em local seguro.");
    };

    const onRestoreFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const result = parseBackupText(await file.text());
        if (!result.ok) {
            toast.error(result.errors.slice(0, 4).join(" "), { autoClose: 10000 });
            return;
        }
        setPreview(result);
    };

    const restoreLocal = async (b) => {
        const result = parseBackupText(JSON.stringify(b.payload?.transactions !== undefined && b.payload?.schemaVersion ? b.payload : b.payload?.transactions ?? b.payload));
        if (!result.ok) {
            toast.error(`Cópia ilegível: ${result.errors[0]}`);
            return;
        }
        setPreview(result);
    };

    const wipe = async () => {
        if (!(await confirm({ title: "Apagar todos os dados", message: "Todas as transações, contas, metas e configurações serão apagadas deste navegador. Uma cópia de segurança local será criada antes. Recomendamos baixar um backup primeiro.", confirmLabel: "Apagar tudo" }))) return;
        try {
            actions.replaceStore(createEmptyStore(), { backupReason: "antes-de-apagar" });
            setLocals(actions.listLocalBackups());
            toast.success("Dados apagados. Uma cópia local foi mantida.");
        } catch (e) {
            toast.error(e.message);
        }
    };

    const exp = async (fn) => {
        if (!all.length) {
            toast.info("Não há transações para exportar.");
            return;
        }
        try {
            await fn();
        } catch (e) {
            toast.error(`Falha ao exportar: ${e.message}`);
        }
    };

    return (
        <Stack $gap={4}>
            <Card id="backup" aria-labelledby="bk-title" style={{ scrollMarginTop: 88 }}>
                <CardHeader id="bk-title" title="Backup e restauração" subtitle="O backup em JSON contém tudo: transações, contas, cartões, categorias, orçamentos, metas, recorrências e preferências." />
                <Row $wrap $gap={2}>
                    <Button variant="primary" icon={Download} onClick={doBackup}>
                        Baixar backup
                    </Button>
                    <Button icon={Upload} onClick={() => fileRef.current?.click()}>
                        Restaurar de arquivo
                    </Button>
                    <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onRestoreFile} aria-label="Arquivo de backup" />
                </Row>
                <p style={{ marginTop: 12 }}>
                    {last ? (
                        <Badge $tone={daysSince > 30 ? "warning" : "income"}>
                            <ShieldCheck size={12} aria-hidden="true" /> Último backup: {new Date(last).toLocaleDateString("pt-BR")} ({daysSince === 0 ? "hoje" : `há ${daysSince} dia(s)`})
                        </Badge>
                    ) : (
                        <Badge $tone="warning">Nenhum backup baixado ainda</Badge>
                    )}
                </p>
                {locals.length > 0 && (
                    <>
                        <Divider />
                        <h3 style={{ fontSize: "var(--v-font-size-md)", marginBottom: 4 }}>Cópias de segurança automáticas</h3>
                        <Muted>Criadas antes de migrações, restaurações, importações e exclusões em massa (últimas 3).</Muted>
                        <List>
                            {locals.map((b) => (
                                <li key={b.key}>
                                    <HardDrive size={18} aria-hidden="true" />
                                    <span className="grow">
                                        <span>{b.reason}</span>
                                        <Muted>{b.createdAt ? new Date(b.createdAt).toLocaleString("pt-BR") : "data desconhecida"}</Muted>
                                    </span>
                                    <Button size="sm" onClick={() => restoreLocal(b)} disabled={!b.payload}>
                                        Restaurar
                                    </Button>
                                </li>
                            ))}
                        </List>
                    </>
                )}
            </Card>

            <Card id="importar" aria-labelledby="imp-title" style={{ scrollMarginTop: 88 }}>
                <CardHeader id="imp-title" title="Importar" subtitle="CSV, XLSX ou OFX do seu banco, com prévia, detecção de duplicados e linhas inválidas." />
                <Row $wrap $gap={2}>
                    <Button variant="primary" icon={Upload} onClick={() => setImportOpen(true)}>
                        Importar arquivo
                    </Button>
                    <Button icon={FileSpreadsheet} onClick={downloadImportTemplate}>
                        Baixar modelo
                    </Button>
                </Row>
            </Card>

            <Card aria-labelledby="exp-title">
                <CardHeader id="exp-title" title="Exportar todas as transações" subtitle="Para exportar um período ou filtro, use Movimentações › Exportar." />
                <ActionGrid>
                    <Button icon={FileSpreadsheet} onClick={() => exp(() => exportToExcel(all, store))}>
                        Excel (.xlsx)
                    </Button>
                    <Button icon={FileText} onClick={() => exp(() => exportToCsv(all, store))}>
                        CSV
                    </Button>
                    <Button icon={FileIcon} onClick={() => exp(() => exportToPDF(all, store))}>
                        PDF
                    </Button>
                    <Button icon={FileText} onClick={() => exp(() => exportToWord(all, store))}>
                        Word (.docx)
                    </Button>
                </ActionGrid>
            </Card>

            <Card aria-labelledby="st-title">
                <CardHeader id="st-title" title="Armazenamento" />
                <p>
                    Os dados ficam somente neste navegador ({storageBytes ? `${(storageBytes / 1024).toFixed(0)} KB usados de ~5 MB` : "uso desconhecido"}). Limpar os dados do navegador, usar
                    janela anônima ou outro dispositivo não mostrará estes dados — use o backup para transferi-los.
                </p>
                <Divider />
                <Button variant="danger-ghost" icon={Trash2} onClick={wipe}>
                    Apagar todos os dados
                </Button>
            </Card>

            {preview && (
                <RestoreDialog
                    preview={preview}
                    onClose={() => {
                        setPreview(null);
                        setLocals(actions.listLocalBackups());
                    }}
                />
            )}
            {importOpen && <ImportDialog open onClose={() => setImportOpen(false)} />}
        </Stack>
    );
}

// ---------------- Sobre ----------------

function AboutSection() {
    const { store } = useFinance();
    const summary = summarizeStore(store);
    const migrations = store.meta?.migrations ?? [];
    return (
        <Stack $gap={4}>
            <Card aria-labelledby="ab-title">
                <CardHeader id="ab-title" title="Sobre o VELDORA" />
                <Stack $gap={3}>
                    <p>VELDORA — Smart Financial Platform. Controle financeiro pessoal local-first: funciona sem internet e não envia seus dados a nenhum servidor.</p>
                    <p>
                        <Link to="/design-system">Ver o Design System</Link> (componentes, cores e tipografia da interface).
                    </p>
                    <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px" }}>
                        <dt>Versão</dt>
                        <dd>2.0.0</dd>
                        <dt>Formato dos dados</dt>
                        <dd>schema v{SCHEMA_VERSION}</dd>
                        <dt>Transações</dt>
                        <dd>{summary.transactions}</dd>
                        <dt>Contas / cartões</dt>
                        <dd>
                            {summary.accounts} / {summary.cards}
                        </dd>
                    </dl>
                    {migrations.length > 0 && (
                        <>
                            <h3 style={{ fontSize: "var(--v-font-size-md)" }}>Histórico de migrações</h3>
                            <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>
                                {migrations.map((m, i) => (
                                    <li key={i}>
                                        v{String(m.from)} → v{String(m.to)} em {new Date(String(m.at)).toLocaleString("pt-BR")}: {String(m.migrated)} migradas, {String(m.rejected)} preservadas à parte.
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    <h3 style={{ fontSize: "var(--v-font-size-md)" }}>Assistente inteligente</h3>
                    <p>
                        Os insights atuais são calculados por regras, no seu navegador. Uma futura integração com IA exigirá um servidor seguro e o seu consentimento explícito antes de qualquer envio de dados
                        financeiros. Hoje nenhum dado sai do dispositivo.
                    </p>
                </Stack>
            </Card>
            <Card aria-labelledby="kb-title">
                <CardHeader id="kb-title" title="Atalhos de teclado" subtitle="Funcionam fora de campos de texto" />
                <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 16px", alignItems: "center" }}>
                    <dt>
                        <Kbd>N</Kbd>
                    </dt>
                    <dd>Nova transação</dd>
                    <dt>
                        <Kbd>Q</Kbd>
                    </dt>
                    <dd>Captura rápida</dd>
                    <dt>
                        <Kbd>/</Kbd>
                    </dt>
                    <dd>Buscar movimentações</dd>
                    <dt>
                        <Kbd>←</Kbd> <Kbd>→</Kbd>
                    </dt>
                    <dd>Mês anterior / próximo</dd>
                    <dt>
                        <Kbd>Esc</Kbd>
                    </dt>
                    <dd>Fechar diálogos</dd>
                    <dt>
                        <Kbd>Enter</Kbd>
                    </dt>
                    <dd>Salvar formulário</dd>
                </dl>
            </Card>
        </Stack>
    );
}

export default function SettingsPage() {
    return (
        <>
            <PageHeader title="Configurações" description="Preferências, cadastros e seus dados" />
            <RouteTabs tabs={TABS} label="Seções de configurações" />
            <Routes>
                <Route index element={<Navigate to="aparencia" replace />} />
                <Route path="aparencia" element={<AppearanceSection />} />
                <Route path="regional" element={<RegionalSection />} />
                <Route path="categorias" element={<CategoriesSection />} />
                <Route path="contas" element={<AccountsSection />} />
                <Route path="dados" element={<DataSection />} />
                <Route path="sobre" element={<AboutSection />} />
                <Route path="*" element={<Navigate to="aparencia" replace />} />
            </Routes>
        </>
    );
}


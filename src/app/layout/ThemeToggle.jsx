import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { IconButton } from "../../components/ui";
import { useFinance, useFinanceActions } from "../../state/contexts";

const ORDER = ["dark", "light", "system"];
const META = {
    dark: { label: "Escuro", icon: Moon },
    light: { label: "Claro", icon: Sun },
    system: { label: "Sistema", icon: MonitorSmartphone },
};

/**
 * Alternância de tema do header: Escuro → Claro → Sistema. A preferência é salva em settings.theme
 * (persistida entre sessões); "Sistema" acompanha o sistema operacional.
 */
export function ThemeToggle({ size = "sm" }) {
    const { store } = useFinance();
    const { updateSettings } = useFinanceActions();
    const current = ORDER.includes(store.settings.theme) ? store.settings.theme : "system";
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    const { icon, label } = META[current];
    return <IconButton icon={icon} size={size} label={`Tema: ${label}. Alternar para ${META[next].label}`} onClick={() => updateSettings({ theme: next })} />;
}

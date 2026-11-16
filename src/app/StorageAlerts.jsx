import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useFinance, useFinanceActions } from "../state/contexts";

/**
 * Comunica eventos de armazenamento: migração concluída, correções automáticas e falhas de gravação.
 */
export function StorageAlerts() {
    const { migrationReport, persistError, repairNotes } = useFinance();
    const { dismissMigrationReport } = useFinanceActions();
    const shown = useRef({ migration: false, repair: false });

    useEffect(() => {
        if (migrationReport && !shown.current.migration) {
            shown.current.migration = true;
            const r = migrationReport;
            const extra = r.rejected ? ` ${r.rejected} registro(s) sem valor válido foram preservados à parte.` : "";
            toast.info(
                `Seus dados foram atualizados para o novo formato: ${r.migrated} transações migradas com a data de ${r.assignedDate.split("-").reverse().join("/")}. Uma cópia de segurança foi guardada.${extra}`,
                { autoClose: 10000, onClose: dismissMigrationReport }
            );
        }
    }, [migrationReport, dismissMigrationReport]);

    useEffect(() => {
        if (repairNotes.length && !shown.current.repair) {
            shown.current.repair = true;
            toast.warning(`Corrigimos ${repairNotes.length} inconsistência(s) nos dados salvos.`, { autoClose: 8000 });
        }
    }, [repairNotes]);

    useEffect(() => {
        if (!persistError) return;
        const msg =
            persistError.code === "quota"
                ? "Sem espaço no navegador: a última alteração não foi salva. Faça um backup e libere espaço."
                : `Não foi possível salvar: ${persistError.message}`;
        toast.error(msg, { toastId: "persist-error", autoClose: false });
    }, [persistError]);

    return null;
}

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal, ModalBody, ModalFooter } from "./Modal";
import { Button } from "./Button";

const ConfirmContext = createContext(null);

/**
 * Provider de confirmações. Uso: const confirm = useConfirm(); if (await confirm({...})) { ... }
 */
export function ConfirmProvider({ children }) {
    const [state, setState] = useState(null);
    const resolver = useRef(null);
    const confirmBtn = useRef(null);

    const confirm = useCallback((opts) => {
        return new Promise((resolve) => {
            resolver.current = resolve;
            setState({ confirmLabel: "Confirmar", cancelLabel: "Cancelar", tone: "danger", ...opts });
        });
    }, []);

    const close = (value) => {
        resolver.current?.(value);
        resolver.current = null;
        setState(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal open={Boolean(state)} onClose={() => close(false)} title={state?.title ?? ""} size="sm" initialFocusRef={state?.tone === "danger" ? undefined : confirmBtn}>
                {state && (
                    <>
                        <ModalBody>
                            {typeof state.message === "string" ? <p style={{ lineHeight: 1.5 }}>{state.message}</p> : state.message}
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={() => close(false)}>{state.cancelLabel}</Button>
                            <Button ref={confirmBtn} variant={state.tone === "danger" ? "danger" : "primary"} onClick={() => close(true)}>
                                {state.confirmLabel}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error("useConfirm deve ser usado dentro de ConfirmProvider");
    return ctx;
}

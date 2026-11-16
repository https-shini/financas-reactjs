import { useEffect, useRef } from "react";

const isTyping = (el) => {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
};

/**
 * Atalhos de teclado globais. Ignorados enquanto o usuário digita ou quando há um diálogo aberto.
 * map: { "n": fn, "/": fn, "ArrowLeft": fn }
 */
export function useHotkeys(map, enabled = true) {
    const ref = useRef(map);
    ref.current = map;
    useEffect(() => {
        if (!enabled) return undefined;
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (isTyping(document.activeElement)) return;
            if (document.querySelector("[role='dialog'][aria-modal='true']")) return;
            const fn = ref.current[e.key] ?? ref.current[e.key.toLowerCase()];
            if (fn) {
                e.preventDefault();
                fn(e);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [enabled]);
}

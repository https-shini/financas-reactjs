import { useEffect, useState } from "react";

export function useMediaQuery(query) {
    const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
    const [matches, setMatches] = useState(get);
    useEffect(() => {
        const mq = window.matchMedia?.(query);
        if (!mq) return undefined;
        const on = (e) => setMatches(e.matches);
        setMatches(mq.matches);
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, [query]);
    return matches;
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
export const useIsMobile = () => useMediaQuery("(max-width: 639.98px)");

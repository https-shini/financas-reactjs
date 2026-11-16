import { describe, expect, it } from "vitest";
import {
    addMonthsISO,
    addMonthsToKey,
    dateInMonth,
    formatMonthLabel,
    isValidISODate,
    lastMonths,
    monthEnd,
    parseFlexibleDate,
    todayISO,
} from "./dates";

describe("datas locais", () => {
    it("todayISO usa a data local, não UTC", () => {
        // 23:30 do dia 16 em horário local continua sendo dia 16.
        const lateNight = new Date(2026, 10, 16, 23, 30);
        expect(todayISO(lateNight)).toBe("2026-11-16");
    });

    it("valida datas", () => {
        expect(isValidISODate("2026-02-29")).toBe(false);
        expect(isValidISODate("2028-02-29")).toBe(true);
        expect(isValidISODate("2026-13-01")).toBe(false);
        expect(isValidISODate("16/11/2026")).toBe(false);
    });

    it("fim do mês e dia limitado", () => {
        expect(monthEnd("2026-02")).toBe("2026-02-28");
        expect(dateInMonth("2026-02", 31)).toBe("2026-02-28");
        expect(dateInMonth("2026-04", 31)).toBe("2026-04-30");
    });

    it("soma de meses limita o dia", () => {
        expect(addMonthsISO("2026-01-31", 1)).toBe("2026-02-28");
        expect(addMonthsToKey("2026-12", 1)).toBe("2027-01");
        expect(lastMonths("2026-02", 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
    });

    it("interpreta formatos de data comuns", () => {
        expect(parseFlexibleDate("16/11/2026")).toBe("2026-11-16");
        expect(parseFlexibleDate("2026-11-16")).toBe("2026-11-16");
        expect(parseFlexibleDate("20261116120000[-3:BRT]")).toBe("2026-11-16");
        expect(parseFlexibleDate("1/2/26")).toBe("2026-02-01");
        expect(parseFlexibleDate(46342)).toBe("2026-11-16");
        expect(parseFlexibleDate("31/02/2026")).toBeNull();
        expect(parseFlexibleDate("ontem")).toBeNull();
    });

    it("rótulo de mês em português", () => {
        expect(formatMonthLabel("2026-11")).toBe("Novembro de 2026");
    });
});

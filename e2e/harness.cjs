/*
 * Harness mínimo da bateria E2E (navegador real via Playwright, sem dependência no package.json).
 * Cada teste recebe uma página nova com o armazenamento limpo; as verificações leem o estado
 * persistido (localStorage "financas:store") e o que está na tela.
 */
const { chromium, devices } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:5173";
const STORE_KEY = "financas:store";
const results = [];
const only = process.env.ONLY ? new RegExp(process.env.ONLY, "i") : null;

class AssertionError extends Error {}
function assert(cond, msg) {
    if (!cond) throw new AssertionError(msg);
}
function eq(actual, expected, msg) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) throw new AssertionError(`${msg}: esperado ${e}, obtido ${a}`);
}

/** Converte "R$ 1.234,56" / "-R$ 10,00" / "+R$ 5,00" em centavos. */
function parseBRL(text) {
    const t = String(text).replace(/\s/g, "");
    const neg = /^[-−]/.test(t);
    const digits = t.replace(/[^\d,]/g, "").replace(",", ".");
    const v = Math.round(parseFloat(digits) * 100);
    return neg ? -v : v;
}

const tests = [];
function test(suite, name, fn, opts = {}) {
    tests.push({ suite, name, fn, opts });
}

async function newPage(browser, opts = {}) {
    const ctxOpts = opts.mobile ? { ...devices["iPhone 13"], colorScheme: opts.scheme || "light" } : { viewport: opts.viewport || { width: 1440, height: 900 }, colorScheme: opts.scheme || "light", acceptDownloads: true };
    // reducedMotion: sem animações de abertura de diálogos, para que cliques imediatos não caiam em elementos em movimento.
    const ctx = await browser.newContext({ ...ctxOpts, acceptDownloads: true, reducedMotion: process.env.MOTION ? "no-preference" : "reduce" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
        if (m.type() === "error") errors.push(`console.error: ${m.text().slice(0, 300)}`);
    });
    page.on("dialog", (d) => d.accept());
    await page.goto(BASE + "/");
    await page.evaluate(() => localStorage.clear());
    if (opts.store) await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [STORE_KEY, opts.store]);
    const h = {
        page,
        ctx,
        errors,
        async go(path) {
            await page.goto(BASE + path);
            await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 10000 });
        },
        async store() {
            return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), STORE_KEY);
        },
        async waitStore(pred, msg, timeout = 4000) {
            const t0 = Date.now();
            let s;
            while (Date.now() - t0 < timeout) {
                s = await h.store();
                try {
                    if (s && pred(s)) return s;
                } catch {
                    /* tenta de novo */
                }
                await page.waitForTimeout(100);
            }
            throw new AssertionError(`estado persistido não atingiu a condição: ${msg}`);
        },
        dialog(name) {
            return page.getByRole("dialog", { name });
        },
        async toast(re) {
            await page.locator(".Toastify").getByText(re).first().waitFor({ timeout: 5000 });
        },
    };
    return h;
}

async function run() {
    const browser = await chromium.launch();
    const started = Date.now();
    for (const t of tests) {
        if (only && !only.test(`${t.suite} ${t.name}`)) continue;
        const h = await newPage(browser, t.opts);
        const t0 = Date.now();
        let status = "pass";
        let error = null;
        try {
            await t.fn(h);
            const errs = h.errors.filter((e) => !/Download the React DevTools|favicon/.test(e));
            if (errs.length) throw new AssertionError(`erros no console: ${errs.join(" | ")}`);
        } catch (e) {
            status = "fail";
            error = e.message.split("\n").slice(0, 4).join(" ");
            await h.page.screenshot({ path: `${__dirname}/out/fail-${results.length}.png` }).catch(() => {});
        }
        results.push({ suite: t.suite, name: t.name, status, ms: Date.now() - t0, error });
        console.log(`${status === "pass" ? "✓" : "✗"} [${t.suite}] ${t.name}${error ? `\n    → ${error}` : ""}`);
        await h.ctx.close();
    }
    await browser.close();
    const pass = results.filter((r) => r.status === "pass").length;
    const fail = results.length - pass;
    console.log(`\n${results.length} testes · ${pass} aprovados · ${fail} reprovados · ${((Date.now() - started) / 1000).toFixed(0)} s`);
    require("fs").writeFileSync(`${__dirname}/out/results.json`, JSON.stringify(results, null, 2));
    process.exit(fail ? 1 : 0);
}

module.exports = { test, run, assert, eq, parseBRL, BASE, STORE_KEY };

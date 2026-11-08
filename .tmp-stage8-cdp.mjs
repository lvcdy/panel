import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CDP_HTTP = "http://127.0.0.1:9235";
const SERVER = "http://127.0.0.1:4330";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const exceptions = [];
const consoleErrors = [];
const logErrors = [];

const getTargets = async () => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
        try {
            const response = await fetch(`${CDP_HTTP}/json/list`);
            if (response.ok) return await response.json();
        } catch {
            // Chrome still starting.
        }
        await wait(200);
    }
    throw new Error("CDP unavailable");
};

const targets = await getTargets();
const pageTarget = targets.find((target) => target.type === "page");
if (!pageTarget?.webSocketDebuggerUrl) throw new Error("No page target");

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();

ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
        const entry = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) entry.reject(new Error(`${message.error.message} (${message.error.code})`));
        else entry.resolve(message.result);
        return;
    }
    if (message.method === "Runtime.exceptionThrown") {
        exceptions.push(
            message.params.exceptionDetails.exception?.description ??
                message.params.exceptionDetails.text,
        );
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
        consoleErrors.push(
            message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" "),
        );
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
        logErrors.push(message.params.entry.text);
    }
});

const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
    });

const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
    });
    if (result.exceptionDetails) {
        throw new Error(
            result.exceptionDetails.exception?.description ??
                result.exceptionDetails.text,
        );
    }
    return result.result.value;
};

const waitFor = async (expression, timeout = 12000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
        try {
            if (await evaluate(expression)) return;
        } catch {
            // Context may detach.
        }
        await wait(120);
    }
    throw new Error(`Timed out waiting for: ${expression}`);
};

const screenshot = async (file) => {
    const result = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(file, Buffer.from(result.data, "base64"));
};

const setMode = async (mode) => {
    const response = await fetch(`${SERVER}/__mode?value=${mode}`);
    assert.equal(response.ok, true);
};

const resetStats = async () => {
    const response = await fetch(`${SERVER}/__reset`);
    assert.equal(response.ok, true);
};

const getStats = async () => {
    const response = await fetch(`${SERVER}/__stats`);
    return await response.json();
};

const navigate = async (url) => {
    await send("Page.navigate", { url });
    await waitFor("document.readyState === 'complete'");
    await waitFor("document.querySelectorAll('.sun-card').length > 0");
};

const reload = async () => {
    await send("Page.reload", { ignoreCache: true });
    await waitFor("document.readyState === 'complete'");
};

const scrollToFooter = async () => {
    await evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await wait(300);
};

const resetPageStatusCache = async () => {
    await evaluate("sessionStorage.clear()");
};

const build = (env) => {
    execSync("pnpm build", {
        cwd: process.cwd(),
        env,
        stdio: "pipe",
        timeout: 120000,
    });
};

const rootEnv = { ...process.env };
delete rootEnv.PANEL_BASE;
delete rootEnv.PANEL_API_BASE;
delete rootEnv.PUBLIC_PANEL_API_BASE;

const panelEnv = { ...rootEnv, PANEL_BASE: "/panel/" };

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");

// ── Good API: footer network info + online statuses ──
await setMode("good");
await resetStats();
await navigate(`${SERVER}/`);
await scrollToFooter();
await waitFor("document.getElementById('network-info')?.dataset.state === 'success'");
assert.equal(await evaluate("document.getElementById('network-ip').textContent"), "1.1.1.1");
assert.equal(await evaluate("document.getElementById('network-asn').textContent"), "AS13335");
assert.equal(
    await evaluate("document.getElementById('network-organization').textContent"),
    "Cloudflare, Inc.",
);
assert.equal(await evaluate("document.getElementById('network-edge').textContent"), "HKG");
assert.equal(await evaluate("document.getElementById('network-platform').textContent"), "Cloudflare");
assert.match(
    await evaluate("document.getElementById('network-location').textContent"),
    /中国香港/,
);
await waitFor("Boolean(document.querySelector('.site-status-badge[data-state=\"up\"]'))");
assert.equal(
    await evaluate("document.querySelector('.site-status-badge[data-state=\"up\"] [data-site-status-label]')?.textContent"),
    "在线",
);
let stats = await getStats();
assert.ok(stats.networkInfoRequests >= 1);
assert.ok(stats.siteStatusRequests >= 1);
const networkBeforeRefresh = stats.networkInfoRequests;
await evaluate("document.getElementById('network-info-refresh').click()");
await wait(700);
stats = await getStats();
assert.equal(stats.networkInfoRequests, networkBeforeRefresh + 1);
await screenshot("D:/git/panel/.tmp-stage8-footer.png");

// ── Missing API: fast fallback, no long "checking" state ──
for (const mode of ["missing", "error", "invalid", "slow"]) {
    await setMode(mode);
    await resetStats();
    await resetPageStatusCache();
    const started = Date.now();
    await reload();
    await waitFor("document.querySelectorAll('.sun-card').length > 0");
    await scrollToFooter();
    await waitFor(
        "document.getElementById('network-info')?.dataset.state === 'unavailable'",
        mode === "slow" ? 8000 : 5000,
    );
    await waitFor(
        "Boolean(document.querySelector('.site-status-badge[data-state=\"unknown\"]'))",
        mode === "slow" ? 8000 : 5000,
    );
    const elapsed = Date.now() - started;
    assert.ok(elapsed < (mode === "slow" ? 8000 : 5000), `${mode} fallback took ${elapsed}ms`);

    stats = await getStats();
    assert.ok(
        stats.siteStatusRequests <= 4,
        `${mode} made ${stats.siteStatusRequests} status requests`,
    );
    assert.ok(
        stats.networkInfoRequests <= 1,
        `${mode} made ${stats.networkInfoRequests} network-info requests`,
    );

    // Core page remains usable.
    assert.equal(
        await evaluate("Boolean(document.getElementById('searchInput'))"),
        true,
    );
    await evaluate("document.getElementById('settings-toggle').click()");
    await wait(250);
    assert.equal(
        await evaluate("document.getElementById('settings-panel').classList.contains('active')"),
        true,
    );
    await evaluate("document.getElementById('settings-toggle').click()");
    await wait(200);

    if (mode === "missing") {
        await screenshot("D:/git/panel/.tmp-stage8-missing.png");
    }
}

// ── Subpath deployment ──
build(panelEnv);

const subpathHtml = fs.readFileSync(path.resolve("dist/index.html"), "utf8");
assert.match(subpathHtml, /href="\/panel\/favicon\.svg"/);
assert.match(subpathHtml, /\/panel\/_astro\//);
const subpathHeaders = fs.readFileSync(path.resolve("dist/_headers"), "utf8");
assert.match(subpathHeaders, /\/panel\/_astro\/\*/);
const subpathRoutes = JSON.parse(fs.readFileSync(path.resolve("dist/_routes.json"), "utf8"));
assert.deepEqual(subpathRoutes.include, ["/api/site-status", "/api/network-info"]);

await setMode("good");
await resetStats();
await navigate(`${SERVER}/panel/`);
await waitFor("document.querySelectorAll('.sun-card').length > 0");
assert.equal(await evaluate("document.title"), "Panel");
assert.match(
    await evaluate("document.querySelector('link[rel=\"icon\"]')?.getAttribute('href') ?? ''"),
    /^\/panel\/favicon\.svg$/,
);
assert.match(
    await evaluate("[...document.querySelectorAll('link[rel=\"stylesheet\"]')].map((el) => el.getAttribute('href')).join(' ')"),
    /\/panel\/_astro\//,
);
await scrollToFooter();
await waitFor("document.getElementById('network-info')?.dataset.state === 'success'");
await waitFor("Boolean(document.querySelector('.site-status-badge[data-state=\"up\"]'))");
stats = await getStats();
assert.ok(stats.networkInfoRequests >= 1);
assert.ok(stats.siteStatusRequests >= 1);
await screenshot("D:/git/panel/.tmp-stage8-subpath.png");

await send("Page.navigate", { url: `${SERVER}/panel/404.html` });
await waitFor("document.readyState === 'complete'");
assert.match(await evaluate("document.body.textContent"), /404/);
assert.equal(
    await evaluate("document.querySelector('main a')?.getAttribute('href')"),
    "/panel/",
);

// Restore the default root build for delivery.
build(rootEnv);
const rootHtml = fs.readFileSync(path.resolve("dist/index.html"), "utf8");
assert.match(rootHtml, /href="\/favicon\.svg"/);
const rootHeaders = fs.readFileSync(path.resolve("dist/_headers"), "utf8");
assert.match(rootHeaders, /^\/_astro\/\*/m);

const filteredLogErrors = logErrors.filter(
    (line) =>
        !line.includes("/api/site-status") &&
        !line.includes("/api/network-info") &&
        !line.includes("404") &&
        !line.includes("500") &&
        !line.includes("Failed to load resource") &&
        !line.includes("net::ERR"),
);

const result = {
    goodApi: {
        footer: "ok",
        statusBadges: "ok",
        refresh: "ok",
    },
    degradedModes: ["missing", "error", "invalid", "slow"],
    degradation: "ok",
    subpath: "ok",
    rootBuild: "ok",
    deploymentFiles: "ok",
    exceptions,
    consoleErrors,
    logErrors: filteredLogErrors,
};

console.log(JSON.stringify(result, null, 2));

assert.equal(exceptions.length, 0, exceptions.join("\n"));
assert.equal(consoleErrors.length, 0, consoleErrors.join("\n"));
assert.equal(filteredLogErrors.length, 0, filteredLogErrors.join("\n"));

await send("Browser.close");
ws.close();

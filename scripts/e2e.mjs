import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(new URL("..", import.meta.url).pathname);
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${host}:${port}`);
    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = join(root, decodeURIComponent(requested));
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": mime[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

await new Promise((resolveListen) => server.listen(port, host, resolveListen));

const browser = await chromium.launch({
  headless: process.env.HEADED !== "1"
});

const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto(`http://${host}:${port}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__clockAppTest));
  await page.evaluate(() => window.__clockAppTest.clear());

  await page.getByTestId("tab-settings").click();
  assert.equal(await page.locator("[data-theme-pick]").count(), 6, "Expected six uploaded theme cards");
  await page.getByTestId("theme-card-interstellar").click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "interstellar");
  await page.getByTestId("brand-home").click();
  await page.waitForFunction(() => document.querySelector("#clock").classList.contains("active"));
  const firstQuote = await page.locator("#greetingName").textContent();
  await page.locator("#greetingName").click();
  await page.waitForFunction((previous) => document.querySelector("#greetingName")?.textContent !== previous, firstQuote);
  const secondQuote = await page.locator("#greetingName").textContent();
  assert.notEqual(firstQuote, secondQuote, "Theme quote did not cycle on click");

  await page.getByTestId("tab-alarms").click();
  await page.getByTestId("unlock-audio").click();
  await page.waitForFunction(() => document.querySelector("[data-testid='audio-status']").textContent.includes("Ready"));

  await page.getByTestId("quick-test-alarm").click();
  await page.waitForFunction(
    () => window.__clockAppTest.soundEvents.some((event) => event.type === "alarm" && event.audioContextState === "running"),
    null,
    { timeout: 8_000 }
  );
  await page.waitForSelector("[data-testid='ring-dialog'][open]", { timeout: 2_000 });
  await page.getByTestId("stop-ring").click();

  await page.getByTestId("tab-timer").click();
  await page.getByTestId("brand-home").click();
  await page.waitForFunction(() => document.querySelector("#clock").classList.contains("active"));
  await page.getByTestId("tab-timer").click();
  await page.getByTestId("start-3s-timer").click();
  await page.waitForFunction(
    () => window.__clockAppTest.soundEvents.some((event) => event.type === "timer" && event.audioContextState === "running"),
    null,
    { timeout: 7_000 }
  );
  await page.waitForSelector("[data-testid='ring-dialog'][open]", { timeout: 2_000 });

  await mkdir(join(root, "test-results"), { recursive: true });
  await page.screenshot({ path: join(root, "test-results", "basic-clock-e2e.png"), fullPage: true });

  const result = await page.evaluate(() => ({
    audioStatus: document.querySelector("[data-testid='audio-status']").textContent,
    sounds: window.__clockAppTest.soundEvents,
    nextAlarm: document.querySelector("[data-testid='next-alarm']").textContent,
    timerText: document.querySelector("[data-testid='timer-display']").textContent
  }));

  assert.equal(pageErrors.length, 0, `Unexpected page errors: ${pageErrors.join("; ")}`);
  assert.ok(result.sounds.some((event) => event.type === "alarm"), "Alarm sound did not fire");
  assert.ok(result.sounds.some((event) => event.type === "timer"), "Timer sound did not fire");

  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

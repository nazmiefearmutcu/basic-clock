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

const revealTopbar = async () => {
  await page.mouse.move(720, 5);
  await page.waitForFunction(() => document.querySelector(".topbar").getBoundingClientRect().height > 60);
};

try {
  await page.goto(`http://${host}:${port}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(window.__clockAppTest));
  await page.evaluate(() => window.__clockAppTest.clear());

  const defaultClock = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    clockColors: document.documentElement.dataset.clockColors,
    footDisplay: getComputedStyle(document.querySelector(".clock-foot")).display,
    topbar: document.documentElement.dataset.topbar,
    blink: document.documentElement.dataset.blink,
    volume: document.querySelector("#volumeRange").value
  }));
  assert.equal(defaultClock.theme, "matrix", "Default theme should be Matrix");
  assert.equal(defaultClock.clockColors, "theme", "Default clock colors should follow the selected theme");
  assert.equal(defaultClock.footDisplay, "none", "Matrix should hide the lower info bar");
  assert.equal(defaultClock.topbar, "auto-hide", "Default top tabs should auto-hide");
  assert.equal(defaultClock.blink, "off", "Default colon blink should be off");
  assert.equal(defaultClock.volume, "1", "Default volume should match the installed app configuration");

  await page.mouse.move(720, 420);
  await page.waitForFunction(() => document.querySelector(".topbar").getBoundingClientRect().height <= 14);
  await revealTopbar();

  await page.getByTestId("tab-settings").click();
  assert.equal(await page.locator("[data-theme-pick]").count(), 6, "Expected six uploaded theme cards");
  await page.getByTestId("topbar-autohide-toggle").uncheck();
  await page.waitForFunction(() => document.documentElement.dataset.topbar === "fixed");

  const setColor = async (testId, color) => {
    await page.getByTestId(testId).evaluate((input, nextColor) => {
      input.value = nextColor;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, color.toLowerCase());
  };
  await page.getByTestId("clock-custom-colors-toggle").check();
  await setColor("clock-color-1", "#ff0033");
  await setColor("clock-color-2", "#33ff66");
  await setColor("clock-color-3", "#3366ff");
  await page.waitForFunction(() => document.documentElement.dataset.clockColors === "custom");
  await page.getByTestId("brand-home").click();
  await page.waitForFunction(() => document.querySelector("#clock").classList.contains("active"));
  const customClock = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const clockStyle = getComputedStyle(document.querySelector("#digitalClock"));
    const sepStyle = getComputedStyle(document.querySelector("#digitalClock .ck-sep"));
    return {
      colors: ["--clock-custom-1", "--clock-custom-2", "--clock-custom-3"].map((name) => rootStyle.getPropertyValue(name).trim()),
      background: clockStyle.backgroundImage,
      separatorColor: sepStyle.getPropertyValue("-webkit-text-fill-color") || sepStyle.color,
      overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
    };
  });
  assert.deepEqual(customClock.colors, ["#ff0033", "#33ff66", "#3366ff"], "Custom clock colors were not applied to CSS variables");
  assert.match(customClock.background, /rgb\(255,\s*0,\s*51\)/, "Clock gradient did not include the top custom color");
  assert.match(customClock.background, /rgb\(51,\s*255,\s*102\)/, "Clock gradient did not include the middle custom color");
  assert.match(customClock.background, /rgb\(51,\s*102,\s*255\)/, "Clock gradient did not include the bottom custom color");
  assert.match(customClock.separatorColor, /rgb\(51,\s*255,\s*102\)/, "Clock separators did not use the middle custom color");
  assert.equal(customClock.overflow, 0, "Custom clock colors should not create horizontal overflow");
  await page.getByTestId("tab-settings").click();
  await page.getByTestId("theme-card-rainbow").click();
  await page.waitForFunction(() => document.documentElement.dataset.clockColors === "theme");
  await page.waitForFunction(() => document.documentElement.dataset.theme === "rainbow");
  await page.getByTestId("brand-home").click();
  const themedClock = await page.evaluate(() => {
    const foot = document.querySelector(".clock-foot");
    const footCell = document.querySelector(".clock-foot-cell");
    const footStyle = getComputedStyle(foot);
    const footCellStyle = getComputedStyle(footCell);
    const clockStyle = getComputedStyle(document.querySelector("#digitalClock"));
    return {
      customToggleChecked: document.querySelector("[data-testid='clock-custom-colors-toggle']").checked,
      background: clockStyle.backgroundImage,
      footDisplay: footStyle.display,
      footBorder: footStyle.borderTopStyle,
      footBorderWidth: footStyle.borderTopWidth,
      footBackground: footStyle.backgroundColor,
      footCellBackground: footCellStyle.backgroundColor
    };
  });
  assert.equal(themedClock.customToggleChecked, false, "Selecting a preset theme should disable custom clock colors");
  assert.match(themedClock.background, /rgb\(255,\s*59,\s*59\)/, "Preset theme should restore its own clock colors");
  assert.doesNotMatch(themedClock.background, /rgb\(255,\s*0,\s*51\)/, "Custom clock color should not remain after selecting a preset theme");
  assert.equal(themedClock.footDisplay, "grid", "Non-Matrix themes should still show the lower info text");
  assert.equal(themedClock.footBorder, "none", "Lower info bar frame should be invisible");
  assert.equal(themedClock.footBorderWidth, "0px", "Lower info bar border should be removed");
  assert.equal(themedClock.footBackground, "rgba(0, 0, 0, 0)", "Lower info bar background should be transparent");
  assert.equal(themedClock.footCellBackground, "rgba(0, 0, 0, 0)", "Lower info cells should be transparent");

  for (const theme of ["matrix", "bladerunner", "alien", "pinkie", "rainbow", "interstellar"]) {
    await page.getByTestId("tab-settings").click();
    await page.locator(`[data-theme-pick="${theme}"]`).click();
    await page.locator('[data-seg="layout"] [data-seg-val="minimal"]').click();
    await page.waitForFunction((nextTheme) => document.documentElement.dataset.theme === nextTheme, theme);
    await page.waitForFunction(() => document.documentElement.dataset.layout === "minimal");
    await page.getByTestId("brand-home").click();
    await page.waitForFunction(() => document.querySelector("#clock").classList.contains("active"));
    await page.waitForFunction(() => document.fonts?.ready);
    const themeOverflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    assert.equal(themeOverflow, 0, `${theme} minimal clock should fit without horizontal overflow`);
  }
  await page.getByTestId("tab-settings").click();
  await page.getByTestId("theme-card-interstellar").click();
  await page.locator('[data-seg="layout"] [data-seg-val="split"]').click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "interstellar");
  await page.waitForFunction(() => document.documentElement.dataset.layout === "split");
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
  await page.screenshot({ path: join(root, "test-results", "such-a-good-clock-e2e.png"), fullPage: true });

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

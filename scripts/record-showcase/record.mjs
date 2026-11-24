// Records the start page showcase videos, in light and in dark mode.
//
//   node scripts/record-showcase/record.mjs     # log in by hand in the window it opens, then wait
//   node scripts/record-showcase/encode.mjs     # trims, joins and writes static/videos and posters
//
// Every new session starts in the dark IDE theme, so each scene is recorded in two parts:
// part 1 ends when the browser leaves the landing page for the IDE, an unrecorded page then
// switches the IDE theme (and warms the Run task), and part 2 reloads the IDE.
// The landing page follows the emulated prefers-color-scheme.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { CLONE_REPO, LANDING, OUT, VIEWPORT } from "./config.mjs";

const browser = await chromium.launch({ channel: "chrome", headless: false });

// The login is the person's: this only waits until the landing page shows its tiles.
// The cookies are kept in STATE (outside the repository, readable only by you) so a rerun needs no new login
// while the identity provider's session lasts.
const STATE = path.join(OUT, "login-state.json");
let storageState = fs.existsSync(STATE) ? STATE : undefined;
const login = await browser.newContext({ viewport: VIEWPORT, storageState });
const loginPage = await login.newPage();
await loginPage.goto(LANDING);
console.log(
  `Log in at ${LANDING} in the opened window if it asks. Waiting up to 10 minutes...`,
);
await loginPage
  .getByRole("button", { name: /^Start / })
  .first()
  .waitFor({ timeout: 600_000 });
fs.mkdirSync(OUT, { recursive: true });
await login.storageState({ path: STATE });
fs.chmodSync(STATE, 0o600);
storageState = STATE;
await login.close();

for (const mode of ["dark", "light"]) {
  const dir = path.join(OUT, mode);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  const ctx = await browser.newContext({
    storageState,
    viewport: VIEWPORT,
    colorScheme: mode,
    recordVideo: { dir: path.join(dir, "raw"), size: VIEWPORT },
  });
  const pause = (page, ms) => page.waitForTimeout(ms);

  // A recorded page; its video is saved as <name>.webm when the page closes.
  // mark() notes seconds since the page opened, which is where its video starts; encode.mjs cuts at them.
  const marks = {};
  async function recorded(name, fn) {
    const page = await ctx.newPage();
    const t0 = Date.now();
    marks[name] = {};
    const mark = (m) => (marks[name][m] = (Date.now() - t0) / 1000);
    try {
      await fn(page, mark);
    } catch (e) {
      await page.screenshot({ path: path.join(OUT, "error.png") });
      throw e;
    } finally {
      mark("end");
      await page.close();
      await page.video().saveAs(path.join(dir, `${name}.webm`));
    }
  }

  // Pages whose video is thrown away.
  async function scratch(fn) {
    const page = await ctx.newPage();
    try {
      await fn(page);
    } catch (e) {
      await page.screenshot({ path: path.join(OUT, "error.png") });
      throw e;
    } finally {
      await page.close();
    }
  }

  async function ideReady(page) {
    await page.getByText("pom.xml").first().waitFor({ timeout: 300_000 });
    // Theia restores the Explorer's expanded folders right after the first paint.
    await pause(page, 2000);
    // Scorpio prepares the workspace on every load and may open the template's file; let it finish first.
    const preparing = page.locator(".theia-notification-list-item", {
      hasText: "Preparing your workspace",
    });
    const shown = await preparing.first().waitFor({ timeout: 8000 }).then(() => true, () => false);
    if (shown) {
      await preparing.first().waitFor({ state: "detached", timeout: 60_000 }).catch(() => {});
      await pause(page, 1000);
    }
  }

  async function deleteAllEnvironments(page) {
    await page.goto(LANDING);
    await page
      .getByRole("button", { name: /^Start / })
      .first()
      .waitFor();
    for (;;) {
      const del = page
        .getByRole("button", { name: "Delete", exact: true })
        .first();
      if (!(await del.isVisible().catch(() => false))) {
        return;
      }
      await del.click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Delete" })
        .click();
      await page.getByRole("dialog").waitFor({ state: "detached" });
      await pause(page, 1500);
    }
  }

  async function paletteCommand(page, command, choice) {
    await page.keyboard.press("F1");
    await page.keyboard.type(command, { delay: 40 });
    await page
      .locator(".quick-input-list .monaco-list-row", { hasText: command })
      .first()
      .waitFor();
    await page.keyboard.press("Enter");
    if (choice) {
      await page.keyboard.type(choice, { delay: 40 });
      await page
        .locator(".quick-input-list .monaco-list-row", { hasText: choice })
        .first()
        .waitFor();
      await page.keyboard.press("Enter");
    }
  }

  // Through the Explorer: Go to File finds nothing until the search index is built.
  async function openAppJava(page) {
    const file = page.locator(".theia-TreeNode", { hasText: /^App\.java$/ }).first();
    // The Explorer shows main/java/com/example either compressed into one row or as four rows.
    for (const folder of ["src", "main", "java", "com", "example"]) {
      if (await file.isVisible().catch(() => false)) break;
      const row = page
        .locator(".theia-TreeNode", { hasText: new RegExp(`^${folder}(/|$)`) })
        .first();
      if (!(await row.isVisible().catch(() => false))) continue;
      if ((await row.locator(".theia-mod-collapsed").count()) > 0) {
        await row.click();
        await pause(page, 600);
      }
    }
    await file.click();
    await page
      .locator('button[title="Run Task: Run"]')
      .waitFor({ timeout: 60_000 });
  }


  // Theme, and one Run so the recorded Run does not download Maven plugins.
  async function prepareIde(url, { warmRun }) {
    await scratch(async (page) => {
      await page.goto(url);
      await ideReady(page);
      await pause(page, 2000);
      await page.locator("body").click({ position: { x: 700, y: 500 } });
      await paletteCommand(
        page,
        "Preferences: Color Theme",
        mode === "light" ? "EduIDE Light" : "EduIDE Dark",
      );
      if (warmRun) {
        await openAppJava(page);
        await page.locator('button[title="Run Task: Run"]').click();
        await page
          .locator(".quick-input-list .monaco-list-row")
          .first()
          .waitFor({ timeout: 5000 })
          .then(
            () => page.keyboard.press("Enter"),
            () => {},
          );
        await pause(page, 45_000);
      }
      await pause(page, 1500);
    });
  }

  const env = await ctx.newPage();
  await deleteAllEnvironments(env);
  await env.close();

  // Hero: start page -> Java 17 with Maven -> the IDE with the template.
  let ideUrl;
  await recorded("hero-1", async (page, mark) => {
    await page.goto(LANDING);
    await page.getByRole("button", { name: "Start Java 17" }).waitFor();
    mark("loaded");
    await pause(page, 2000);
    await page.getByRole("button", { name: "Start Java 17" }).click();
    await pause(page, 1200);
    await page.getByRole("radio", { name: /Maven/ }).click();
    await pause(page, 1000);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Start", exact: true })
      .click();
    mark("started");
    await page.waitForURL(/\/\/instance\./, { timeout: 300_000 });
    mark("ide");
    await pause(page, 2000);
    ideUrl = page.url();
  });
  await prepareIde(ideUrl, { warmRun: true });
  await recorded("hero-2", async (page, mark) => {
    await page.goto(ideUrl);
    await ideReady(page);
    mark("ready");
    await pause(page, 1500);
    await openAppJava(page);
    await pause(page, 3000);
  });

  // Run: one click on Run, the program output in the terminal.
  await recorded("run-button", async (page, mark) => {
    await page.goto(ideUrl);
    await ideReady(page);
    await openAppJava(page);
    mark("ready");
    await pause(page, 1500);
    await page.locator('button[title="Select task to run"]').hover();
    await pause(page, 600);
    await page.locator('button[title="Run Task: Run"]').click();
    await page
      .locator(".quick-input-list .monaco-list-row")
      .first()
      .waitFor({ timeout: 3000 })
      .then(
        () => page.keyboard.press("Enter"),
        () => {},
      );
    await pause(page, 12_000);
  });

  // Open from a link: the link starts Java 17 with the repository cloned into the workspace.
  const link = `${LANDING}?${new URLSearchParams({ appDef: "java-17-standalone", gitUri: CLONE_REPO, title: "vscode-remote-try-java" })}`;
  let linkUrl;
  await scratch(deleteAllEnvironments);
  await recorded("open-from-link-1", async (page, mark) => {
    await page.goto(link);
    await page.getByText("Request accepted").waitFor({ timeout: 60_000 });
    mark("loaded");
    await page.waitForURL(/\/\/instance\./, { timeout: 300_000 });
    mark("ide");
    await pause(page, 2000);
    linkUrl = page.url();
  });
  await prepareIde(linkUrl, { warmRun: false });
  await recorded("open-from-link-2", async (page, mark) => {
    await page.goto(linkUrl);
    await page.getByText(".devcontainer").first().waitFor({ timeout: 300_000 });
    await pause(page, 2000);
    mark("ready");
    await pause(page, 1500);
    await page
      .locator(".theia-TreeNode", { hasText: ".vscode" })
      .first()
      .click();
    await pause(page, 1500);
    await page.getByText("README.md", { exact: true }).first().dblclick();
    await page.locator(".lm-TabBar-tab", { hasText: "README.md" }).first().waitFor();
    await pause(page, 4000);
  });

  await scratch(deleteAllEnvironments);
  await ctx.close();
  fs.rmSync(path.join(dir, "raw"), { recursive: true, force: true });
  fs.writeFileSync(
    path.join(dir, "marks.json"),
    JSON.stringify(marks, null, 1),
  );
  console.log(`recorded ${mode} into ${dir}`);
}
await browser.close();

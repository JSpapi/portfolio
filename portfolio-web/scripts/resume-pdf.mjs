// Builds public/resume/*.pdf from content/cv (same text as the /cv page).
// Run: npm run resume   (needs Google Chrome; set CHROME_PATH if it lives elsewhere)
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { en } from "../content/cv/en.ts";
import { ru } from "../content/cv/ru.ts";
import { uz } from "../content/cv/uz.ts";
import { cvContact, resumePdf } from "../content/cv/contact.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const cvs = { en, ru, uz };
const sitePath = { en: "", ru: "/ru", uz: "/uz" };
const photo = `data:image/jpeg;base64,${readFileSync(join(root, "public/avatar.jpg")).toString("base64")}`;

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// **bold** → <b>
const rich = (s) =>
  esc(s)
    .split("**")
    .map((part, i) => (i % 2 ? `<b>${part}</b>` : part))
    .join("");
const bare = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function job(j, l) {
  return `
  <div class="job">
    <div class="job-head">
      <div><b>${esc(j.title)}</b> <span class="co">— ${esc(j.company)}</span></div>
      <div class="when">${esc(j.dates)} · ${esc(j.place)}</div>
    </div>
    <p>${rich(j.intro)}</p>
    ${j.work ? `<div class="mini">${esc(l.keyWork)}</div><ul>${j.work.map((w) => `<li>${rich(w)}</li>`).join("")}</ul>` : ""}
    ${j.stack ? `<p class="stack"><b>${esc(l.stack)}:</b> ${esc(j.stack)}</p>` : ""}
  </div>`;
}

function rows(list) {
  return `<table>${list
    .map((r) => `<tr><th>${esc(r.label)}</th><td>${esc(r.text)}</td></tr>`)
    .join("")}</table>`;
}

function html(lang, cv) {
  const l = cv.labels;
  const site = `${cvContact.site}${sitePath[lang]}`;
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<title>${esc(cvContact.name)} — ${esc(l.metaTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=block" rel="stylesheet">
<style>
  @page { size: Letter; margin: 0.45in 0.6in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "IBM Plex Sans", Arial, sans-serif; font-size: 8.3pt; line-height: 1.5; color: #222; }
  a { color: #2c5d8f; text-decoration: none; }
  b { font-weight: 600; }
  .head { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 10px; border-bottom: 1.5px solid #d6d9de; }
  h1 { font-size: 22pt; line-height: 1.15; color: #1c2f4d; font-weight: 700; }
  .role { margin-top: 6px; font-size: 8.5pt; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: #6b7280; }
  .tag { margin-top: 6px; font-size: 9pt; font-weight: 600; color: #2c5d8f; }
  .line { margin-top: 5px; color: #444; }
  .line .sep { color: #c3c7cd; margin: 0 6px; }
  .line span.i { white-space: nowrap; }
  .photo { width: 1.05in; height: 1.05in; border-radius: 50%; border: 2px solid #1c2f4d; object-fit: cover; flex-shrink: 0; }
  h2 { margin: 14px 0 8px; padding-bottom: 3px; border-bottom: 1.5px solid #d6d9de; font-size: 9pt; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #1c2f4d; }
  .page { break-before: page; }
  .page > h2:first-child { margin-top: 0; }
  p { margin-bottom: 6px; }
  ul { margin: 0 0 6px 18px; }
  li { margin-bottom: 2px; }
  .help { columns: 2; column-gap: 28px; list-style: none; margin-left: 0; }
  .help li::before { content: "• "; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  th { width: 1.9in; padding: 3px 12px 3px 0; text-align: left; vertical-align: top; font-weight: 600; color: #1c2f4d; }
  td { padding: 3px 0; vertical-align: top; }
  .job { margin-bottom: 12px; break-inside: auto; }
  .job-head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px; font-size: 9.5pt; }
  .co { color: #2c5d8f; font-weight: 600; }
  .when { color: #6b7280; font-size: 8pt; white-space: nowrap; }
  .mini { margin: 6px 0 3px; font-size: 7.5pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #6b7280; }
  .stack { color: #6b7280; }
  .stack b { color: #1c2f4d; }
  .proj { margin-bottom: 14px; break-inside: avoid; }
  .proj h3 { font-size: 10.5pt; font-weight: 700; }
  .proj .by { font-style: italic; color: #6b7280; margin-bottom: 5px; }
  .note i { color: #6b7280; }
  .langs span + span::before { content: "·"; color: #c3c7cd; margin: 0 10px; }
  .langs b { color: #2c5d8f; }
</style></head>
<body>
  <div class="head">
    <div>
      <h1>${esc(cvContact.name)}</h1>
      <div class="role">${esc(cv.role)}</div>
      <div class="tag">${esc(cvContact.headline)}</div>
      <div class="line"><b>${esc(l.portfolio)}:</b> <a href="${site}">${bare(site)}</a></div>
      <div class="line">${[
        esc(cv.location),
        `<a href="mailto:${cvContact.email}">${cvContact.email}</a>`,
        `<a href="${cvContact.linkedin}">${bare(cvContact.linkedin)}</a>`,
        `<a href="${cvContact.github}">${bare(cvContact.github)}</a>`,
      ].map((x) => `<span class="i">${x}</span>`).join(`<span class="sep">|</span>`)}</div>
    </div>
    <img class="photo" src="${photo}" alt="">
  </div>

  <h2>${esc(l.profile)}</h2>
  ${cv.summary.map((p) => `<p>${rich(p)}</p>`).join("")}
  <p>${esc(cv.domainsIntro)}</p>
  <ul>${cv.domains.map((d) => `<li><b>${esc(d.name)}</b> — ${esc(d.text)}</li>`).join("")}</ul>
  <p>${rich(cv.summaryOutro)}</p>

  <h2>${esc(l.help)}</h2>
  <ul class="help">${cv.help.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>

  <h2>${esc(l.skills)}</h2>
  ${rows(cv.skills.map((s) => ({ label: s.group, text: s.items })))}

  <div class="page">
    <h2>${esc(l.experience)}</h2>
    ${cv.jobs.map((j) => job(j, l)).join("")}
  </div>

  <div class="page">
    <h2>${esc(l.projects)}</h2>
    ${cv.projects
      .map(
        (p) => `
    <div class="proj">
      <h3>${esc(p.name)}</h3>
      <div class="by">${esc(p.role)}</div>
      <p>${esc(p.intro)}</p>
      ${rows(p.rows)}
      ${p.note ? `<p class="note"><b>${esc(p.note.label)}</b> <i>${esc(p.note.text)}</i></p>` : ""}
      ${p.stack ? `<p class="stack"><b>${esc(l.stack)}:</b> ${esc(p.stack)}</p>` : ""}
    </div>`
      )
      .join("")}

    <h2>${esc(l.additional)}</h2>
    ${cv.extra.map((j) => job(j, l)).join("")}

    <h2>${esc(l.languages)}</h2>
    <p class="langs">${cv.languages.map((x) => `<span><b>${esc(x.name)}</b> — ${esc(x.level)}</span>`).join("")}</p>
  </div>
</body></html>`;
}

// Chrome writes the PDF but on macOS often never exits, so wait for the
// file to stop growing and then stop Chrome ourselves.
async function printPdf(src, out, profile) {
  rmSync(out, { force: true });
  const proc = spawn(chrome, [
    "--headless",
    "--disable-gpu",
    `--user-data-dir=${profile}`,
    "--use-mock-keychain",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-pdf-header-footer",
    "--virtual-time-budget=15000",
    `--print-to-pdf=${out}`,
    `file://${src}`,
  ], { stdio: "ignore", detached: true });
  let exited = false;
  proc.on("exit", () => (exited = true));
  try {
    let last = -1;
    for (let i = 0; i < 120; i++) {
      await sleep(500);
      const size = existsSync(out) ? statSync(out).size : 0;
      if (size > 0 && size === last) return;
      if (exited && size === 0) break;
      last = size;
    }
    throw new Error(`Chrome did not print ${out}`);
  } finally {
    // Kill the whole group so no helper processes stay behind.
    if (!exited) process.kill(-proc.pid, "SIGKILL");
  }
}

const tmp = mkdtempSync(join(tmpdir(), "resume-"));
try {
  const only = process.argv.slice(2);
  for (const [lang, cv] of Object.entries(cvs)) {
    if (only.length && !only.includes(lang)) continue;
    const src = join(tmp, `${lang}.html`);
    const out = join(root, "public", resumePdf(lang));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(src, html(lang, cv));
    await printPdf(src, out, join(tmp, `chrome-${lang}`));
    console.log(`wrote ${out}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

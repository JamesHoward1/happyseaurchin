#!/usr/bin/env node
/* Writes a static snapshot of each paper into its page, so search engines, link previews
   and other people's assistants see the words without running any script.

   It reads each block from the beach with the same readBlock() the pages use, renders it
   with the same renderPaper(), and puts the result inside <main data-snapshot="...">.
   In a browser, beach.js still reads the beach live and replaces the snapshot.

   Usage:  node build/snapshot.js
           SNAPSHOT_FIXTURES=dir node build/snapshot.js   (read <block name with : as _>.json from dir instead of the beach)

   Exit code 1 only if every paper failed to read; a single failure leaves that page as it was. */

const fs = require("fs");
const path = require("path");
const { PAGES, readBlock, renderPaper, renderIndex, paperParts } = require("../beach.js");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://silobuster.mlcinnovations.co.uk/";
const FIX = process.env.SNAPSHOT_FIXTURES;
const today = new Date().toISOString().slice(0, 10);

const escAttr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)).replace(/[,;:—–-]\s*$/, "") + "…");

async function getBlock(name) {
  if (FIX) return JSON.parse(fs.readFileSync(path.join(FIX, name.replace(/:/g, "_") + ".json"), "utf8"));
  return readBlock(name);
}

function metaTags({ title, description, file }) {
  const url = SITE + (file === "index.html" ? "" : file);
  return [
    "<!-- snapshot:meta -->",
    `<meta name="description" content="${escAttr(description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="Silo Buster">`,
    `<meta property="og:title" content="${escAttr(title)}">`,
    `<meta property="og:description" content="${escAttr(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta name="twitter:card" content="summary">`,
    "<!-- /snapshot:meta -->"
  ].join("\n");
}

function writePage(file, { title, description, body }) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, "utf8");
  const before = html;

  // head: title, and one managed block of meta tags (replacing the hand-written description)
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escAttr(title)}</title>`);
  html = html.replace(/\n?<!-- snapshot:meta -->[\s\S]*?<!-- \/snapshot:meta -->/, "");
  html = html.replace(/\n?<meta name="description"[^>]*>/, "");
  html = html.replace(/<\/title>/, `</title>\n${metaTags({ title, description, file })}`);

  // body: the rendered paper inside <main>
  html = html.replace(/<main[^>]*>[\s\S]*?<\/main>/,
    `<main data-snapshot="${today}">\n${body}\n<p class="state">Snapshot of ${today}. Your browser reads the latest version from the beach.</p>\n</main>`);

  // ignore a date-only change, so the scheduled run doesn't commit every time
  const strip = s => s.replace(/\d{4}-\d{2}-\d{2}/g, "");
  if (strip(html) === strip(before)) return false;
  fs.writeFileSync(p, html);
  return true;
}

(async () => {
  let ok = 0, failed = 0, changed = [];

  for (const [name, page] of Object.entries(PAGES)) {
    try {
      const block = await getBlock(name);
      const { lede } = paperParts(name, block);
      const description = clip(lede || page.blurb, 200);
      if (writePage(page.file, { title: page.title, description, body: renderPaper(name, block) })) changed.push(page.file);
      ok++;
    } catch (e) {
      failed++;
      console.warn(`skip ${page.file}: could not read ${name} (${e.message})`);
    }
  }

  const index = {
    title: "Silo Buster: people and their AI, working together",
    description: "Silo Buster is a facilitated programme that helps people, and the AI assistants working for them, collaborate. It starts with one walk-in hour that gives a leadership team an immediate picture of its own coordination.",
    body: renderIndex()
  };
  if (writePage("index.html", index)) changed.push("index.html");

  console.log(`${ok} papers read, ${failed} failed; changed: ${changed.join(", ") || "none"}`);
  if (ok === 0) process.exit(1);
})();

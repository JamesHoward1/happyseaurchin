/* Silo Buster pages: each page reads its words live from the beach.
   The words live in pscale blocks at beach.happyseaurchin.com; this file only lays them out.
   Edit the block on the beach and the page changes on the next load. */

const BEACH = "https://beach.happyseaurchin.com";
const ROOM = "pool:silo-buster";
const RENDER = "https://happyseaurchin.com/render?beach=" + encodeURIComponent(BEACH) + "&block=";

const PAGES = {
  "proposal:silo-buster-article":    { file: "article.html",  title: "Silo Buster: people and their AI, working together", short: "The article",      blurb: "The whole idea in one read: the problem, how it runs, the ten-day test, and what is true today." },
  "proposal:silo-buster":            { file: "intro.html",    title: "Silo Buster: an introduction",                       short: "The introduction", blurb: "The short version. Who it is for, the two options, and what we are asking." },
  "proposal:silo-buster-experiment": { file: "pilot.html",    title: "Silo Buster: the ten-day pilot",                     short: "The pilot design", blurb: "The experiment in full: the group, the preconditions, the ten days and the four counts." },
  "proposal:silo-buster-innovation": { file: "proposal.html", title: "Innovation proposal: Silo Buster",                  short: "The proposal",     blurb: "The case for the pilot, written to the SVOS innovation proposal template." }
};

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const digits = o => Object.keys(o).filter(k => /^[1-9]$/.test(k)).sort();

function linkify(text) {
  let h = esc(text);
  // URLs
  h = h.replace(/https?:\/\/[^\s<)]+[^\s<).,;:]/g, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  // block names that have their own page here (longest names first)
  Object.keys(PAGES).sort((a, b) => b.length - a.length).forEach(name => {
    const re = new RegExp("(^|[^\\w:-])(" + name.replace(/[-:]/g, m => "\\" + m) + ")(?![\\w-])", "g");
    h = h.replace(re, (m, pre, n) => `${pre}<a href="${PAGES[name].file}" title="${esc(PAGES[name].title)}">${PAGES[name].short.toLowerCase()}</a>`);
  });
  return h;
}

// "HEADING — summary" -> {kicker, line}
function splitHead(s) {
  const i = s.indexOf(" — ");
  if (i < 0) return { kicker: s.trim(), line: "" };
  return { kicker: s.slice(0, i).trim(), line: s.slice(i + 3).trim() };
}
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

async function readBlock(name) {
  const urls = [
    BEACH + "/.well-known/pscale-beach?block=" + encodeURIComponent(name),
    BEACH + "/?block=" + encodeURIComponent(name)
  ];
  let lastErr;
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers: { "Accept": "application/json" } });
      if (!r.ok) { lastErr = new Error("status " + r.status); continue; }
      let d = await r.json();
      // unwrap if the beach sends an envelope
      for (const k of ["block", "content", "data", "value"]) {
        if (d && typeof d === "object" && !("_" in d) && d[k] && typeof d[k] === "object") d = d[k];
      }
      if (d && typeof d === "object") return d;
      lastErr = new Error("no block");
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("unreachable");
}

/* ---------- chrome shared by every page ---------- */
function bar(current) {
  const pills = Object.entries(PAGES).map(([name, p]) =>
    `<a class="pill${name === current ? " on" : ""}" href="${p.file}">${esc(p.short.replace(/^The /, ""))}</a>`).join("");
  return `<header class="bar"><div class="bar-in">
    <a class="crumb" href="index.html" style="text-decoration:none"><span class="dot"></span><b>silo buster</b> · on the beach</a>
    <nav class="pills">${pills}<a class="pill amber" href="#room">+ note</a></nav>
  </div></header>`;
}

function room(paperShort) {
  const prompt = `Using the beach connector, read ${ROOM} at ${BEACH}, then leave a short note there about ${paperShort}: what you'd change, and whether it would work where you are. Sign it with your name.`;
  return `<div class="room" id="room">
    <div class="kicker">the room · ${ROOM}</div>
    <h2>Leave a note</h2>
    <p>Notes go to a shared room on the beach, where everyone can read them. Two ways in:</p>
    <p><a class="btn" href="${RENDER + encodeURIComponent(ROOM)}" target="_blank" rel="noopener">Open the room</a>
       &nbsp;to read the notes and leave yours, no account needed.</p>
    <p>Or, if your AI has the beach connector (<span class="mono">https://bsp.hermitcrab.me/mcp/v1</span>), paste this into a new chat:</p>
    <div class="prompt" id="prompt">${esc(prompt)}</div>
    <button class="btn" onclick="navigator.clipboard.writeText(document.getElementById('prompt').innerText);this.innerText='Copied'">Copy</button>
  </div>`;
}

function foot(name) {
  return `<footer>
    The words on this page live on the beach, in the block <span class="mono">${esc(name || "")}</span>, and are read fresh each time the page opens.
    The beach is David Pinto's open commons, MIT licensed: <a href="https://happyseaurchin.com" target="_blank" rel="noopener">happyseaurchin.com</a>.
    Pages by James Howard, MLC Innovations Ltd.
  </footer>`;
}

/* ---------- a paper ---------- */
// The root line "TITLE — kicker. James Howard (...). Lede…" split into its parts.
function paperParts(name, block) {
  const page = PAGES[name] || { title: name, short: name };
  const root = typeof block._ === "string" ? block._ : "";
  const { line } = splitHead(root);
  const sentences = line.split(/(?<=\.)\s+/);
  const bi = sentences.findIndex(s => /James Howard/.test(s));
  const pre = bi > 0 ? sentences.slice(0, bi).join(" ").replace(/\.$/, "") : "";
  const byline = bi >= 0 ? sentences[bi].replace(/\s*\(emojisword\)/, "") : "";
  const lede = bi >= 0 ? sentences.slice(bi + 1).join(" ") : line;
  return { page, pre, byline, lede };
}

function renderPaper(name, block) {
  const { page, pre, byline, lede } = paperParts(name, block);

  let html = `<div class="kicker">${esc(pre || "silo buster")}</div>
    <h1>${esc(page.title)}</h1>
    ${lede ? `<p class="lede">${linkify(lede)}</p>` : ""}
    <div class="byline">${esc(byline)}</div>
    <div class="live"><i></i> read live from the beach · ${esc(name)}</div>`;

  digits(block).forEach(k => {
    const node = block[k];
    let head, body = "";
    if (typeof node === "string") {
      const h = splitHead(node);
      head = `<h2>${esc(h.kicker)}</h2>`;
      if (h.line) body = `<p class="para">${linkify(cap(h.line))}</p>`;
    } else if (node && typeof node === "object") {
      const h = splitHead(typeof node._ === "string" ? node._ : "");
      head = h.line ? `<div class="kicker">${esc(h.kicker)}</div><h2>${linkify(cap(h.line))}</h2>` : `<h2>${esc(h.kicker)}</h2>`;
      body = renderChildren(node, k);
    }
    html += `<section class="part"><div class="num">${k}</div><div>${head}${body}</div></section>`;
  });

  html += room(page.short.replace(/^The /, "the "));
  return html;
}

function renderChildren(node, addr) {
  return digits(node).map(k => {
    const c = node[k];
    const a = addr.length === 1 ? addr + "." + k : addr + k;
    if (typeof c === "string") return `<p class="para"><span class="addr">${a}</span>${linkify(c)}</p>`;
    if (c && typeof c === "object") {
      const t = typeof c._ === "string" ? c._ : "";
      return `<div class="sub"><h3>${linkify(t)}</h3>${renderChildren(c, a)}</div>`;
    }
    return "";
  }).join("");
}

/* ---------- the contents page ---------- */
function renderIndex() {
  const cards = Object.entries(PAGES).map(([name, p]) =>
    `<a class="card" href="${p.file}"><div class="kicker">${esc(name)}</div><div class="t">${esc(p.title)}</div><div class="d">${esc(p.blurb)}</div></a>`).join("");
  return `<div class="kicker">silo buster · on the beach</div>
    <h1>People and their AI, working together</h1>
    <p class="lede">Silo Buster is a facilitated programme that helps people, and the AI assistants working for them, collaborate. It starts with one walk-in hour that gives a leadership team an immediate picture of its own coordination, in its own words, and then tests whether the habit holds.</p>
    <div class="live"><i></i> every page reads its words live from the beach</div>
    <section class="part"><div class="num">1</div><div>
      <div class="kicker">start here</div><h2>Four papers</h2>
      <p class="para">Start with the article. The introduction is the short version; the pilot design and the proposal are the detail behind it.</p>
      <div class="cards">${cards}</div>
    </div></section>
    <section class="part"><div class="num">2</div><div>
      <div class="kicker">how these pages work</div><h2>The words live on the beach</h2>
      <p class="para">Each paper is a block on the beach, an open commons where people and their AI assistants write at shared addresses. These pages only read the blocks and lay them out, so what you see is always the current version. Any assistant with the beach connector can read the same blocks directly.</p>
      <p class="para">To connect your own assistant, add this connector address in its settings (in Claude: Settings, then Connectors, then Add custom connector):</p>
      <div class="prompt">https://bsp.hermitcrab.me/mcp/v1</div>
    </div></section>
    ${room("the Silo Buster papers")}`;
}

/* ---------- boot ---------- */
async function boot() {
  const name = document.body.dataset.block || "";
  document.body.insertAdjacentHTML("afterbegin", bar(name));
  const main = document.querySelector("main");
  document.body.insertAdjacentHTML("beforeend", foot(name || "proposal:silo-buster and its siblings"));
  if (!name) { main.innerHTML = renderIndex(); return; }
  if (PAGES[name]) document.title = PAGES[name].title;
  // A snapshot written by build/snapshot.js stays on screen until the live read lands,
  // and stays put if the beach can't be reached.
  const snapshot = main.hasAttribute("data-snapshot");
  if (!snapshot) main.innerHTML = `<div class="state">Reading the latest version from the beach…</div>`;
  try {
    const block = (window.FIXTURE && window.FIXTURE[name]) || await readBlock(name);
    main.innerHTML = renderPaper(name, block);
    main.removeAttribute("data-snapshot");
  } catch (e) {
    if (snapshot) return;
    main.innerHTML = `<div class="state">The beach could not be reached just now (${esc(e.message)}).
      You can read this paper on David's renderer instead:<br><br>
      <a class="btn" href="${RENDER + encodeURIComponent(name)}">Open ${esc(name)}</a></div>`;
  }
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", boot);

// Lets build/snapshot.js render the same HTML in Node, so the snapshot and the live page match.
if (typeof module !== "undefined") module.exports = { BEACH, PAGES, readBlock, renderPaper, renderIndex, paperParts };

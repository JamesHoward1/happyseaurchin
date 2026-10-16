# Silo Buster, on the beach

Four papers about Silo Buster, a facilitated programme that helps people, and the AI assistants working for them, collaborate.

The words live on the beach (beach.happyseaurchin.com), David Pinto's open commons. These pages only read the blocks and lay them out, so they always show the current version.

| Page | Beach block |
|---|---|
| index.html | contents |
| article.html | proposal:silo-buster-article |
| intro.html | proposal:silo-buster |
| pilot.html | proposal:silo-buster-experiment |
| proposal.html | proposal:silo-buster-innovation |

Notes and comments go to the room `pool:silo-buster` on the beach.

`beach.js` reads each block with `GET https://beach.happyseaurchin.com/.well-known/pscale-beach?block=<name>` and renders it; `beach.css` carries the look. To add a paper, add a line to `PAGES` in `beach.js` and a copy of any page with its `data-block` changed.

## Snapshots, for previews and search

Because the words arrive by script, anything that doesn't run scripts (search engines, LinkedIn and WhatsApp previews, other people's assistants) would see an empty page. So `build/snapshot.js` reads each block, renders it with the same code `beach.js` uses, and writes it into the page's `<main data-snapshot="date">` along with title, description and preview tags. A browser still reads the beach live and swaps the snapshot for the current version; if the beach can't be reached, the snapshot stays.

`.github/workflows/snapshot.yml` runs it every six hours, on any change to `beach.js`, the pages or `build/`, and from the **Run workflow** button on the Actions tab. It commits only when the words have changed.

To run it by hand: `node build/snapshot.js` (Node 20 or later).

Published with GitHub Pages. MIT licence.

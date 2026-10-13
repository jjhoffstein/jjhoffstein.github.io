# JJ Hoffstein’s digital portfolio

The published site is https://jjhoffstein.github.io/. It is a static HTML/CSS/JavaScript site hosted by GitHub Pages from `master`, using the HTML5 UP Phantom design. No application build or server is required.

## Local checks and publishing

Run `node --test tests/*.test.mjs` with Node.js 24 or newer. The same suite runs in GitHub Actions for pull requests and pushes to `master`. A separate Chromium job checks desktop/mobile rendering and the main keyboard interactions, saving previews as CI artifacts. To run it locally, use `npm ci --ignore-scripts`, `npx playwright install chromium`, and `npm run test:browser`. Browser checks use isolated local fixtures and never change live browser storage. Publish through a reviewed pull request, check CI, then verify the separate GitHub Pages deployment and live pages. A local test pass is not deployment evidence.

For a local preview, serve the repository with a static HTTP server. Loading a page directly from disk will not load the shared menu through its HTTP request.

## Adding or updating a project

Copy the shell of an existing project page. Preserve its header, footer, stylesheet/script order, and spacing. Add the project to both the homepage tiles in `index.html` and the shared navigation in `menu.html`; retain the existing tile classes and palette. Add an indexable project URL to `sitemap.xml`. Give the page its own title, description, canonical URL, meaningful image alternative text, and correctly sized image dimensions.

Menu links are root-relative so they work from nested pages. Nested pages set `data-menu-src` to the correct menu URL. The custom `404.html` uses root-relative assets and `/menu.html` because it can be served at any missing URL. The menu has a stable request URL and uses normal browser revalidation.

## Styling and assets

`assets/css/main.css` is the served Phantom stylesheet; keep corresponding changes in `assets/sass/` consistent. No Sass build is configured. The original palette, tile artwork, and Source Sans Pro metrics are retained. Tile text has a translucent backing for contrast, and keyboard focus reveals the same captions as hover. Reduced-motion preferences disable animations.

`assets/css/fonts.css` serves locally hosted Source Sans Pro 300, 700, and 900 webfonts. The modified fonts use internal names that respect the upstream reserved-name license, with CSS aliases retaining the site’s existing font family. Latin, punctuation, and characters used by the site are included. `portfolio-fa-*.woff2` contains the existing Font Awesome shapes used by public pages and form controls. When adding an icon or new script/language, regenerate the appropriate subset or restore its full original font; check actual rendered glyphs. Font licenses live in `assets/webfonts/`. `images/globe-64.jpg` is the same original globe resized for the 32-pixel header and favicon. The original public artwork and historical downloads remain available.

## Interactive projects

The Snake game’s state lives in `basketball_snake.js`; its styles are in `basketball_snake.css`. Its grid contains whole cells, stays logically fixed during a run when the canvas resizes, and accepts one turn per movement tick. Browser storage is optional for its high score. Opening Help pauses the game; other overlays suspend movement and countdown input.

The Alpha Site Tracker uses `assets/js/alpha-site-scorer.js` and the validation/storage module `assets/js/alpha-site-data.js`. Its base styles load before the shared portfolio stylesheet, and `assets/css/alpha-site-scorer.css` applies scoped overrides after it. The editor commits only on Save. Cancel and Escape discard drafts. Storage and import validation failures preserve existing saved data.

Alpha scores are out of 84, the maximum of the original weights at zero rent. Green remains 75+, yellow remains 50 to below 75, and red remains below 50. The bar shows the fraction of 84. Annual margin at capacity is `capacity × tuition − annual operating costs`; it can be negative. These are illustrative model assumptions, not validated forecasts. Map positions are approximate ZIP-area coordinates for the supported ZIP codes, including ZIP+4 aliases. The map reports every missing/unsupported location; it does not geocode new addresses. Chart.js is pinned to 4.5.1 and Leaflet to 1.9.4.

`assets/js/site-dialog.js` provides focus containment, Escape dismissal, background inertness, and focus restoration for the existing menu and overlays. New overlays should use it and supply an accessible name and close callback.

## Archive and housekeeping

Archive articles remain available with their existing `noindex, follow` search policy. Historical downloads are retained, even when currently unreferenced, to avoid breaking bookmarks. The practice-philosophy PDF is losslessly recompressed: its 177 pages, decoded image samples, text, page geometry, and annotation counts were checked against the original. It remains a large download (about 50 MB).

`.gitignore` and `_config.yml` keep logs, local metadata, tests, and development output out of the published site. Unused Phantom demonstration pages and obsolete UI previews have been removed. Keep the template attribution and licenses.

## Credits and license

Phantom by HTML5 UP — https://html5up.net/ — @ajlkn. Free for personal and commercial use under the CCA 3.0 license; see `LICENSE.txt` and https://html5up.net/license. Original template notes are retained in `README.txt`.

Icons: Font Awesome. Typeface: Source Sans Pro, Adobe. Supporting libraries: jQuery 3.7.1 (full build, required for the menu request), Responsive Tools by ajlkn, Chart.js, and Leaflet. Tile demonstration artwork: Unsplash. See each bundled dependency’s license notice and the original template credits.

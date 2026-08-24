import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const rootPath = root.pathname;
const pages = readdirSync(rootPath).filter((file) => file.endsWith('.html'));
const pageContents = pages.map((page) => readFileSync(new URL(`../${page}`, import.meta.url), 'utf8'));
const mainStyles = readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8');
const iconStylesSource = readFileSync(new URL('../assets/sass/components/_icon.scss', import.meta.url), 'utf8');

function relativeLuminance([red, green, blue]) {
  const channels = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(firstColor, secondColor) {
  const firstLuminance = relativeLuminance(firstColor);
  const secondLuminance = relativeLuminance(secondColor);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

test('site provides crawler and privacy documents', () => {
  assert.ok(existsSync(new URL('../robots.txt', import.meta.url)));
  assert.ok(existsSync(new URL('../sitemap.xml', import.meta.url)));
  assert.ok(existsSync(new URL('../privacy.html', import.meta.url)));
});

test('public pages do not load Google Analytics before consent', () => {
  for (const [index, page] of pageContents.entries()) {
    assert.doesNotMatch(page, /googletagmanager\.com\/gtag\/js|gtag\('.*G-V928CLWGF5/,
      `${pages[index]} still loads Google Analytics`);
  }
});

test('Snake game uses local production styles instead of the Tailwind Play CDN', () => {
  const snakePage = pageContents[pages.indexOf('basketball_snake.html')];
  assert.doesNotMatch(snakePage, /cdn\.tailwindcss\.com/);
  assert.doesNotMatch(snakePage, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(snakePage, /href="basketball_snake\.css"/);
});

test('portfolio pages declare essential language and search metadata', () => {
  for (const [index, page] of pageContents.entries()) {
    if (['elements.html', 'generic.html', 'menu.html'].includes(pages[index])) continue;
    assert.match(page, /<html lang="en">/, `${pages[index]} is missing a document language`);
    assert.match(page, /<meta name="description" content="[^"]+"/, `${pages[index]} is missing a description`);
  }
});

test('global stylesheet provides a visible keyboard focus indicator', () => {
  assert.match(mainStyles, /:focus-visible\s*\{[\s\S]*?outline:\s*3px solid #f2849e;/);
});

test('icon labels stay available to assistive technology while visually hidden', () => {
  const iconLabelRule = mainStyles.match(/\.icon > \.label\s*\{([\s\S]*?)\}/)?.[1] ?? '';

  assert.ok(iconLabelRule, 'main.css is missing the icon label rule');
  assert.doesNotMatch(iconLabelRule, /display:\s*none/);
  assert.doesNotMatch(iconLabelRule, /visibility:\s*hidden/);
  assert.match(iconLabelRule, /position:\s*absolute/);
  assert.match(iconLabelRule, /width:\s*1px/);
  assert.match(iconLabelRule, /height:\s*1px/);
  assert.match(iconLabelRule, /overflow:\s*hidden/);
  assert.match(iconLabelRule, /clip-path:\s*inset\(100%\)/);
  assert.match(iconLabelRule, /white-space:\s*nowrap/);

  assert.doesNotMatch(iconStylesSource, /> \.label\s*\{[\s\S]*?display:\s*none/);
  assert.match(iconStylesSource, /> \.label\s*\{[\s\S]*?clip-path:\s*inset\(100%\)/);
});

test('footer copyright and legal text meets WCAG AA contrast', () => {
  const backgroundMatch = mainStyles.match(/#footer\s*\{[\s\S]*?background-color:\s*#([0-9a-f]{6});/i);
  const foregroundMatch = mainStyles.match(
    /#footer > \.inner \.copyright\s*\{[\s\S]*?color:\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\);/i,
  );

  assert.ok(backgroundMatch, 'main.css is missing the footer background color');
  assert.ok(foregroundMatch, 'main.css is missing the footer copyright color');

  const background = [0, 2, 4].map((offset) => Number.parseInt(
    backgroundMatch[1].slice(offset, offset + 2),
    16,
  ));
  const foreground = foregroundMatch.slice(1, 4).map(Number);
  const alpha = Number(foregroundMatch[4]);
  const compositedForeground = foreground.map(
    (channel, index) => (channel * alpha) + (background[index] * (1 - alpha)),
  );
  const ratio = contrastRatio(compositedForeground, background);

  assert.ok(ratio >= 4.5, `footer legal text contrast is ${ratio.toFixed(2)}:1; expected at least 4.5:1`);
});

test('root portfolio pages keep their wrapper div markup balanced', () => {
  for (const [index, page] of pageContents.entries()) {
    const openingDivs = page.match(/<div\b/g)?.length ?? 0;
    const closingDivs = page.match(/<\/div>/g)?.length ?? 0;
    assert.equal(openingDivs, closingDivs, `${pages[index]} has unbalanced div markup`);
  }
});

test('portfolio footers remain inside the shared page wrapper', () => {
  for (const [index, page] of pageContents.entries()) {
    const tags = page.match(/<\/?(?:div|footer)\b[^>]*>/gi) ?? [];
    const divStack = [];
    let hasFooter = false;

    for (const tag of tags) {
      if (tag.startsWith('</div')) {
        divStack.pop();
      } else if (tag.startsWith('<div')) {
        divStack.push(tag);
      } else if (tag.startsWith('<footer')) {
        hasFooter = true;
        assert.ok(
          divStack.some((div) => /\bid\s*=\s*["']wrapper["']/i.test(div)),
          `${pages[index]} places its footer outside #wrapper`,
        );
      }
    }

    if (pages[index] === 'menu.html') assert.equal(hasFooter, false);
  }
});

test('all root-relative local asset references resolve', () => {
  for (const [index, page] of pageContents.entries()) {
    const references = page.matchAll(/(?:href|src)="([^"]+)"/g);
    for (const match of references) {
      const reference = match[1];
      if (/^(?:https?:|mailto:|tel:|#|data:)/.test(reference)) continue;
      const path = reference.split(/[?#]/, 1)[0].replace(/^\//, '');
      if (!path || path.endsWith('/')) continue;
      assert.ok(existsSync(resolve(rootPath, path)), `${pages[index]} references missing ${reference}`);
    }
  }
});

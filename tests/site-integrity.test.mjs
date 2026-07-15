import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const rootPath = root.pathname;
const pages = readdirSync(rootPath).filter((file) => file.endsWith('.html'));
const pageContents = pages.map((page) => readFileSync(new URL(`../${page}`, import.meta.url), 'utf8'));
const mainStyles = readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8');

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

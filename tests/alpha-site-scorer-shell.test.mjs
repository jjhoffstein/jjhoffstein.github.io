import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../alpha-site-scorer/index.html', import.meta.url), 'utf8');
const menuScript = readFileSync(new URL('../assets/js/main.js', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../menu.html', import.meta.url), 'utf8');

test('Alpha Site Scorer uses the shared portfolio shell and nested menu path', () => {
  assert.match(page, /href="\.\.\/assets\/css\/main\.css"/);
  assert.match(page, /<header id="header">/);
  assert.match(page, /<nav id="menu" data-menu-src="\.\.\/menu\.html"><\/nav>/);
  assert.match(page, /src="\.\.\/assets\/js\/main\.js"/);
});

test('Alpha Site Scorer loads its scoped portfolio-aligned stylesheet', () => {
  assert.match(page, /href="\.\.\/assets\/css\/alpha-site-scorer\.css"/);
  assert.match(page, /class="is-preload alpha-site-scorer"/);
});

test('shared menu loader honors a nested-page menu path and menu links work from nested pages', () => {
  assert.match(menuScript, /data-menu-src/);
  assert.match(menu, /href="\/index\.html"/);
});

test('dashboard navigation controls use text labels with an accessible theme toggle', () => {
  assert.match(page, /aria-label="Toggle color theme"/);
  assert.match(page, />Cards<\/button>/);
  assert.match(page, />Kanban<\/button>/);
  assert.match(page, />Map<\/button>/);
  assert.doesNotMatch(page, /📋 Cards|📊 Kanban|🗺️ Map/);
});

test('site cards follow the page heading hierarchy', () => {
  assert.match(page, /<h2>\$\{s\.name\}<\/h2>/);
  assert.doesNotMatch(page, /<h3>\$\{s\.name\}<\/h3>/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../alpha-site-scorer/index.html', import.meta.url), 'utf8');
const menuScript = readFileSync(new URL('../assets/js/main.js', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../menu.html', import.meta.url), 'utf8');
const dashboardStyles = readFileSync(new URL('../assets/css/alpha-site-scorer.css', import.meta.url), 'utf8');

test('Alpha Site Scorer uses the shared portfolio shell and nested menu path', () => {
  assert.match(page, /href="\.\.\/assets\/css\/main\.css"/);
  assert.match(page, /<header id="header">/);
  assert.match(page, /<nav id="menu" data-menu-src="\.\.\/menu\.html" aria-label="Site navigation"><\/nav>/);
  assert.match(page, /src="\.\.\/assets\/js\/main\.js"/);
});

test('Alpha Site Scorer loads its scoped portfolio-aligned stylesheet', () => {
  assert.match(page, /href="\.\.\/assets\/css\/alpha-site-scorer\.css(?:\?[^\"]*)?"/);
  assert.match(page, /class="is-preload alpha-site-scorer"/);
});

test('shared menu loader honors a nested-page menu path and menu links work from nested pages', () => {
  assert.match(menuScript, /data-menu-src/);
  assert.match(menu, /href="\/index\.html"/);
});

test('dashboard navigation controls use text labels', () => {
  assert.match(page, />Cards<\/button>/);
  assert.match(page, />Kanban<\/button>/);
  assert.match(page, />Map<\/button>/);
  assert.doesNotMatch(page, /📋 Cards|📊 Kanban|🗺️ Map/);
});

test('dashboard has no dark-mode control or behavior', () => {
  assert.doesNotMatch(page, /<button[^>]*theme-toggle/);
  assert.doesNotMatch(page, /toggleDark/);
  assert.doesNotMatch(page, /localStorage\.getItem\('dark'\)/);
  assert.doesNotMatch(dashboardStyles, /\.theme-toggle|body\.alpha-site-scorer\.dark/);
});

test('dashboard button styles distinguish default, hover, and active states', () => {
  assert.match(dashboardStyles, /\.view-toggle button,[\s\S]*background: #ffffff;[\s\S]*color: #585858 !important;/);
  assert.match(dashboardStyles, /\.view-toggle button:hover,[\s\S]*background: #fde7ed;[\s\S]*color: #585858 !important;/);
  assert.match(dashboardStyles, /\.view-toggle button\.active \{[\s\S]*background: #f2849e;[\s\S]*color: #ffffff !important;/);
});

test('dashboard action controls and score summaries use deliberate shared grouping', () => {
  assert.match(page, /<div class="action-controls">[\s\S]*<button class="btn btn-secondary" onclick="exportSites\(\)">Export<\/button>[\s\S]*<label class="btn btn-secondary">Import/);
  assert.match(page, /<div class="score-summary"><div class="score">\$\{r\.total\.toFixed\(1\)\}<span>\/100<\/span><\/div><div class="score-bar">/);
  assert.match(dashboardStyles, /\.action-controls \.btn \{[\s\S]*display: inline-flex;/);
  assert.match(dashboardStyles, /\.score-summary \{[\s\S]*margin: 1em 0 0\.75em;/);
});

test('dashboard prevents horizontal overflow on narrow screens', () => {
  assert.match(dashboardStyles, /@media screen and \(max-width: 736px\)[\s\S]*\.funnel-stage::after[\s\S]*display: none;/);
  assert.match(dashboardStyles, /@media screen and \(max-width: 736px\)[\s\S]*\.grid \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/);
});

test('site cards follow the page heading hierarchy', () => {
  assert.match(page, /<h2>\$\{s\.name\}<\/h2>/);
  assert.doesNotMatch(page, /<h3>\$\{s\.name\}<\/h3>/);
});

test('dashboard keeps one global implementation of its map and cost controls', () => {
  const functionNames = [
    'initMap',
    'updateMarkers',
    'showView',
    'showCostDetail',
    'closeCostModal',
  ];

  for (const functionName of functionNames) {
    const definitions = page.match(new RegExp(`function ${functionName}\\(`, 'g')) ?? [];
    assert.equal(
      definitions.length,
      1,
      `${functionName} should be defined exactly once`,
    );
  }

  const noteSaveHandlers = page.match(
    /document\.getElementById\('edit-notes'\)\.addEventListener\('keydown'/g,
  ) ?? [];
  assert.equal(noteSaveHandlers.length, 1, 'the notes shortcut should be registered once');
});

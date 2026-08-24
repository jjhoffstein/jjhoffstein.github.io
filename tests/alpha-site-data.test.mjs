import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const helperSource = readFileSync(
  new URL('../assets/js/alpha-site-data.js', import.meta.url),
  'utf8',
);
const context = {};
vm.runInNewContext(helperSource, context);
const {
  MAX_IMPORT_BYTES,
  MAX_SITES,
  commitSites,
  escapeHtml,
  loadSites,
  normalizeSite,
  parseSiteList,
} = context.AlphaSiteData;

const validSite = {
  name: 'Demo Site',
  address: '100 Main St',
  zip_code: '10001',
  sqft: 12000,
  monthly_rent: 25000,
  has_driveway: true,
  has_outdoor_space: false,
  has_kitchen_area: true,
  zoning_clear: true,
  parking_spots: 0,
  status: 'Site Visit',
  date_added: '2026-08-24T12:00:00.000Z',
  notes: 'Call the broker.',
};

test('Alpha text is escaped before insertion into HTML strings', () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('x')"> & done`),
    '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; done',
  );
});

test('Alpha site normalization returns only validated, canonical fields', () => {
  const normalized = normalizeSite({ ...validSite, ignored: '<script>' });

  assert.deepEqual(
    Object.keys(normalized),
    [
      'name',
      'address',
      'zip_code',
      'sqft',
      'monthly_rent',
      'has_driveway',
      'has_outdoor_space',
      'has_kitchen_area',
      'zoning_clear',
      'parking_spots',
      'status',
      'date_added',
      'notes',
    ],
  );
  assert.equal(normalized.name, validSite.name);
  assert.equal('ignored' in normalized, false);
});

test('Alpha site normalization rejects malformed records and unsafe bounds', () => {
  const invalidRecords = [
    null,
    { ...validSite, name: '' },
    { ...validSite, name: 'x'.repeat(121) },
    { ...validSite, address: 'x'.repeat(241) },
    { ...validSite, zip_code: 'x'.repeat(11) },
    { ...validSite, zip_code: '__proto__' },
    { ...validSite, sqft: '12000' },
    { ...validSite, sqft: 0 },
    { ...validSite, monthly_rent: -1 },
    { ...validSite, has_driveway: 1 },
    { ...validSite, status: 'Unknown' },
    { ...validSite, date_added: 'not-a-date' },
    { ...validSite, notes: 'x'.repeat(501) },
  ];

  for (const record of invalidRecords) {
    assert.throws(() => normalizeSite(record));
  }
});

test('Alpha imports are arrays, bounded, and rejected atomically', () => {
  assert.equal(MAX_IMPORT_BYTES, 1024 * 1024);
  assert.equal(MAX_SITES, 500);
  assert.throws(() => parseSiteList(JSON.stringify(validSite)), /array/i);
  assert.throws(
    () => parseSiteList(JSON.stringify(Array.from({ length: MAX_SITES + 1 }, () => validSite))),
    /500/,
  );
  assert.throws(
    () => parseSiteList(JSON.stringify([validSite, { ...validSite, sqft: 'bad' }]))
  );
});

test('Alpha storage loading falls back without deleting malformed saved data', () => {
  let removed = false;
  const storage = {
    getItem: () => '{bad json',
    removeItem: () => { removed = true; },
  };
  const fallback = [{ ...validSite, name: 'Built-in Demo' }];

  const result = loadSites(storage, 'alpha-sites', fallback);

  assert.equal(result.sites[0].name, 'Built-in Demo');
  assert.match(result.warning, /saved data/i);
  assert.equal(removed, false);
  assert.notEqual(result.sites, fallback);
});

test('Alpha storage loading tolerates unavailable browser storage', () => {
  const fallback = [{ ...validSite, name: 'Built-in Demo' }];

  const result = loadSites(null, 'alpha-sites', fallback);

  assert.equal(result.sites[0].name, 'Built-in Demo');
  assert.match(result.warning, /saved data/i);
});

test('Alpha storage commits are atomic when persistence fails', () => {
  const storage = { setItem: () => { throw new Error('quota'); } };

  const result = commitSites(storage, 'alpha-sites', [validSite]);

  assert.equal(result.ok, false);
  assert.match(result.error, /save/i);
  assert.equal(result.sites, undefined);
});

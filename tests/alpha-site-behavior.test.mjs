import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const application = readFileSync(new URL('../assets/js/alpha-site-scorer.js', import.meta.url), 'utf8');
const dataModule = readFileSync(new URL('../assets/js/alpha-site-data.js', import.meta.url), 'utf8');

function createDashboard({ storageFails = false } = {}) {
  const elements = new Map();
  const writes = [];
  const warnings = [];
  const dialog = { current: null, open(element) { this.current = element; }, close() { this.current = null; } };
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      const item = { id, value: '', checked: false, hidden: false, style: {}, textContent: '', innerHTML: '',
        classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); }, contains(name) { return classes.has(name); }, toggle() {} },
        addEventListener() {}, focus() {},
      };
      Object.defineProperty(item, 'valueAsNumber', { get() { return Number(this.value); } });
      elements.set(id, item);
    }
    return elements.get(id);
  }
  const mapMarkers = [];
  const context = vm.createContext({
    console, Date, Number, JSON, Math, alert(message) { warnings.push(message); }, confirm() { return true; },
    SiteDialog: dialog,
    document: { getElementById: element },
    window: { localStorage: { getItem() { return null; }, setItem(key, value) { if (storageFails) throw new Error('Storage blocked'); writes.push(JSON.parse(value)); } }, matchMedia() { return { matches: false }; } },
    setTimeout(callback) { callback(); },
    L: { circleMarker(coords) { const marker = { coords, addTo() { mapMarkers.push(marker); return marker; }, bindPopup(html) { this.popup = html; }, on() {} }; return marker; },
      featureGroup() { return { getBounds() { return { pad() { return {}; } }; } }; } },
  });
  vm.runInContext(dataModule, context);
  vm.runInContext(application, context);
  return { element, writes, warnings, dialog, mapMarkers, run(expression) { return vm.runInContext(expression, context); } };
}

test('canceling an added site leaves the saved data and rendered count intact', () => {
  const dashboard = createDashboard();
  const before = dashboard.run('JSON.stringify(sites)');
  dashboard.run('addNewSite()');
  assert.equal(dashboard.element('edit-title').textContent, 'Add Site');
  assert.equal(dashboard.element('delete-site').hidden, true);
  dashboard.element('edit-name').value = 'Unsaved draft';
  dashboard.run('closeModal(); saveSite();');
  assert.equal(dashboard.run('JSON.stringify(sites)'), before);
  assert.equal(dashboard.writes.length, 0);
  assert.equal(dashboard.run('editingDraft'), null);
});

test('saving a new draft commits exactly once; editing preserves stored metadata', () => {
  const dashboard = createDashboard();
  const count = dashboard.run('sites.length');
  dashboard.run('addNewSite()');
  dashboard.element('edit-name').value = 'Saved site';
  dashboard.run('saveSite(); saveSite();');
  assert.equal(dashboard.run('sites.length'), count + 1);
  assert.equal(dashboard.writes.length, 1);
  assert.equal(dashboard.run('sites[sites.length - 1].name'), 'Saved site');
  const date = dashboard.run('sites[0].date_added');
  dashboard.run('editSite(0)');
  dashboard.element('edit-name').value = 'Renamed site';
  dashboard.run('saveSite()');
  assert.equal(dashboard.run('sites[0].name'), 'Renamed site');
  assert.equal(dashboard.run('sites[0].date_added'), date);
});

test('validation and persistence failures leave an editable draft without changing data', () => {
  for (const storageFails of [false, true]) {
    const dashboard = createDashboard({ storageFails });
    const before = dashboard.run('JSON.stringify(sites)');
    dashboard.run('addNewSite()');
    if (!storageFails) dashboard.element('edit-sqft').value = '-1';
    dashboard.run('saveSite()');
    assert.equal(dashboard.run('JSON.stringify(sites)'), before);
    assert.equal(dashboard.writes.length, 0);
    assert.equal(dashboard.element('editModal').classList.contains('active'), true);
  }
});

test('the maximum score is reachable and the original tier boundaries stay intact', () => {
  const dashboard = createDashboard();
  const best = dashboard.run('scoreSite({sqft:5250,monthly_rent:0,has_driveway:true,has_outdoor_space:true,has_kitchen_area:true,zoning_clear:true})');
  assert.equal(best.total, 84);
  assert.equal(best.tier, 'GREEN');
  assert.equal(dashboard.run('scoreSite({sqft:5250,monthly_rent:11812.5,has_driveway:true,has_outdoor_space:true,has_kitchen_area:true,zoning_clear:true}).tier'), 'GREEN');
  assert.equal(dashboard.run('scoreSite({sqft:5250,monthly_rent:11813,has_driveway:true,has_outdoor_space:true,has_kitchen_area:true,zoning_clear:true}).tier'), 'YELLOW');
  assert.match(dashboard.element('grid').innerHTML, /<span>\/84<\/span>/);
});

test('annual margin uses revenue minus costs, including deficits and exact break-even', () => {
  const dashboard = createDashboard();
  const nyc = dashboard.run('costAnalysis(demoSites[0])');
  assert.equal(nyc.totalCost, 2224000);
  assert.equal(nyc.breakEven, 149);
  assert.equal(nyc.margin, 3176000);
  const deficit = dashboard.run('costAnalysis({sqft:50,monthly_rent:15000})');
  assert.equal(deficit.margin, 15000 - deficit.totalCost);
  assert.ok(deficit.margin < 0);
  assert.equal(dashboard.run("formatMoney(-1000)"), '−$1,000');
});

test('maps support ZIP+4 and report every omitted site rather than silently losing it', () => {
  const dashboard = createDashboard();
  dashboard.run("sites = [{...sites[0],zip_code:'10038-1234'}, {...sites[1],zip_code:'90210'}, {...sites[2],zip_code:null}]; map = {removeLayer(){}, fitBounds(){}}; updateMarkers();");
  assert.equal(dashboard.mapMarkers.length, 1);
  assert.equal(JSON.stringify(dashboard.mapMarkers[0].coords), JSON.stringify([40.71, -74]));
  assert.match(dashboard.element('map-status').textContent, /Showing 1 of 3 sites/);
  assert.match(dashboard.element('map-status').textContent, /2 sites are not mapped/);
  assert.match(dashboard.mapMarkers[0].popup, /\/84/);
});

test('rendered card and map labels keep hostile imported text inert', () => {
  const dashboard = createDashboard();
  dashboard.run(`sites[0].name = '<img src=x onerror="alert(1)">'; render(); map = {removeLayer(){}, fitBounds(){}}; updateMarkers();`);
  assert.doesNotMatch(dashboard.element('grid').innerHTML, /<img src=x/);
  assert.match(dashboard.element('grid').innerHTML, /&lt;img/);
  assert.doesNotMatch(dashboard.mapMarkers[0].popup, /<img src=x/);
});

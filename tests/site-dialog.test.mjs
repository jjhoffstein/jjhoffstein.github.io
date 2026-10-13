import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/site-dialog.js', import.meta.url), 'utf8');

function createDialogHarness() {
  const handlers = new Map();
  const document = {
    activeElement: null,
    addEventListener(type, handler) { handlers.set(type, handler); },
  };
  function element(name, parent, focusable = false) {
    const item = {
      name, parentElement: parent, children: [], inert: false, visible: true, disabled: false,
      tabIndex: focusable ? 0 : -1, isConnected: true, attributes: {},
      setAttribute(key, value) { this.attributes[key] = value; },
      getClientRects() { return this.visible ? [{}] : []; },
      closest() { let node = this; while (node) { if (node.inert) return node; node = node.parentElement; } return null; },
      contains(target) { return this === target || this.children.some(child => child.contains(target)); },
      focus() { document.activeElement = this; },
      querySelectorAll() { return this.children.flatMap(child => [child, ...child.querySelectorAll()]); },
    };
    if (parent) parent.children.push(item);
    return item;
  }
  document.body = element('body');
  const wrapper = element('wrapper', document.body);
  const trigger = element('trigger', wrapper, true);
  const untouched = element('already inert', wrapper);
  untouched.inert = true;
  const modal = element('modal', document.body);
  const first = element('first', modal, true);
  const disabled = element('disabled', modal, true); disabled.disabled = true;
  const hidden = element('hidden', modal, true); hidden.visible = false;
  const last = element('last', modal, true);
  const window = {};
  vm.runInNewContext(source, { document, window });
  trigger.focus();
  let closes = 0;
  function close() { closes++; window.SiteDialog.close(modal); }
  return {
    document, element, wrapper, trigger, untouched, modal, first, last, dialog: window.SiteDialog,
    get closes() { return closes; },
    open(options = {}) { window.SiteDialog.open(modal, { onClose: close, ...options }); },
    key(key, shiftKey = false) {
      const event = { key, shiftKey, prevented: false, stopped: false,
        preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
      handlers.get('keydown')(event); return event;
    },
    focusOutside() { trigger.focus(); handlers.get('focusin')({ target: trigger }); },
  };
}

test('opening moves focus inside, disables background interaction and sets dialog semantics', () => {
  const harness = createDialogHarness();
  harness.open();
  assert.equal(harness.document.activeElement, harness.first);
  assert.equal(harness.wrapper.inert, true);
  assert.equal(harness.modal.attributes.role, 'dialog');
  assert.equal(harness.modal.attributes['aria-modal'], 'true');
  assert.equal(harness.modal.attributes['aria-hidden'], 'false');
  assert.equal(harness.dialog.isOpen(), true);
});

test('Tab wraps in both directions and excludes hidden or disabled controls', () => {
  const harness = createDialogHarness();
  harness.open();
  const backwards = harness.key('Tab', true);
  assert.equal(backwards.prevented, true);
  assert.equal(harness.document.activeElement, harness.last);
  harness.key('Tab');
  assert.equal(harness.document.activeElement, harness.first);
  harness.focusOutside();
  assert.equal(harness.document.activeElement, harness.first);
});

test('Escape closes immediately, restores focus and preserves existing inert states', () => {
  const harness = createDialogHarness();
  harness.open();
  const event = harness.key('Escape');
  assert.equal(event.prevented, true);
  assert.equal(event.stopped, true);
  assert.equal(harness.closes, 1);
  assert.equal(harness.wrapper.inert, false);
  assert.equal(harness.untouched.inert, true);
  assert.equal(harness.document.activeElement, harness.trigger);
  assert.equal(harness.dialog.isOpen(), false);
  assert.equal(harness.modal.inert, true);
});

test('a dialog inside the page disables sibling branches without disabling its own ancestors', () => {
  const harness = createDialogHarness();
  const nested = harness.element('nested dialog', harness.wrapper);
  const control = harness.element('nested control', nested, true);
  harness.dialog.open(nested, { onClose() { harness.dialog.close(nested); } });
  assert.equal(harness.wrapper.inert, false);
  assert.equal(harness.trigger.inert, true);
  assert.equal(nested.inert, false);
  assert.equal(harness.document.activeElement, control);
  harness.dialog.close(nested);
  assert.equal(harness.trigger.inert, false);
  assert.equal(harness.untouched.inert, true);
});

test('closing restores a replacement control when the original trigger was removed', () => {
  const harness = createDialogHarness();
  const replacement = harness.element('replacement', harness.wrapper, true);
  harness.open({ restoreFocus: () => replacement });
  harness.trigger.isConnected = false;
  harness.dialog.close(harness.modal);
  assert.equal(harness.document.activeElement, replacement);
});

test('an empty or asynchronously loaded menu still traps focus', () => {
  const harness = createDialogHarness();
  harness.modal.children = [];
  harness.open();
  assert.equal(harness.document.activeElement, harness.modal);
  assert.equal(harness.key('Tab').prevented, true);
  assert.equal(harness.document.activeElement, harness.modal);
});

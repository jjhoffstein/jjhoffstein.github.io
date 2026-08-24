import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('CI runs the complete site test suite on pull requests and master', () => {
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:\s*\n\s*branches:\s*\n\s*- master/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /jobs:\s*\n\s*tests:\s*\n\s*name: Tests/);
  assert.match(workflow, /uses: actions\/checkout@v7/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /uses: actions\/setup-node@v7/);
  assert.match(workflow, /node-version: ['"]24['"]/);
  assert.match(workflow, /package-manager-cache: false/);
  assert.match(workflow, /timeout-minutes: 5/);
  assert.match(workflow, /run: node --test tests\/\*\.test\.mjs/);
});

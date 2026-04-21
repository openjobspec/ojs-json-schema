import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildSchemaRegistry,
  discoverSchemas,
  registerSchemas,
  repositoryRoot,
  runValidation,
  validateFixtureDirectory,
} from './schema-harness.js';

test('schema discovery failures are fatal and identify the path', () => {
  const missingDirectory = path.join(os.tmpdir(), 'ojs-missing-schema-directory');
  assert.throws(
    () => discoverSchemas([missingDirectory]),
    /Unable to discover schemas in .*ojs-missing-schema-directory/,
  );
});

test('schema parse and registration failures are fatal', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ojs-schema-errors-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const malformedPath = path.join(directory, 'malformed.schema.json');
  fs.writeFileSync(malformedPath, '{');
  assert.throws(
    () => discoverSchemas([directory]),
    /Unable to load schema .*malformed\.schema\.json/,
  );

  fs.rmSync(malformedPath);
  const duplicateId = 'https://openjobspec.org/tests/duplicate.json';
  const records = ['first.schema.json', 'second.schema.json'].map((fileName) => ({
    filePath: path.join(directory, fileName),
    schema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: duplicateId,
      type: 'object',
    },
  }));
  assert.throws(
    () => registerSchemas(records),
    /Unable to register schema .*second\.schema\.json: schema with key or id .* already exists/,
  );
});

test('fixture validation unit owns expectation, counting, and reporting', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ojs-fixtures-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, '02-rejected.json'), '{"valid":false}\n');
  fs.writeFileSync(path.join(directory, '01-accepted.json'), '{"valid":true}\n');
  fs.writeFileSync(path.join(directory, 'ignored.txt'), 'not a fixture\n');

  const output = [];
  const validate = (data) => data.valid;
  const result = validateFixtureDirectory({
    directory,
    expectedValid: true,
    validate,
    log: (...parts) => output.push(parts),
  });

  assert.deepEqual(output, [
    ['✓', '01-accepted.json'],
    ['✗', '02-rejected.json', undefined],
  ]);
  assert.deepEqual(result, {
    passed: 1,
    failed: 1,
    summary: 'Valid fixtures: 1 passed, 1 failed',
  });
});

test('every public schema compiles using canonical IDs only', () => {
  const { ajv, records, validators } = buildSchemaRegistry();
  assert.equal(validators.size, records.length);

  for (const { filePath, schema } of records) {
    const fileNameAlias = new URL(path.basename(filePath), schema.$id).href;
    if (fileNameAlias !== schema.$id) {
      assert.equal(
        ajv.getSchema(fileNameAlias),
        undefined,
        `${path.relative(repositoryRoot, filePath)} registered a synthetic filename alias`,
      );
    }

    const validate = validators.get(filePath);
    assert.equal(validate(null), false, `${path.relative(repositoryRoot, filePath)} accepted null`);

    if (Array.isArray(schema.examples) && schema.examples.length > 0) {
      assert.equal(
        validate(schema.examples[0]),
        true,
        `${path.relative(repositoryRoot, filePath)} rejected its first example: ${JSON.stringify(validate.errors)}`,
      );
    }
  }
});

test('affected schemas validate through canonical external references', () => {
  const { ajv } = buildSchemaRegistry();
  const migrationExport = ajv.getSchema(
    'https://openjobspec.org/schemas/v1/migration-export.json',
  );
  const workflowBuilder = ajv.getSchema(
    'https://openjobspec.org/schemas/v1/workflow-builder.json',
  );

  const migration = {
    version: '1.0',
    source: {
      backend: 'redis',
      url: 'redis://localhost:6379',
    },
    exported_at: '2026-08-04T00:00:00Z',
    jobs: [
      {
        id: 'job-1',
        type: 'email.send',
        queue: 'default',
        state: 'available',
        args: [],
        retry: {
          max_attempts: 3,
        },
        unique: {
          keys: ['type'],
          on_conflict: 'reject',
        },
      },
    ],
  };
  assert.equal(migrationExport(migration), true, JSON.stringify(migrationExport.errors));

  const invalidRetry = structuredClone(migration);
  invalidRetry.jobs[0].retry.max_attempts = -1;
  assert.equal(migrationExport(invalidRetry), false);

  const invalidUnique = structuredClone(migration);
  invalidUnique.jobs[0].unique.on_conflict = 'overwrite';
  assert.equal(migrationExport(invalidUnique), false);

  const builder = {
    version: '1.0',
    workflow: {
      type: 'chain',
      steps: [
        {
          type: 'email.send',
          args: [],
        },
      ],
    },
    canvas: {
      nodes: [],
      edges: [],
    },
  };
  assert.equal(workflowBuilder(builder), true, JSON.stringify(workflowBuilder.errors));

  const invalidWorkflow = structuredClone(builder);
  invalidWorkflow.workflow.type = 'sequence';
  assert.equal(workflowBuilder(invalidWorkflow), false);
});

test('validates repository fixtures', () => {
  assert.equal(runValidation(), 0);
});

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));

export const repositoryRoot = path.join(testsDir, '..');
export const schemaRoots = [
  path.join(repositoryRoot, 'schemas'),
  path.join(repositoryRoot, 'extensions'),
];
export const jobSchemaId = 'https://openjobspec.org/schemas/v1/job.json';

function displayPath(filePath) {
  const relativePath = path.relative(repositoryRoot, filePath);
  return relativePath.startsWith('..') ? filePath : relativePath;
}

function readJson(filePath, kind) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to load ${kind} ${displayPath(filePath)}: ${error.message}`, {
      cause: error,
    });
  }
}

function discoverJsonFiles(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Unable to discover schemas in ${displayPath(directory)}: ${error.message}`, {
      cause: error,
    });
  }

  return entries
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return discoverJsonFiles(entryPath);
      }
      return entry.name.endsWith('.json') ? [entryPath] : [];
    });
}

export function discoverSchemas(roots = schemaRoots) {
  return roots
    .flatMap(discoverJsonFiles)
    .map((filePath) => ({ filePath, schema: readJson(filePath, 'schema') }))
    .filter(({ schema }) => schema.$schema)
    .map((record) => {
      if (!record.schema.$id) {
        throw new Error(`Schema ${displayPath(record.filePath)} is missing $id`);
      }
      return record;
    });
}

export function createAjv() {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  return ajv;
}

export function registerSchemas(records, ajv = createAjv()) {
  for (const record of records) {
    try {
      ajv.addSchema(record.schema);
    } catch (error) {
      throw new Error(
        `Unable to register schema ${displayPath(record.filePath)}: ${error.message}`,
        { cause: error },
      );
    }
  }
  return ajv;
}

export function compileSchemas(records, ajv) {
  const validators = new Map();
  for (const { filePath, schema } of records) {
    try {
      const validate = ajv.getSchema(schema.$id);
      if (!validate) {
        throw new Error(`AJV did not return a validator for ${schema.$id}`);
      }
      validators.set(filePath, validate);
    } catch (error) {
      throw new Error(`Unable to compile schema ${displayPath(filePath)}: ${error.message}`, {
        cause: error,
      });
    }
  }
  return validators;
}

export function buildSchemaRegistry(roots = schemaRoots) {
  const records = discoverSchemas(roots);
  const ajv = registerSchemas(records);
  const validators = compileSchemas(records, ajv);
  return { ajv, records, validators };
}

function fixtureFiles(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    throw new Error(`Unable to read fixture directory ${displayPath(directory)}: ${error.message}`, {
      cause: error,
    });
  }

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();
}

export function validateFixtureDirectory({
  directory,
  expectedValid,
  validate,
  log = console.log,
}) {
  let passed = 0;
  let failed = 0;

  for (const fileName of fixtureFiles(directory)) {
    const data = readJson(path.join(directory, fileName), 'fixture');
    const valid = validate(data);
    if (valid === expectedValid) {
      passed++;
      log(expectedValid ? '✓' : '✓ (correctly rejected)', fileName);
      continue;
    }

    failed++;
    if (expectedValid) {
      log('✗', fileName, JSON.stringify(validate.errors, null, 2));
    } else {
      log('✗ (should have been rejected)', fileName);
    }
  }

  return {
    passed,
    failed,
    summary: expectedValid
      ? `Valid fixtures: ${passed} passed, ${failed} failed`
      : `Invalid fixtures: ${passed} correctly rejected, ${failed} incorrectly accepted`,
  };
}

export function runValidation({ log = console.log } = {}) {
  const { ajv } = buildSchemaRegistry();
  const jobSchema = ajv.getSchema(jobSchemaId);
  if (!jobSchema) {
    throw new Error(`Registered job schema is unavailable: ${jobSchemaId}`);
  }

  const valid = validateFixtureDirectory({
    directory: path.join(testsDir, 'valid'),
    expectedValid: true,
    validate: jobSchema,
    log,
  });
  const invalid = validateFixtureDirectory({
    directory: path.join(testsDir, 'invalid'),
    expectedValid: false,
    validate: jobSchema,
    log,
  });

  log();
  log(valid.summary);
  log(invalid.summary);
  return valid.failed + invalid.failed;
}


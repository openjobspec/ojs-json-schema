import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);

// Load all schemas
const schemaDir = path.join(__dirname, '..', 'schemas', 'v1');
function loadSchemas(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      loadSchemas(fp);
      continue;
    }
    if (!f.endsWith('.schema.json')) continue;
    const s = JSON.parse(fs.readFileSync(fp, 'utf8'));
    try {
      ajv.addSchema(s);
    } catch (e) {
      console.log('Schema load error:', f, e.message);
    }
  }
}
loadSchemas(schemaDir);

const jobSchema = ajv.getSchema('https://openjobspec.org/schemas/v1/job.json');

// Validate valid fixtures
const validDir = path.join(__dirname, 'valid');
let pass = 0, fail = 0;
for (const f of fs.readdirSync(validDir).sort()) {
  if (!f.endsWith('.json')) continue;
  const data = JSON.parse(fs.readFileSync(path.join(validDir, f), 'utf8'));
  const valid = jobSchema(data);
  if (valid) {
    pass++;
    console.log('✓', f);
  } else {
    fail++;
    console.log('✗', f, JSON.stringify(jobSchema.errors, null, 2));
  }
}

// Validate invalid fixtures
const invalidDir = path.join(__dirname, 'invalid');
let invalidPass = 0, invalidFail = 0;
for (const f of fs.readdirSync(invalidDir).sort()) {
  if (!f.endsWith('.json')) continue;
  const data = JSON.parse(fs.readFileSync(path.join(invalidDir, f), 'utf8'));
  const valid = jobSchema(data);
  if (!valid) {
    invalidPass++;
    console.log('✓ (correctly rejected)', f);
  } else {
    invalidFail++;
    console.log('✗ (should have been rejected)', f);
  }
}

console.log();
console.log(`Valid fixtures: ${pass} passed, ${fail} failed`);
console.log(`Invalid fixtures: ${invalidPass} correctly rejected, ${invalidFail} incorrectly accepted`);
process.exit(fail + invalidFail);

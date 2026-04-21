import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const sourceRoots = ['schemas', 'extensions'];

rmSync(dist, { recursive: true, force: true });

for (const sourceRoot of sourceRoots) {
  for (const sourcePath of discoverJson(path.join(root, sourceRoot))) {
    const relativePath = path.relative(root, sourcePath);
    const schema = JSON.parse(readFileSync(sourcePath, 'utf8'));
    const serialized = JSON.stringify(schema, null, 2);
    const esmPath = path.join(dist, 'esm', `${relativePath}.js`);
    const cjsPath = path.join(dist, 'cjs', `${relativePath}.cjs`);

    mkdirSync(path.dirname(esmPath), { recursive: true });
    mkdirSync(path.dirname(cjsPath), { recursive: true });
    writeFileSync(esmPath, `export default ${serialized};\n`);
    writeFileSync(cjsPath, `'use strict';\nmodule.exports = ${serialized};\n`);
  }
}

const typesPath = path.join(dist, 'types', 'schema.d.ts');
mkdirSync(path.dirname(typesPath), { recursive: true });
writeFileSync(
  typesPath,
  'declare const schema: Record<string, unknown>;\nexport default schema;\n',
);
writeFileSync(
  path.join(dist, 'types', 'schema.d.cts'),
  'declare const schema: Record<string, unknown>;\nexport = schema;\n',
);

console.log('Generated ESM and CommonJS wrappers for packed JSON schemas.');

function discoverJson(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return discoverJson(entryPath);
      return entry.name.endsWith('.json') ? [entryPath] : [];
    });
}

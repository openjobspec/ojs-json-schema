import {
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(
  readFileSync(path.join(root, 'package-lock.json'), 'utf8'),
);
const changelog = readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
const scratch = path.join(root, '.package-smoke');
const nodeBinary = process.env.OJS_TEST_NODE ?? process.execPath;
let tarball;

if (lock.version !== pkg.version || lock.packages['']?.version !== pkg.version) {
  throw new Error('package.json and package-lock.json versions do not match');
}
if (!changelog.includes(`## [${pkg.version}]`)) {
  throw new Error(`CHANGELOG.md has no ${pkg.version} release heading`);
}

try {
  rmSync(scratch, { recursive: true, force: true });
  mkdirSync(scratch, { recursive: true });

  const dryRun = JSON.parse(
    run('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], root),
  )[0];
  const packedFiles = new Set(dryRun.files.map((file) => file.path));
  const specifiers = [];

  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (subpath.includes('*')) continue;
    const targets = [
      target['openjobspec-schema'],
      target.import.types,
      target.import.default,
      target.require.types,
      target.require.default,
    ];
    for (const exportedTarget of targets) {
      const packedPath = exportedTarget.replace(/^\.\//, '');
      if (!packedFiles.has(packedPath)) {
        throw new Error(`Packed package omitted export target: ${packedPath}`);
      }
    }
    specifiers.push(
      subpath === '.' ? pkg.name : `${pkg.name}/${subpath.slice(2)}`,
    );
  }

  const packed = JSON.parse(
    run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', scratch],
      root,
    ),
  )[0];
  tarball = path.join(scratch, packed.filename);
  const packageDir = path.join(
    scratch,
    'consumer',
    'node_modules',
    '@openjobspec',
    'schemas',
  );
  mkdirSync(packageDir, { recursive: true });
  run('tar', ['-xzf', tarball, '--strip-components=1', '-C', packageDir], root);

  const consumerDir = path.join(scratch, 'consumer');
  writeFileSync(
    path.join(consumerDir, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );
  writeFileSync(
    path.join(consumerDir, 'import-smoke.mjs'),
    `const specifiers = ${JSON.stringify(specifiers)};\n` +
      "for (const specifier of specifiers) {\n" +
      "  const loaded = await import(specifier);\n" +
      "  if (!loaded.default || typeof loaded.default !== 'object') throw new Error(`Invalid ESM export: ${specifier}`);\n" +
      "}\n" +
      "const wildcard = await import('@openjobspec/schemas/schemas/v1/job.schema.json');\n" +
      "if (!wildcard.default?.$id) throw new Error('Invalid wildcard ESM export');\n",
  );
  writeFileSync(
    path.join(consumerDir, 'require-smoke.cjs'),
    `const specifiers = ${JSON.stringify(specifiers)};\n` +
      "for (const specifier of specifiers) {\n" +
      "  const loaded = require(specifier);\n" +
      "  if (!loaded || typeof loaded !== 'object') throw new Error(`Invalid CommonJS export: ${specifier}`);\n" +
      "}\n" +
      "const wildcard = require('@openjobspec/schemas/schemas/v1/job.schema.json');\n" +
      "if (!wildcard.$id) throw new Error('Invalid wildcard CommonJS export');\n",
  );
  run(nodeBinary, ['import-smoke.mjs'], consumerDir);
  run(nodeBinary, ['require-smoke.cjs'], consumerDir);

  const typeSpecifiers = [
    ...specifiers,
    '@openjobspec/schemas/schemas/v1/job.schema.json',
  ];
  const cjsImports = typeSpecifiers
    .map((specifier, index) => `import schema${index} = require('${specifier}');`)
    .join('\n');
  const uses = `void [${typeSpecifiers.map((_, index) => `schema${index}`).join(', ')}];\n`;
  writeFileSync(
    path.join(consumerDir, 'consumer.cts'),
    `${cjsImports}\n${uses}`,
  );
  for (const moduleKind of ['Node16', 'NodeNext']) {
    writeFileSync(
      path.join(consumerDir, `tsconfig.${moduleKind.toLowerCase()}.json`),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: moduleKind,
          moduleResolution: moduleKind,
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        files: ['consumer.cts'],
      }),
    );
  }
  const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  run(process.execPath, [tsc, '-p', 'tsconfig.node16.json'], consumerDir);
  run(process.execPath, [tsc, '-p', 'tsconfig.nodenext.json'], consumerDir);

  console.log(
    `Verified ${specifiers.length} packed schema exports under ESM/CommonJS runtime and Node16/NodeNext CommonJS types.`,
  );
} finally {
  if (tarball) rmSync(tarball, { force: true });
  rmSync(scratch, { recursive: true, force: true });
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

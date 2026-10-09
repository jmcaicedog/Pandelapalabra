import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

test('Node ESM carga el JSON del santoral sin bundler ni loader TypeScript', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'panvivo-native-santoral-'));
  try {
    await mkdir(join(directory, 'data'));
    await mkdir(join(directory, 'lib'));
    await writeFile(join(directory, 'package.json'), '{"type":"module"}');
    for (const file of ['data/colombianSaints', 'data/saintsCalendar', 'lib/dateUtils']) {
      const source = await readFile(new URL(`../${file}.ts`, import.meta.url), 'utf8');
      const result = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      });
      await writeFile(join(directory, `${file}.js`), result.outputText);
    }
    await copyFile(
      new URL('../data/colombianEditorialSaints.json', import.meta.url),
      join(directory, 'data/colombianEditorialSaints.json'),
    );
    const { stdout } = await promisify(execFile)(process.execPath, [
      '--input-type=module', '--eval',
      `import { getEditorialSaint } from './data/colombianSaints.js';
       console.log(JSON.stringify([
         getEditorialSaint('2026-10-08').saint.name,
         getEditorialSaint('2026-10-09').saint.name,
         getEditorialSaint('2028-02-29').saint.name,
       ]));`,
    ], { cwd: directory, timeout: 10000, env: { ...process.env, NODE_OPTIONS: '' } });
    assert.deepEqual(JSON.parse(stdout), [
      'Santa Pelagia de Antioquía', 'San Luis Bertrán', 'San Osvaldo de Worcester',
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

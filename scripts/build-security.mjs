import { readFile, writeFile } from 'node:fs/promises';
import { minify } from 'terser';

const source = await readFile(new URL('../dist/security.js', import.meta.url), 'utf8');
const result = await minify(source, {
  compress: { passes: 2, drop_console: false },
  mangle: { toplevel: true },
  format: { comments: false },
});

if (!result.code) throw new Error('La minification de security.js a échoué.');
await writeFile(new URL('../dist/security.min.js', import.meta.url), `${result.code}\n`, 'utf8');
console.log(`security.min.js généré (${Buffer.byteLength(result.code)} octets).`);

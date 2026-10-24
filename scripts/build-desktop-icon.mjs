import { mkdir, readFile, writeFile } from 'node:fs/promises';
import pngToIco from 'png-to-ico';

const source = new URL('../dist/assets/branding/stoa-mark-400.png', import.meta.url);
const output = new URL('../build/icon.ico', import.meta.url);
await mkdir(new URL('../build/', import.meta.url), { recursive: true });
const icon = await pngToIco(await readFile(source));
await writeFile(output, icon);
console.log('Icône Electron créée : build/icon.ico');

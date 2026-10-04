import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

async function files(directory){const entries=await readdir(directory,{withFileTypes:true});const output=[];for(const entry of entries){const path=join(directory,entry.name);if(entry.isDirectory())output.push(...await files(path));else if(/\.(?:js|mjs|cjs)$/.test(entry.name))output.push(path);}return output;}
const targets=[...(await files('dist')),...(await files('api')), ...(await files('scripts'))].filter(path=>!path.endsWith('check-js.mjs'));
for(const path of targets){const result=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`${targets.length} fichiers JavaScript valides.`);

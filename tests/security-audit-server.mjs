import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.STOA_SECURITY_AUDIT_PORT || 4317);
const mockSupabase = `
export const supabase={
  auth:{
    getSession:async()=>({data:{session:{access_token:'e30.e30.e30',user:{id:'audit-user',email:'audit@stoa.test'}}}}),
    signOut:async()=>({error:null})
  },
  from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{role:'member',username:'audit'}})})
};`;
const fixture = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="/security.min.js"></script><link rel="stylesheet" href="/security.css"></head><body><main><article id="lesson-content"><h1>Leçon audit</h1><div id="lesson-copy"><p id="protected-text">Texte pédagogique confidentiel à protéger.</p><img id="protected-image" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Test"><input id="allowed-input" data-allow-select value="Champ autorisé"></div></article></main><script>window.dispatchEvent(new CustomEvent('stoa:lesson-ready'));</script></body></html>`;
const emptyShell = '<!doctype html><html><head><meta charset="utf-8"></head><body><article id="lesson-content"><div id="lesson-copy"></div></article></body></html>';
const types = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8' };

createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/module' || pathname === '/module.html') {
    response.writeHead(200, { 'content-type': types['.html'], 'cache-control': 'no-store' });
    response.end(fixture);
    return;
  }
  if (pathname === '/module-shell') {
    response.writeHead(200, { 'content-type': types['.html'] });
    response.end(emptyShell);
    return;
  }
  if (pathname === '/supabase.js') {
    response.writeHead(200, { 'content-type': types['.js'] });
    response.end(mockSupabase);
    return;
  }
  const file = join(root, pathname.replace(/^\//, ''));
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Security audit fixture: http://127.0.0.1:${port}`));

// Builds the hosted web demo: the real frontend (public/ + shared/) bundled into ONE html file,
// with the HTTP API swapped for demo/api-demo.js (data lives in the visitor's browser).
//
//   npm run build:demo   →  dist/bock-demo.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEMO_API = path.join(ROOT, 'demo', 'api-demo.js');

const resolvePaths = {
  name: 'bock-paths',
  setup(b) {
    // Browser-absolute imports like '/shared/format.js' → repo folder
    b.onResolve({ filter: /^\/shared\// }, (args) => ({ path: path.join(ROOT, args.path) }));
    // Every import of the real API client gets the in-browser demo API instead
    b.onResolve({ filter: /\/api\.js$/ }, (args) =>
      args.importer === DEMO_API ? undefined : { path: DEMO_API },
    );
  },
};

const result = await build({
  entryPoints: [path.join(ROOT, 'public/js/app.js')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  charset: 'utf8',
  write: false,
  plugins: [resolvePaths],
});

const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(ROOT, 'public/css/app.css'), 'utf8');

// Body of public/index.html without the head/script tags; the artifact host adds the document skeleton.
const html = `<title>Bock</title>
<meta name="description" content="Wer hat Zeit? Wer hat Bock? Wer braucht Hilfe? Demo der privaten Freundeskreis-App.">
<style>${css}</style>
<div id="app">
  <main id="view" class="view" aria-live="polite"><div class="splash"><div class="splash-logo">🤙</div></div></main>
  <nav id="tabbar" class="tabbar" hidden></nav>
</div>
<div id="sheet-root"></div>
<div id="toast-root" aria-live="assertive"></div>
<script>${js}</script>
`;

const out = path.join(ROOT, 'dist', 'bock-demo.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`✓ ${path.relative(ROOT, out)} (${(html.length / 1024).toFixed(0)} KB)`);

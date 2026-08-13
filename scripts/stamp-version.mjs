// Estampa la versión de build en dos lugares que deben coincidir:
//   - src/environments/version.ts  → queda compilada dentro del bundle
//   - public/version.json          → se sirve como archivo estático en /version.json
// La app compara ambas en runtime: si difieren, hay una versión nueva desplegada.
// Se ejecuta automáticamente vía `npm run build:prod`.
import { writeFileSync, mkdirSync } from 'node:fs';

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const version = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.${pad(now.getHours())}${pad(now.getMinutes())}`;

mkdirSync('src/environments', { recursive: true });
mkdirSync('public', { recursive: true });

writeFileSync(
  'src/environments/version.ts',
  `// Generado por scripts/stamp-version.mjs — NO editar a mano.\nexport const APP_VERSION = '${version}';\n`,
);
writeFileSync('public/version.json', JSON.stringify({ version }) + '\n');

console.log(`[stamp-version] APP_VERSION = ${version}`);

# Despliegue a producción — Metscan Admin

Panel Angular desplegado en **Firebase Hosting**:
- https://meterscan-admin.web.app
- https://meterscan-admin.favric.cl

API de producción: `https://scan-service.favric.cl/api` (repo `meter-scanner-api`, corre en Docker en el VPS).

## Regla de oro: compilar SIEMPRE con `build:prod`

```bash
npm run build:prod
```

**Nunca uses `ng build` a secas para producción.** `build:prod` ejecuta primero
`scripts/stamp-version.mjs`, que estampa la versión del build (formato `AAAAMMDD.HHMM`) en dos
archivos que deben coincidir:

| Archivo | Rol |
|---|---|
| `src/environments/version.ts` | Queda compilada dentro del bundle (`APP_VERSION`) |
| `public/version.json` | Se sirve como estático en `/version.json` |

La app compara ambas en runtime (cada 5 min y al volver a la pestaña, ver
`src/app/core/services/version-check.service.ts`). Si difieren, muestra el banner
**«Hay una nueva versión disponible — haz clic aquí para actualizar»**, que evita que la clienta
quede pegada en una versión vieja sin recargar.

Si compilas con `ng build` sin estampar, no se rompe nada, pero **el aviso de nueva versión no
se dispara** para ese deploy.

## Pasos completos

```bash
# 1. Traer lo último
git pull

# 2. Dependencias (solo la primera vez o si cambió package.json)
npm install

# 3. Compilar producción (estampa versión + build)
npm run build:prod

# 4. Desplegar a Firebase Hosting
npx firebase deploy --only hosting
```

Requisitos: sesión de Firebase iniciada (`npx firebase login`, cuenta `admin@favric.cl`).
El proyecto de Firebase es `meterscan-admin` (ya fijado en `.firebaserc`).

## Verificación post-deploy

```bash
curl -s https://meterscan-admin.web.app/version.json
```

Debe devolver la versión recién estampada (la misma que imprimió `[stamp-version]` en el build).
En la app, la versión activa se ve al pie del sidebar («build AAAAMMDD.HHMM»).

## Notas de caché

`firebase.json` sirve `index.html` y `version.json` con `Cache-Control: no-cache` — no cambiar
esos headers: son parte del mecanismo de actualización. El resto de los assets llevan hash en el
nombre, así que pueden cachearse sin riesgo.

## API (referencia rápida)

El backend se despliega aparte (repo `meter-scanner-api`): push a `main` en GitHub y en el VPS
`git pull` + `docker compose -f docker-compose.prod.yml up -d --build web`.

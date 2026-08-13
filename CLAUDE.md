# Metscan Admin — notas para asistentes

Panel de administración Angular 19 (standalone components + signals) de Metscan/HydroScan.
Producción en Firebase Hosting; la API vive en el repo `meter-scanner-api`.

## Despliegue a producción

**Sigue [DEPLOY.md](DEPLOY.md).** Lo esencial:

- Compila SIEMPRE con `npm run build:prod` (nunca `ng build` a secas para prod): estampa la
  versión del build en `src/environments/version.ts` + `public/version.json`, que alimentan el
  banner «hay una nueva versión disponible» de la app.
- Deploy: `npx firebase deploy --only hosting`.
- Verifica: `curl -s https://meterscan-admin.web.app/version.json` debe mostrar la versión nueva.

## Convenciones del proyecto

- Comentarios y textos de UI en español.
- La tabla de Mediciones arranca vacía: los datos se cargan por alcance (mes+año, ciclo o
  pendientes) desde el servidor — no volver a cargar el histórico completo por defecto.
- El Dashboard usa el endpoint liviano `/measurements/summary/`, no descarga filas.
- Sin auto-refresh por defecto; es opt-in desde el menú «Auto» en Mediciones.

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
- La tabla de Mediciones carga por alcance (un mes, un ciclo o pendientes) desde el servidor.
  Al entrar se carga solo el mes en curso; el histórico completo únicamente si el usuario
  elige «Todo el histórico» en el selector de período — no volver a cargarlo por defecto.
- La exportación (planilla XLSX/CSV y ZIP de fotos) vive en un diálogo propio que pide los
  datos al servidor por ciclo o por mes (`MeasurementService.fetchByScope`), sin depender de
  lo que muestra la tabla. El formato de la planilla (Depto-Torre + Lectura, orden torre/depto)
  está en `shared/utils/measurement-export.util.ts`; no cambiarlo sin confirmar con la clienta.
- El Dashboard usa el endpoint liviano `/measurements/summary/`, no descarga filas.
- Sin auto-refresh por defecto; es opt-in desde el menú «Auto» en Mediciones.

import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { DemoModeService } from '../services/demo-mode.service';
import { DemoStoreService } from '../services/demo-store.service';

function id(url: string, pattern: RegExp): string | null {
  const m = url.match(pattern);
  return m ? m[1] : null;
}

function ok(body: unknown, status = 200) {
  return of(new HttpResponse({ status, body }));
}

export const demoInterceptor: HttpInterceptorFn = (req, next) => {
  const demo  = inject(DemoModeService);
  const store = inject(DemoStoreService);

  if (!demo.isActive()) return next(req);

  const url    = req.url;
  const method = req.method;
  const body   = req.body as any;

  // ── /accounts/users/me/ ────────────────────────────────────────────────
  if (url.includes('/accounts/users/me/')) {
    return ok(store.getMe());
  }

  // ── /accounts/users/{id}/assign-apartments/ ───────────────────────────
  if (url.includes('/assign-apartments/') && method === 'POST') {
    const uid = id(url, /\/users\/(\d+)\/assign-apartments\//);
    if (uid) return ok(store.assignApartments(uid, body?.apartment_ids ?? []));
  }

  // ── /accounts/users/{id}/ ─────────────────────────────────────────────
  if (url.includes('/accounts/users/')) {
    const uid = id(url, /\/users\/(\d+)\//);
    if (!uid) {
      if (method === 'GET')  return ok(store.listUsers());
      if (method === 'POST') return ok(store.createUser(body));
    } else {
      if (method === 'PATCH')  return ok(store.updateUser(uid, body));
      if (method === 'DELETE') { store.deleteUser(uid); return ok(null, 204); }
    }
  }

  // ── /buildings/buildings/{id}/ ────────────────────────────────────────
  if (url.includes('/buildings/buildings/')) {
    const bid = id(url, /\/buildings\/buildings\/(\d+)\//);
    if (!bid) {
      if (method === 'GET')  return ok(store.listBuildings());
      if (method === 'POST') return ok(store.createBuilding(body));
    } else {
      if (method === 'PATCH')  return ok(store.updateBuilding(bid, body));
      if (method === 'DELETE') { store.deleteBuilding(bid); return ok(null, 204); }
    }
  }

  // ── /buildings/towers/{id}/ ───────────────────────────────────────────
  if (url.includes('/buildings/towers/')) {
    const tid = id(url, /\/towers\/(\d+)\//);
    if (!tid && method === 'POST') return ok(store.createTower(body));
    if (tid  && method === 'DELETE') { store.deleteTower(tid); return ok(null, 204); }
  }

  // ── /buildings/apartments/ ────────────────────────────────────────────
  if (url.includes('/buildings/apartments/')) {
    if (url.includes('/bulk-create') && method === 'POST') {
      return ok(store.bulkCreateApartments(body));
    }
    const aid = id(url, /\/apartments\/(\d+)\//);
    if (!aid && method === 'POST') return ok(store.createApartment(body));
    if (aid && method === 'PATCH') return ok(store.updateApartment(aid, body));
    if (aid && method === 'DELETE') { store.deleteApartment(aid); return ok(null, 204); }
  }

  // ── /measurements/{id}/ ───────────────────────────────────────────────
  if (url.includes('/measurements/')) {
    const mid = id(url, /\/measurements\/(\d+)\//);
    if (!mid && method === 'GET') return ok(store.listMeasurements());
    if (mid  && method === 'DELETE') { store.deleteMeasurement(mid); return ok(null, 204); }
  }

  // ── /cycles/{id}/progress/ ────────────────────────────────────────────
  if (url.includes('/cycles/') && url.includes('/progress/')) {
    const cid = id(url, /\/cycles\/(\d+)\/progress\//);
    if (cid) return ok(store.getCycleProgress(cid));
  }

  // ── /cycles/{id}/ ────────────────────────────────────────────────────
  if (url.includes('/cycles/')) {
    const cid = id(url, /\/cycles\/(\d+)\//);
    if (!cid) {
      if (method === 'GET')  return ok(store.listCycles());
      if (method === 'POST') return ok(store.createCycle(body));
    } else {
      if (method === 'PATCH')  { store.updateCycleStatus(cid, body?.status); return ok(null); }
      if (method === 'DELETE') { store.deleteCycle(cid); return ok(null, 204); }
    }
  }

  // Fallback: pass through (should not happen in demo mode for known endpoints)
  return ok({});
};

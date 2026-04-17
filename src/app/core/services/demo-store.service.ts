import { Injectable } from '@angular/core';
import { MeasurementCycle, CycleProgressResponse } from '../models/cycle.model';

// ── Private API shapes (mirrors what each service expects from the real backend) ──

interface ApiApt     { id: number; number: string; floor: number; meter_id: string; tower: number; reading_layout: string; }
interface ApiTower   { id: number; name: string; building: number; apartments: ApiApt[]; apartment_count: number; }
interface ApiBuilding { id: number; name: string; address: string; created_at: string; towers: ApiTower[]; tower_count: number; apartment_count: number; }
interface ApiUser    { id: number; username: string; email: string; first_name: string; last_name: string; phone: string; role: string; is_active: boolean; date_joined: string; assigned_apartment_ids: number[]; }
interface ApiMeas    { id: number; apartment: number; operator: number | null; reading_value: string; unit: string; photo: null; photo_url: null; status: string; meter_type: string; latitude: null; longitude: null; captured_at: string; created_at: string; tower_name: string; building_name: string; apartment_number: string; meter_id: string; operator_name: string | null; }
interface ApiPage<T> { count: number; results: T[]; }

// ── Seed helpers ──

function apt(id: number, number: string, floor: number, meter_id: string, tower: number, reading_layout: 'A' | 'B' = 'A'): ApiApt {
  return { id, number, floor, meter_id, tower, reading_layout };
}

function tower(id: number, name: string, building: number, apts: ApiApt[]): ApiTower {
  return { id, name, building, apartments: apts, apartment_count: apts.length };
}

function building(id: number, name: string, address: string, towers: ApiTower[]): ApiBuilding {
  const apt_count = towers.reduce((s, t) => s + t.apartments.length, 0);
  return { id, name, address, created_at: '2024-01-15T10:00:00Z', towers, tower_count: towers.length, apartment_count: apt_count };
}

// ── Seed data ──

const SEED_BUILDINGS: ApiBuilding[] = [
  building(1, 'Edificio Los Robles', 'Av. Libertad 1250, Santiago', [
    tower(1, 'Torre A', 1, [
      apt(1,  '101', 1, 'LR-A-101', 1), apt(2,  '102', 1, 'LR-A-102', 1),
      apt(3,  '201', 2, 'LR-A-201', 1), apt(4,  '202', 2, 'LR-A-202', 1),
      apt(5,  '301', 3, 'LR-A-301', 1), apt(6,  '302', 3, 'LR-A-302', 1),
      apt(7,  '401', 4, 'LR-A-401', 1), apt(8,  '402', 4, 'LR-A-402', 1),
    ]),
    tower(2, 'Torre B', 1, [
      apt(9,  '101', 1, 'LR-B-101', 2), apt(10, '102', 1, 'LR-B-102', 2),
      apt(11, '201', 2, 'LR-B-201', 2), apt(12, '202', 2, 'LR-B-202', 2),
      apt(13, '301', 3, 'LR-B-301', 2), apt(14, '302', 3, 'LR-B-302', 2),
    ]),
  ]),
  building(2, 'Residencial El Parque', 'Calle Los Olmos 456, Las Condes', [
    tower(3, 'Torre Norte', 2, [
      apt(15, '101', 1, 'EP-N-101', 3), apt(16, '102', 1, 'EP-N-102', 3),
      apt(17, '201', 2, 'EP-N-201', 3), apt(18, '202', 2, 'EP-N-202', 3),
      apt(19, '301', 3, 'EP-N-301', 3), apt(20, '302', 3, 'EP-N-302', 3),
    ]),
    tower(4, 'Torre Sur', 2, [
      apt(21, '101', 1, 'EP-S-101', 4), apt(22, '102', 1, 'EP-S-102', 4),
      apt(23, '201', 2, 'EP-S-201', 4), apt(24, '202', 2, 'EP-S-202', 4),
    ]),
  ]),
];

const SEED_USERS: ApiUser[] = [
  { id: 1, username: 'admin', email: 'admin@metscan.io', first_name: 'Admin', last_name: 'Sistema', phone: '', role: 'admin', is_active: true, date_joined: '2024-01-01T00:00:00Z', assigned_apartment_ids: [] },
  { id: 2, username: 'juan.perez', email: 'juan@losrobles.cl', first_name: 'Juan', last_name: 'Pérez', phone: '+56912345678', role: 'operator', is_active: true, date_joined: '2024-02-15T00:00:00Z', assigned_apartment_ids: [1,2,3,4,5,6,7,8] },
  { id: 3, username: 'maria.garcia', email: 'maria@losrobles.cl', first_name: 'María', last_name: 'García', phone: '+56987654321', role: 'operator', is_active: true, date_joined: '2024-03-01T00:00:00Z', assigned_apartment_ids: [9,10,11,12,13,14] },
  { id: 4, username: 'carlos.silva', email: 'carlos@elparque.cl', first_name: 'Carlos', last_name: 'Silva', phone: '+56911111111', role: 'operator', is_active: true, date_joined: '2024-04-10T00:00:00Z', assigned_apartment_ids: [15,16,17,18,19,20,21,22,23,24] },
  { id: 5, username: 'ana.torres', email: 'ana@elparque.cl', first_name: 'Ana', last_name: 'Torres', phone: '+56922222222', role: 'operator', is_active: false, date_joined: '2024-05-20T00:00:00Z', assigned_apartment_ids: [] },
];

function daysAgo(n: number, h = 10, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const SEED_MEASUREMENTS: ApiMeas[] = [
  // Today
  { id: 1,  apartment: 1,  operator: 2, reading_value: '47.3', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(0,9,15),  created_at: daysAgo(0,9,15),  tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '101', meter_id: 'LR-A-101', operator_name: 'Juan Pérez' },
  { id: 2,  apartment: 2,  operator: 2, reading_value: '52.1', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(0,9,45),  created_at: daysAgo(0,9,45),  tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '102', meter_id: 'LR-A-102', operator_name: 'Juan Pérez' },
  { id: 3,  apartment: 9,  operator: 3, reading_value: '38.7', unit: 'm3', photo: null, photo_url: null, status: 'pending_review', meter_type: 'digital_drum', latitude: null, longitude: null, captured_at: daysAgo(0,10,30), created_at: daysAgo(0,10,30), tower_name: 'Torre B', building_name: 'Edificio Los Robles',  apartment_number: '101', meter_id: 'LR-B-101', operator_name: 'María García' },
  // 1 day ago
  { id: 4,  apartment: 3,  operator: 2, reading_value: '61.5', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(1,9,0),   created_at: daysAgo(1,9,0),   tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '201', meter_id: 'LR-A-201', operator_name: 'Juan Pérez' },
  { id: 5,  apartment: 4,  operator: 2, reading_value: '29.8', unit: 'm3', photo: null, photo_url: null, status: 'rejected',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(1,9,30),  created_at: daysAgo(1,9,30),  tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '202', meter_id: 'LR-A-202', operator_name: 'Juan Pérez' },
  { id: 6,  apartment: 15, operator: 4, reading_value: '44.2', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(1,11,0),  created_at: daysAgo(1,11,0),  tower_name: 'Torre Norte', building_name: 'Residencial El Parque', apartment_number: '101', meter_id: 'EP-N-101', operator_name: 'Carlos Silva' },
  // 2 days ago
  { id: 7,  apartment: 5,  operator: 2, reading_value: '55.0', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital_drum', latitude: null, longitude: null, captured_at: daysAgo(2,9,0),   created_at: daysAgo(2,9,0),   tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '301', meter_id: 'LR-A-301', operator_name: 'Juan Pérez' },
  { id: 8,  apartment: 6,  operator: 2, reading_value: '33.4', unit: 'm3', photo: null, photo_url: null, status: 'pending_review', meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(2,9,45),  created_at: daysAgo(2,9,45),  tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '302', meter_id: 'LR-A-302', operator_name: 'Juan Pérez' },
  { id: 9,  apartment: 16, operator: 4, reading_value: '71.8', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(2,10,15), created_at: daysAgo(2,10,15), tower_name: 'Torre Norte', building_name: 'Residencial El Parque', apartment_number: '102', meter_id: 'EP-N-102', operator_name: 'Carlos Silva' },
  // 3 days ago
  { id: 10, apartment: 7,  operator: 2, reading_value: '48.6', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(3,9,0),   created_at: daysAgo(3,9,0),   tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '401', meter_id: 'LR-A-401', operator_name: 'Juan Pérez' },
  { id: 11, apartment: 8,  operator: 2, reading_value: '40.1', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(3,9,30),  created_at: daysAgo(3,9,30),  tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '402', meter_id: 'LR-A-402', operator_name: 'Juan Pérez' },
  { id: 12, apartment: 10, operator: 3, reading_value: '25.9', unit: 'm3', photo: null, photo_url: null, status: 'pending_review', meter_type: 'digital_drum', latitude: null, longitude: null, captured_at: daysAgo(3,11,0),  created_at: daysAgo(3,11,0),  tower_name: 'Torre B', building_name: 'Edificio Los Robles',  apartment_number: '102', meter_id: 'LR-B-102', operator_name: 'María García' },
  // 5 days ago
  { id: 13, apartment: 11, operator: 3, reading_value: '68.3', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(5,8,30),  created_at: daysAgo(5,8,30),  tower_name: 'Torre B', building_name: 'Edificio Los Robles',  apartment_number: '201', meter_id: 'LR-B-201', operator_name: 'María García' },
  { id: 14, apartment: 12, operator: 3, reading_value: '57.7', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(5,9,0),   created_at: daysAgo(5,9,0),   tower_name: 'Torre B', building_name: 'Edificio Los Robles',  apartment_number: '202', meter_id: 'LR-B-202', operator_name: 'María García' },
  { id: 15, apartment: 17, operator: 4, reading_value: '36.5', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital_drum', latitude: null, longitude: null, captured_at: daysAgo(5,10,30), created_at: daysAgo(5,10,30), tower_name: 'Torre Norte', building_name: 'Residencial El Parque', apartment_number: '201', meter_id: 'EP-N-201', operator_name: 'Carlos Silva' },
  { id: 16, apartment: 18, operator: 4, reading_value: '42.0', unit: 'm3', photo: null, photo_url: null, status: 'rejected',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(5,11,15), created_at: daysAgo(5,11,15), tower_name: 'Torre Norte', building_name: 'Residencial El Parque', apartment_number: '202', meter_id: 'EP-N-202', operator_name: 'Carlos Silva' },
  // 7 days ago
  { id: 17, apartment: 13, operator: 3, reading_value: '50.2', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(7,9,0),   created_at: daysAgo(7,9,0),   tower_name: 'Torre B', building_name: 'Edificio Los Robles',  apartment_number: '301', meter_id: 'LR-B-301', operator_name: 'María García' },
  { id: 18, apartment: 14, operator: 3, reading_value: '44.9', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(7,9,30),  created_at: daysAgo(7,9,30),  tower_name: 'Torre B', building_name: 'Edificio Los Robles',  apartment_number: '302', meter_id: 'LR-B-302', operator_name: 'María García' },
  { id: 19, apartment: 21, operator: 4, reading_value: '30.6', unit: 'm3', photo: null, photo_url: null, status: 'pending_review', meter_type: 'digital_drum', latitude: null, longitude: null, captured_at: daysAgo(7,10,0),  created_at: daysAgo(7,10,0),  tower_name: 'Torre Sur',  building_name: 'Residencial El Parque', apartment_number: '101', meter_id: 'EP-S-101', operator_name: 'Carlos Silva' },
  { id: 20, apartment: 22, operator: 4, reading_value: '63.4', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(7,10,45), created_at: daysAgo(7,10,45), tower_name: 'Torre Sur',  building_name: 'Residencial El Parque', apartment_number: '102', meter_id: 'EP-S-102', operator_name: 'Carlos Silva' },
  // 10 days ago
  { id: 21, apartment: 19, operator: 4, reading_value: '58.1', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(10,9,0),  created_at: daysAgo(10,9,0),  tower_name: 'Torre Norte', building_name: 'Residencial El Parque', apartment_number: '301', meter_id: 'EP-N-301', operator_name: 'Carlos Silva' },
  { id: 22, apartment: 20, operator: 4, reading_value: '39.8', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(10,9,30), created_at: daysAgo(10,9,30), tower_name: 'Torre Norte', building_name: 'Residencial El Parque', apartment_number: '302', meter_id: 'EP-N-302', operator_name: 'Carlos Silva' },
  { id: 23, apartment: 23, operator: 4, reading_value: '45.5', unit: 'm3', photo: null, photo_url: null, status: 'pending_review', meter_type: 'digital_drum', latitude: null, longitude: null, captured_at: daysAgo(10,11,0), created_at: daysAgo(10,11,0), tower_name: 'Torre Sur',  building_name: 'Residencial El Parque', apartment_number: '201', meter_id: 'EP-S-201', operator_name: 'Carlos Silva' },
  // 14 days ago
  { id: 24, apartment: 1,  operator: 2, reading_value: '44.1', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(14,9,0),  created_at: daysAgo(14,9,0),  tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '101', meter_id: 'LR-A-101', operator_name: 'Juan Pérez' },
  { id: 25, apartment: 2,  operator: 2, reading_value: '49.0', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(14,9,30), created_at: daysAgo(14,9,30), tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '102', meter_id: 'LR-A-102', operator_name: 'Juan Pérez' },
  { id: 26, apartment: 24, operator: 4, reading_value: '27.3', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(14,10,0), created_at: daysAgo(14,10,0), tower_name: 'Torre Sur',  building_name: 'Residencial El Parque', apartment_number: '202', meter_id: 'EP-S-202', operator_name: 'Carlos Silva' },
  // 20 days ago
  { id: 27, apartment: 5,  operator: 2, reading_value: '51.7', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital_drum', latitude: null, longitude: null, captured_at: daysAgo(20,9,0),  created_at: daysAgo(20,9,0),  tower_name: 'Torre A', building_name: 'Edificio Los Robles',  apartment_number: '301', meter_id: 'LR-A-301', operator_name: 'Juan Pérez' },
  { id: 28, apartment: 11, operator: 3, reading_value: '65.2', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'analog',       latitude: null, longitude: null, captured_at: daysAgo(20,9,30), created_at: daysAgo(20,9,30), tower_name: 'Torre B', building_name: 'Edificio Los Robles',  apartment_number: '201', meter_id: 'LR-B-201', operator_name: 'María García' },
  { id: 29, apartment: 17, operator: 4, reading_value: '34.4', unit: 'm3', photo: null, photo_url: null, status: 'rejected',       meter_type: 'digital',      latitude: null, longitude: null, captured_at: daysAgo(20,10,0), created_at: daysAgo(20,10,0), tower_name: 'Torre Norte', building_name: 'Residencial El Parque', apartment_number: '201', meter_id: 'EP-N-201', operator_name: 'Carlos Silva' },
  { id: 30, apartment: 21, operator: 4, reading_value: '29.1', unit: 'm3', photo: null, photo_url: null, status: 'verified',       meter_type: 'digital_drum', latitude: null, longitude: null, captured_at: daysAgo(20,11,0), created_at: daysAgo(20,11,0), tower_name: 'Torre Sur',  building_name: 'Residencial El Parque', apartment_number: '101', meter_id: 'EP-S-101', operator_name: 'Carlos Silva' },
];

const today = new Date();
const SEED_CYCLES: MeasurementCycle[] = [
  { id: '1', name: 'Ciclo Marzo 2026 — Los Robles', building: '1', building_name: 'Edificio Los Robles', year: 2026, month: 3, month_name: 'Marzo', scheduled_date: '2026-03-01', deadline: '2026-03-31', status: 'completed', enforce: false, apartment_ids: [], notes: 'Ciclo completado sin incidencias.', created_at: '2026-03-01T08:00:00Z', total_apartments: 14, measured_count: 14, pending_count: 0, progress_pct: 100 },
  { id: '2', name: `Ciclo Abril 2026 — Los Robles`,  building: '1', building_name: 'Edificio Los Robles', year: 2026, month: 4, month_name: 'Abril', scheduled_date: `${today.getFullYear()}-04-01`, deadline: `${today.getFullYear()}-04-30`, status: 'in_progress', enforce: false, apartment_ids: [], notes: '', created_at: '2026-04-01T08:00:00Z', total_apartments: 14, measured_count: 10, pending_count: 4, progress_pct: 71 },
  { id: '3', name: 'Ciclo Marzo 2026 — El Parque',   building: '2', building_name: 'Residencial El Parque', year: 2026, month: 3, month_name: 'Marzo', scheduled_date: '2026-03-01', deadline: '2026-03-31', status: 'closed', enforce: false, apartment_ids: [], notes: 'Cerrado con 2 lecturas pendientes.', created_at: '2026-03-01T08:00:00Z', total_apartments: 10, measured_count: 8, pending_count: 2, progress_pct: 80 },
  { id: '4', name: 'Ciclo Abril 2026 — El Parque',   building: '2', building_name: 'Residencial El Parque', year: 2026, month: 4, month_name: 'Abril', scheduled_date: `${today.getFullYear()}-04-01`, deadline: `${today.getFullYear()}-04-30`, status: 'pending', enforce: false, apartment_ids: [], notes: '', created_at: '2026-04-01T08:00:00Z', total_apartments: 10, measured_count: 0, pending_count: 10, progress_pct: 0 },
];

// ── Service ──

@Injectable({ providedIn: 'root' })
export class DemoStoreService {
  private _buildings: ApiBuilding[] = JSON.parse(JSON.stringify(SEED_BUILDINGS));
  private _users: ApiUser[]         = JSON.parse(JSON.stringify(SEED_USERS));
  private _measurements: ApiMeas[]  = JSON.parse(JSON.stringify(SEED_MEASUREMENTS));
  private _cycles: MeasurementCycle[] = JSON.parse(JSON.stringify(SEED_CYCLES));

  private _nextBId  = 100;
  private _nextTId  = 100;
  private _nextAId  = 1000;
  private _nextUId  = 100;
  private _nextMId  = 1000;
  private _nextCId  = 100;

  // ── Auth ────────────────────────────────────────────────────────────────

  getMe() {
    return { id: 1, username: 'admin', first_name: 'Admin', last_name: 'Demo', email: 'admin@metscan.io', phone: '', role: 'admin', is_active: true };
  }

  // ── Buildings ────────────────────────────────────────────────────────────

  listBuildings(): ApiPage<ApiBuilding> {
    return { count: this._buildings.length, results: this._buildings };
  }

  createBuilding(body: { name: string; address: string }): ApiBuilding {
    const b = building(this._nextBId++, body.name, body.address, []);
    this._buildings.push(b);
    return b;
  }

  updateBuilding(id: string, body: Partial<{ name: string; address: string }>): ApiBuilding | null {
    const b = this._buildings.find(x => x.id === Number(id));
    if (!b) return null;
    if (body.name !== undefined)    b.name    = body.name;
    if (body.address !== undefined) b.address = body.address;
    return b;
  }

  deleteBuilding(id: string): void {
    this._buildings = this._buildings.filter(b => b.id !== Number(id));
  }

  // ── Towers ───────────────────────────────────────────────────────────────

  createTower(body: { name: string; building: number }): ApiTower | null {
    const b = this._buildings.find(x => x.id === body.building);
    if (!b) return null;
    const t = tower(this._nextTId++, body.name, body.building, []);
    b.towers.push(t);
    b.tower_count = b.towers.length;
    return t;
  }

  deleteTower(id: string): void {
    for (const b of this._buildings) {
      const before = b.towers.length;
      b.towers = b.towers.filter(t => t.id !== Number(id));
      if (b.towers.length !== before) {
        b.tower_count = b.towers.length;
        b.apartment_count = b.towers.reduce((s, t) => s + t.apartments.length, 0);
        break;
      }
    }
  }

  // ── Apartments ───────────────────────────────────────────────────────────

  createApartment(body: {
    number: string;
    floor: number;
    meter_id: string;
    tower: number;
    reading_layout?: string;
  }): ApiApt | null {
    for (const b of this._buildings) {
      const t = b.towers.find(x => x.id === body.tower);
      if (t) {
        const rl: 'A' | 'B' = body.reading_layout === 'B' ? 'B' : 'A';
        const a = apt(this._nextAId++, body.number, body.floor, body.meter_id, body.tower, rl);
        t.apartments.push(a);
        t.apartment_count = t.apartments.length;
        b.apartment_count = b.towers.reduce((s, tt) => s + tt.apartments.length, 0);
        return a;
      }
    }
    return null;
  }

  updateApartment(
    id: string,
    body: Partial<{ number: string; floor: number; meter_id: string; reading_layout: string }>,
  ): ApiApt | null {
    for (const b of this._buildings) {
      for (const t of b.towers) {
        const a = t.apartments.find(x => x.id === Number(id));
        if (a) {
          if (body.number !== undefined) a.number = body.number;
          if (body.floor !== undefined) a.floor = body.floor;
          if (body.meter_id !== undefined) a.meter_id = body.meter_id;
          if (body.reading_layout !== undefined) {
            a.reading_layout = body.reading_layout === 'B' ? 'B' : 'A';
          }
          return a;
        }
      }
    }
    return null;
  }

  bulkCreateApartments(body: {
    tower: number;
    apartments: { number: string; floor: number; meter_id: string; reading_layout?: string }[];
  }): { created: number; apartments: ApiApt[] } {
    const created: ApiApt[] = [];
    for (const item of body.apartments) {
      const a = this.createApartment({
        number: item.number,
        floor: item.floor,
        meter_id: item.meter_id,
        tower: body.tower,
        reading_layout: item.reading_layout,
      });
      if (a) created.push(a);
    }
    return { created: created.length, apartments: created };
  }

  deleteApartment(id: string): void {
    for (const b of this._buildings) {
      for (const t of b.towers) {
        const before = t.apartments.length;
        t.apartments = t.apartments.filter(a => a.id !== Number(id));
        if (t.apartments.length !== before) {
          t.apartment_count = t.apartments.length;
          b.apartment_count = b.towers.reduce((s, tt) => s + tt.apartments.length, 0);
          return;
        }
      }
    }
  }

  // ── Users ────────────────────────────────────────────────────────────────

  listUsers(): ApiPage<ApiUser> {
    return { count: this._users.length, results: this._users };
  }

  createUser(body: any): ApiUser {
    const u: ApiUser = {
      id: this._nextUId++,
      username: body.username,
      email: body.email || '',
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      phone: body.phone || '',
      role: body.role || 'operator',
      is_active: body.is_active ?? true,
      date_joined: new Date().toISOString(),
      assigned_apartment_ids: [],
    };
    this._users.push(u);
    return u;
  }

  updateUser(id: string, body: any): ApiUser | null {
    const u = this._users.find(x => x.id === Number(id));
    if (!u) return null;
    if (body.username !== undefined)   u.username   = body.username;
    if (body.email !== undefined)      u.email      = body.email;
    if (body.phone !== undefined)      u.phone      = body.phone;
    if (body.role !== undefined)       u.role       = body.role;
    if (body.is_active !== undefined)  u.is_active  = body.is_active;
    if (body.first_name !== undefined) u.first_name = body.first_name;
    if (body.last_name !== undefined)  u.last_name  = body.last_name;
    return u;
  }

  deleteUser(id: string): void {
    this._users = this._users.filter(u => u.id !== Number(id));
  }

  assignApartments(userId: string, aptIds: number[]): any {
    const u = this._users.find(x => x.id === Number(userId));
    if (u) u.assigned_apartment_ids = aptIds;
    return { detail: 'ok' };
  }

  // ── Measurements ─────────────────────────────────────────────────────────

  listMeasurements(): ApiPage<ApiMeas> {
    const sorted = [...this._measurements].sort((a, b) => b.captured_at.localeCompare(a.captured_at));
    return { count: sorted.length, results: sorted };
  }

  deleteMeasurement(id: string): void {
    this._measurements = this._measurements.filter(m => m.id !== Number(id));
  }

  // ── Cycles ───────────────────────────────────────────────────────────────

  listCycles(): ApiPage<MeasurementCycle> {
    return { count: this._cycles.length, results: this._cycles };
  }

  createCycle(body: any): MeasurementCycle {
    const buildingName = this._buildings.find(b => b.id === body.building)?.name ?? String(body.building);
    const totalApts = this._buildings.find(b => b.id === body.building)?.apartment_count ?? 0;
    const c: MeasurementCycle = {
      id: String(this._nextCId++),
      name: body.name,
      building: String(body.building),
      building_name: buildingName,
      year: body.year,
      month: body.month,
      month_name: body.month_name ?? '',
      scheduled_date: body.scheduled_date,
      deadline: body.deadline,
      status: body.status ?? 'pending',
      enforce: body.enforce ?? false,
      apartment_ids: body.apartment_ids ?? [],
      notes: body.notes ?? '',
      created_at: new Date().toISOString(),
      total_apartments: body.apartment_ids?.length || totalApts,
      measured_count: 0,
      pending_count: body.apartment_ids?.length || totalApts,
      progress_pct: 0,
    };
    this._cycles.unshift(c);
    return c;
  }

  updateCycleStatus(id: string, status: string): void {
    const c = this._cycles.find(x => x.id === id);
    if (c) c.status = status as MeasurementCycle['status'];
  }

  deleteCycle(id: string): void {
    this._cycles = this._cycles.filter(c => c.id !== id);
  }

  getCycleProgress(id: string): CycleProgressResponse | null {
    const cycle = this._cycles.find(c => c.id === id);
    if (!cycle) return null;

    const b = this._buildings.find(x => x.id === Number(cycle.building));
    if (!b) return null;

    const measuredIds = new Set(this._measurements.map(m => m.apartment));
    const apartments = b.towers.flatMap(t =>
      t.apartments.map((a, idx) => {
        const m = this._measurements.find(x => x.apartment === a.id);
        const measured = measuredIds.has(a.id);
        return {
          apartment_id: a.id,
          apartment_number: a.number,
          floor: a.floor,
          meter_id: a.meter_id,
          tower_name: t.name,
          measured,
          measurement_id: m ? m.id : null,
          reading_value: m ? parseFloat(m.reading_value) : null,
          captured_at: m ? m.captured_at : null,
          operator_name: m ? m.operator_name : null,
          measurement_status: m ? m.status : null,
        };
      }),
    );

    return { cycle, apartments };
  }
}

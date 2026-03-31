import { Injectable, signal, computed } from '@angular/core';
import { Building, Tower, Apartment } from '../models/building.model';

const SEED_BUILDINGS: Building[] = [
  {
    id: 'bld-001',
    name: 'Edificio Los Robles',
    address: 'Av. Providencia 1234, Santiago',
    towers: [
      {
        id: 'twr-001', name: 'Torre A',
        apartments: [
          { id: 'apt-001', number: '101', meterId: '621659-11', floor: 1 },
          { id: 'apt-002', number: '102', meterId: '621660-12', floor: 1 },
          { id: 'apt-003', number: '201', meterId: '621661-13', floor: 2 },
          { id: 'apt-004', number: '202', meterId: '621662-14', floor: 2 },
          { id: 'apt-005', number: '203', meterId: '785412-03', floor: 2 },
          { id: 'apt-006', number: '301', meterId: '621663-15', floor: 3 },
          { id: 'apt-007', number: '405', meterId: '369258-22', floor: 4 },
        ],
      },
      {
        id: 'twr-002', name: 'Torre B',
        apartments: [
          { id: 'apt-008', number: '201', meterId: '147852-19', floor: 2 },
          { id: 'apt-009', number: '504', meterId: '24081375', floor: 5 },
          { id: 'apt-010', number: '601', meterId: '258147-06', floor: 6 },
        ],
      },
      {
        id: 'twr-003', name: 'Torre C',
        apartments: [
          { id: 'apt-011', number: '102', meterId: '951753-14', floor: 1 },
          { id: 'apt-012', number: '302', meterId: '963258-07', floor: 3 },
        ],
      },
    ],
  },
  {
    id: 'bld-002',
    name: 'Condominio Parque Central',
    address: 'Calle Las Flores 567, Ñuñoa',
    towers: [
      {
        id: 'twr-004', name: 'Torre Norte',
        apartments: [
          { id: 'apt-013', number: '101', meterId: '550101-01', floor: 1 },
          { id: 'apt-014', number: '201', meterId: '550201-02', floor: 2 },
          { id: 'apt-015', number: '301', meterId: '550301-03', floor: 3 },
        ],
      },
      {
        id: 'twr-005', name: 'Torre Sur',
        apartments: [
          { id: 'apt-016', number: '101', meterId: '560101-01', floor: 1 },
          { id: 'apt-017', number: '201', meterId: '560201-02', floor: 2 },
        ],
      },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class BuildingService {
  private readonly _buildings = signal<Building[]>(SEED_BUILDINGS);
  readonly buildings = this._buildings.asReadonly();

  /** Flat list of all towers across all buildings */
  readonly allTowers = computed(() =>
    this._buildings().flatMap(b => b.towers.map(t => ({ ...t, buildingId: b.id, buildingName: b.name }))),
  );

  /** Flat list of all apartments across all buildings/towers */
  readonly allApartments = computed(() =>
    this._buildings().flatMap(b =>
      b.towers.flatMap(t =>
        t.apartments.map(a => ({
          ...a,
          towerId: t.id,
          towerName: t.name,
          buildingId: b.id,
          buildingName: b.name,
        })),
      ),
    ),
  );

  // ── CRUD Buildings ──

  addBuilding(name: string, address: string): Building {
    const b: Building = {
      id: `bld-${Date.now()}`,
      name,
      address,
      towers: [],
    };
    this._buildings.update(list => [...list, b]);
    return b;
  }

  updateBuilding(id: string, patch: Partial<Pick<Building, 'name' | 'address'>>): void {
    this._buildings.update(list =>
      list.map(b => (b.id === id ? { ...b, ...patch } : b)),
    );
  }

  deleteBuilding(id: string): void {
    this._buildings.update(list => list.filter(b => b.id !== id));
  }

  // ── CRUD Towers ──

  addTower(buildingId: string, name: string): Tower {
    const t: Tower = { id: `twr-${Date.now()}`, name, apartments: [] };
    this._buildings.update(list =>
      list.map(b =>
        b.id === buildingId ? { ...b, towers: [...b.towers, t] } : b,
      ),
    );
    return t;
  }

  deleteTower(buildingId: string, towerId: string): void {
    this._buildings.update(list =>
      list.map(b =>
        b.id === buildingId
          ? { ...b, towers: b.towers.filter(t => t.id !== towerId) }
          : b,
      ),
    );
  }

  // ── CRUD Apartments ──

  addApartment(buildingId: string, towerId: string, apt: Omit<Apartment, 'id'>): Apartment {
    const a: Apartment = { ...apt, id: `apt-${Date.now()}` };
    this._buildings.update(list =>
      list.map(b =>
        b.id === buildingId
          ? {
              ...b,
              towers: b.towers.map(t =>
                t.id === towerId ? { ...t, apartments: [...t.apartments, a] } : t,
              ),
            }
          : b,
      ),
    );
    return a;
  }

  deleteApartment(buildingId: string, towerId: string, aptId: string): void {
    this._buildings.update(list =>
      list.map(b =>
        b.id === buildingId
          ? {
              ...b,
              towers: b.towers.map(t =>
                t.id === towerId
                  ? { ...t, apartments: t.apartments.filter(a => a.id !== aptId) }
                  : t,
              ),
            }
          : b,
      ),
    );
  }

  // ── Lookups ──

  getBuildingById(id: string): Building | undefined {
    return this._buildings().find(b => b.id === id);
  }

  getApartmentById(aptId: string): (Apartment & { towerName: string; buildingName: string }) | undefined {
    return this.allApartments().find(a => a.id === aptId);
  }
}

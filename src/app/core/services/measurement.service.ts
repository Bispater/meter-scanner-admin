import { Injectable, signal, computed } from '@angular/core';
import { Measurement, Summary, MeasurementsResponse } from '../models/measurement.model';

const MOCK_DATA: MeasurementsResponse = {
  measurements: [
    {
      id: 'uuid-001',
      meter_id: '621659-11',
      tower: 'Torre A',
      apartment: '101',
      reading_value: 154.5,
      unit: 'm3',
      captured_at: '2026-03-26T14:30:00Z',
      operator_id: 'user_05',
      photo_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
      status: 'verified',
      meter_type: 'analog',
      location_coords: { lat: -33.41, lng: -70.58 },
    },
    {
      id: 'uuid-002',
      meter_id: '24081375',
      tower: 'Torre B',
      apartment: '504',
      reading_value: 890.12,
      unit: 'm3',
      captured_at: '2026-03-26T15:10:00Z',
      operator_id: 'user_05',
      photo_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
      status: 'pending_review',
      meter_type: 'digital_drum',
      location_coords: { lat: -33.41, lng: -70.58 },
    },
    {
      id: 'uuid-003',
      meter_id: '785412-03',
      tower: 'Torre A',
      apartment: '203',
      reading_value: 312.8,
      unit: 'm3',
      captured_at: '2026-03-26T09:45:00Z',
      operator_id: 'user_02',
      photo_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
      status: 'verified',
      meter_type: 'analog',
      location_coords: { lat: -33.41, lng: -70.58 },
    },
    {
      id: 'uuid-004',
      meter_id: '963258-07',
      tower: 'Torre C',
      apartment: '302',
      reading_value: 45.3,
      unit: 'm3',
      captured_at: '2026-03-26T11:20:00Z',
      operator_id: 'user_03',
      photo_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
      status: 'pending_review',
      meter_type: 'digital',
      location_coords: { lat: -33.42, lng: -70.59 },
    },
    {
      id: 'uuid-005',
      meter_id: '147852-19',
      tower: 'Torre B',
      apartment: '201',
      reading_value: 678.9,
      unit: 'm3',
      captured_at: '2026-03-25T16:00:00Z',
      operator_id: 'user_05',
      photo_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
      status: 'verified',
      meter_type: 'analog',
      location_coords: { lat: -33.41, lng: -70.58 },
    },
    {
      id: 'uuid-006',
      meter_id: '369258-22',
      tower: 'Torre A',
      apartment: '405',
      reading_value: 1023.4,
      unit: 'm3',
      captured_at: '2026-03-25T10:15:00Z',
      operator_id: 'user_01',
      photo_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
      status: 'rejected',
      meter_type: 'digital_drum',
      location_coords: { lat: -33.41, lng: -70.58 },
    },
    {
      id: 'uuid-007',
      meter_id: '951753-14',
      tower: 'Torre C',
      apartment: '102',
      reading_value: 89.7,
      unit: 'm3',
      captured_at: '2026-03-26T08:30:00Z',
      operator_id: 'user_04',
      photo_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
      status: 'verified',
      meter_type: 'analog',
      location_coords: { lat: -33.42, lng: -70.59 },
    },
    {
      id: 'uuid-008',
      meter_id: '258147-06',
      tower: 'Torre B',
      apartment: '601',
      reading_value: 456.2,
      unit: 'm3',
      captured_at: '2026-03-26T13:00:00Z',
      operator_id: 'user_02',
      photo_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
      status: 'pending_review',
      meter_type: 'digital',
      location_coords: { lat: -33.41, lng: -70.58 },
    },
  ],
  summary: {
    total_readings_today: 45,
    pending_alerts: 3,
    total_consumption_m3: 3650.92,
  },
};

@Injectable({ providedIn: 'root' })
export class MeasurementService {
  private readonly _measurements = signal<Measurement[]>(MOCK_DATA.measurements);
  private readonly _summary = signal<Summary>(MOCK_DATA.summary);

  readonly measurements = this._measurements.asReadonly();
  readonly summary = this._summary.asReadonly();

  readonly towers = computed(() => {
    const all = this._measurements();
    return [...new Set(all.map(m => m.tower))].sort();
  });

  getFilteredMeasurements(filters: {
    tower?: string;
    apartment?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Measurement[] {
    let result = this._measurements();

    if (filters.tower) {
      result = result.filter(m => m.tower === filters.tower);
    }
    if (filters.apartment) {
      result = result.filter(m =>
        m.apartment.toLowerCase().includes(filters.apartment!.toLowerCase())
      );
    }
    if (filters.status) {
      result = result.filter(m => m.status === filters.status);
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(m => new Date(m.captured_at) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59);
      result = result.filter(m => new Date(m.captured_at) <= to);
    }

    return result.sort((a, b) =>
      new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
    );
  }

  getMeasurementById(id: string): Measurement | undefined {
    return this._measurements().find(m => m.id === id);
  }
}

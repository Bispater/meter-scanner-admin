export type CycleStatus = 'pending' | 'in_progress' | 'completed' | 'closed';

export interface MeasurementCycle {
  id: string;
  name: string;
  building: string;
  building_name: string;
  year: number;
  month: number;
  month_name: string;
  scheduled_date: string;
  deadline: string;
  status: CycleStatus;
  notes: string;
  created_at: string;
  total_apartments: number;
  measured_count: number;
  pending_count: number;
  progress_pct: number;
}

export interface CycleProgressApartment {
  apartment_id: number;
  apartment_number: string;
  floor: number;
  meter_id: string;
  tower_name: string;
  measured: boolean;
  measurement_id: number | null;
  reading_value: number | null;
  captured_at: string | null;
  operator_name: string | null;
  measurement_status: string | null;
}

export interface CycleProgressResponse {
  cycle: MeasurementCycle;
  apartments: CycleProgressApartment[];
}

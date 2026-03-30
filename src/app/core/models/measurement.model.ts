export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface Measurement {
  id: string;
  meter_id: string;
  tower: string;
  apartment: string;
  reading_value: number;
  unit: string;
  captured_at: string;
  operator_id: string;
  photo_url: string;
  status: 'verified' | 'pending_review' | 'rejected';
  meter_type: 'analog' | 'digital_drum' | 'digital';
  location_coords: LocationCoords;
}

export interface Summary {
  total_readings_today: number;
  pending_alerts: number;
  total_consumption_m3: number;
}

export interface MeasurementsResponse {
  measurements: Measurement[];
  summary: Summary;
}

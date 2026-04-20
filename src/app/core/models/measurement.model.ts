export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface MeasurementAuditEntry {
  id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  note: string;
  created_at: string;
  edited_by_name: string | null;
}

export interface Measurement {
  id: string;
  meter_id: string;
  /** Edificio (desde apartment.tower.building) */
  building_name: string;
  tower: string;
  apartment: string;
  /** Null si aún no hay lectura (p. ej. solo foto y la IA no terminó). */
  reading_value: number | null;
  unit: string;
  captured_at: string;
  operator_id: string;
  operator_name?: string;
  photo_url: string;
  status: 'verified' | 'pending_review' | 'rejected';
  meter_type: 'analog' | 'digital_drum' | 'digital';
  location_coords: LocationCoords;
  /** FK ciclo de medición (si aplica) */
  cycle_id: string | null;
  cycle_name?: string | null;
  /** Edificio del ciclo (puede diferir si hubo error histórico; la verdad es apartment → building) */
  cycle_building_name?: string | null;
  ocr_value?: string;
  /** A/B — cara del medidor (enteros + decimales). */
  reading_layout?: 'A' | 'B';
  /** Estado del análisis por IA en servidor. */
  ai_analysis_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'skipped';
  /** Si hubo lectura manual e IA: coinciden o no. */
  ai_agrees_with_operator?: boolean | null;
  /** Solo en GET detalle */
  audit_logs?: MeasurementAuditEntry[];
  /** Solo en papelera (API) */
  deleted_at?: string;
  retention_days_remaining?: number;
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

export type ReportStatus = 'pending' | 'active' | 'completed' | 'verified';

export interface DisasterReport {
  id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lat: number;
  lng: number;
  area: string;
  description: string;
  status: ReportStatus;
  created_at: string;
}

export interface Volunteer {
  id: number;
  name: string;
  phone: string;
  area: string;
  status: 'idle' | 'busy';
  last_lat?: number;
  last_lng?: number;
}

export interface Action {
  id: number;
  report_id: number;
  volunteer_id: number;
  status: string;
  updated_at: string;
}

export type ReportStatus = 'pending' | 'active' | 'completed' | 'verified';

export interface DisasterReport {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lat: number;
  lng: number;
  area: string;
  description: string;
  status: ReportStatus;
  createdAt: any; // Firestore Timestamp
}

export interface Volunteer {
  uid: string;
  name: string;
  phone: string;
  area: string;
  status: 'idle' | 'busy';
  lastLat?: number;
  lastLng?: number;
  role?: 'admin' | 'user';
}

export interface Action {
  id: string;
  reportId: string;
  volunteerId: string;
  status: string;
  updatedAt: any; // Firestore Timestamp
}

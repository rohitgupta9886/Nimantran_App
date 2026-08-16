export interface MasterContact {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  group_name?: string;
  relationship?: string;
  notes?: string;
  source: 'MANUAL' | 'MOBILE_SYNC' | 'CSV_IMPORT' | 'EVENT_MANUAL';
  created_at: string;
  updated_at: string;
}

export interface MasterContactCreate {
  name: string;
  phone?: string;
  email?: string;
  group_name?: string;
  relationship?: string;
  notes?: string;
  source?: string;
}

export interface MasterContactUpdate {
  name?: string;
  phone?: string;
  email?: string;
  group_name?: string;
  relationship?: string;
  notes?: string;
}

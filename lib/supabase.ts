import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour la base de données
export type VehicleType = 'Porteur' | 'Remorque' | 'Tracteur';

export interface Vehicle {
  id: string;
  immat: string;
  marque: string;
  type: VehicleType;
  date_ct: string | null; // CT annuel (valable 1 an) - TOUS
  date_tachy: string | null; // Tachygraphe - Porteur & Tracteur uniquement
  date_atp: string | null; // ATP - Porteur & Remorque uniquement
  status: 'actif' | 'maintenance' | 'garage';
  created_at?: string;
}

// Règles métier : quels contrôles pour quel type
export const VEHICLE_CONTROLS = {
  Porteur: {
    requiresCT: true,
    requiresTachy: true,
    requiresATP: true,
  },
  Remorque: {
    requiresCT: true,
    requiresTachy: false,
    requiresATP: true,
  },
  Tracteur: {
    requiresCT: true,
    requiresTachy: true,
    requiresATP: false,
  },
} as const;

export type InterventionStatus = 'pending' | 'approved_waiting_rdv' | 'planned' | 'completed';

export interface Intervention {
  id: string;
  vehicle_id?: string;
  vehicule: string;
  immat: string;
  description: string;
  garage: string;
  montant: number;
  status: InterventionStatus;
  date_creation: string;
  date_prevue?: string | null;
  rdv_date?: string | null;
  rdv_lieu?: string | null;
  created_at?: string;
}

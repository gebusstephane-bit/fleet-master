import { addDays } from "date-fns";

// Types
export type InterventionStatus = "pending" | "approved_waiting_rdv" | "planned" | "completed";
export type VehicleStatus = "actif" | "maintenance" | "garage";

// Role utilisateur (stocke en localStorage)
export type UserRole = "directeur" | "agent_parc" | "exploitant";

export interface Vehicle {
  id: string;
  immat: string;
  marque: string;
  type: string;
  date_mines: Date;
  date_tachy: Date;
  status: VehicleStatus;
}

export interface Intervention {
  id: string;
  vehicle_id?: string;
  vehicule: string;
  immat: string;
  description: string;
  garage: string;
  montant: number;
  status: InterventionStatus;
  dateCreation: string;
  datePrevue?: string;
  rdv_date?: string;
  rdv_lieu?: string;
}

// Données centralisées
const today = new Date();

export const VEHICLES: Vehicle[] = [
  {
    id: "1",
    immat: "AB-123-CD",
    marque: "Renault Trucks T",
    type: "Porteur 19T",
    date_mines: addDays(today, -5), // PÉRIMÉ
    date_tachy: addDays(today, 45),
    status: "actif",
  },
  {
    id: "2",
    immat: "EF-456-GH",
    marque: "MAN TGX",
    type: "Tracteur 44T",
    date_mines: addDays(today, 15), // BIENTÔT
    date_tachy: addDays(today, 20),
    status: "actif",
  },
  {
    id: "3",
    immat: "IJ-789-KL",
    marque: "Scania R450",
    type: "Tracteur 44T",
    date_mines: addDays(today, 120),
    date_tachy: addDays(today, 180),
    status: "actif",
  },
  {
    id: "4",
    immat: "MN-012-OP",
    marque: "Volvo FH16",
    type: "Tracteur 44T",
    date_mines: addDays(today, 90),
    date_tachy: addDays(today, 150),
    status: "maintenance",
  },
  {
    id: "5",
    immat: "QR-345-ST",
    marque: "DAF XF",
    type: "Porteur 26T",
    date_mines: addDays(today, 200),
    date_tachy: addDays(today, 240),
    status: "actif",
  },
];

export const INTERVENTIONS: Intervention[] = [
  {
    id: "1",
    vehicule: "Renault Trucks T",
    immat: "AB-123-CD",
    description: "Changement Pare-brise",
    garage: "Garage Renault Trucks - Lyon",
    montant: 450,
    status: "pending",
    dateCreation: "24/01/2026",
  },
  {
    id: "2",
    vehicule: "MAN TGX",
    immat: "EF-456-GH",
    description: "Revision 50 000km complete",
    garage: "MAN Service Center - Marseille",
    montant: 1250,
    status: "approved_waiting_rdv",
    dateCreation: "23/01/2026",
  },
  {
    id: "3",
    vehicule: "Scania R450",
    immat: "IJ-789-KL",
    description: "Remplacement plaquettes de frein avant",
    garage: "Scania Atelier - Paris",
    montant: 680,
    status: "planned",
    dateCreation: "20/01/2026",
    rdv_date: "2026-01-30T09:00:00",
    rdv_lieu: "Scania Atelier - Paris, 15 rue de la Mecanique",
  },
  {
    id: "4",
    vehicule: "Volvo FH16",
    immat: "MN-012-OP",
    description: "Diagnostic moteur - Voyant actif",
    garage: "Volvo Trucks Service - Lille",
    montant: 320,
    status: "completed",
    dateCreation: "18/01/2026",
    rdv_date: "2026-01-20T14:00:00",
    rdv_lieu: "Volvo Trucks Service - Lille",
  },
];

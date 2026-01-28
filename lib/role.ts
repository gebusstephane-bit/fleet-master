// Gestion des roles utilisateur (stocke en localStorage)
// RBAC simplifie sans authentification

export type UserRole = 'directeur' | 'agent_parc' | 'exploitant';

const ROLE_STORAGE_KEY = 'fleet_user_role';
const DEFAULT_ROLE: UserRole = 'exploitant';

export function getUserRole(): UserRole {
  if (typeof window === 'undefined') return DEFAULT_ROLE;
  const stored = localStorage.getItem(ROLE_STORAGE_KEY);
  if (stored && ['directeur', 'agent_parc', 'exploitant'].includes(stored)) {
    return stored as UserRole;
  }
  return DEFAULT_ROLE;
}

export function setUserRole(role: UserRole): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ROLE_STORAGE_KEY, role);
}

// Permissions par role
export const PERMISSIONS = {
  directeur: {
    canValidateDevis: true,
    canPlanRdv: false,
    canCompleteIntervention: false,
    canEditVehicle: true,
  },
  agent_parc: {
    canValidateDevis: false,
    canPlanRdv: true,
    canCompleteIntervention: true,
    canEditVehicle: true,
  },
  exploitant: {
    canValidateDevis: false,
    canPlanRdv: false,
    canCompleteIntervention: false,
    canEditVehicle: false,
  },
} as const;

export function getPermissions(role: UserRole) {
  return PERMISSIONS[role];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  directeur: 'Directeur',
  agent_parc: 'Agent Parc',
  exploitant: 'Exploitant',
};

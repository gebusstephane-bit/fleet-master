"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { UserRole, getUserRole, setUserRole, ROLE_LABELS, ALL_ROLES } from "@/lib/role";
import { User } from "lucide-react";

const DEV_MODE = process.env.NODE_ENV === "development";

interface RoleSwitcherProps {
  onRoleChange?: (role: UserRole) => void;
}

export function RoleSwitcher({ onRoleChange }: RoleSwitcherProps) {
  const { role: authRole, profile } = useAuth();
  const [devRole, setDevRole] = useState<UserRole>("exploitation");

  useEffect(() => {
    setDevRole(getUserRole());
  }, []);

  // In production, just show the auth role as a badge
  if (!DEV_MODE) {
    return (
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
        <User className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">
          {profile ? `${profile.prenom} ${profile.nom}` : ROLE_LABELS[authRole]}
        </span>
      </div>
    );
  }

  // DEV mode: allow switching
  const handleChange = (newRole: UserRole) => {
    setDevRole(newRole);
    setUserRole(newRole);
    onRoleChange?.(newRole);
  };

  return (
    <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-300 shadow-sm">
      <User className="w-4 h-4 text-yellow-600" />
      <span className="text-xs text-yellow-700 font-bold mr-1">DEV</span>
      <select
        value={devRole}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
        ))}
      </select>
    </div>
  );
}

export function useRole() {
  const { role: authRole } = useAuth();
  const [devRole, setDevRoleState] = useState<UserRole>("exploitation");

  useEffect(() => {
    setDevRoleState(getUserRole());
    const handleStorage = () => setDevRoleState(getUserRole());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const role = process.env.NODE_ENV === "development" ? devRole : authRole;

  const updateRole = (newRole: UserRole) => {
    setUserRole(newRole);
    setDevRoleState(newRole);
  };

  return { role, setRole: updateRole };
}

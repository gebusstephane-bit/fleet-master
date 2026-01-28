"use client";

import { useState, useEffect } from "react";
import { UserRole, getUserRole, setUserRole, ROLE_LABELS } from "@/lib/role";
import { User } from "lucide-react";

interface RoleSwitcherProps {
  onRoleChange?: (role: UserRole) => void;
}

export function RoleSwitcher({ onRoleChange }: RoleSwitcherProps) {
  const [role, setRole] = useState<UserRole>("exploitant");

  useEffect(() => {
    setRole(getUserRole());
  }, []);

  const handleChange = (newRole: UserRole) => {
    setRole(newRole);
    setUserRole(newRole);
    onRoleChange?.(newRole);
  };

  return (
    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
      <User className="w-4 h-4 text-slate-500" />
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer"
      >
        <option value="directeur">{ROLE_LABELS.directeur}</option>
        <option value="agent_parc">{ROLE_LABELS.agent_parc}</option>
        <option value="exploitant">{ROLE_LABELS.exploitant}</option>
      </select>
    </div>
  );
}

export function useRole() {
  const [role, setRoleState] = useState<UserRole>("exploitant");

  useEffect(() => {
    setRoleState(getUserRole());

    // Ecouter les changements de localStorage
    const handleStorage = () => {
      setRoleState(getUserRole());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateRole = (newRole: UserRole) => {
    setUserRole(newRole);
    setRoleState(newRole);
  };

  return { role, setRole: updateRole };
}

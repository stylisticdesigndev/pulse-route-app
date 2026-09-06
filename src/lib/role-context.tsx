import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ActiveRole = "field_technician" | "dispatch_supervisor";

const STORAGE_KEY = "pulseroute.activeRole.v1";

type RoleContextValue = {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
};

const RoleContext = createContext<RoleContextValue>({
  activeRole: "field_technician",
  setActiveRole: () => {},
});

/** Persistent developer role state — switching updates every screen instantly. */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [activeRole, setRole] = useState<ActiveRole>("field_technician");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dispatch_supervisor" || stored === "field_technician") setRole(stored);
  }, []);

  const value = useMemo<RoleContextValue>(
    () => ({
      activeRole,
      setActiveRole: (role) => {
        setRole(role);
        window.localStorage.setItem(STORAGE_KEY, role);
      },
    }),
    [activeRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}

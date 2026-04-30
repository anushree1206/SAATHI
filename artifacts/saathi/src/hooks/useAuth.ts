import { useEffect, useState } from "react";
import { AuthUser, clearAuthSession, getAuthUser, onAuthChange } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => getAuthUser());

  useEffect(() => {
    const unsubscribe = onAuthChange(() => setUser(getAuthUser()));
    return unsubscribe;
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    signOut: () => {
      clearAuthSession();
      setUser(null);
    },
  };
}

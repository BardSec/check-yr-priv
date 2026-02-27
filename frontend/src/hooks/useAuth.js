import { useEffect, useState } from "react";
import { api } from "../api/client";

export function useAuth() {
  const [state, setState] = useState({ loading: true, authenticated: false, user: null });

  useEffect(() => {
    api.me()
      .then((data) => {
        if (data) setState({ loading: false, authenticated: data.authenticated, user: data.user });
      })
      .catch(() => setState({ loading: false, authenticated: false, user: null }));
  }, []);

  const logout = async () => {
    await api.logout();
    setState({ loading: false, authenticated: false, user: null });
  };

  return { ...state, logout };
}

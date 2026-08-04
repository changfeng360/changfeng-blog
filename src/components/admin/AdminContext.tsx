"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type AdminContextValue = {
  token: string;
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  login: (value: string) => Promise<boolean>;
  logout: () => void;
  api: (
    path: string,
    options?: RequestInit,
    authToken?: string,
  ) => Promise<unknown>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const tokenRef = useRef("");

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const api = useCallback(
    async (
      path: string,
      options: RequestInit = {},
      authToken = tokenRef.current,
    ) => {
      const response = await fetch(`/api/admin/${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
          ...(options.headers || {}),
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }
      return data;
    },
    [],
  );

  useEffect(() => {
    const savedToken = window.sessionStorage.getItem("cf-admin-token");
    if (!savedToken) {
      return;
    }
    setToken(savedToken);
    api("auth", { method: "POST", body: "{}" }, savedToken)
      .then(() => setIsAdmin(true))
      .catch(() => window.sessionStorage.removeItem("cf-admin-token"));
  }, [api]);

  const login = useCallback(
    async (value: string) => {
      const data = (await api(
        "auth",
        { method: "POST", body: "{}" },
        value,
      )) as { ok: boolean };
      if (!data.ok) {
        return false;
      }
      setToken(value);
      setIsAdmin(true);
      setEditMode(true);
      window.sessionStorage.setItem("cf-admin-token", value);
      return true;
    },
    [api],
  );

  const logout = useCallback(() => {
    setToken("");
    setIsAdmin(false);
    setEditMode(false);
    window.sessionStorage.removeItem("cf-admin-token");
  }, []);

  return (
    <AdminContext.Provider
      value={{
        token,
        isAdmin,
        editMode,
        setEditMode,
        login,
        logout,
        api,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used inside AdminProvider");
  }
  return context;
}

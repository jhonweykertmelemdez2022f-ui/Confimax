"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cliente" | "vendedor";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  recoverPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión al cargar
    const storedUser = localStorage.getItem("confimax_user");
    const storedToken = localStorage.getItem("confimax_token");
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      api.setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login(email, password) as any;
      
      const userData = response.user || response.data;
      setUser(userData);
      localStorage.setItem("confimax_user", JSON.stringify(userData));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.register(name, email, password) as any;
      
      const userData = response.user || response.data;
      setUser(userData);
      localStorage.setItem("confimax_user", JSON.stringify(userData));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const recoverPassword = async (email: string) => {
    try {
      await api.recoverPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error("Error al hacer logout:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("confimax_user");
      api.clearToken();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, recoverPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
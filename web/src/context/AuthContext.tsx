"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AlertTriangle, X } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cliente" | "vendedor";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  recoverPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    // Verificar sesión al cargar
    const storedUser = localStorage.getItem("confimax_user");
    const storedToken = localStorage.getItem("confimax_token");
    const storedAttempts = Number(localStorage.getItem("confimax_failed_attempts") || "0");
    const storedLockout = Number(localStorage.getItem("confimax_lockout_until") || "0");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      api.setToken(storedToken);
    }

    setFailedAttempts(storedAttempts);
    if (storedLockout && storedLockout > Date.now()) {
      setLockoutUntil(storedLockout);
      setIsLockedOut(true);
      setLockoutRemaining(Math.ceil((storedLockout - Date.now()) / 1000));
    }

    setIsLoading(false);

    // Configurar callback para token expirado
    api.setOnTokenExpired(() => {
      setTokenExpired(true);
      setCountdown(5);
      setUser(null);
      localStorage.removeItem("confimax_user");
    });
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (tokenExpired && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (tokenExpired && countdown === 0) {
      handleTokenExpiredClose();
    }
    return () => clearTimeout(timer);
  }, [tokenExpired, countdown]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLockedOut && lockoutUntil) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
        setLockoutRemaining(remaining);
        if (remaining <= 0) {
          clearLockout();
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLockedOut, lockoutUntil]);

  const handleTokenExpiredClose = () => {
    setTokenExpired(false);
    setCountdown(5);
    router.push('/login');
  };

  const clearLockout = () => {
    setFailedAttempts(0);
    setIsLockedOut(false);
    setLockoutUntil(null);
    setLockoutRemaining(0);
    localStorage.setItem("confimax_failed_attempts", "0");
    localStorage.removeItem("confimax_lockout_until");
  };

  const activateLockout = () => {
    const until = Date.now() + 30000;
    setFailedAttempts(3);
    setLockoutUntil(until);
    setIsLockedOut(true);
    setLockoutRemaining(30);
    localStorage.setItem("confimax_failed_attempts", "3");
    localStorage.setItem("confimax_lockout_until", String(until));
  };

  const incrementFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    localStorage.setItem("confimax_failed_attempts", String(nextAttempts));
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 3) {
      activateLockout();
      return true;
    }
    return false;
  };

  const login = async (usernameOrEmail: string, password: string) => {
    if (isLockedOut && lockoutRemaining > 0) {
      throw new Error(`Demasiados intentos fallidos. Intenta de nuevo en ${lockoutRemaining} segundos.`);
    }

    setIsLoading(true);
    try {
      const response = await api.login(usernameOrEmail, password) as any;
      
      const token = response.token || response.accessToken;
      if (token) {
        api.setToken(token);
        localStorage.setItem("confimax_token", token);
      }

      const rawUser = response.user || response.data;
      const roleMapping: Record<string, "admin" | "cliente" | "vendedor"> = {
        admin: "admin",
        vendedor: "vendedor",
        cliente: "cliente",
        vendor: "vendedor",
        customer: "cliente",
      };
      
      const userData: User = {
        id: rawUser.id,
        name: rawUser.name || rawUser.username || (rawUser.email ? rawUser.email.split('@')[0] : "Usuario"),
        email: rawUser.email,
        role: roleMapping[rawUser.role] || "cliente"
      };

      setUser(userData);
      localStorage.setItem("confimax_user", JSON.stringify(userData));
      clearLockout();
      return userData;
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.message?.toString?.() || "Error al iniciar sesión";
      const isAuthError = status === 401 || status === 403 || /clave|credencial|credenciales|usuario|contraseña/i.test(message);

      if (isAuthError) {
        const locked = incrementFailedAttempt();
        if (locked) {
          throw new Error("Demasiados intentos fallidos. Bloqueado por 30 segundos.");
        }
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.register(name, email, password) as any;
      
      const token = response.token || response.accessToken;
      if (token) {
        api.setToken(token);
        localStorage.setItem("confimax_token", token);
      }

      const rawUser = response.user || response.data;
      const roleMapping: Record<string, "admin" | "cliente" | "vendedor"> = {
        admin: "admin",
        vendedor: "vendedor",
        cliente: "cliente",
        vendor: "vendedor",
        customer: "cliente",
      };
      
      const userData: User = {
        id: rawUser.id,
        name: rawUser.name || rawUser.username || name,
        email: rawUser.email,
        role: roleMapping[rawUser.role] || "cliente"
      };

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
      localStorage.removeItem("confimax_token");
      api.clearToken();
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, recoverPassword }}>
      {children}
      
      {/* Alert de token expirado */}
      {tokenExpired && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Sesión expirada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Tu sesión ha expirado. Vuelve a iniciar sesión de nuevo para continuar.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Redirigiendo automáticamente en <span className="font-bold text-blue-600 dark:text-blue-400">{countdown}</span> segundos...
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={handleTokenExpiredClose}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all"
                  >
                    Ir al login ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
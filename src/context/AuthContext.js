// src/context/AuthContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { authService } from "../services/api";

// ⚠️ CONFIGURA AQUÍ TU IP CORRECTA
const MI_IP_LOCAL = "192.168.100.123";

const getApiUrl = () => {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    return `http://${MI_IP_LOCAL}:5001/api/auth`;
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5001/api/auth";
  }
  if (Platform.OS === "ios") {
    return "http://localhost:5001/api/auth";
  }
  return `http://${MI_IP_LOCAL}:5001/api/auth`;
};

const API_URL = getApiUrl();
console.log("🔗 API URL:", API_URL);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ✅ Declara el estado user aquí
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          console.log("🔍 Verificando token...");
          const perfil = await authService.getPerfil();
          setUser(perfil);
          console.log("✅ Usuario autenticado:", perfil.nombre_completo);
        }
      } catch (error) {
        console.log("❌ Error verificando token:", error.message);
        await AsyncStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      console.log("📝 Registrando usuario...");
      const data = await authService.register(userData);
      const { token, usuaria } = data;
      await AsyncStorage.setItem("token", token);
      setUser(usuaria);
      console.log("✅ Registro exitoso:", usuaria.nombre_completo);
      Alert.alert("Éxito", "Registro completado correctamente");
      return { success: true, user: usuaria };
    } catch (error) {
      const errorMsg = error.message || "Error al registrarse";
      console.error("❌ Error en registro:", errorMsg);
      setError(errorMsg);
      Alert.alert("Error", errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const login = async (correo_institucional, contrasena) => {
    try {
      setError(null);
      console.log("🔑 Iniciando sesión...");

      const data = await authService.login(correo_institucional, contrasena);
      const { token, usuaria } = data;

      await AsyncStorage.setItem("token", token);
      setUser(usuaria);

      console.log("✅ Login exitoso:", usuaria.nombre_completo);
      Alert.alert("Éxito", `Bienvenida ${usuaria.nombre_completo}`);
      return { success: true, user: usuaria };
    } catch (error) {
      let errorMsg = error.message || "Error al iniciar sesión";
      if (error.message.includes("Failed to fetch")) {
        errorMsg =
          "No se pudo conectar al servidor. Verifica que el backend esté corriendo.";
      }
      console.error("❌ Error en login:", errorMsg);
      setError(errorMsg);
      Alert.alert("Error", errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      setUser(null);
      console.log("👋 Sesión cerrada");
      Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente");
    } catch (error) {
      console.log("❌ Error al cerrar sesión:", error);
    }
  };

  const clearError = () => setError(null);

  // ✅ El value debe contener user
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

// src/services/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ⚠️ CONFIGURA AQUÍ TU IP
const MI_IP_LOCAL = "192.168.100.123";

const getBaseURL = () => {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    return `http://${MI_IP_LOCAL}:5001/api`;
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5001/api";
  }
  if (Platform.OS === "ios") {
    return "http://localhost:5001/api";
  }
  return `http://${MI_IP_LOCAL}:5001/api`;
};

const API_BASE_URL = getBaseURL();
console.log("🔗 API Base URL:", API_BASE_URL);

// ==========================================
// FUNCIONES BASE
// ==========================================

export const fetchWithAuth = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    console.log(`📡 ${options.method || "GET"} ${API_BASE_URL}${endpoint}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || "Error en la petición");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error en fetchWithAuth:", error.message);
    throw error;
  }
};

// ==========================================
// SERVICIO DE AUTENTICACIÓN
// ==========================================
export const authService = {
  register: async (userData) => {
    try {
      console.log("📝 Registrando en:", `${API_BASE_URL}/auth/registro`);
      const response = await fetch(`${API_BASE_URL}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.mensaje || "Error al registrarse");
      return data;
    } catch (error) {
      console.error("❌ Error en registro:", error.message);
      throw error;
    }
  },

  login: async (correo_institucional, contrasena) => {
    try {
      console.log("🔑 Login en:", `${API_BASE_URL}/auth/login`);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_institucional, contrasena }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.mensaje || "Error al iniciar sesión");
      return data;
    } catch (error) {
      console.error("❌ Error en login:", error.message);
      throw error;
    }
  },

  getPerfil: async () => {
    try {
      const data = await fetchWithAuth("/auth/perfil");
      return data;
    } catch (error) {
      console.error("❌ Error al obtener perfil:", error.message);
      throw error;
    }
  },
};

// ==========================================
// SERVICIO DE QUEJAS LEGALES
// ==========================================
export const quejasLegalesService = {
  crearQueja: async (data) => {
    try {
      console.log(
        "📝 Creando queja legal en:",
        `${API_BASE_URL}/quejas-legales`,
      );
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/quejas-legales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.mensaje || "Error al crear la queja");
      return result;
    } catch (error) {
      console.error("❌ Error al crear queja legal:", error.message);
      throw error;
    }
  },

  getQuejas: async () => {
    try {
      return await fetchWithAuth("/quejas-legales");
    } catch (error) {
      console.error("❌ Error al obtener quejas legales:", error.message);
      throw error;
    }
  },

  getQueja: async (id) => {
    try {
      return await fetchWithAuth(`/quejas-legales/${id}`);
    } catch (error) {
      console.error(`❌ Error al obtener queja ${id}:`, error.message);
      throw error;
    }
  },

  actualizarEstado: async (id, estado, respuesta) => {
    try {
      return await fetchWithAuth(`/quejas-legales/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado, respuesta }),
      });
    } catch (error) {
      console.error(`❌ Error al actualizar queja ${id}:`, error.message);
      throw error;
    }
  },

  getMisQuejas: async () => {
    try {
      return await fetchWithAuth("/quejas-legales/mis-quejas");
    } catch (error) {
      console.error("❌ Error al obtener mis quejas:", error.message);
      throw error;
    }
  },
};

// ==========================================
// SERVICIO DE CONSULTAS PSICOPEDAGÓGICAS
// ==========================================
export const consultasPsicopedagogiaService = {
  crearConsulta: async (data) => {
    try {
      console.log(
        "📝 Creando consulta psicopedagógica en:",
        `${API_BASE_URL}/consultas-psicopedagogia`,
      );
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/consultas-psicopedagogia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.mensaje || "Error al crear la consulta");
      return result;
    } catch (error) {
      console.error(
        "❌ Error al crear consulta psicopedagógica:",
        error.message,
      );
      throw error;
    }
  },

  getConsultas: async () => {
    try {
      return await fetchWithAuth("/consultas-psicopedagogia");
    } catch (error) {
      console.error("❌ Error al obtener consultas:", error.message);
      throw error;
    }
  },

  getConsulta: async (id) => {
    try {
      return await fetchWithAuth(`/consultas-psicopedagogia/${id}`);
    } catch (error) {
      console.error(`❌ Error al obtener consulta ${id}:`, error.message);
      throw error;
    }
  },

  actualizarEstado: async (id, estado, respuesta) => {
    try {
      return await fetchWithAuth(`/consultas-psicopedagogia/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado, respuesta }),
      });
    } catch (error) {
      console.error(`❌ Error al actualizar consulta ${id}:`, error.message);
      throw error;
    }
  },

  getMisConsultas: async () => {
    try {
      return await fetchWithAuth("/consultas-psicopedagogia/mis-consultas");
    } catch (error) {
      console.error("❌ Error al obtener mis consultas:", error.message);
      throw error;
    }
  },
};

// ==========================================
// EXPORTACIÓN POR DEFECTO
// ==========================================
export default {
  API_BASE_URL,
  fetchWithAuth,
  authService,
  quejasLegalesService,
  consultasPsicopedagogiaService,
};

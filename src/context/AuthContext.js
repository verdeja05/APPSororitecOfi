import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuaria, setUsuaria] = useState(null);
  const [cargando, setCargando] = useState(false);

  const login = async (correo, contrasena) => {
    setCargando(true);
    try {
      const res = await api.post('/auth/login', {
        correo_institucional: correo,
        contrasena
      });
      await AsyncStorage.setItem('token', res.data.token);
      setUsuaria(res.data.usuaria);
      return { exito: true };
    } catch (err) {
      return { exito: false, mensaje: err.response?.data?.mensaje || 'Error al iniciar sesión' };
    } finally {
      setCargando(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUsuaria(null);
  };

  return (
    <AuthContext.Provider value={{ usuaria, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
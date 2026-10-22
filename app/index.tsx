import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

// Pantallas comunes
import BienvenidaScreen from "../src/screens/BienvenidaScreen";
import LoginScreen from "../src/screens/LoginScreen";
import RegistroScreen from "../src/screens/RegistroScreen";

// Pantallas usuaria
import BecasScreen from "../src/screens/BecasScreen";
import CrearHistoriaScreen from "../src/screens/CrearHistoriaScreen";
import CrearPublicacionScreen from "../src/screens/CrearPublicacionScreen";
import ForoScreen from "../src/screens/ForoScreen";
import GPSScreen from "../src/screens/GPSScreen";
import HomeScreen from "../src/screens/HomeScreen";
import PerfilScreen from "../src/screens/PerfilScreen";
import TalleresScreen from "../src/screens/TalleresScreen";
import VerHistoriaScreen from "../src/screens/VerHistoriaScreen";
import DudasMedicasScreen from "../src/screens/DudasMedicasScreen";
import DudasLegalesScreen from "../src/screens/DudasLegalesScreen";
import ConsultaScreen from "../src/screens/ConsultaScreen";
import MisConsultasScreen from "../src/screens/MisConsultasScreen";
import ChatConsultaScreen from "../src/screens/ChatConsultaScreen";
import NotificacionesScreen from "../src/screens/NotificacionesScreen";

// Pantallas especialistas individuales
import PanelAbogadaScreen from "../src/screens/PanelAbogadaScreen";
import PanelPsicologaScreen from "../src/screens/PanelPsicologaScreen";
import PanelMedicaScreen from "../src/screens/PanelMedicaScreen";

// Pantalla admin contenido
import AdminContenidoScreen from "../src/screens/AdminContenidoScreen";

// Pantalla superadmin
import SuperAdminScreen from "../src/screens/SuperAdminScreen";

const Stack = createStackNavigator();

function Navigation() {
  const { usuaria } = useAuth();
  const rol = usuaria?.rol;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!usuaria ? (
        <>
          <Stack.Screen name="Bienvenida" component={BienvenidaScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegistroScreen} />
        </>
      ) : rol === 'superadmin' ? (
        <>
          <Stack.Screen name="SuperAdmin" component={SuperAdminScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
        </>
      ) : rol === 'administradora' ? (
        <>
          <Stack.Screen name="AdminContenido" component={AdminContenidoScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
        </>
      ) : rol === 'abogada' ? (
        <>
          <Stack.Screen name="PanelAbogada" component={PanelAbogadaScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
        </>
      ) : rol === 'psicologa' ? (
        <>
          <Stack.Screen name="PanelPsicologa" component={PanelPsicologaScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
        </>
      ) : rol === 'medica' ? (
        <>
          <Stack.Screen name="PanelMedica" component={PanelMedicaScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CrearPublicacion" component={CrearPublicacionScreen} />
          <Stack.Screen name="GPS" component={GPSScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
          <Stack.Screen name="CrearHistoria" component={CrearHistoriaScreen} />
          <Stack.Screen name="VerHistoria" component={VerHistoriaScreen} />
          <Stack.Screen name="Talleres" component={TalleresScreen} />
          <Stack.Screen name="Becas" component={BecasScreen} />
          <Stack.Screen name="Foro" component={ForoScreen} />
          <Stack.Screen name="DudasMedicas" component={DudasMedicasScreen} />
          <Stack.Screen name="DudasLegales" component={DudasLegalesScreen} />
          <Stack.Screen name="Consulta" component={ConsultaScreen} />
          <Stack.Screen name="MisConsultas" component={MisConsultasScreen} />
          <Stack.Screen name="ChatConsulta" component={ChatConsultaScreen} />
          <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
// index.tsx
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

// Pantallas de Usuario
import BecasScreen from "../src/screens/BecasScreen";
import BienvenidaScreen from "../src/screens/BienvenidaScreen";
import CrearHistoriaScreen from "../src/screens/CrearHistoriaScreen";
import CrearPublicacionScreen from "../src/screens/CrearPublicacionScreen";
import GPSScreen from "../src/screens/GPSScreen";
import HomeScreen from "../src/screens/HomeScreen";
import LoginScreen from "../src/screens/LoginScreen";
import PerfilScreen from "../src/screens/PerfilScreen";
import RegistroScreen from "../src/screens/RegistroScreen";
import TalleresScreen from "../src/screens/TalleresScreen";
import VerHistoriaScreen from "../src/screens/VerHistoriaScreen";

// 🆕 Pantallas Legales
import ChatLegalScreen from "../src/screens/ChatLegalScreen";
import MisQuejasScreen from "../src/screens/MisQuejasScreen";
import SolicitarApoyoLegalScreen from "../src/screens/SolicitarApoyoLegalScreen";

// 🆕 Pantallas Administrativas
import AdminLegalScreen from "../src/screens/AdminLegalScreen";
import ModerarPublicacionesScreen from "../src/screens/ModerarPublicacionesScreen";

const Stack = createStackNavigator();

function Navigation() {
  const { user } = useAuth();

  const esAdmin =
    user?.correo_institucional?.includes("@utvtol.edu.mx") || false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Bienvenida" component={BienvenidaScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegistroScreen} />
        </>
      ) : (
        <>
          {/* Pantallas principales */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="CrearPublicacion"
            component={CrearPublicacionScreen}
          />
          <Stack.Screen name="GPS" component={GPSScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
          <Stack.Screen name="CrearHistoria" component={CrearHistoriaScreen} />
          <Stack.Screen name="VerHistoria" component={VerHistoriaScreen} />
          <Stack.Screen name="Talleres" component={TalleresScreen} />
          <Stack.Screen name="Becas" component={BecasScreen} />

          {/* 🆕 Pantallas Legales */}
          <Stack.Screen
            name="SolicitarApoyoLegal"
            component={SolicitarApoyoLegalScreen}
          />
          <Stack.Screen name="MisQuejas" component={MisQuejasScreen} />
          <Stack.Screen name="ChatLegal" component={ChatLegalScreen} />

          {/* 🆕 Pantallas Administrativas */}
          {esAdmin && (
            <>
              <Stack.Screen name="AdminLegal" component={AdminLegalScreen} />
              <Stack.Screen
                name="ModerarPublicaciones"
                component={ModerarPublicacionesScreen}
              />
            </>
          )}
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

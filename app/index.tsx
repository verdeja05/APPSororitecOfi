import React from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import BienvenidaScreen from '../src/screens/BienvenidaScreen';
import LoginScreen from '../src/screens/LoginScreen';
import RegistroScreen from '../src/screens/RegistroScreen';
import HomeScreen from '../src/screens/HomeScreen';
import CrearPublicacionScreen from '../src/screens/CrearPublicacionScreen';
import GPSScreen from '../src/screens/GPSScreen';
import ForoScreen from '../src/screens/ForoScreen';
import DudasMedicasScreen from '../src/screens/DudasMedicasScreen';
import DudasLegalesScreen from '../src/screens/DudasLegalesScreen';
import TalleresScreen from '../src/screens/TalleresScreen';
import BecasScreen from '../src/screens/BecasScreen';
import PerfilScreen from '../src/screens/PerfilScreen';
import { useAuth } from '../src/context/AuthContext';
import { createStackNavigator } from '@react-navigation/stack';
import CrearHistoriaScreen from '../src/screens/CrearHistoriaScreen';
import VerHistoriaScreen from '../src/screens/VerHistoriaScreen';

const Stack = createStackNavigator();

function Navigation() {
  const { usuaria } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!usuaria ? (
        <>
          <Stack.Screen name="Bienvenida" component={BienvenidaScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegistroScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CrearPublicacion" component={CrearPublicacionScreen} />
          <Stack.Screen name="GPS" component={GPSScreen} />
          <Stack.Screen name="Foro" component={ForoScreen} />
          <Stack.Screen name="DudasMedicas" component={DudasMedicasScreen} />
          <Stack.Screen name="DudasLegales" component={DudasLegalesScreen} />
          <Stack.Screen name="Talleres" component={TalleresScreen} />
          <Stack.Screen name="Becas" component={BecasScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
          <Stack.Screen name="CrearHistoria" component={CrearHistoriaScreen} />
          <Stack.Screen name="VerHistoria" component={VerHistoriaScreen} />
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
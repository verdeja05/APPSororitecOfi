import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import BienvenidaScreen from '../screens/BienvenidaScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import HomeScreen from '../screens/HomeScreen';
import CrearPublicacionScreen from '../screens/CrearPublicacionScreen';
import ForoScreen from '../screens/ForoScreen';
import DudasMedicasScreen from '../screens/DudasMedicasScreen';
import DudasLegalesScreen from '../screens/DudasLegalesScreen';
import TalleresScreen from '../screens/TalleresScreen';
import BecasScreen from '../screens/BecasScreen';
import GPSScreen from '../screens/GPSScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { usuaria } = useAuth();

  return (
    <NavigationContainer>
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
            <Stack.Screen name="Foro" component={ForoScreen} />
            <Stack.Screen name="DudasMedicas" component={DudasMedicasScreen} />
            <Stack.Screen name="DudasLegales" component={DudasLegalesScreen} />
            <Stack.Screen name="Talleres" component={TalleresScreen} />
            <Stack.Screen name="Becas" component={BecasScreen} />
            <Stack.Screen name="GPS" component={GPSScreen} />
            <Stack.Screen name="Perfil" component={PerfilScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
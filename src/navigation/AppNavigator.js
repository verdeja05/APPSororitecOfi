import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useAuth } from "../context/AuthContext";
import BecasScreen from "../screens/BecasScreen";
import BienvenidaScreen from "../screens/BienvenidaScreen";
import CrearPublicacionScreen from "../screens/CrearPublicacionScreen";
import DudasMedicasScreen from "../screens/DudasMedicasScreen";
import ForoScreen from "../screens/ForoScreen";
import GPSScreen from "../screens/GPSScreen";
import HomeScreen from "../screens/HomeScreen";
import LegalScreen from "../screens/LegalScreen";
import LoginScreen from "../screens/LoginScreen";
import PerfilScreen from "../screens/PerfilScreen";
import PsicopedagogiaScreen from "../screens/PsicopedagogiaScreen";
import RegistroScreen from "../screens/RegistroScreen";
import TalleresScreen from "../screens/TalleresScreen";

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
            <Stack.Screen
              name="CrearPublicacion"
              component={CrearPublicacionScreen}
            />
            <Stack.Screen name="Foro" component={ForoScreen} />
            <Stack.Screen name="DudasMedicas" component={DudasMedicasScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
            <Stack.Screen
              name="Psicopedagogia"
              component={PsicopedagogiaScreen}
            />
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

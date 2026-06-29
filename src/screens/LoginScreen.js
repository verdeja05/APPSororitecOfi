import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const { login, cargando } = useAuth();

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }
    const resultado = await login(correo, contrasena);
    if (!resultado.exito) Alert.alert('Error', resultado.mensaje);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.volver} onPress={() => navigation.navigate('Bienvenida')}>
        <Text style={styles.volverTexto}>{'< Volver'}</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Bienvenida de vuelta</Text>
      <Text style={styles.subtitulo}>Inicia sesión en tu cuenta Sororitec</Text>

      <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.icono}></Text>
        <TextInput
          style={styles.input}
          placeholder="tu@correo.com"
          placeholderTextColor="#888"
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <Text style={styles.label}>CONTRASEÑA</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.icono}></Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#888"
          value={contrasena}
          onChangeText={setContrasena}
          secureTextEntry={!verContrasena}
        />
        <TouchableOpacity onPress={() => setVerContrasena(!verContrasena)}>
          <Text style={styles.icono}>{verContrasena ? 'ver' : 'no ver'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity>
        <Text style={styles.olvidaste}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.boton} onPress={handleLogin} disabled={cargando}>
        {cargando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.botonTexto}>Entrar →</Text>}
      </TouchableOpacity>

      <Text style={styles.terminos}>
        Al continuar aceptas nuestros <Text style={styles.link}>Términos</Text> y <Text style={styles.link}>Privacidad</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', padding: 24, justifyContent: 'center' },
  volver: { position: 'absolute', top: 50, left: 24 },
  volverTexto: { color: '#fff', fontSize: 16 },
  titulo: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8, marginTop: 40 },
  subtitulo: { fontSize: 14, color: '#aaa', marginBottom: 32 },
  label: { fontSize: 11, color: '#aaa', letterSpacing: 1, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1B3A', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20 },
  icono: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, color: '#fff', paddingVertical: 16, fontSize: 15 },
  olvidaste: { color: '#9B6DFF', marginBottom: 32 },
  boton: { backgroundColor: '#7C3AED', padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  terminos: { color: '#666', textAlign: 'center', fontSize: 12 },
  link: { color: '#9B6DFF' }
});
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function BienvenidaScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoIcono}></Text>
      </View>

      <Text style={styles.titulo}>sororitec</Text>
      <Text style={styles.subtitulo}>TU RED, TU COMUNIDAD</Text>

      <View style={styles.imagenContainer}>
        <Text style={styles.badge}>+128K MUJERES CONECTADAS</Text>
      </View>

      <TouchableOpacity
        style={styles.botonPrimario}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.botonPrimarioTexto}>Iniciar sesión →</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonSecundario}
        onPress={() => navigation.navigate('Registro')}>
        <Text style={styles.botonSecundarioTexto}>Crear cuenta</Text>
      </TouchableOpacity>

      <Text style={styles.oText}>o continúa con</Text>

      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialBtn}>
          <Text>G</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialBtn}>
          <Text></Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialBtn}>
          <Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A', padding: 24, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 60, height: 60, backgroundColor: '#7C3AED', borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoIcono: { fontSize: 28 },
  titulo: { fontSize: 36, fontWeight: 'bold', color: '#fff', letterSpacing: 2, marginBottom: 4 },
  subtitulo: { fontSize: 12, color: '#aaa', letterSpacing: 3, marginBottom: 32 },
  imagenContainer: { width: '100%', height: 180, backgroundColor: '#1E1B3A', borderRadius: 16, marginBottom: 32, justifyContent: 'flex-end', padding: 16 },
  badge: { color: '#9B6DFF', fontWeight: 'bold', fontSize: 13 },
  botonPrimario: { backgroundColor: '#7C3AED', width: '100%', padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  botonPrimarioTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  botonSecundario: { width: '100%', padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#333' },
  botonSecundarioTexto: { color: '#fff', fontSize: 16 },
  oText: { color: '#666', marginBottom: 16 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { backgroundColor: '#1E1B3A', width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});
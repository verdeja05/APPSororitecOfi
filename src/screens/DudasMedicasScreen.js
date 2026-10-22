import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DudasMedicasScreen({ navigation }) {
  const opciones = [
    { icono: '🩺', titulo: 'Nueva consulta médica', sub: 'Habla con una médica', ruta: 'Consulta', params: { tipo: 'medica' } },
    { icono: '🧠', titulo: 'Consulta psicológica', sub: 'Habla con una psicóloga', ruta: 'Consulta', params: { tipo: 'psicologica' } },
    { icono: '📋', titulo: 'Mis consultas', sub: 'Ver el estado de tus consultas', ruta: 'MisConsultas', params: {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>🩺 Salud y Bienestar</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>💜</Text>
          <Text style={styles.bannerTitulo}>Tu salud importa</Text>
          <Text style={styles.bannerSub}>
            Nuestras especialistas están aquí para apoyarte. 
            Todas las consultas son confidenciales y seguras.
          </Text>
        </View>

        {opciones.map((op, i) => (
          <TouchableOpacity
            key={i}
            style={styles.opcionCard}
            onPress={() => navigation.navigate(op.ruta, op.params)}>
            <Text style={styles.opcionIcono}>{op.icono}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.opcionTitulo}>{op.titulo}</Text>
              <Text style={styles.opcionSub}>{op.sub}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitulo}>🩺 Consultas médicas</Text>
          {[
            '🌡️ Síntomas físicos',
            '💊 Dudas sobre medicamentos',
            '🏥 Orientación sobre tratamientos',
          ].map((item, i) => (
            <Text key={i} style={styles.infoItem}>{item}</Text>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitulo}>🧠 Consultas psicológicas</Text>
          {[
            '😔 Ansiedad o depresión',
            '💔 Problemas emocionales',
            '🧘 Bienestar mental',
            '🆘 Crisis emocionales',
          ].map((item, i) => (
            <Text key={i} style={styles.infoItem}>{item}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  volver: { color: '#9B6DFF', fontSize: 16 },
  titulo: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  banner: { backgroundColor: '#1E1B3A', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#7C3AED' },
  bannerEmoji: { fontSize: 48, marginBottom: 8 },
  bannerTitulo: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  bannerSub: { color: '#aaa', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  opcionCard: { backgroundColor: '#1E1B3A', borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  opcionIcono: { fontSize: 28 },
  opcionTitulo: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  opcionSub: { color: '#aaa', fontSize: 12 },
  arrow: { color: '#7C3AED', fontSize: 24 },
  infoCard: { backgroundColor: '#1E1B3A', borderRadius: 14, padding: 16, marginBottom: 12 },
  infoTitulo: { color: '#9B6DFF', fontWeight: 'bold', fontSize: 14, marginBottom: 12 },
  infoItem: { color: '#aaa', fontSize: 13, marginBottom: 8, lineHeight: 20 },
});
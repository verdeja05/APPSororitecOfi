import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function MisConsultasScreen({ navigation }) {
  const [consultas, setConsultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      cargar();
    }, [])
  );

  const cargar = async () => {
    try {
      const res = await api.get('/consultas/mis-consultas');
      setConsultas(res.data);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const estadoColor = (estado) => ({
    pendiente: '#FFA500',
    en_revision: '#2196F3',
    respondida: '#4CAF50',
    cerrada: '#666'
  })[estado] || '#666';

  const estadoTexto = (estado) => ({
    pendiente: '⏳ Pendiente',
    en_revision: '👀 En revisión',
    respondida: '✅ Respondida',
    cerrada: '🔒 Cerrada'
  })[estado] || estado;

  const tipoIcono = (tipo) => ({
    legal: '⚖️',
    medica: '🩺',
    psicologica: '🧠'
  })[tipo] || '📋';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Mis consultas</Text>
        <View style={{ width: 60 }} />
      </View>

      {cargando ? (
        <ActivityIndicator color="#7C3AED" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => { setRefrescando(true); cargar(); }}
              colors={['#7C3AED']}
            />
          }>
          {consultas.length === 0 ? (
            <View style={styles.vacio}>
              <Text style={styles.vacioEmoji}>📋</Text>
              <Text style={styles.vacioTexto}>No tienes consultas aún</Text>
            </View>
          ) : (
            <View style={styles.lista}>
              {consultas.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.card}
                  onPress={() => navigation.navigate('ChatConsulta', { consultaId: c._id })}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardIcono}>{tipoIcono(c.tipo)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardAsunto}>{c.asunto}</Text>
                      <Text style={styles.cardFecha}>
                        {new Date(c.fecha_consulta).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={[styles.estadoBadge, { backgroundColor: estadoColor(c.estado) }]}>
                      <Text style={styles.estadoTexto}>{estadoTexto(c.estado)}</Text>
                    </View>
                  </View>
                  {c.respuesta && (
                    <View style={styles.respuestaPreview}>
                      <Text style={styles.respuestaLabel}>Respuesta de {c.nombre_especialista}:</Text>
                      <Text style={styles.respuestaTexto} numberOfLines={2}>{c.respuesta}</Text>
                    </View>
                  )}
                  {c.estado === 'respondida' && c.chat_activo && (
                    <Text style={styles.chatActivo}>💬 Chat disponible</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  volver: { color: '#9B6DFF', fontSize: 16 },
  titulo: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  lista: { padding: 16 },
  card: { backgroundColor: '#1E1B3A', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cardIcono: { fontSize: 28 },
  cardAsunto: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  cardFecha: { color: '#555', fontSize: 11 },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  estadoTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  respuestaPreview: { backgroundColor: '#0D0D1A', borderRadius: 8, padding: 10, marginTop: 8 },
  respuestaLabel: { color: '#9B6DFF', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  respuestaTexto: { color: '#aaa', fontSize: 13 },
  chatActivo: { color: '#4CAF50', fontSize: 12, marginTop: 8, fontWeight: '600' },
  vacio: { alignItems: 'center', paddingTop: 60 },
  vacioEmoji: { fontSize: 48, marginBottom: 16 },
  vacioTexto: { color: '#aaa', fontSize: 16 },
});
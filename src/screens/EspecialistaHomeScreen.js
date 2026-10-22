import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function EspecialistaHomeScreen({ navigation }) {
  const { usuaria, logout } = useAuth();
  const [consultas, setConsultas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [tab, setTab] = useState('pendientes');

  const tipoMap = { abogada: 'legal', psicologa: 'psicologica', medica: 'medica' };
  const tipo = tipoMap[usuaria?.rol];
  const titulo = { abogada: '⚖️ Panel Legal', psicologa: '🧠 Panel Psicológico', medica: '🩺 Panel Médico' }[usuaria?.rol];

  useFocusEffect(
    React.useCallback(() => {
      cargar();
    }, [])
  );

  const cargar = async () => {
    try {
      const res = await api.get(`/consultas/tipo/${tipo}`);
      setConsultas(res.data);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const consultasFiltradas = consultas.filter(c => {
    if (tab === 'pendientes') return c.estado === 'pendiente';
    if (tab === 'activas') return ['en_revision', 'respondida'].includes(c.estado);
    if (tab === 'cerradas') return c.estado === 'cerrada';
    return true;
  });

  const estadoColor = {
    pendiente: '#FFA500', en_revision: '#2196F3',
    respondida: '#4CAF50', cerrada: '#666'
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>Hola, {usuaria?.nombre_completo?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitulo}>{titulo}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
          <View style={styles.avatar}>
            {usuaria?.foto_perfil ? (
              <Image source={{ uri: usuaria.foto_perfil }} style={{ width: 44, height: 44, borderRadius: 22 }} />
            ) : (
              <Text style={{ fontSize: 22 }}>👩‍⚕️</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{consultas.filter(c => c.estado === 'pendiente').length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{consultas.filter(c => c.estado === 'en_revision').length}</Text>
          <Text style={styles.statLabel}>En revisión</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{consultas.filter(c => c.estado === 'respondida').length}</Text>
          <Text style={styles.statLabel}>Respondidas</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'pendientes', label: 'Pendientes' },
          { key: 'activas', label: 'Activas' },
          { key: 'cerradas', label: 'Cerradas' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActivo]}
            onPress={() => setTab(t.key)}>
            <Text style={[styles.tabTexto, tab === t.key && styles.tabTextoActivo]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
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
          <View style={styles.lista}>
            {consultasFiltradas.length === 0 ? (
              <View style={styles.vacio}>
                <Text style={styles.vacioEmoji}>📋</Text>
                <Text style={styles.vacioTexto}>No hay consultas {tab}</Text>
              </View>
            ) : (
              consultasFiltradas.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.card}
                  onPress={() => navigation.navigate('ConsultaDetalle', { consultaId: c._id })}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardAvatar}>
                      {c.id_usuaria?.foto_perfil ? (
                        <Image source={{ uri: c.id_usuaria.foto_perfil }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                      ) : (
                        <Text style={{ fontSize: 22 }}>👩</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardNombre}>{c.nombre_usuaria || 'Usuaria'}</Text>
                      <Text style={styles.cardAsunto}>{c.asunto}</Text>
                      <Text style={styles.cardFecha}>
                        {new Date(c.fecha_consulta).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <View style={[styles.estadoBadge, { backgroundColor: estadoColor[c.estado] }]}>
                      <Text style={styles.estadoTexto}>{c.estado}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDesc} numberOfLines={2}>{c.descripcion}</Text>
                  {c.estado === 'pendiente' && (
                    <View style={styles.nuevaBadge}>
                      <Text style={styles.nuevaTexto}>⚡ Requiere atención</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  saludo: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subtitulo: { color: '#9B6DFF', fontSize: 13, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E1B3A', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#1E1B3A', borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum: { color: '#7C3AED', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#aaa', fontSize: 11, marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#1E1B3A' },
  tabActivo: { borderBottomColor: '#7C3AED' },
  tabTexto: { color: '#555', fontSize: 12 },
  tabTextoActivo: { color: '#9B6DFF', fontWeight: 'bold' },
  lista: { padding: 16 },
  card: { backgroundColor: '#1E1B3A', borderRadius: 14, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2D1B69', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardNombre: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardAsunto: { color: '#9B6DFF', fontSize: 12, marginTop: 2 },
  cardFecha: { color: '#555', fontSize: 11, marginTop: 2 },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  estadoTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardDesc: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  nuevaBadge: { backgroundColor: '#2D1B69', borderRadius: 8, padding: 6, marginTop: 8, alignItems: 'center' },
  nuevaTexto: { color: '#FFA500', fontSize: 12, fontWeight: 'bold' },
  vacio: { alignItems: 'center', paddingTop: 60 },
  vacioEmoji: { fontSize: 48, marginBottom: 16 },
  vacioTexto: { color: '#aaa', fontSize: 16 },
  logoutBtn: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1E1B3A' },
  logoutTexto: { color: '#ff6b6b', fontSize: 14 },
});
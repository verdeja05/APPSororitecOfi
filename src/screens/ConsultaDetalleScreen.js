import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function ConsultaDetalleScreen({ navigation, route }) {
  const { consultaId } = route.params;
  const [consulta, setConsulta] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      cargar();
    }, [])
  );

  const cargar = async () => {
    try {
      const res = await api.get(`/consultas/${consultaId}`);
      setConsulta(res.data);
      if (res.data.respuesta) setRespuesta(res.data.respuesta);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const enviarRespuesta = async () => {
    if (!respuesta.trim()) {
      Alert.alert('Error', 'Escribe una respuesta');
      return;
    }
    setEnviando(true);
    try {
      await api.put(`/consultas/responder/${consultaId}`, { respuesta });
      Alert.alert('✅ Respuesta enviada', 'La usuaria podrá ver tu respuesta y chatear contigo.');
      cargar();
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar');
    } finally {
      setEnviando(false);
    }
  };

  const cerrarConsulta = async () => {
    Alert.alert(
      '🔒 Cerrar consulta',
      '¿Estás segura de que quieres cerrar esta consulta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar',
          onPress: async () => {
            try {
              await api.put(`/consultas/cerrar/${consultaId}`);
              Alert.alert('Consulta cerrada', 'La consulta ha sido cerrada.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'No se pudo cerrar');
            }
          }
        }
      ]
    );
  };

  if (cargando) return (
    <View style={styles.loading}>
      <ActivityIndicator color="#7C3AED" size="large" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Detalle de consulta</Text>
        <TouchableOpacity onPress={cerrarConsulta}>
          <Text style={styles.cerrarBtn}>🔒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Info usuaria */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>👩 Usuaria</Text>
          <Text style={styles.cardValor}>{consulta?.nombre_usuaria}</Text>
          <Text style={styles.cardLabel}>📅 Fecha</Text>
          <Text style={styles.cardValor}>
            {new Date(consulta?.fecha_consulta).toLocaleString('es-MX')}
          </Text>
        </View>

        {/* Consulta */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>📋 Asunto</Text>
          <Text style={styles.cardValor}>{consulta?.asunto}</Text>
          <Text style={styles.cardLabel}>📝 Descripción</Text>
          <Text style={styles.descripcion}>{consulta?.descripcion}</Text>
        </View>

        {/* Respuesta */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            {consulta?.respuesta ? '✅ Tu respuesta' : '📤 Escribir respuesta'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu respuesta profesional aquí..."
            placeholderTextColor="#555"
            value={respuesta}
            onChangeText={setRespuesta}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={consulta?.estado !== 'cerrada'}
          />
          {consulta?.estado !== 'cerrada' && (
            <TouchableOpacity
              style={styles.botonResponder}
              onPress={enviarRespuesta}
              disabled={enviando}>
              {enviando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.botonTexto}>
                    {consulta?.respuesta ? '✏️ Actualizar respuesta' : '📤 Enviar respuesta'}
                  </Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Ir al chat */}
        {consulta?.chat_activo && (
          <TouchableOpacity
            style={styles.botonChat}
            onPress={() => navigation.navigate('ChatConsulta', { consultaId })}>
            <Text style={styles.botonTexto}>💬 Abrir chat con la usuaria</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  loading: { flex: 1, backgroundColor: '#0D0D1A', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  volver: { color: '#9B6DFF', fontSize: 16 },
  titulo: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cerrarBtn: { fontSize: 22 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#1E1B3A', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardLabel: { color: '#9B6DFF', fontSize: 12, fontWeight: 'bold', marginBottom: 4, marginTop: 8 },
  cardValor: { color: '#fff', fontSize: 14, marginBottom: 4 },
  descripcion: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  input: { backgroundColor: '#0D0D1A', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, minHeight: 120, marginTop: 8 },
  botonResponder: { backgroundColor: '#7C3AED', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  botonChat: { backgroundColor: '#2196F3', padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 40 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
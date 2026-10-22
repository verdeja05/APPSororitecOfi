import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ChatConsultaScreen({ navigation, route }) {
  const { consultaId } = route.params;
  const { usuaria } = useAuth();
  const [consulta, setConsulta] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const scrollRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      cargar();
      const intervalo = setInterval(cargar, 5000);
      return () => clearInterval(intervalo);
    }, [])
  );

  const cargar = async () => {
    try {
      const res = await api.get(`/consultas/${consultaId}`);
      setConsulta(res.data);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;
    setEnviando(true);
    try {
      await api.post(`/consultas/chat/${consultaId}`, { mensaje });
      setMensaje('');
      cargar();
      setTimeout(() => scrollRef.current?.scrollToEnd(), 300);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setEnviando(false);
    }
  };

  const tipoIcono = { legal: '⚖️', medica: '🩺', psicologica: '🧠' };
  const estadoColor = {
    pendiente: '#FFA500', en_revision: '#2196F3',
    respondida: '#4CAF50', cerrada: '#666'
  };

  if (cargando) return (
    <View style={styles.loading}>
      <ActivityIndicator color="#7C3AED" size="large" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitulo}>
            {tipoIcono[consulta?.tipo]} {consulta?.asunto}
          </Text>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor[consulta?.estado] }]}>
            <Text style={styles.estadoTexto}>{consulta?.estado}</Text>
          </View>
        </View>
        <View style={{ width: 50 }} />
      </View>

      {/* Info consulta */}
      <View style={styles.infoConsulta}>
        <Text style={styles.infoLabel}>Tu consulta:</Text>
        <Text style={styles.infoTexto} numberOfLines={2}>{consulta?.descripcion}</Text>
        {consulta?.nombre_especialista && (
          <Text style={styles.especialistaTexto}>
            Atendida por: {consulta.nombre_especialista} 💜
          </Text>
        )}
      </View>

      {/* Respuesta inicial si existe */}
      {consulta?.respuesta && (
        <View style={styles.respuestaCard}>
          <Text style={styles.respuestaLabel}>✅ Respuesta oficial:</Text>
          <Text style={styles.respuestaTexto}>{consulta.respuesta}</Text>
        </View>
      )}

      {/* Chat */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          style={styles.mensajesList}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd()}>
          {consulta?.mensajes?.length === 0 && (
            <Text style={styles.sinMensajes}>
              {consulta?.chat_activo
                ? 'El chat está activo. ¡Escribe tu mensaje!'
                : 'El chat estará disponible cuando la especialista responda tu consulta.'}
            </Text>
          )}
          {consulta?.mensajes?.map((m, i) => {
            const esMio = m.id_autor === usuaria?._id ||
              m.nombre_autor === usuaria?.nombre_completo;
            return (
              <View key={i} style={[
                styles.mensajeRow,
                esMio ? styles.mensajeMioRow : styles.mensajeOtroRow
              ]}>
                {!esMio && (
                  <View style={styles.avatarMensaje}>
                    <Text style={{ fontSize: 16 }}>
                      {m.rol_autor === 'abogada' ? '⚖️' :
                       m.rol_autor === 'medica' ? '🩺' :
                       m.rol_autor === 'psicologa' ? '🧠' : '👩'}
                    </Text>
                  </View>
                )}
                <View style={[
                  styles.burbuja,
                  esMio ? styles.burbujaPropia : styles.burbujaAjena
                ]}>
                  {!esMio && (
                    <Text style={styles.nombreMensaje}>{m.nombre_autor}</Text>
                  )}
                  <Text style={styles.textoMensaje}>{m.mensaje}</Text>
                  <Text style={styles.fechaMensaje}>
                    {new Date(m.fecha).toLocaleTimeString('es-MX', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input mensaje */}
        {consulta?.chat_activo && consulta?.estado !== 'cerrada' ? (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#555"
              value={mensaje}
              onChangeText={setMensaje}
              multiline
            />
            <TouchableOpacity
              style={styles.enviarBtn}
              onPress={enviarMensaje}
              disabled={enviando || !mensaje.trim()}>
              {enviando
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.enviarTexto}>→</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.chatCerrado}>
            <Text style={styles.chatCerradoTexto}>
              {consulta?.estado === 'cerrada'
                ? '🔒 Esta consulta está cerrada'
                : '⏳ El chat estará disponible cuando la especialista responda'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  loading: { flex: 1, backgroundColor: '#0D0D1A', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E1B3A' },
  volver: { color: '#9B6DFF', fontSize: 16 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitulo: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  infoConsulta: { backgroundColor: '#1E1B3A', margin: 12, borderRadius: 12, padding: 12 },
  infoLabel: { color: '#9B6DFF', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  infoTexto: { color: '#aaa', fontSize: 13 },
  especialistaTexto: { color: '#4CAF50', fontSize: 12, marginTop: 6 },
  respuestaCard: { backgroundColor: '#1a2f1a', margin: 12, marginTop: 0, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#4CAF50' },
  respuestaLabel: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  respuestaTexto: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  mensajesList: { flex: 1, padding: 12 },
  sinMensajes: { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 14, lineHeight: 22 },
  mensajeRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  mensajeMioRow: { justifyContent: 'flex-end' },
  mensajeOtroRow: { justifyContent: 'flex-start' },
  avatarMensaje: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2D1B69', alignItems: 'center', justifyContent: 'center' },
  burbuja: { maxWidth: '75%', borderRadius: 16, padding: 10 },
  burbujaPropia: { backgroundColor: '#7C3AED', borderBottomRightRadius: 4 },
  burbujaAjena: { backgroundColor: '#1E1B3A', borderBottomLeftRadius: 4 },
  nombreMensaje: { color: '#9B6DFF', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  textoMensaje: { color: '#fff', fontSize: 14, lineHeight: 20 },
  fechaMensaje: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#1E1B3A', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#1E1B3A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 80 },
  enviarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  enviarTexto: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  chatCerrado: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1E1B3A' },
  chatCerradoTexto: { color: '#555', fontSize: 13 },
});
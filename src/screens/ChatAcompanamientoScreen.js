import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView,
  Platform, ActivityIndicator, SafeAreaView
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatAcompanamientoScreen({ route, navigation }) {
  const { id, nombreOtra } = route.params;
  const { usuaria } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const flatListRef = useRef(null);
  const intervaloRef = useRef(null);

  useEffect(() => {
    cargarMensajes();
    intervaloRef.current = setInterval(cargarMensajes, 3000);
    return () => clearInterval(intervaloRef.current);
  }, []);

  const cargarMensajes = async () => {
    try {
      const res = await api.get(`/mensajes/${id}`);
      setMensajes(res.data);
    } catch (err) {
      console.log('Error cargando mensajes:', err);
    } finally {
      setCargando(false);
    }
  };

  const enviarMensaje = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await api.post(`/mensajes/${id}`, { texto });
      setTexto('');
      await cargarMensajes();
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.log('Error enviando:', err);
    } finally {
      setEnviando(false);
    }
  };

  const esMio = (msg) => msg.id_usuaria === usuaria?.id || msg.nombre === usuaria?.nombre_completo;

  const formatHora = (fecha) => new Date(fecha).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.titulo}>💬 Chat Sorori</Text>
          <Text style={styles.subtitulo}>con {nombreOtra}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.aviso}>
        <Text style={styles.avisoTexto}>
          🔒 Chat temporal — solo disponible durante el acompañamiento
        </Text>
      </View>

      {cargando ? (
        <View style={styles.cargando}>
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item._id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={styles.vacioEmoji}>💜</Text>
              <Text style={styles.vacioTexto}>Aún no hay mensajes</Text>
              <Text style={styles.vacioSub}>¡Saluda a tu compañera sorori!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mio = esMio(item);
            return (
              <View style={[styles.msgRow, mio ? styles.msgRowMio : styles.msgRowOtra]}>
                {!mio && (
                  <View style={styles.avatar}>
                    <Text style={{ fontSize: 16 }}>🌸</Text>
                  </View>
                )}
                <View style={[styles.burbuja, mio ? styles.burbujaM : styles.burbujaO]}>
                  {!mio && (
                    <Text style={styles.msgNombre}>{item.nombre?.split(' ')[0]}</Text>
                  )}
                  <Text style={styles.msgTexto}>{item.texto}</Text>
                  <Text style={styles.msgHora}>{formatHora(item.fecha)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#555"
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.botonEnviar, !texto.trim() && styles.botonDesactivado]}
            onPress={enviarMensaje}
            disabled={enviando || !texto.trim()}>
            {enviando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.enviarTexto}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#1E1B3A' },
  volver: { color: '#9B6DFF', fontSize: 16 },
  headerCenter: { alignItems: 'center' },
  titulo: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subtitulo: { color: '#9B6DFF', fontSize: 12 },
  aviso: { backgroundColor: '#1E1B3A', margin: 12, borderRadius: 10, padding: 10 },
  avisoTexto: { color: '#666', fontSize: 11, textAlign: 'center' },
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lista: { padding: 16, paddingBottom: 8 },
  vacio: { alignItems: 'center', paddingVertical: 60 },
  vacioEmoji: { fontSize: 40, marginBottom: 12 },
  vacioTexto: { color: '#aaa', fontSize: 15, fontWeight: '600' },
  vacioSub: { color: '#555', fontSize: 13, marginTop: 4 },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  msgRowMio: { justifyContent: 'flex-end' },
  msgRowOtra: { justifyContent: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2D1B69', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  burbuja: { maxWidth: '75%', borderRadius: 16, padding: 12 },
  burbujaM: { backgroundColor: '#7C3AED', borderBottomRightRadius: 4 },
  burbujaO: { backgroundColor: '#1E1B3A', borderBottomLeftRadius: 4 },
  msgNombre: { color: '#9B6DFF', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  msgTexto: { color: '#fff', fontSize: 14, lineHeight: 20 },
  msgHora: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1E1B3A', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, backgroundColor: '#1E1B3A', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 100 },
  botonEnviar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  botonDesactivado: { backgroundColor: '#333' },
  enviarTexto: { color: '#fff', fontSize: 18 },
});
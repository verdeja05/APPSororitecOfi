import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

export default function ConsultaScreen({ navigation, route }) {
  const { tipo } = route.params; // 'legal', 'medica', 'psicologica'
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  const titulo = {
    legal: '⚖️ Consulta Legal',
    medica: '🩺 Consulta Médica',
    psicologica: '🧠 Consulta Psicológica'
  }[tipo];

  const placeholder = {
    legal: 'Describe tu situación legal...',
    medica: 'Describe tus síntomas o situación médica...',
    psicologica: 'Cuéntanos cómo te has sentido...'
  }[tipo];

  const enviar = async () => {
    if (!asunto.trim() || !descripcion.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    setEnviando(true);
    try {
      await api.post('/consultas', { tipo, asunto, descripcion });
      Alert.alert(
        '✅ Consulta enviada',
        'Una especialista revisará tu caso pronto. Puedes ver el estado en "Mis consultas".',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo enviar');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>{titulo}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTexto}>
            Tu consulta será atendida por una especialista certificada. 
            La información es confidencial. 💜
          </Text>
        </View>

        <Text style={styles.label}>Asunto</Text>
        <TextInput
          style={styles.input}
          placeholder="Resume tu consulta en una línea..."
          placeholderTextColor="#555"
          value={asunto}
          onChangeText={setAsunto}
          maxLength={100}
        />

        <Text style={styles.label}>Descripción detallada</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder={placeholder}
          placeholderTextColor="#555"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={styles.contador}>{descripcion.length}/1000</Text>

        <TouchableOpacity
          style={styles.boton}
          onPress={enviar}
          disabled={enviando}>
          {enviando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.botonTexto}>📤 Enviar consulta</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  volver: { color: '#9B6DFF', fontSize: 16 },
  titulo: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  infoCard: { backgroundColor: '#2D1B69', borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#7C3AED' },
  infoTexto: { color: '#9B6DFF', fontSize: 13, lineHeight: 20 },
  label: { color: '#aaa', fontSize: 13, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1E1B3A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 14 },
  inputMultiline: { minHeight: 140, marginBottom: 4 },
  contador: { color: '#444', fontSize: 11, textAlign: 'right', marginBottom: 24 },
  boton: { backgroundColor: '#7C3AED', padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 40 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
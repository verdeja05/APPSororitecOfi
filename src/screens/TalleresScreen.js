import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl,
  TextInput, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Calendar, MapPin, Users,
  Clock, ChevronRight, X, Check
} from 'lucide-react-native';
import api from '../services/api';

const COLORES = {
  primario: '#6C63FF', fondo: '#0A0A14', superficie: '#13131F',
  superficie2: '#1C1C2E', borde: '#2A2A3E', texto: '#F1F1F6',
  textoSub: '#8888AA', exito: '#10B981', alerta: '#F59E0B',
  error: '#EF4444', info: '#3B82F6',
};

export default function TalleresScreen({ navigation }) {
  const { usuaria } = useAuth();
  const [talleres, setTalleres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modalInscripcion, setModalInscripcion] = useState(false);
  const [tallerSeleccionado, setTallerSeleccionado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({
    nombre_completo: usuaria?.nombre_completo || '',
    correo_institucional: usuaria?.correo_institucional || '',
    telefono: '',
    carrera: usuaria?.carrera || '',
    cuatrimestre: usuaria?.cuatrimestre?.toString() || '',
    motivacion: '',
    experiencia_previa: '',
  });

  useFocusEffect(
    React.useCallback(() => {
      cargar();
    }, [])
  );

  const cargar = async () => {
    try {
      const res = await api.get('/talleres');
      setTalleres(res.data);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const abrirInscripcion = (taller) => {
    setTallerSeleccionado(taller);
    setModalInscripcion(true);
  };

  const inscribirse = async () => {
    if (!form.telefono || !form.motivacion) {
      Alert.alert('Campos requeridos', 'Completa todos los campos obligatorios');
      return;
    }
    setEnviando(true);
    try {
      await api.post(`/talleres/${tallerSeleccionado._id}/inscribir`, form);
      Alert.alert(
        'Inscripcion enviada',
        'Tu solicitud fue recibida. Recibiras confirmacion pronto.'
      );
      setModalInscripcion(false);
      cargar();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo completar la inscripcion');
    } finally {
      setEnviando(false);
    }
  };

  const categoriaColor = (cat) => ({
    tecnologia: COLORES.primario, salud: COLORES.exito,
    legal: COLORES.info, bienestar: '#EC4899',
    liderazgo: COLORES.alerta, emprendimiento: '#F97316',
    otro: COLORES.textoSub,
  })[cat] || COLORES.textoSub;

  const modalidadIcono = (mod) => ({
    presencial: 'Presencial', virtual: 'Virtual', hibrido: 'Hibrido'
  })[mod] || mod;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Talleres</Text>
        <View style={{ width: 60 }} />
      </View>

      {cargando ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORES.primario} size="large" />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => { setRefrescando(true); cargar(); }}
              colors={[COLORES.primario]}
              tintColor={COLORES.primario}
            />
          }>
          <View style={styles.seccion}>
            {talleres.length === 0 ? (
              <View style={styles.vacio}>
                <BookOpen size={48} color={COLORES.borde} />
                <Text style={styles.vacioTexto}>No hay talleres disponibles</Text>
                <Text style={styles.vacioSub}>Vuelve pronto para ver nuevas oportunidades</Text>
              </View>
            ) : (
              talleres.map((t, i) => (
                <View key={i} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.categoriaChip, { backgroundColor: categoriaColor(t.categoria) + '20' }]}>
                      <Text style={[styles.categoriaTexto, { color: categoriaColor(t.categoria) }]}>
                        {t.categoria}
                      </Text>
                    </View>
                    <View style={[styles.modalidadChip]}>
                      <Text style={styles.modalidadTexto}>{modalidadIcono(t.modalidad)}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitulo}>{t.titulo}</Text>
                  <Text style={styles.cardInstructor}>Instructor: {t.instructor}</Text>
                  <Text style={styles.cardDesc} numberOfLines={3}>{t.descripcion}</Text>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Calendar size={13} color={COLORES.textoSub} />
                      <Text style={styles.infoTexto}>
                        {new Date(t.fecha_inicio).toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Clock size={13} color={COLORES.textoSub} />
                      <Text style={styles.infoTexto}>{t.horario}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <MapPin size={13} color={COLORES.textoSub} />
                      <Text style={styles.infoTexto}>{t.lugar}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Users size={13} color={COLORES.textoSub} />
                      <Text style={styles.infoTexto}>{t.cupo_disponible} lugares disponibles</Text>
                    </View>
                  </View>

                  {t.requisitos ? (
                    <View style={styles.requisitosBox}>
                      <Text style={styles.requisitosLabel}>Requisitos:</Text>
                      <Text style={styles.requisitosTexto}>{t.requisitos}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      styles.botonInscribir,
                      t.cupo_disponible === 0 && styles.botonDeshabilitado
                    ]}
                    onPress={() => t.cupo_disponible > 0 && abrirInscripcion(t)}
                    disabled={t.cupo_disponible === 0}>
                    <Text style={styles.botonTexto}>
                      {t.cupo_disponible === 0 ? 'Sin cupo disponible' : 'Inscribirme'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal inscripcion */}
      <Modal visible={modalInscripcion} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitulo}>Formulario de Inscripcion</Text>
                <Text style={styles.modalSubtitulo}>{tallerSeleccionado?.titulo}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalInscripcion(false)}>
                <X size={20} color={COLORES.textoSub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSeccion}>Datos personales</Text>
              {[
                { placeholder: 'Nombre completo *', key: 'nombre_completo' },
                { placeholder: 'Correo institucional *', key: 'correo_institucional' },
                { placeholder: 'Telefono *', key: 'telefono', numeric: true },
                { placeholder: 'Carrera *', key: 'carrera' },
                { placeholder: 'Cuatrimestre *', key: 'cuatrimestre', numeric: true },
              ].map((f, i) => (
                <TextInput
                  key={i}
                  style={styles.modalInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORES.textoSub}
                  value={form[f.key]}
                  onChangeText={t => setForm(prev => ({ ...prev, [f.key]: t }))}
                  keyboardType={f.numeric ? 'numeric' : 'default'}
                  autoCapitalize="none"
                />
              ))}

              <Text style={styles.modalSeccion}>Motivacion</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 90 }]}
                placeholder="Por que deseas participar en este taller? *"
                placeholderTextColor={COLORES.textoSub}
                value={form.motivacion}
                onChangeText={t => setForm(prev => ({ ...prev, motivacion: t }))}
                multiline
                textAlignVertical="top"
              />
              <TextInput
                style={[styles.modalInput, { minHeight: 70 }]}
                placeholder="Experiencia previa relacionada (opcional)"
                placeholderTextColor={COLORES.textoSub}
                value={form.experiencia_previa}
                onChangeText={t => setForm(prev => ({ ...prev, experiencia_previa: t }))}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.modalBotones}>
                <TouchableOpacity
                  style={styles.modalCancelar}
                  onPress={() => setModalInscripcion(false)}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmar}
                  onPress={inscribirse}
                  disabled={enviando}>
                  {enviando
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.modalConfirmarTexto}>Enviar solicitud</Text>}
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondo },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  volver: { color: COLORES.primario, fontSize: 15, fontWeight: '600' },
  titulo: { color: COLORES.texto, fontSize: 18, fontWeight: 'bold' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  seccion: { padding: 16 },
  card: { backgroundColor: COLORES.superficie, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORES.borde },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoriaChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  categoriaTexto: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalidadChip: { backgroundColor: COLORES.superficie2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  modalidadTexto: { color: COLORES.textoSub, fontSize: 11, fontWeight: '500' },
  cardTitulo: { color: COLORES.texto, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  cardInstructor: { color: COLORES.primario, fontSize: 12, marginBottom: 8 },
  cardDesc: { color: COLORES.textoSub, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  infoGrid: { gap: 8, marginBottom: 14 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTexto: { color: COLORES.textoSub, fontSize: 12 },
  requisitosBox: { backgroundColor: COLORES.superficie2, borderRadius: 10, padding: 12, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: COLORES.alerta },
  requisitosLabel: { color: COLORES.alerta, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  requisitosTexto: { color: COLORES.textoSub, fontSize: 12, lineHeight: 18 },
  botonInscribir: { backgroundColor: COLORES.primario, padding: 14, borderRadius: 12, alignItems: 'center' },
  botonDeshabilitado: { backgroundColor: COLORES.borde },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  vacio: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  vacioTexto: { color: COLORES.texto, fontSize: 16, fontWeight: '600' },
  vacioSub: { color: COLORES.textoSub, fontSize: 13, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORES.superficie, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%', borderWidth: 1, borderColor: COLORES.borde },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  modalTitulo: { color: COLORES.texto, fontSize: 17, fontWeight: '700' },
  modalSubtitulo: { color: COLORES.primario, fontSize: 12, marginTop: 4 },
  modalSeccion: { color: COLORES.textoSub, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  modalInput: { backgroundColor: COLORES.fondo, borderRadius: 10, padding: 12, color: COLORES.texto, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORES.borde },
  modalBotones: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelar: { flex: 1, backgroundColor: COLORES.superficie2, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde },
  modalCancelarTexto: { color: COLORES.textoSub, fontWeight: '600' },
  modalConfirmar: { flex: 1, backgroundColor: COLORES.primario, padding: 14, borderRadius: 10, alignItems: 'center' },
  modalConfirmarTexto: { color: '#fff', fontWeight: '700' },
});
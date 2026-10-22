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
  Award, Calendar, ExternalLink,
  Clock, X, FileText, Building
} from 'lucide-react-native';
import api from '../services/api';

const COLORES = {
  primario: '#6C63FF', fondo: '#0A0A14', superficie: '#13131F',
  superficie2: '#1C1C2E', borde: '#2A2A3E', texto: '#F1F1F6',
  textoSub: '#8888AA', exito: '#10B981', alerta: '#F59E0B',
  error: '#EF4444', info: '#3B82F6',
};

const TIPO_COLOR = {
  academica: '#6C63FF', deportiva: '#10B981', cultural: '#EC4899',
  investigacion: '#3B82F6', movilidad: '#F97316', otro: '#8888AA',
};

export default function BecasScreen({ navigation }) {
  const { usuaria } = useAuth();
  const [becas, setBecas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modalAplicar, setModalAplicar] = useState(false);
  const [becaSeleccionada, setBecaSeleccionada] = useState(null);
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
      const res = await api.get('/becas');
      setBecas(res.data);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const abrirAplicar = (beca) => {
    setBecaSeleccionada(beca);
    setModalAplicar(true);
  };

  const aplicar = async () => {
    if (!form.telefono || !form.motivacion) {
      Alert.alert('Campos requeridos', 'Completa todos los campos obligatorios');
      return;
    }
    setEnviando(true);
    try {
      await api.post(`/becas/${becaSeleccionada._id}/aplicar`, form);
      Alert.alert(
        'Aplicacion enviada',
        'Tu solicitud fue recibida. El equipo revisara tu perfil y te notificara.'
      );
      setModalAplicar(false);
      cargar();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo enviar la aplicacion');
    } finally {
      setEnviando(false);
    }
  };

  const diasRestantes = (fecha) => {
    const diff = new Date(fecha) - new Date();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (dias < 0) return 'Vencida';
    if (dias === 0) return 'Vence hoy';
    return `${dias} dias restantes`;
  };

  const diasColor = (fecha) => {
    const diff = new Date(fecha) - new Date();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (dias < 0) return COLORES.error;
    if (dias <= 7) return COLORES.alerta;
    return COLORES.exito;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Becas</Text>
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
            {becas.length === 0 ? (
              <View style={styles.vacio}>
                <Award size={48} color={COLORES.borde} />
                <Text style={styles.vacioTexto}>No hay becas disponibles</Text>
                <Text style={styles.vacioSub}>Revisa pronto para nuevas oportunidades</Text>
              </View>
            ) : (
              becas.map((b, i) => (
                <View key={i} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.tipoChip, { backgroundColor: (TIPO_COLOR[b.tipo] || COLORES.textoSub) + '20' }]}>
                      <Text style={[styles.tipoTexto, { color: TIPO_COLOR[b.tipo] || COLORES.textoSub }]}>
                        {b.tipo}
                      </Text>
                    </View>
                    <View style={[styles.diasChip, { backgroundColor: diasColor(b.fecha_limite) + '20' }]}>
                      <Clock size={11} color={diasColor(b.fecha_limite)} />
                      <Text style={[styles.diasTexto, { color: diasColor(b.fecha_limite) }]}>
                        {diasRestantes(b.fecha_limite)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardNombre}>{b.nombre}</Text>

                  <View style={styles.institucionRow}>
                    <Building size={13} color={COLORES.textoSub} />
                    <Text style={styles.institucionTexto}>{b.institucion}</Text>
                  </View>

                  <Text style={styles.cardDesc} numberOfLines={3}>{b.descripcion}</Text>

                  {b.monto && (
                    <View style={styles.montoBox}>
                      <Text style={styles.montoLabel}>Beneficio economico</Text>
                      <Text style={styles.montoValor}>{b.monto}</Text>
                    </View>
                  )}

                  {b.cubre && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoBoxLabel}>Cubre:</Text>
                      <Text style={styles.infoBoxTexto}>{b.cubre}</Text>
                    </View>
                  )}

                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Requisitos:</Text>
                    <Text style={styles.infoBoxTexto}>{b.requisitos}</Text>
                  </View>

                  {b.documentos_necesarios && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoBoxLabel}>Documentos necesarios:</Text>
                      <Text style={styles.infoBoxTexto}>{b.documentos_necesarios}</Text>
                    </View>
                  )}

                  <View style={styles.fechaRow}>
                    <Calendar size={13} color={COLORES.textoSub} />
                    <Text style={styles.fechaTexto}>
                      Fecha limite: {new Date(b.fecha_limite).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.botonAplicar}
                    onPress={() => abrirAplicar(b)}>
                    <Text style={styles.botonTexto}>Aplicar a esta beca</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal aplicar */}
      <Modal visible={modalAplicar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitulo}>Formulario de Aplicacion</Text>
                <Text style={styles.modalSubtitulo}>{becaSeleccionada?.nombre}</Text>
                <Text style={styles.modalInstitucion}>{becaSeleccionada?.institucion}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalAplicar(false)}>
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

              <Text style={styles.modalSeccion}>Carta de motivacion</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 100 }]}
                placeholder="Por que mereces esta beca? Describe tus logros y metas *"
                placeholderTextColor={COLORES.textoSub}
                value={form.motivacion}
                onChangeText={t => setForm(prev => ({ ...prev, motivacion: t }))}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.contador}>{form.motivacion.length}/500</Text>

              <TextInput
                style={[styles.modalInput, { minHeight: 80 }]}
                placeholder="Experiencia o logros academicos relevantes (opcional)"
                placeholderTextColor={COLORES.textoSub}
                value={form.experiencia_previa}
                onChangeText={t => setForm(prev => ({ ...prev, experiencia_previa: t }))}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.modalBotones}>
                <TouchableOpacity
                  style={styles.modalCancelar}
                  onPress={() => setModalAplicar(false)}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmar}
                  onPress={aplicar}
                  disabled={enviando}>
                  {enviando
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.modalConfirmarTexto}>Enviar aplicacion</Text>}
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
  tipoChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  tipoTexto: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  diasChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  diasTexto: { fontSize: 11, fontWeight: '600' },
  cardNombre: { color: COLORES.texto, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  institucionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  institucionTexto: { color: COLORES.textoSub, fontSize: 12 },
  cardDesc: { color: COLORES.textoSub, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  montoBox: { backgroundColor: COLORES.exito + '15', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORES.exito + '30' },
  montoLabel: { color: COLORES.exito, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  montoValor: { color: COLORES.exito, fontSize: 16, fontWeight: '800' },
  infoBox: { backgroundColor: COLORES.superficie2, borderRadius: 10, padding: 12, marginBottom: 10 },
  infoBoxLabel: { color: COLORES.textoSub, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  infoBoxTexto: { color: COLORES.texto, fontSize: 13, lineHeight: 18 },
  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  fechaTexto: { color: COLORES.textoSub, fontSize: 12 },
  botonAplicar: { backgroundColor: COLORES.primario, padding: 14, borderRadius: 12, alignItems: 'center' },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  vacio: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  vacioTexto: { color: COLORES.texto, fontSize: 16, fontWeight: '600' },
  vacioSub: { color: COLORES.textoSub, fontSize: 13, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORES.superficie, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '92%', borderWidth: 1, borderColor: COLORES.borde },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 12 },
  modalTitulo: { color: COLORES.texto, fontSize: 17, fontWeight: '700' },
  modalSubtitulo: { color: COLORES.primario, fontSize: 12, marginTop: 4 },
  modalInstitucion: { color: COLORES.textoSub, fontSize: 11, marginTop: 2 },
  modalSeccion: { color: COLORES.textoSub, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  modalInput: { backgroundColor: COLORES.fondo, borderRadius: 10, padding: 12, color: COLORES.texto, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORES.borde },
  contador: { color: COLORES.textoSub, fontSize: 11, textAlign: 'right', marginBottom: 10, marginTop: -6 },
  modalBotones: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelar: { flex: 1, backgroundColor: COLORES.superficie2, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde },
  modalCancelarTexto: { color: COLORES.textoSub, fontWeight: '600' },
  modalConfirmar: { flex: 1, backgroundColor: COLORES.primario, padding: 14, borderRadius: 10, alignItems: 'center' },
  modalConfirmarTexto: { color: '#fff', fontWeight: '700' },
});
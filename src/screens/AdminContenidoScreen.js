import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl,
  TextInput, Alert, Modal, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  BookOpen, Award, Users, Plus, FileText,
  X, Check, Clock, BarChart2, Calendar, MapPin, User
} from 'lucide-react-native';
import api from '../services/api';

const { width } = Dimensions.get('window');

const COLORES = {
  primario: '#6C63FF', secundario: '#A78BFA', fondo: '#0A0A14',
  superficie: '#13131F', superficie2: '#1C1C2E', borde: '#2A2A3E',
  texto: '#F1F1F6', textoSub: '#8888AA', exito: '#10B981',
  alerta: '#F59E0B', error: '#EF4444', info: '#3B82F6',
};

const CATEGORIAS_TALLER = ['tecnologia', 'salud', 'legal', 'bienestar', 'liderazgo', 'emprendimiento', 'otro'];
const TIPOS_BECA = ['academica', 'deportiva', 'cultural', 'investigacion', 'movilidad', 'otro'];
const MODALIDADES = ['presencial', 'virtual', 'hibrido'];

export default function AdminContenidoScreen({ navigation }) {
  const { usuaria, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [talleres, setTalleres] = useState([]);
  const [becas, setBecas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modalTaller, setModalTaller] = useState(false);
  const [modalBeca, setModalBeca] = useState(false);
  const [tallerSeleccionado, setTallerSeleccionado] = useState(null);
  const [becaSeleccionada, setBecaSeleccionada] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const [mostrarFechaTaller, setMostrarFechaTaller] = useState(false);
  const [mostrarHoraInicio, setMostrarHoraInicio] = useState(false);
  const [mostrarHoraFin, setMostrarHoraFin] = useState(false);
  const [mostrarFechaBeca, setMostrarFechaBeca] = useState(false);
  const [fechaTaller, setFechaTaller] = useState(new Date());
  const [horaInicio, setHoraInicio] = useState(new Date());
  const [horaFin, setHoraFin] = useState(new Date());
  const [fechaBeca, setFechaBeca] = useState(new Date());

  const [titulo, setTitulo] = useState('');
  const [instructor, setInstructor] = useState('');
  const [descripcionTaller, setDescripcionTaller] = useState('');
  const [fechaInicioTaller, setFechaInicioTaller] = useState('');
  const [horaInicioTaller, setHoraInicioTaller] = useState('');
  const [horaFinTaller, setHoraFinTaller] = useState('');
  const [lugarTaller, setLugarTaller] = useState('');
  const [cupoMaximo, setCupoMaximo] = useState('');
  const [requisitosTaller, setRequisitosTaller] = useState('');
  const [enlaceVirtual, setEnlaceVirtual] = useState('');
  const [categoriaTaller, setCategoriaTaller] = useState('tecnologia');
  const [modalidadTaller, setModalidadTaller] = useState('presencial');

  const [nombreBeca, setNombreBeca] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [descripcionBeca, setDescripcionBeca] = useState('');
  const [tipoBeca, setTipoBeca] = useState('academica');
  const [monto, setMonto] = useState('');
  const [cubre, setCubre] = useState('');
  const [requisitosBeca, setRequisitosBeca] = useState('');
  const [documentos, setDocumentos] = useState('');
  const [fechaLimiteBeca, setFechaLimiteBeca] = useState('');
  const [enlaceOficial, setEnlaceOficial] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      cargar();
    }, [])
  );

  const cargar = async () => {
    try {
      const [talleresRes, becasRes] = await Promise.all([
        api.get('/talleres/admin/todos'),
        api.get('/becas/admin/todas'),
      ]);
      setTalleres(talleresRes.data);
      setBecas(becasRes.data);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const formatHora = (date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const resetTaller = () => {
    setTitulo(''); setInstructor(''); setDescripcionTaller('');
    setFechaInicioTaller(''); setHoraInicioTaller(''); setHoraFinTaller('');
    setLugarTaller(''); setCupoMaximo(''); setRequisitosTaller('');
    setEnlaceVirtual(''); setCategoriaTaller('tecnologia'); setModalidadTaller('presencial');
  };

  const resetBeca = () => {
    setNombreBeca(''); setInstitucion(''); setDescripcionBeca('');
    setTipoBeca('academica'); setMonto(''); setCubre('');
    setRequisitosBeca(''); setDocumentos(''); setFechaLimiteBeca(''); setEnlaceOficial('');
  };

  const crearTaller = async () => {
    const camposFaltantes = [];
    if (!titulo.trim()) camposFaltantes.push('Titulo');
    if (!descripcionTaller.trim()) camposFaltantes.push('Descripcion');
    if (!instructor.trim()) camposFaltantes.push('Instructor');
    if (!fechaInicioTaller) camposFaltantes.push('Fecha de inicio');
    if (!horaInicioTaller) camposFaltantes.push('Hora de inicio');
    if (!lugarTaller.trim()) camposFaltantes.push('Lugar');
    if (!cupoMaximo) camposFaltantes.push('Cupo maximo');

    if (camposFaltantes.length > 0) {
      Alert.alert('Campos requeridos', `Faltan: ${camposFaltantes.join(', ')}`);
      return;
    }

    const horario = horaFinTaller
      ? `${horaInicioTaller} - ${horaFinTaller}`
      : horaInicioTaller;

    try {
      await api.post('/talleres', {
        titulo: titulo.trim(),
        instructor: instructor.trim(),
        descripcion: descripcionTaller.trim(),
        fecha_inicio: fechaInicioTaller,
        horario,
        lugar: lugarTaller.trim(),
        cupo_maximo: parseInt(cupoMaximo),
        requisitos: requisitosTaller.trim(),
        enlace_virtual: enlaceVirtual.trim(),
        categoria: categoriaTaller,
        modalidad: modalidadTaller,
      });
      Alert.alert('Taller publicado', 'El taller ya es visible para las usuarias.');
      setModalTaller(false);
      resetTaller();
      cargar();
    } catch (err) {
      console.log('Error taller:', err.response?.data);
      Alert.alert('Error', err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo crear el taller');
    }
  };

  const crearBeca = async () => {
    const camposFaltantes = [];
    if (!nombreBeca.trim()) camposFaltantes.push('Nombre');
    if (!institucion.trim()) camposFaltantes.push('Institucion');
    if (!descripcionBeca.trim()) camposFaltantes.push('Descripcion');
    if (!requisitosBeca.trim()) camposFaltantes.push('Requisitos');
    if (!fechaLimiteBeca) camposFaltantes.push('Fecha limite');

    if (camposFaltantes.length > 0) {
      Alert.alert('Campos requeridos', `Faltan: ${camposFaltantes.join(', ')}`);
      return;
    }

    try {
      await api.post('/becas', {
        nombre: nombreBeca.trim(),
        institucion: institucion.trim(),
        descripcion: descripcionBeca.trim(),
        tipo: tipoBeca,
        monto: monto.trim(),
        cubre: cubre.trim(),
        requisitos: requisitosBeca.trim(),
        documentos_necesarios: documentos.trim(),
        fecha_limite: fechaLimiteBeca,
        enlace_oficial: enlaceOficial.trim(),
      });
      Alert.alert('Beca publicada', 'La beca ya es visible para las usuarias.');
      setModalBeca(false);
      resetBeca();
      cargar();
    } catch (err) {
      console.log('Error beca:', err.response?.data);
      Alert.alert('Error', err.response?.data?.error || err.response?.data?.mensaje || 'No se pudo crear la beca');
    }
  };

  const verInscripciones = async (id, tipo) => {
    try {
      const res = tipo === 'taller'
        ? await api.get(`/talleres/${id}/inscripciones`)
        : await api.get(`/becas/${id}/aplicaciones`);
      setInscripciones(res.data);
      setTab(tipo === 'taller' ? 'inscripcionesTaller' : 'inscripcionesBeca');
      if (tipo === 'taller') setTallerSeleccionado(talleres.find(t => t._id === id));
      else setBecaSeleccionada(becas.find(b => b._id === id));
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las inscripciones');
    }
  };

  const confirmarInscripcion = async (id, tipo) => {
    try {
      if (tipo === 'taller') await api.put(`/talleres/inscripciones/${id}/confirmar`);
      else await api.put(`/becas/aplicaciones/${id}/confirmar`);
      Alert.alert('Confirmado', 'La inscripcion ha sido confirmada.');
      const refId = tipo === 'taller' ? tallerSeleccionado?._id : becaSeleccionada?._id;
      verInscripciones(refId, tipo);
    } catch (err) {
      Alert.alert('Error', 'No se pudo confirmar');
    }
  };

  const cambiarEstadoTaller = async (id, estado) => {
    try {
      await api.put(`/talleres/${id}`, { estado });
      cargar();
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const generarPDFInscripciones = async (tipo) => {
    setGenerandoPDF(true);
    try {
      const referencia = tipo === 'taller' ? tallerSeleccionado : becaSeleccionada;
      const tituloRef = tipo === 'taller' ? referencia?.titulo : referencia?.nombre;
      const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const html = `
        <!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Helvetica Neue',Arial,sans-serif; color:#1a1a2e; }
          .portada { background:linear-gradient(135deg,#6C63FF,#A78BFA); padding:50px 40px; }
          .portada h1 { color:#fff; font-size:28px; font-weight:800; margin-bottom:8px; }
          .portada h2 { color:rgba(255,255,255,0.85); font-size:16px; }
          .portada .meta { color:rgba(255,255,255,0.7); font-size:12px; margin-top:12px; }
          .portada .badge { display:inline-block; background:rgba(255,255,255,0.2); color:#fff; padding:4px 16px; border-radius:20px; font-size:11px; margin-top:10px; }
          .contenido { padding:32px 40px; }
          .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:28px; }
          .stat { background:#f8f7ff; border-left:4px solid #6C63FF; padding:16px; border-radius:8px; text-align:center; }
          .stat-num { font-size:28px; font-weight:800; color:#6C63FF; }
          .stat-label { font-size:10px; color:#666; margin-top:4px; text-transform:uppercase; letter-spacing:1px; }
          .seccion { font-size:15px; font-weight:700; color:#6C63FF; border-bottom:2px solid #6C63FF; padding-bottom:6px; margin:20px 0 14px; }
          table { width:100%; border-collapse:collapse; font-size:12px; }
          th { background:#6C63FF; color:#fff; padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; }
          td { padding:10px 12px; border-bottom:1px solid #f0f0f0; }
          tr:nth-child(even) td { background:#fafafa; }
          .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; color:#fff; }
          .confirmada { background:#10B981; } .pendiente { background:#F59E0B; } .rechazada { background:#EF4444; }
          .footer { margin-top:32px; padding:14px 40px; background:#f8f7ff; text-align:center; font-size:10px; color:#999; border-top:2px solid #6C63FF; }
        </style></head><body>
        <div class="portada">
          <h1>${tipo === 'taller' ? 'Reporte de Inscripciones' : 'Reporte de Aplicaciones'}</h1>
          <h2>${tituloRef}</h2>
          <div class="meta">Generado el ${fecha} | Sororitec</div>
          <div class="badge">DOCUMENTO OFICIAL</div>
        </div>
        <div class="contenido">
          <div class="stats">
            <div class="stat"><div class="stat-num">${inscripciones.length}</div><div class="stat-label">Total</div></div>
            <div class="stat"><div class="stat-num">${inscripciones.filter(i => i.estado === 'confirmada').length}</div><div class="stat-label">Confirmadas</div></div>
            <div class="stat"><div class="stat-num">${inscripciones.filter(i => i.estado === 'pendiente').length}</div><div class="stat-label">Pendientes</div></div>
          </div>
          <div class="seccion">Listado</div>
          <table><thead><tr><th>#</th><th>Nombre</th><th>Correo</th><th>Carrera</th><th>Cuatrimestre</th><th>Telefono</th><th>Estado</th></tr></thead>
          <tbody>${inscripciones.map((ins, i) => `<tr><td>${i + 1}</td><td>${ins.nombre_completo}</td><td>${ins.correo_institucional}</td><td>${ins.carrera}</td><td>${ins.cuatrimestre}</td><td>${ins.telefono}</td><td><span class="badge ${ins.estado}">${ins.estado}</span></td></tr>`).join('')}</tbody></table>
        </div>
        <div class="footer">Sororitec — ${fecha} — DOCUMENTO CONFIDENCIAL</div>
        </body></html>
      `;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Reporte ${tituloRef}` });
    } catch (err) {
      Alert.alert('Error', 'No se pudo generar el PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const estadoColor = (estado) => ({
    activo: COLORES.exito, inactivo: COLORES.textoSub, finalizado: COLORES.primario,
    activa: COLORES.exito, cerrada: COLORES.error, confirmada: COLORES.exito,
    pendiente: COLORES.alerta, rechazada: COLORES.error
  })[estado] || COLORES.textoSub;

  const TABS = [
    { key: 'dashboard', label: 'Dashboard', Icon: BarChart2 },
    { key: 'talleres', label: 'Talleres', Icon: BookOpen },
    { key: 'becas', label: 'Becas', Icon: Award },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>PANEL DE CONTENIDO</Text>
          <Text style={styles.headerNombre}>{usuaria?.nombre_completo}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <X size={16} color={COLORES.error} />
          <Text style={styles.logoutTexto}>Salir</Text>
        </TouchableOpacity>
      </View>

      {['inscripcionesTaller', 'inscripcionesBeca'].includes(tab) ? (
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => setTab(tab === 'inscripcionesTaller' ? 'talleres' : 'becas')}>
            <Text style={styles.volverTexto}>{'< Volver'}</Text>
          </TouchableOpacity>
          <Text style={styles.subHeaderTitulo}>
            {tab === 'inscripcionesTaller' ? tallerSeleccionado?.titulo : becaSeleccionada?.nombre}
          </Text>
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={() => generarPDFInscripciones(tab === 'inscripcionesTaller' ? 'taller' : 'beca')}
            disabled={generandoPDF}>
            {generandoPDF ? <ActivityIndicator color="#fff" size="small" /> : <FileText size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {TABS.map(({ key, label, Icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.tab, tab === key && styles.tabActivo]}
                  onPress={() => setTab(key)}>
                  <Icon size={14} color={tab === key ? COLORES.primario : COLORES.textoSub} />
                  <Text style={[styles.tabTexto, tab === key && styles.tabTextoActivo]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* DateTimePickers fuera del Modal */}
      {mostrarFechaTaller && (
        <DateTimePicker value={fechaTaller} mode="date" display="default" minimumDate={new Date()}
          onChange={(event, date) => {
            setMostrarFechaTaller(false);
            if (date) { setFechaTaller(date); setFechaInicioTaller(date.toISOString()); }
          }} />
      )}
      {mostrarHoraInicio && (
        <DateTimePicker value={horaInicio} mode="time" display="default" is24Hour={true}
          onChange={(event, time) => {
            setMostrarHoraInicio(false);
            if (time) { setHoraInicio(time); setHoraInicioTaller(formatHora(time)); }
          }} />
      )}
      {mostrarHoraFin && (
        <DateTimePicker value={horaFin} mode="time" display="default" is24Hour={true}
          onChange={(event, time) => {
            setMostrarHoraFin(false);
            if (time) { setHoraFin(time); setHoraFinTaller(formatHora(time)); }
          }} />
      )}
      {mostrarFechaBeca && (
        <DateTimePicker value={fechaBeca} mode="date" display="default" minimumDate={new Date()}
          onChange={(event, date) => {
            setMostrarFechaBeca(false);
            if (date) { setFechaBeca(date); setFechaLimiteBeca(date.toISOString()); }
          }} />
      )}

      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORES.primario} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} colors={[COLORES.primario]} tintColor={COLORES.primario} />
          }>

          {tab === 'dashboard' && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Resumen General</Text>
              <View style={styles.kpiGrid}>
                {[
                  { label: 'Talleres Activos', valor: talleres.filter(t => t.estado === 'activo').length, Icon: BookOpen, color: COLORES.primario },
                  { label: 'Becas Activas', valor: becas.filter(b => b.estado === 'activa').length, Icon: Award, color: COLORES.info },
                  { label: 'Total Talleres', valor: talleres.length, Icon: BarChart2, color: COLORES.exito },
                  { label: 'Total Becas', valor: becas.length, Icon: FileText, color: COLORES.alerta },
                ].map((kpi, i) => (
                  <View key={i} style={styles.kpiCard}>
                    <View style={[styles.kpiIcono, { backgroundColor: kpi.color + '20' }]}>
                      <kpi.Icon size={22} color={kpi.color} />
                    </View>
                    <Text style={styles.kpiValor}>{kpi.valor}</Text>
                    <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.seccionTitulo}>Talleres Recientes</Text>
              {talleres.slice(0, 3).map((t, i) => (
                <View key={i} style={styles.resumenCard}>
                  <BookOpen size={16} color={COLORES.primario} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resumenNombre}>{t.titulo}</Text>
                    <Text style={styles.resumenMeta}>{t.cupo_disponible}/{t.cupo_maximo} cupos</Text>
                  </View>
                  <View style={[styles.estadoChip, { backgroundColor: estadoColor(t.estado) + '20' }]}>
                    <Text style={[styles.estadoTexto, { color: estadoColor(t.estado) }]}>{t.estado}</Text>
                  </View>
                </View>
              ))}
              <Text style={[styles.seccionTitulo, { marginTop: 20 }]}>Becas Recientes</Text>
              {becas.slice(0, 3).map((b, i) => (
                <View key={i} style={styles.resumenCard}>
                  <Award size={16} color={COLORES.info} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resumenNombre}>{b.nombre}</Text>
                    <Text style={styles.resumenMeta}>{b.institucion}</Text>
                  </View>
                  <View style={[styles.estadoChip, { backgroundColor: estadoColor(b.estado) + '20' }]}>
                    <Text style={[styles.estadoTexto, { color: estadoColor(b.estado) }]}>{b.estado}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {tab === 'talleres' && (
            <View style={styles.seccion}>
              <View style={styles.seccionHeaderRow}>
                <Text style={styles.seccionTitulo}>Talleres ({talleres.length})</Text>
                <TouchableOpacity style={styles.botonAgregar} onPress={() => setModalTaller(true)}>
                  <Plus size={14} color="#fff" />
                  <Text style={styles.botonAgregarTexto}>Nuevo</Text>
                </TouchableOpacity>
              </View>
              {talleres.length === 0 ? (
                <View style={styles.vacio}>
                  <BookOpen size={40} color={COLORES.borde} />
                  <Text style={styles.vacioTexto}>No hay talleres publicados</Text>
                </View>
              ) : (
                talleres.map((t, i) => (
                  <View key={i} style={styles.contenidoCard}>
                    <View style={styles.contenidoTop}>
                      <View style={[styles.contenidoIcono, { backgroundColor: COLORES.primario + '20' }]}>
                        <BookOpen size={20} color={COLORES.primario} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contenidoTitulo}>{t.titulo}</Text>
                        <Text style={styles.contenidoMeta}>{t.instructor}</Text>
                        <View style={styles.metaRow}>
                          <Calendar size={11} color={COLORES.textoSub} />
                          <Text style={styles.metaTexto}>{new Date(t.fecha_inicio).toLocaleDateString('es-MX')}</Text>
                          <Clock size={11} color={COLORES.textoSub} />
                          <Text style={styles.metaTexto}>{t.horario}</Text>
                          <MapPin size={11} color={COLORES.textoSub} />
                          <Text style={styles.metaTexto}>{t.lugar}</Text>
                        </View>
                      </View>
                      <View style={[styles.estadoChip, { backgroundColor: estadoColor(t.estado) + '20' }]}>
                        <Text style={[styles.estadoTexto, { color: estadoColor(t.estado) }]}>{t.estado}</Text>
                      </View>
                    </View>
                    <View style={styles.cupoBar}>
                      <Text style={styles.cupoTexto}>Cupo: {t.cupo_disponible}/{t.cupo_maximo}</Text>
                      <View style={styles.cupoBarFondo}>
                        <View style={[styles.cupoBarRelleno, {
                          width: `${((t.cupo_maximo - t.cupo_disponible) / t.cupo_maximo) * 100}%`,
                          backgroundColor: t.cupo_disponible === 0 ? COLORES.error : COLORES.primario
                        }]} />
                      </View>
                    </View>
                    <View style={styles.accionesRow}>
                      <TouchableOpacity style={styles.accionChip} onPress={() => verInscripciones(t._id, 'taller')}>
                        <Users size={12} color={COLORES.primario} />
                        <Text style={styles.accionChipTexto}>Inscritas</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.accionChip, { borderColor: t.estado === 'activo' ? COLORES.error : COLORES.exito }]}
                        onPress={() => cambiarEstadoTaller(t._id, t.estado === 'activo' ? 'inactivo' : 'activo')}>
                        <Text style={[styles.accionChipTexto, { color: t.estado === 'activo' ? COLORES.error : COLORES.exito }]}>
                          {t.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {tab === 'becas' && (
            <View style={styles.seccion}>
              <View style={styles.seccionHeaderRow}>
                <Text style={styles.seccionTitulo}>Becas ({becas.length})</Text>
                <TouchableOpacity style={styles.botonAgregar} onPress={() => setModalBeca(true)}>
                  <Plus size={14} color="#fff" />
                  <Text style={styles.botonAgregarTexto}>Nueva</Text>
                </TouchableOpacity>
              </View>
              {becas.length === 0 ? (
                <View style={styles.vacio}>
                  <Award size={40} color={COLORES.borde} />
                  <Text style={styles.vacioTexto}>No hay becas publicadas</Text>
                </View>
              ) : (
                becas.map((b, i) => (
                  <View key={i} style={styles.contenidoCard}>
                    <View style={styles.contenidoTop}>
                      <View style={[styles.contenidoIcono, { backgroundColor: COLORES.info + '20' }]}>
                        <Award size={20} color={COLORES.info} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contenidoTitulo}>{b.nombre}</Text>
                        <Text style={styles.contenidoMeta}>{b.institucion}</Text>
                        <View style={styles.metaRow}>
                          <Clock size={11} color={COLORES.textoSub} />
                          <Text style={styles.metaTexto}>Limite: {new Date(b.fecha_limite).toLocaleDateString('es-MX')}</Text>
                          {b.monto && <Text style={[styles.metaTexto, { color: COLORES.exito, fontWeight: '600' }]}>{b.monto}</Text>}
                        </View>
                      </View>
                      <View style={[styles.estadoChip, { backgroundColor: estadoColor(b.estado) + '20' }]}>
                        <Text style={[styles.estadoTexto, { color: estadoColor(b.estado) }]}>{b.estado}</Text>
                      </View>
                    </View>
                    <View style={styles.accionesRow}>
                      <TouchableOpacity style={styles.accionChip} onPress={() => verInscripciones(b._id, 'beca')}>
                        <Users size={12} color={COLORES.info} />
                        <Text style={[styles.accionChipTexto, { color: COLORES.info }]}>Aplicantes</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {tab === 'inscripcionesTaller' && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>{inscripciones.length} inscritas</Text>
              {inscripciones.length === 0 ? (
                <View style={styles.vacio}>
                  <Users size={40} color={COLORES.borde} />
                  <Text style={styles.vacioTexto}>Sin inscripciones aun</Text>
                </View>
              ) : (
                inscripciones.map((ins, i) => (
                  <View key={i} style={styles.inscripcionCard}>
                    <View style={styles.inscripcionTop}>
                      <View style={styles.inscripcionAvatar}>
                        <User size={20} color={COLORES.textoSub} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inscripcionNombre}>{ins.nombre_completo}</Text>
                        <Text style={styles.inscripcionCorreo}>{ins.correo_institucional}</Text>
                        <Text style={styles.inscripcionMeta}>{ins.carrera} · {ins.cuatrimestre} cuatrimestre</Text>
                      </View>
                      <View style={[styles.estadoChip, { backgroundColor: estadoColor(ins.estado) + '20' }]}>
                        <Text style={[styles.estadoTexto, { color: estadoColor(ins.estado) }]}>{ins.estado}</Text>
                      </View>
                    </View>
                    <Text style={styles.motivacionTexto}>{ins.motivacion}</Text>
                    {ins.estado === 'pendiente' && (
                      <TouchableOpacity style={styles.botonConfirmar} onPress={() => confirmarInscripcion(ins._id, 'taller')}>
                        <Check size={14} color="#fff" />
                        <Text style={styles.botonConfirmarTexto}>Confirmar inscripcion</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {tab === 'inscripcionesBeca' && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>{inscripciones.length} aplicantes</Text>
              {inscripciones.length === 0 ? (
                <View style={styles.vacio}>
                  <Users size={40} color={COLORES.borde} />
                  <Text style={styles.vacioTexto}>Sin aplicaciones aun</Text>
                </View>
              ) : (
                inscripciones.map((ins, i) => (
                  <View key={i} style={styles.inscripcionCard}>
                    <View style={styles.inscripcionTop}>
                      <View style={styles.inscripcionAvatar}>
                        <User size={20} color={COLORES.textoSub} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inscripcionNombre}>{ins.nombre_completo}</Text>
                        <Text style={styles.inscripcionCorreo}>{ins.correo_institucional}</Text>
                        <Text style={styles.inscripcionMeta}>{ins.carrera} · {ins.cuatrimestre}</Text>
                        <Text style={styles.inscripcionMeta}>Tel: {ins.telefono}</Text>
                      </View>
                      <View style={[styles.estadoChip, { backgroundColor: estadoColor(ins.estado) + '20' }]}>
                        <Text style={[styles.estadoTexto, { color: estadoColor(ins.estado) }]}>{ins.estado}</Text>
                      </View>
                    </View>
                    <Text style={styles.motivacionLabel}>Motivacion:</Text>
                    <Text style={styles.motivacionTexto}>{ins.motivacion}</Text>
                    {ins.experiencia_previa && (
                      <>
                        <Text style={styles.motivacionLabel}>Experiencia previa:</Text>
                        <Text style={styles.motivacionTexto}>{ins.experiencia_previa}</Text>
                      </>
                    )}
                    {ins.estado === 'pendiente' && (
                      <TouchableOpacity style={styles.botonConfirmar} onPress={() => confirmarInscripcion(ins._id, 'beca')}>
                        <Check size={14} color="#fff" />
                        <Text style={styles.botonConfirmarTexto}>Confirmar aplicacion</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal Crear Taller */}
      <Modal visible={modalTaller} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Nuevo Taller</Text>
              <TouchableOpacity onPress={() => { setModalTaller(false); resetTaller(); }}>
                <X size={20} color={COLORES.textoSub} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.modalInput}
                placeholder="Titulo del taller *"
                placeholderTextColor={COLORES.textoSub}
                value={titulo}
                onChangeText={setTitulo}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Nombre del instructor *"
                placeholderTextColor={COLORES.textoSub}
                value={instructor}
                onChangeText={setInstructor}
              />
              <TextInput
                style={[styles.modalInput, { minHeight: 70 }]}
                placeholder="Descripcion *"
                placeholderTextColor={COLORES.textoSub}
                value={descripcionTaller}
                onChangeText={setDescripcionTaller}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.modalInput} onPress={() => setMostrarFechaTaller(true)}>
                <Text style={{ color: fechaInicioTaller ? COLORES.texto : COLORES.textoSub }}>
                  {fechaInicioTaller
                    ? new Date(fechaInicioTaller).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Fecha de inicio *'}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={[styles.modalInput, { flex: 1 }]} onPress={() => setMostrarHoraInicio(true)}>
                  <Text style={{ color: horaInicioTaller ? COLORES.texto : COLORES.textoSub }}>
                    {horaInicioTaller || 'Hora inicio *'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalInput, { flex: 1 }]} onPress={() => setMostrarHoraFin(true)}>
                  <Text style={{ color: horaFinTaller ? COLORES.texto : COLORES.textoSub }}>
                    {horaFinTaller || 'Hora fin'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Lugar *"
                placeholderTextColor={COLORES.textoSub}
                value={lugarTaller}
                onChangeText={setLugarTaller}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Cupo maximo *"
                placeholderTextColor={COLORES.textoSub}
                value={cupoMaximo}
                onChangeText={setCupoMaximo}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, { minHeight: 70 }]}
                placeholder="Requisitos"
                placeholderTextColor={COLORES.textoSub}
                value={requisitosTaller}
                onChangeText={setRequisitosTaller}
                multiline
                textAlignVertical="top"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Enlace virtual (si aplica)"
                placeholderTextColor={COLORES.textoSub}
                value={enlaceVirtual}
                onChangeText={setEnlaceVirtual}
                autoCapitalize="none"
              />

              <Text style={styles.modalLabel}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {CATEGORIAS_TALLER.map(c => (
                    <TouchableOpacity key={c} style={[styles.chip, categoriaTaller === c && styles.chipActivo]} onPress={() => setCategoriaTaller(c)}>
                      <Text style={[styles.chipTexto, categoriaTaller === c && styles.chipTextoActivo]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.modalLabel}>Modalidad</Text>
              <View style={styles.chipsRow}>
                {MODALIDADES.map(m => (
                  <TouchableOpacity key={m} style={[styles.chip, modalidadTaller === m && styles.chipActivo]} onPress={() => setModalidadTaller(m)}>
                    <Text style={[styles.chipTexto, modalidadTaller === m && styles.chipTextoActivo]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBotones}>
                <TouchableOpacity style={styles.modalCancelar} onPress={() => { setModalTaller(false); resetTaller(); }}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmar} onPress={crearTaller}>
                  <Text style={styles.modalConfirmarTexto}>Publicar</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Crear Beca */}
      <Modal visible={modalBeca} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Nueva Beca</Text>
              <TouchableOpacity onPress={() => { setModalBeca(false); resetBeca(); }}>
                <X size={20} color={COLORES.textoSub} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput style={styles.modalInput} placeholder="Nombre de la beca *" placeholderTextColor={COLORES.textoSub} value={nombreBeca} onChangeText={setNombreBeca} />
              <TextInput style={styles.modalInput} placeholder="Institucion que la otorga *" placeholderTextColor={COLORES.textoSub} value={institucion} onChangeText={setInstitucion} />
              <TextInput style={[styles.modalInput, { minHeight: 70 }]} placeholder="Descripcion *" placeholderTextColor={COLORES.textoSub} value={descripcionBeca} onChangeText={setDescripcionBeca} multiline textAlignVertical="top" />
              <TextInput style={styles.modalInput} placeholder="Monto o beneficio (ej: $5,000 mensuales)" placeholderTextColor={COLORES.textoSub} value={monto} onChangeText={setMonto} />
              <TextInput style={styles.modalInput} placeholder="Que cubre" placeholderTextColor={COLORES.textoSub} value={cubre} onChangeText={setCubre} />
              <TextInput style={[styles.modalInput, { minHeight: 70 }]} placeholder="Requisitos *" placeholderTextColor={COLORES.textoSub} value={requisitosBeca} onChangeText={setRequisitosBeca} multiline textAlignVertical="top" />
              <TextInput style={[styles.modalInput, { minHeight: 70 }]} placeholder="Documentos necesarios" placeholderTextColor={COLORES.textoSub} value={documentos} onChangeText={setDocumentos} multiline textAlignVertical="top" />

              <TouchableOpacity style={styles.modalInput} onPress={() => setMostrarFechaBeca(true)}>
                <Text style={{ color: fechaLimiteBeca ? COLORES.texto : COLORES.textoSub }}>
                  {fechaLimiteBeca
                    ? new Date(fechaLimiteBeca).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Fecha limite *'}
                </Text>
              </TouchableOpacity>

              <TextInput style={styles.modalInput} placeholder="Enlace oficial" placeholderTextColor={COLORES.textoSub} value={enlaceOficial} onChangeText={setEnlaceOficial} autoCapitalize="none" />

              <Text style={styles.modalLabel}>Tipo de beca</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {TIPOS_BECA.map(t => (
                    <TouchableOpacity key={t} style={[styles.chip, tipoBeca === t && styles.chipActivo]} onPress={() => setTipoBeca(t)}>
                      <Text style={[styles.chipTexto, tipoBeca === t && styles.chipTextoActivo]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalBotones}>
                <TouchableOpacity style={styles.modalCancelar} onPress={() => { setModalBeca(false); resetBeca(); }}>
                  <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmar} onPress={crearBeca}>
                  <Text style={styles.modalConfirmarTexto}>Publicar</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  headerLabel: { color: COLORES.textoSub, fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  headerNombre: { color: COLORES.texto, fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORES.error + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORES.error + '30' },
  logoutTexto: { color: COLORES.error, fontSize: 13, fontWeight: '600' },
  subHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORES.borde, gap: 12 },
  volverTexto: { color: COLORES.primario, fontSize: 14, fontWeight: '600' },
  subHeaderTitulo: { flex: 1, color: COLORES.texto, fontSize: 14, fontWeight: '600' },
  pdfBtn: { backgroundColor: COLORES.primario, padding: 8, borderRadius: 8 },
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, marginRight: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActivo: { borderBottomColor: COLORES.primario },
  tabTexto: { color: COLORES.textoSub, fontSize: 12, fontWeight: '500' },
  tabTextoActivo: { color: COLORES.primario, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flex: 1 },
  seccion: { padding: 20 },
  seccionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seccionTitulo: { color: COLORES.texto, fontSize: 15, fontWeight: '700', letterSpacing: 0.5, marginBottom: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  kpiCard: { backgroundColor: COLORES.superficie, borderRadius: 14, padding: 16, alignItems: 'center', width: (width - 52) / 2, borderWidth: 1, borderColor: COLORES.borde },
  kpiIcono: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValor: { color: COLORES.texto, fontSize: 28, fontWeight: '800' },
  kpiLabel: { color: COLORES.textoSub, fontSize: 11, marginTop: 4, textAlign: 'center' },
  resumenCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORES.superficie, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORES.borde },
  resumenNombre: { color: COLORES.texto, fontWeight: '600', fontSize: 13 },
  resumenMeta: { color: COLORES.textoSub, fontSize: 11, marginTop: 2 },
  contenidoCard: { backgroundColor: COLORES.superficie, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORES.borde },
  contenidoTop: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  contenidoIcono: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contenidoTitulo: { color: COLORES.texto, fontWeight: '700', fontSize: 14, marginBottom: 2 },
  contenidoMeta: { color: COLORES.textoSub, fontSize: 12, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaTexto: { color: COLORES.textoSub, fontSize: 11 },
  estadoChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  estadoTexto: { fontSize: 10, fontWeight: '700' },
  cupoBar: { marginBottom: 12 },
  cupoTexto: { color: COLORES.textoSub, fontSize: 11, marginBottom: 4 },
  cupoBarFondo: { height: 4, backgroundColor: COLORES.borde, borderRadius: 2, overflow: 'hidden' },
  cupoBarRelleno: { height: '100%', borderRadius: 2 },
  accionesRow: { flexDirection: 'row', gap: 8 },
  accionChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORES.primario + '15', borderRadius: 8, paddingVertical: 8, borderWidth: 1, borderColor: COLORES.primario + '40' },
  accionChipTexto: { color: COLORES.primario, fontSize: 12, fontWeight: '600' },
  botonAgregar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORES.primario, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  botonAgregarTexto: { color: '#fff', fontSize: 12, fontWeight: '600' },
  vacio: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  vacioTexto: { color: COLORES.textoSub, fontSize: 15 },
  inscripcionCard: { backgroundColor: COLORES.superficie, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORES.borde },
  inscripcionTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  inscripcionAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORES.superficie2, alignItems: 'center', justifyContent: 'center' },
  inscripcionNombre: { color: COLORES.texto, fontWeight: '600', fontSize: 14 },
  inscripcionCorreo: { color: COLORES.primario, fontSize: 11, marginTop: 2 },
  inscripcionMeta: { color: COLORES.textoSub, fontSize: 11, marginTop: 2 },
  motivacionLabel: { color: COLORES.textoSub, fontSize: 11, fontWeight: '600', marginBottom: 4, marginTop: 8 },
  motivacionTexto: { color: COLORES.textoSub, fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  botonConfirmar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORES.exito, padding: 10, borderRadius: 10, marginTop: 12 },
  botonConfirmarTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORES.superficie, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', borderWidth: 1, borderColor: COLORES.borde },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo: { color: COLORES.texto, fontSize: 18, fontWeight: '700' },
  modalLabel: { color: COLORES.textoSub, fontSize: 12, marginBottom: 8, marginTop: 12, fontWeight: '600', letterSpacing: 0.5 },
  modalInput: { backgroundColor: COLORES.fondo, borderRadius: 10, padding: 12, color: COLORES.texto, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORES.borde, justifyContent: 'center', minHeight: 46 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: { backgroundColor: COLORES.fondo, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORES.borde },
  chipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  chipTexto: { color: COLORES.textoSub, fontSize: 12 },
  chipTextoActivo: { color: '#fff', fontWeight: '600' },
  modalBotones: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 },
  modalCancelar: { flex: 1, backgroundColor: COLORES.superficie2, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde },
  modalCancelarTexto: { color: COLORES.textoSub, fontWeight: '600' },
  modalConfirmar: { flex: 1, backgroundColor: COLORES.primario, padding: 14, borderRadius: 10, alignItems: 'center' },
  modalConfirmarTexto: { color: '#fff', fontWeight: '700' },
});
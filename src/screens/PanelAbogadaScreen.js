import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl,
  TextInput, Alert, Modal, Dimensions, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  Scale, FileText, Clock, CheckCircle,
  XCircle, MessageSquare, User, BarChart2,
  ChevronRight, X, Send, AlertCircle
} from 'lucide-react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import api from '../services/api';

const { width } = Dimensions.get('window');

const COLORES = {
  primario: '#3B82F6',
  secundario: '#60A5FA',
  fondo: '#0A0A14',
  superficie: '#13131F',
  superficie2: '#1C1C2E',
  borde: '#2A2A3E',
  texto: '#F1F1F6',
  textoSub: '#8888AA',
  exito: '#10B981',
  alerta: '#F59E0B',
  error: '#EF4444',
};

export default function PanelAbogadaScreen({ navigation }) {
  const { usuaria, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [consultas, setConsultas] = useState([]);
  const [consultaActual, setConsultaActual] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      cargar();
    }, [])
  );

  const cargar = async () => {
    try {
      const res = await api.get('/consultas/tipo/legal');
      setConsultas(res.data);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const abrirConsulta = async (consulta) => {
    try {
      const res = await api.get(`/consultas/${consulta._id}`);
      setConsultaActual(res.data);
      setRespuesta(res.data.respuesta || '');
      setTab('detalle');
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la consulta');
    }
  };

  const enviarRespuesta = async () => {
    if (!respuesta.trim()) {
      Alert.alert('Requerido', 'Escribe una respuesta');
      return;
    }
    setEnviando(true);
    try {
      await api.put(`/consultas/responder/${consultaActual._id}`, { respuesta });
      Alert.alert('Respuesta enviada', 'La usuaria podra ver tu respuesta y chatear contigo.');
      abrirConsulta(consultaActual);
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar la respuesta');
    } finally {
      setEnviando(false);
    }
  };

  const enviarMensajeChat = async () => {
    if (!mensaje.trim()) return;
    setEnviando(true);
    try {
      await api.post(`/consultas/chat/${consultaActual._id}`, { mensaje });
      setMensaje('');
      abrirConsulta(consultaActual);
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  };

  const cerrarConsulta = async () => {
    Alert.alert(
      'Cerrar consulta',
      'Esta accion cerrara el caso y el chat. Confirmas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar caso',
          onPress: async () => {
            try {
              await api.put(`/consultas/cerrar/${consultaActual._id}`);
              Alert.alert('Caso cerrado', 'La consulta ha sido cerrada exitosamente.');
              setTab('consultas');
              cargar();
            } catch (err) {
              Alert.alert('Error', 'No se pudo cerrar la consulta');
            }
          }
        }
      ]
    );
  };

  const generarPDF = async () => {
    setGenerandoPDF(true);
    try {
      const fecha = new Date().toLocaleDateString('es-MX', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; }
            .portada { background: linear-gradient(135deg, #3B82F6, #60A5FA); padding: 50px 40px; }
            .portada h1 { color: #fff; font-size: 26px; font-weight: 800; margin-bottom: 6px; }
            .portada h2 { color: rgba(255,255,255,0.85); font-size: 15px; }
            .portada .meta { color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 10px; }
            .portada .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 4px 16px; border-radius: 20px; font-size: 11px; margin-top: 8px; }
            .contenido { padding: 32px 40px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
            .stat { background: #f0f4ff; border-left: 4px solid #3B82F6; padding: 14px; border-radius: 8px; text-align: center; }
            .stat-num { font-size: 28px; font-weight: 800; color: #3B82F6; }
            .stat-label { font-size: 10px; color: #666; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
            .seccion { font-size: 15px; font-weight: 700; color: #3B82F6; border-bottom: 2px solid #3B82F6; padding-bottom: 6px; margin: 20px 0 14px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #3B82F6; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
            tr:nth-child(even) td { background: #fafafa; }
            .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; color: #fff; }
            .pendiente { background: #F59E0B; }
            .respondida { background: #10B981; }
            .cerrada { background: #6B7280; }
            .en_revision { background: #3B82F6; }
            .footer { margin-top: 32px; padding: 14px 40px; background: #f0f4ff; text-align: center; font-size: 10px; color: #999; border-top: 2px solid #3B82F6; }
          </style>
        </head>
        <body>
          <div class="portada">
            <h1>Reporte de Consultas Legales</h1>
            <h2>Abogada: ${usuaria?.nombre_completo}</h2>
            <div class="meta">Generado el ${fecha}</div>
            <div class="badge">DOCUMENTO CONFIDENCIAL</div>
          </div>
          <div class="contenido">
            <div class="stats">
              <div class="stat">
                <div class="stat-num">${consultas.length}</div>
                <div class="stat-label">Total</div>
              </div>
              <div class="stat">
                <div class="stat-num">${consultas.filter(c => c.estado === 'pendiente').length}</div>
                <div class="stat-label">Pendientes</div>
              </div>
              <div class="stat">
                <div class="stat-num">${consultas.filter(c => c.estado === 'respondida').length}</div>
                <div class="stat-label">Respondidas</div>
              </div>
              <div class="stat">
                <div class="stat-num">${consultas.filter(c => c.estado === 'cerrada').length}</div>
                <div class="stat-label">Cerradas</div>
              </div>
            </div>
            <div class="seccion">Historial de Consultas</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuaria</th>
                  <th>Asunto</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${consultas.map((c, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${c.nombre_usuaria || '-'}</td>
                    <td>${c.asunto}</td>
                    <td>${new Date(c.fecha_consulta).toLocaleDateString('es-MX')}</td>
                    <td><span class="badge ${c.estado}">${c.estado}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="footer">Sororitec — Reporte Legal — ${fecha} — CONFIDENCIAL</div>
        </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Reporte Legal' });
    } catch (err) {
      Alert.alert('Error', 'No se pudo generar el PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const estadoColor = (e) => ({
    pendiente: COLORES.alerta, en_revision: COLORES.primario,
    respondida: COLORES.exito, cerrada: COLORES.textoSub
  })[e] || COLORES.textoSub;

  const TABS = [
    { key: 'dashboard', label: 'Dashboard', Icon: BarChart2 },
    { key: 'consultas', label: 'Consultas', Icon: Scale },
  ];

  const pendientes = consultas.filter(c => c.estado === 'pendiente').length;
  const respondidas = consultas.filter(c => c.estado === 'respondida').length;
  const cerradas = consultas.filter(c => c.estado === 'cerrada').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>PANEL LEGAL</Text>
          <Text style={styles.headerNombre}>{usuaria?.nombre_completo}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <X size={16} color={COLORES.error} />
          <Text style={styles.logoutTexto}>Salir</Text>
        </TouchableOpacity>
      </View>

      {tab === 'detalle' ? (
        <View style={styles.detalleHeader}>
          <TouchableOpacity onPress={() => setTab('consultas')}>
            <Text style={styles.volverTexto}>{'< Volver'}</Text>
          </TouchableOpacity>
          <Text style={styles.detalleTitulo} numberOfLines={1}>{consultaActual?.asunto}</Text>
          <TouchableOpacity onPress={cerrarConsulta}>
            <XCircle size={20} color={COLORES.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tabsContainer}>
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
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={generarPDF}
              disabled={generandoPDF}>
              {generandoPDF
                ? <ActivityIndicator color="#fff" size="small" />
                : <FileText size={14} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {cargando ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORES.primario} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => { setRefrescando(true); cargar(); }}
              colors={[COLORES.primario]}
              tintColor={COLORES.primario}
            />
          }>

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Resumen de casos</Text>
              <View style={styles.kpiGrid}>
                {[
                  { label: 'Total', valor: consultas.length, color: COLORES.primario },
                  { label: 'Pendientes', valor: pendientes, color: COLORES.alerta },
                  { label: 'Respondidas', valor: respondidas, color: COLORES.exito },
                  { label: 'Cerradas', valor: cerradas, color: COLORES.textoSub },
                ].map((k, i) => (
                  <View key={i} style={styles.kpiCard}>
                    <Text style={[styles.kpiNum, { color: k.color }]}>{k.valor}</Text>
                    <Text style={styles.kpiLabel}>{k.label}</Text>
                  </View>
                ))}
              </View>

              {consultas.length > 0 && (
                <View style={styles.graficaCard}>
                  <Text style={styles.graficaTitulo}>Distribucion de casos</Text>
                  <PieChart
                    data={[
                      { name: 'Pendientes', population: pendientes || 0, color: COLORES.alerta, legendFontColor: COLORES.textoSub, legendFontSize: 11 },
                      { name: 'Respondidas', population: respondidas || 0, color: COLORES.exito, legendFontColor: COLORES.textoSub, legendFontSize: 11 },
                      { name: 'Cerradas', population: cerradas || 0, color: COLORES.textoSub, legendFontColor: COLORES.textoSub, legendFontSize: 11 },
                    ].filter(d => d.population > 0)}
                    width={width - 48}
                    height={160}
                    chartConfig={{
                      color: () => COLORES.primario,
                      labelColor: () => COLORES.textoSub,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="16"
                  />
                </View>
              )}

              <Text style={styles.seccionTitulo}>Casos recientes</Text>
              {consultas.slice(0, 5).map((c, i) => (
                <TouchableOpacity key={i} style={styles.consultaCard} onPress={() => abrirConsulta(c)}>
                  <View style={[styles.estadoIndicador, { backgroundColor: estadoColor(c.estado) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.consultaNombre}>{c.nombre_usuaria}</Text>
                    <Text style={styles.consultaAsunto}>{c.asunto}</Text>
                  </View>
                  <ChevronRight size={16} color={COLORES.textoSub} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* CONSULTAS */}
          {tab === 'consultas' && (
            <View style={styles.seccion}>
              {pendientes > 0 && (
                <View style={styles.alertaBanner}>
                  <AlertCircle size={16} color={COLORES.alerta} />
                  <Text style={styles.alertaTexto}>{pendientes} caso{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de atencion</Text>
                </View>
              )}
              {['pendiente', 'en_revision', 'respondida', 'cerrada'].map(estado => {
                const grupo = consultas.filter(c => c.estado === estado);
                if (!grupo.length) return null;
                return (
                  <View key={estado}>
                    <Text style={[styles.grupoLabel, { color: estadoColor(estado) }]}>
                      {estado.replace('_', ' ').toUpperCase()} ({grupo.length})
                    </Text>
                    {grupo.map((c, i) => (
                      <TouchableOpacity key={i} style={styles.consultaCard} onPress={() => abrirConsulta(c)}>
                        <View style={[styles.estadoIndicador, { backgroundColor: estadoColor(c.estado) }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.consultaNombre}>{c.nombre_usuaria}</Text>
                          <Text style={styles.consultaAsunto}>{c.asunto}</Text>
                          <Text style={styles.consultaFecha}>
                            {new Date(c.fecha_consulta).toLocaleDateString('es-MX', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </Text>
                        </View>
                        <ChevronRight size={16} color={COLORES.textoSub} />
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {/* DETALLE */}
          {tab === 'detalle' && consultaActual && (
            <View style={styles.seccion}>
              <View style={styles.detalleMeta}>
                <User size={14} color={COLORES.textoSub} />
                <Text style={styles.detalleMetaTexto}>{consultaActual.nombre_usuaria}</Text>
                <Clock size={14} color={COLORES.textoSub} />
                <Text style={styles.detalleMetaTexto}>
                  {new Date(consultaActual.fecha_consulta).toLocaleDateString('es-MX')}
                </Text>
              </View>

              <View style={styles.descripcionCard}>
                <Text style={styles.descripcionLabel}>Descripcion del caso</Text>
                <Text style={styles.descripcionTexto}>{consultaActual.descripcion}</Text>
              </View>

              <Text style={styles.seccionTitulo}>
                {consultaActual.respuesta ? 'Tu respuesta' : 'Escribir respuesta'}
              </Text>
              <TextInput
                style={[styles.inputRespuesta]}
                placeholder="Escribe tu respuesta legal aqui..."
                placeholderTextColor={COLORES.textoSub}
                value={respuesta}
                onChangeText={setRespuesta}
                multiline
                textAlignVertical="top"
                editable={consultaActual.estado !== 'cerrada'}
              />
              {consultaActual.estado !== 'cerrada' && (
                <TouchableOpacity style={styles.botonResponder} onPress={enviarRespuesta} disabled={enviando}>
                  {enviando
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.botonTexto}>
                        {consultaActual.respuesta ? 'Actualizar respuesta' : 'Enviar respuesta'}
                      </Text>}
                </TouchableOpacity>
              )}

              {consultaActual.chat_activo && (
                <>
                  <Text style={[styles.seccionTitulo, { marginTop: 20 }]}>Chat con la usuaria</Text>
                  <View style={styles.chatContainer}>
                    {consultaActual.mensajes?.length === 0 ? (
                      <Text style={styles.sinMensajes}>Sin mensajes aun</Text>
                    ) : (
                      consultaActual.mensajes?.map((m, i) => {
                        const esMio = m.nombre_autor === usuaria?.nombre_completo;
                        return (
                          <View key={i} style={[styles.mensajeRow, esMio ? styles.mensajeMio : styles.mensajeOtro]}>
                            <View style={[styles.burbuja, esMio ? styles.burbujaPropia : styles.burbujaAjena]}>
                              {!esMio && <Text style={styles.mensajeNombre}>{m.nombre_autor}</Text>}
                              <Text style={styles.mensajeTexto}>{m.mensaje}</Text>
                              <Text style={styles.mensajeFecha}>
                                {new Date(m.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                  {consultaActual.estado !== 'cerrada' && (
                    <View style={styles.chatInput}>
                      <TextInput
                        style={styles.chatTextInput}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor={COLORES.textoSub}
                        value={mensaje}
                        onChangeText={setMensaje}
                        multiline
                      />
                      <TouchableOpacity style={styles.chatEnviarBtn} onPress={enviarMensajeChat} disabled={enviando}>
                        <Send size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  detalleHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORES.borde, gap: 12 },
  volverTexto: { color: COLORES.primario, fontSize: 14, fontWeight: '600' },
  detalleTitulo: { flex: 1, color: COLORES.texto, fontSize: 14, fontWeight: '600' },
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, marginRight: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActivo: { borderBottomColor: COLORES.primario },
  tabTexto: { color: COLORES.textoSub, fontSize: 12, fontWeight: '500' },
  tabTextoActivo: { color: COLORES.primario, fontWeight: '700' },
  pdfBtn: { marginLeft: 'auto', backgroundColor: COLORES.primario, padding: 8, borderRadius: 8 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  seccion: { padding: 20 },
  seccionTitulo: { color: COLORES.texto, fontSize: 15, fontWeight: '700', marginBottom: 14, letterSpacing: 0.5 },
  kpiGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: COLORES.superficie, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde },
  kpiNum: { fontSize: 24, fontWeight: '800' },
  kpiLabel: { color: COLORES.textoSub, fontSize: 10, marginTop: 4, textAlign: 'center' },
  graficaCard: { backgroundColor: COLORES.superficie2, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORES.borde },
  graficaTitulo: { color: COLORES.texto, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  alertaBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORES.alerta + '15', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORES.alerta + '30' },
  alertaTexto: { color: COLORES.alerta, fontSize: 13, fontWeight: '600' },
  grupoLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  consultaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.superficie, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORES.borde, gap: 12 },
  estadoIndicador: { width: 4, height: 40, borderRadius: 2 },
  consultaNombre: { color: COLORES.texto, fontWeight: '600', fontSize: 13 },
  consultaAsunto: { color: COLORES.textoSub, fontSize: 12, marginTop: 2 },
  consultaFecha: { color: COLORES.borde, fontSize: 11, marginTop: 2 },
  detalleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  detalleMetaTexto: { color: COLORES.textoSub, fontSize: 12 },
  descripcionCard: { backgroundColor: COLORES.superficie, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORES.borde },
  descripcionLabel: { color: COLORES.primario, fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  descripcionTexto: { color: COLORES.texto, fontSize: 14, lineHeight: 22 },
  inputRespuesta: { backgroundColor: COLORES.superficie, borderRadius: 12, padding: 14, color: COLORES.texto, fontSize: 14, minHeight: 120, borderWidth: 1, borderColor: COLORES.borde, marginBottom: 12, textAlignVertical: 'top' },
  botonResponder: { backgroundColor: COLORES.primario, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  chatContainer: { backgroundColor: COLORES.superficie, borderRadius: 12, padding: 14, marginBottom: 12, minHeight: 120, borderWidth: 1, borderColor: COLORES.borde },
  sinMensajes: { color: COLORES.textoSub, textAlign: 'center', marginTop: 20, fontSize: 13 },
  mensajeRow: { marginBottom: 10 },
  mensajeMio: { alignItems: 'flex-end' },
  mensajeOtro: { alignItems: 'flex-start' },
  burbuja: { maxWidth: '80%', borderRadius: 14, padding: 10 },
  burbujaPropia: { backgroundColor: COLORES.primario },
  burbujaAjena: { backgroundColor: COLORES.superficie2 },
  mensajeNombre: { color: COLORES.secundario, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  mensajeTexto: { color: COLORES.texto, fontSize: 13, lineHeight: 18 },
  mensajeFecha: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4, textAlign: 'right' },
  chatInput: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  chatTextInput: { flex: 1, backgroundColor: COLORES.superficie, borderRadius: 12, padding: 12, color: COLORES.texto, fontSize: 14, maxHeight: 80, borderWidth: 1, borderColor: COLORES.borde },
  chatEnviarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORES.primario, alignItems: 'center', justifyContent: 'center' },
});
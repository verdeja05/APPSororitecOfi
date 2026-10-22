import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  Users, Shield, Scale, Brain, Stethoscope,
  TrendingUp, FileText, UserPlus, ChevronRight,
  X, Check, AlertCircle, Activity
} from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl,
  TextInput, Alert, Modal, Dimensions, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

const COLORES = {
  primario: '#6C63FF',
  secundario: '#A78BFA',
  fondo: '#0A0A14',
  superficie: '#13131F',
  superficie2: '#1C1C2E',
  borde: '#2A2A3E',
  texto: '#F1F1F6',
  textoSub: '#8888AA',
  exito: '#10B981',
  alerta: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  abogada: '#3B82F6',
  psicologa: '#10B981',
  medica: '#EF4444',
  usuaria: '#6C63FF',
  acompanante: '#F59E0B',
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function SuperAdminScreen({ navigation }) {
  const { logout, usuaria: yo } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [graficas, setGraficas] = useState(null);
  const [usuarias, setUsuarias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalRol, setModalRol] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [form, setForm] = useState({
    nombre_completo: '',
    correo_institucional: '',
    contrasena: '',
    rol: 'usuaria'
  });
  const [creando, setCreando] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      cargar();
    }, [])
  );

  const cargar = async () => {
    try {
      const [statsRes, usuariasRes, graficasRes] = await Promise.all([
        api.get('/admin/estadisticas'),
        api.get('/admin/usuarias'),
        api.get('/admin/graficas'),
      ]);
      setStats(statsRes.data);
      setUsuarias(usuariasRes.data);
      setGraficas(graficasRes.data);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const crearCuenta = async () => {
    if (!form.nombre_completo || !form.correo_institucional || !form.contrasena) {
      Alert.alert('Campos requeridos', 'Completa todos los campos');
      return;
    }
    setCreando(true);
    try {
      await api.post('/admin/crear-cuenta', form);
      Alert.alert('Cuenta creada', `${form.nombre_completo} puede iniciar sesion ahora.`);
      setModalCrear(false);
      setForm({ nombre_completo: '', correo_institucional: '', contrasena: '', rol: 'usuaria' });
      cargar();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo crear la cuenta');
    } finally {
      setCreando(false);
    }
  };

  const cambiarRol = async (nuevoRol) => {
    if (!modalRol) return;
    try {
      await api.put(`/admin/cambiar-rol/${modalRol._id}`, { rol: nuevoRol });
      setModalRol(null);
      cargar();
    } catch (err) {
      Alert.alert('Error', 'No se pudo cambiar el rol');
    }
  };

  const cambiarEstado = (u) => {
    const nuevoEstado = u.estado_cuenta === 'activa' ? 'suspendida' : 'activa';
    Alert.alert(
      nuevoEstado === 'suspendida' ? 'Suspender cuenta' : 'Activar cuenta',
      `Confirmas ${nuevoEstado === 'suspendida' ? 'suspender' : 'activar'} a ${u.nombre_completo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.put(`/admin/estado/${u._id}`, { estado_cuenta: nuevoEstado });
              cargar();
            } catch (err) {
              Alert.alert('Error', 'No se pudo actualizar el estado');
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

      const totalPorRol = {};
      stats?.usuariasPorRol?.forEach(r => { totalPorRol[r._id] = r.total; });

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #1a1a2e; }
            .portada { background: linear-gradient(135deg, #6C63FF, #A78BFA); padding: 60px 40px; text-align: center; }
            .portada h1 { color: #fff; font-size: 32px; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px; }
            .portada h2 { color: rgba(255,255,255,0.85); font-size: 16px; font-weight: 400; margin-bottom: 4px; }
            .portada .fecha { color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 16px; }
            .portada .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 6px 20px; border-radius: 20px; font-size: 12px; margin-top: 12px; }
            .contenido { padding: 40px; }
            .seccion { margin-bottom: 40px; }
            .seccion-titulo { font-size: 18px; font-weight: 700; color: #6C63FF; border-bottom: 2px solid #6C63FF; padding-bottom: 8px; margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
            .stat-card { background: #f8f7ff; border: 1px solid #e8e6ff; border-radius: 12px; padding: 20px; text-align: center; }
            .stat-num { font-size: 36px; font-weight: 800; color: #6C63FF; }
            .stat-label { font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #6C63FF; color: #fff; padding: 12px 16px; text-align: left; font-weight: 600; }
            td { padding: 10px 16px; border-bottom: 1px solid #f0f0f0; }
            tr:nth-child(even) td { background: #fafafa; }
            .badge-rol { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #fff; }
            .badge-activa { background: #10B981; }
            .badge-suspendida { background: #EF4444; }
            .badge-pendiente { background: #F59E0B; }
            .pie-row { display: flex; gap: 12px; flex-wrap: wrap; }
            .pie-item { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 8px 16px; background: #f8f7ff; border-radius: 8px; }
            .pie-dot { width: 12px; height: 12px; border-radius: 50%; }
            .footer { margin-top: 40px; padding: 20px 40px; background: #f8f7ff; text-align: center; font-size: 11px; color: #999; border-top: 2px solid #6C63FF; }
          </style>
        </head>
        <body>
          <div class="portada">
            <h1>SORORITEC</h1>
            <h2>Reporte Ejecutivo General</h2>
            <div class="fecha">Generado el ${fecha}</div>
            <div class="badge">CONFIDENCIAL</div>
          </div>

          <div class="contenido">
            <div class="seccion">
              <div class="seccion-titulo">Resumen General</div>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-num">${stats?.totalUsuarias ?? 0}</div>
                  <div class="stat-label">Total Usuarias</div>
                </div>
                <div class="stat-card">
                  <div class="stat-num">${stats?.totalConsultas ?? 0}</div>
                  <div class="stat-label">Total Consultas</div>
                </div>
                <div class="stat-card">
                  <div class="stat-num">${stats?.consultasPendientes ?? 0}</div>
                  <div class="stat-label">Consultas Pendientes</div>
                </div>
                <div class="stat-card">
                  <div class="stat-num">${stats?.totalPublicaciones ?? 0}</div>
                  <div class="stat-label">Publicaciones</div>
                </div>
                <div class="stat-card">
                  <div class="stat-num">${stats?.totalAcompanamientos ?? 0}</div>
                  <div class="stat-label">Acompanamientos</div>
                </div>
                <div class="stat-card">
                  <div class="stat-num">${usuarias.filter(u => u.estado_cuenta === 'activa').length}</div>
                  <div class="stat-label">Cuentas Activas</div>
                </div>
              </div>
            </div>

            <div class="seccion">
              <div class="seccion-titulo">Distribucion por Rol</div>
              <div class="pie-row">
                ${stats?.usuariasPorRol?.map(r => `
                  <div class="pie-item">
                    <div class="pie-dot" style="background:${
                      r._id === 'abogada' ? '#3B82F6' :
                      r._id === 'psicologa' ? '#10B981' :
                      r._id === 'medica' ? '#EF4444' :
                      r._id === 'superadmin' ? '#F59E0B' :
                      '#6C63FF'
                    }"></div>
                    <strong>${r._id}</strong>: ${r.total}
                  </div>
                `).join('') ?? ''}
              </div>
            </div>

            <div class="seccion">
              <div class="seccion-titulo">Directorio de Especialistas</div>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  ${usuarias
                    .filter(u => ['abogada', 'psicologa', 'medica', 'administradora'].includes(u.rol))
                    .map(u => `
                      <tr>
                        <td>${u.nombre_completo}</td>
                        <td>${u.correo_institucional}</td>
                        <td><span class="badge-rol" style="background:${
                          u.rol === 'abogada' ? '#3B82F6' :
                          u.rol === 'psicologa' ? '#10B981' :
                          '#EF4444'
                        }">${u.rol}</span></td>
                        <td><span class="badge-rol ${u.estado_cuenta === 'activa' ? 'badge-activa' : 'badge-suspendida'}">${u.estado_cuenta}</span></td>
                        <td>${new Date(u.fecha_registro).toLocaleDateString('es-MX')}</td>
                      </tr>
                    `).join('')}
                </tbody>
              </table>
            </div>

            <div class="seccion">
              <div class="seccion-titulo">Listado de Usuarias</div>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  ${usuarias
                    .filter(u => u.rol === 'usuaria')
                    .slice(0, 50)
                    .map(u => `
                      <tr>
                        <td>${u.nombre_completo}</td>
                        <td>${u.correo_institucional}</td>
                        <td><span class="badge-rol ${
                          u.estado_cuenta === 'activa' ? 'badge-activa' :
                          u.estado_cuenta === 'suspendida' ? 'badge-suspendida' :
                          'badge-pendiente'
                        }">${u.estado_cuenta}</span></td>
                        <td>${new Date(u.fecha_registro).toLocaleDateString('es-MX')}</td>
                      </tr>
                    `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="footer">
            Sororitec — Reporte generado el ${fecha} — DOCUMENTO CONFIDENCIAL
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Reporte Sororitec',
        UTI: 'com.adobe.pdf'
      });
    } catch (err) {
      Alert.alert('Error', 'No se pudo generar el PDF');
      console.log(err);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const prepararDatosGraficaMeses = (datos) => {
    if (!datos?.length) return { labels: ['Sin datos'], datasets: [{ data: [0] }] };
    const labels = datos.map(d => MESES[(d._id.mes - 1)] || '');
    const data = datos.map(d => d.total);
    return { labels, datasets: [{ data }] };
  };

  const prepararDatosPie = (datos, coloresMap) => {
    if (!datos?.length) return [];
    return datos.map((d, i) => ({
      name: d._id,
      population: d.total,
      color: coloresMap[d._id] || `hsl(${i * 60}, 70%, 60%)`,
      legendFontColor: COLORES.textoSub,
      legendFontSize: 11,
    }));
  };

  const chartConfig = {
    backgroundGradientFrom: COLORES.superficie2,
    backgroundGradientTo: COLORES.superficie2,
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    labelColor: () => COLORES.textoSub,
    strokeWidth: 2,
    propsForDots: { r: '4', strokeWidth: '2', stroke: COLORES.primario },
    propsForBackgroundLines: { stroke: COLORES.borde },
    decimalPlaces: 0,
  };

  const ROLES = [
    { key: 'usuaria', label: 'Usuaria', color: COLORES.usuaria },
    { key: 'abogada', label: 'Abogada', color: COLORES.abogada },
    { key: 'psicologa', label: 'Psicologa', color: COLORES.psicologa },
    { key: 'medica', label: 'Medica', color: COLORES.medica },
    { key: 'acompanante', label: 'Acompanante', color: COLORES.acompanante },
    { key: 'administradora', label: 'Administradora', color: '#9C27B0' },
  ];

  const usuariasFiltradas = usuarias.filter(u => {
    const matchBusqueda =
      u.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo_institucional?.toLowerCase().includes(busqueda.toLowerCase());
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol;
    return matchBusqueda && matchRol;
  });

  const RolIcon = ({ rol, size = 16, color }) => {
    const props = { size, color: color || COLORES.textoSub };
    if (rol === 'superadmin') return <Shield {...props} />;
    if (rol === 'abogada') return <Scale {...props} />;
    if (rol === 'psicologa') return <Brain {...props} />;
    if (rol === 'medica') return <Stethoscope {...props} />;
    return <Users {...props} />;
  };

  const TABS = [
    { key: 'dashboard', label: 'Dashboard', Icon: Activity },
    { key: 'usuarias', label: 'Usuarias', Icon: Users },
    { key: 'equipo', label: 'Equipo', Icon: Shield },
    { key: 'reportes', label: 'Reportes', Icon: FileText },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>PANEL DE ADMINISTRACION</Text>
          <Text style={styles.headerNombre}>{yo?.nombre_completo}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <X size={16} color={COLORES.error} />
          <Text style={styles.logoutTexto}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {TABS.map(({ key, label, Icon }) => (
              <TouchableOpacity
                key={key}
                style={[styles.tab, tab === key && styles.tabActivo]}
                onPress={() => setTab(key)}>
                <Icon size={14} color={tab === key ? COLORES.primario : COLORES.textoSub} />
                <Text style={[styles.tabTexto, tab === key && styles.tabTextoActivo]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORES.primario} size="large" />
          <Text style={styles.loadingTexto}>Cargando datos...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => { setRefrescando(true); cargar(); }}
              colors={[COLORES.primario]}
              tintColor={COLORES.primario}
            />
          }>

          {/* ========== DASHBOARD ========== */}
          {tab === 'dashboard' && (
            <View style={styles.seccion}>
              {/* KPIs */}
              <Text style={styles.seccionTitulo}>Indicadores Clave</Text>
              <View style={styles.kpiGrid}>
                {[
                  { label: 'Total Usuarias', valor: stats?.totalUsuarias, Icon: Users, color: COLORES.primario },
                  { label: 'Consultas', valor: stats?.totalConsultas, Icon: FileText, color: COLORES.info },
                  { label: 'Pendientes', valor: stats?.consultasPendientes, Icon: AlertCircle, color: COLORES.alerta },
                  { label: 'Publicaciones', valor: stats?.totalPublicaciones, Icon: TrendingUp, color: COLORES.exito },
                  { label: 'Acompanamientos', valor: stats?.totalAcompanamientos, Icon: Shield, color: '#9C27B0' },
                  { label: 'Activas', valor: usuarias.filter(u => u.estado_cuenta === 'activa').length, Icon: Check, color: COLORES.exito },
                ].map((kpi, i) => (
                  <View key={i} style={styles.kpiCard}>
                    <View style={[styles.kpiIcono, { backgroundColor: kpi.color + '20' }]}>
                      <kpi.Icon size={20} color={kpi.color} />
                    </View>
                    <Text style={styles.kpiValor}>{kpi.valor ?? 0}</Text>
                    <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  </View>
                ))}
              </View>

              {/* Grafica usuarias por mes */}
              {graficas?.usuariasPorMes?.length > 0 && (
                <View style={styles.graficaCard}>
                  <Text style={styles.graficaTitulo}>Usuarias Registradas por Mes</Text>
                  <LineChart
                    data={prepararDatosGraficaMeses(graficas.usuariasPorMes)}
                    width={CHART_WIDTH}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.graficaEstilo}
                    withInnerLines={false}
                  />
                </View>
              )}

              {/* Grafica consultas por mes */}
              {graficas?.consultasPorMes?.length > 0 && (
                <View style={styles.graficaCard}>
                  <Text style={styles.graficaTitulo}>Consultas por Mes</Text>
                  <BarChart
                    data={prepararDatosGraficaMeses(graficas.consultasPorMes)}
                    width={CHART_WIDTH}
                    height={200}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(167, 139, 250, ${opacity})`,
                    }}
                    style={styles.graficaEstilo}
                    showValuesOnTopOfBars
                    withInnerLines={false}
                  />
                </View>
              )}

              {/* Pie consultas por tipo */}
              {graficas?.consultasPorTipo?.length > 0 && (
                <View style={styles.graficaCard}>
                  <Text style={styles.graficaTitulo}>Consultas por Tipo</Text>
                  <PieChart
                    data={prepararDatosPie(graficas.consultasPorTipo, {
                      legal: COLORES.abogada,
                      medica: COLORES.medica,
                      psicologica: COLORES.psicologa,
                    })}
                    width={CHART_WIDTH}
                    height={180}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="16"
                  />
                </View>
              )}

              {/* Pie usuarias por rol */}
              {graficas?.usuariasPorRol?.length > 0 && (
                <View style={styles.graficaCard}>
                  <Text style={styles.graficaTitulo}>Distribucion por Rol</Text>
                  <PieChart
                    data={prepararDatosPie(graficas.usuariasPorRol, {
                      usuaria: COLORES.primario,
                      abogada: COLORES.abogada,
                      psicologa: COLORES.psicologa,
                      medica: COLORES.medica,
                      acompanante: COLORES.alerta,
                      superadmin: '#FFD700',
                    })}
                    width={CHART_WIDTH}
                    height={180}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="16"
                  />
                </View>
              )}
            </View>
          )}

          {/* ========== USUARIAS ========== */}
          {tab === 'usuarias' && (
            <View style={styles.seccion}>
              <View style={styles.seccionHeaderRow}>
                <Text style={styles.seccionTitulo}>Usuarias ({usuariasFiltradas.filter(u => !['abogada','psicologa','medica','administradora','superadmin'].includes(u.rol)).length})</Text>
                <TouchableOpacity style={styles.botonAgregar} onPress={() => setModalCrear(true)}>
                  <UserPlus size={14} color="#fff" />
                  <Text style={styles.botonAgregarTexto}>Nueva</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.buscador}
                placeholder="Buscar por nombre o correo..."
                placeholderTextColor={COLORES.textoSub}
                value={busqueda}
                onChangeText={setBusqueda}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={styles.filtrosRow}>
                  {['todos', 'usuaria', 'acompanante', 'pendiente'].map(f => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filtroChip, filtroRol === f && styles.filtroChipActivo]}
                      onPress={() => setFiltroRol(f)}>
                      <Text style={[styles.filtroTexto, filtroRol === f && styles.filtroTextoActivo]}>
                        {f === 'todos' ? 'Todos' : f}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {usuariasFiltradas
                .filter(u => !['abogada', 'psicologa', 'medica', 'administradora', 'superadmin'].includes(u.rol))
                .map((u, i) => (
                  <View key={i} style={styles.usuariaCard}>
                    <View style={styles.usuariaTop}>
                      <View style={[styles.avatarCirculo, { borderColor: COLORES.primario + '50' }]}>
                        {u.foto_perfil ? (
                          <Image source={{ uri: u.foto_perfil }} style={styles.avatarImg} />
                        ) : (
                          <Users size={20} color={COLORES.textoSub} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.usuariaNombre}>{u.nombre_completo}</Text>
                        <Text style={styles.usuariaCorreo}>{u.correo_institucional}</Text>
                        <Text style={styles.usuariaFecha}>
                          Registro: {new Date(u.fecha_registro).toLocaleDateString('es-MX')}
                        </Text>
                      </View>
                      <View style={[
                        styles.estadoIndicador,
                        { backgroundColor: u.estado_cuenta === 'activa' ? COLORES.exito : COLORES.error }
                      ]} />
                    </View>
                    <View style={styles.accionesRow}>
                      <TouchableOpacity
                        style={styles.accionChip}
                        onPress={() => setModalRol(u)}>
                        <Text style={styles.accionChipTexto}>Cambiar rol</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.accionChip, {
                          backgroundColor: u.estado_cuenta === 'activa'
                            ? COLORES.error + '20'
                            : COLORES.exito + '20',
                          borderColor: u.estado_cuenta === 'activa' ? COLORES.error : COLORES.exito
                        }]}
                        onPress={() => cambiarEstado(u)}>
                        <Text style={[styles.accionChipTexto, {
                          color: u.estado_cuenta === 'activa' ? COLORES.error : COLORES.exito
                        }]}>
                          {u.estado_cuenta === 'activa' ? 'Suspender' : 'Activar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* ========== EQUIPO ========== */}
          {tab === 'equipo' && (
            <View style={styles.seccion}>
              <View style={styles.seccionHeaderRow}>
                <Text style={styles.seccionTitulo}>Equipo Especialista</Text>
                <TouchableOpacity style={styles.botonAgregar} onPress={() => setModalCrear(true)}>
                  <UserPlus size={14} color="#fff" />
                  <Text style={styles.botonAgregarTexto}>Agregar</Text>
                </TouchableOpacity>
              </View>

              {['abogada', 'psicologa', 'medica', 'administradora'].map(rol => {
                const miembros = usuarias.filter(u => u.rol === rol);
                if (!miembros.length) return null;
                const rolData = ROLES.find(r => r.key === rol);
                return (
                  <View key={rol} style={styles.rolSeccion}>
                    <View style={styles.rolHeader}>
                      <RolIcon rol={rol} size={16} color={rolData?.color} />
                      <Text style={[styles.rolTitulo, { color: rolData?.color }]}>
                        {rolData?.label} ({miembros.length})
                      </Text>
                    </View>
                    {miembros.map((u, i) => (
                      <View key={i} style={styles.especialistaCard}>
                        <View style={[styles.especialistaAvatar, { backgroundColor: rolData?.color + '20' }]}>
                          <RolIcon rol={rol} size={22} color={rolData?.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.usuariaNombre}>{u.nombre_completo}</Text>
                          <Text style={styles.usuariaCorreo}>{u.correo_institucional}</Text>
                        </View>
                        <View style={styles.accionesCol}>
                          <View style={[
                            styles.estadoChip,
                            { backgroundColor: u.estado_cuenta === 'activa' ? COLORES.exito + '20' : COLORES.error + '20' }
                          ]}>
                            <Text style={[styles.estadoChipTexto, {
                              color: u.estado_cuenta === 'activa' ? COLORES.exito : COLORES.error
                            }]}>
                              {u.estado_cuenta}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => cambiarEstado(u)}>
                            <Text style={styles.accionLink}>
                              {u.estado_cuenta === 'activa' ? 'Suspender' : 'Activar'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {/* ========== REPORTES ========== */}
          {tab === 'reportes' && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Reportes y Exportacion</Text>

              <View style={styles.reporteCard}>
                <View style={styles.reporteInfo}>
                  <FileText size={32} color={COLORES.primario} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reporteTitulo}>Reporte Ejecutivo General</Text>
                    <Text style={styles.reporteDesc}>
                      Incluye estadisticas generales, directorio de especialistas,
                      listado de usuarias y distribucion por roles.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.botonPDF}
                  onPress={generarPDF}
                  disabled={generandoPDF}>
                  {generandoPDF
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.botonPDFTexto}>Exportar PDF</Text>}
                </TouchableOpacity>
              </View>

              <Text style={[styles.seccionTitulo, { marginTop: 24 }]}>Resumen de Datos</Text>
              {[
                { label: 'Total usuarias registradas', valor: stats?.totalUsuarias },
                { label: 'Usuarias activas', valor: usuarias.filter(u => u.estado_cuenta === 'activa').length },
                { label: 'Usuarias suspendidas', valor: usuarias.filter(u => u.estado_cuenta === 'suspendida').length },
                { label: 'Total consultas', valor: stats?.totalConsultas },
                { label: 'Consultas pendientes', valor: stats?.consultasPendientes },
                { label: 'Total publicaciones', valor: stats?.totalPublicaciones },
                { label: 'Total acompanamientos', valor: stats?.totalAcompanamientos },
              ].map((item, i) => (
                <View key={i} style={styles.resumenRow}>
                  <Text style={styles.resumenLabel}>{item.label}</Text>
                  <Text style={styles.resumenValor}>{item.valor ?? 0}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal crear cuenta */}
      <Modal visible={modalCrear} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Nueva Cuenta</Text>
              <TouchableOpacity onPress={() => setModalCrear(false)}>
                <X size={20} color={COLORES.textoSub} />
              </TouchableOpacity>
            </View>

            {[
              { placeholder: 'Nombre completo', key: 'nombre_completo', secure: false },
              { placeholder: 'Correo institucional', key: 'correo_institucional', secure: false },
              { placeholder: 'Contrasena temporal', key: 'contrasena', secure: true },
            ].map((f, i) => (
              <TextInput
                key={i}
                style={styles.modalInput}
                placeholder={f.placeholder}
                placeholderTextColor={COLORES.textoSub}
                value={form[f.key]}
                onChangeText={t => setForm(prev => ({ ...prev, [f.key]: t }))}
                secureTextEntry={f.secure}
                autoCapitalize="none"
              />
            ))}

            <Text style={styles.modalLabel}>Rol de la cuenta</Text>
            <View style={styles.rolesGrid}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[
                    styles.rolChip,
                    form.rol === r.key && { backgroundColor: r.color, borderColor: r.color }
                  ]}
                  onPress={() => setForm(prev => ({ ...prev, rol: r.key }))}>
                  <RolIcon rol={r.key} size={14} color={form.rol === r.key ? '#fff' : r.color} />
                  <Text style={[
                    styles.rolChipTexto,
                    form.rol === r.key && { color: '#fff' }
                  ]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.modalCancelar}
                onPress={() => setModalCrear(false)}>
                <Text style={styles.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmar}
                onPress={crearCuenta}
                disabled={creando}>
                {creando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmarTexto}>Crear cuenta</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal cambiar rol */}
      <Modal visible={!!modalRol} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Cambiar Rol</Text>
              <TouchableOpacity onPress={() => setModalRol(null)}>
                <X size={20} color={COLORES.textoSub} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitulo}>{modalRol?.nombre_completo}</Text>
            <Text style={styles.modalDesc}>
              Rol actual: <Text style={{ color: COLORES.primario, fontWeight: 'bold' }}>{modalRol?.rol}</Text>
            </Text>

            <View style={styles.rolesGrid}>
              {ROLES.filter(r => r.key !== modalRol?.rol).map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.rolChip, { borderColor: r.color }]}
                  onPress={() => {
                    Alert.alert(
                      'Confirmar cambio',
                      `Cambiar rol de ${modalRol?.nombre_completo} a "${r.label}"?`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Confirmar', onPress: () => cambiarRol(r.key) }
                      ]
                    );
                  }}>
                  <RolIcon rol={r.key} size={14} color={r.color} />
                  <Text style={[styles.rolChipTexto, { color: r.color }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalCancelar, { marginTop: 8 }]}
              onPress={() => setModalRol(null)}>
              <Text style={styles.modalCancelarTexto}>Cerrar</Text>
            </TouchableOpacity>
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
  tabsContainer: { borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, marginRight: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActivo: { borderBottomColor: COLORES.primario },
  tabTexto: { color: COLORES.textoSub, fontSize: 12, fontWeight: '500' },
  tabTextoActivo: { color: COLORES.primario, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTexto: { color: COLORES.textoSub, fontSize: 14 },
  scrollContent: { flex: 1 },
  seccion: { padding: 20 },
  seccionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seccionTitulo: { color: COLORES.texto, fontSize: 15, fontWeight: '700', letterSpacing: 0.5, marginBottom: 16 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
 kpiCard: { 
  backgroundColor: COLORES.superficie, 
  borderRadius: 14, 
  padding: 16, 
  alignItems: 'center', 
  width: (width - 52) / 2, 
  borderWidth: 1, 
  borderColor: COLORES.borde 
},
  kpiIcono: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kpiValor: { color: COLORES.texto, fontSize: 24, fontWeight: '800' },
  kpiLabel: { color: COLORES.textoSub, fontSize: 10, marginTop: 4, textAlign: 'center', letterSpacing: 0.5 },
  graficaCard: { backgroundColor: COLORES.superficie2, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORES.borde },
  graficaTitulo: { color: COLORES.texto, fontSize: 13, fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 },
  graficaEstilo: { borderRadius: 12, marginLeft: -8 },
  buscador: { backgroundColor: COLORES.superficie, borderRadius: 10, padding: 12, color: COLORES.texto, fontSize: 14, borderWidth: 1, borderColor: COLORES.borde, marginBottom: 12 },
  filtrosRow: { flexDirection: 'row', gap: 8 },
  filtroChip: { backgroundColor: COLORES.superficie, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORES.borde },
  filtroChipActivo: { backgroundColor: COLORES.primario + '20', borderColor: COLORES.primario },
  filtroTexto: { color: COLORES.textoSub, fontSize: 12 },
  filtroTextoActivo: { color: COLORES.primario, fontWeight: '600' },
  usuariaCard: { backgroundColor: COLORES.superficie, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORES.borde },
  usuariaTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatarCirculo: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORES.superficie2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  usuariaNombre: { color: COLORES.texto, fontWeight: '600', fontSize: 14 },
  usuariaCorreo: { color: COLORES.textoSub, fontSize: 12, marginTop: 2 },
  usuariaFecha: { color: COLORES.borde, fontSize: 11, marginTop: 2 },
  estadoIndicador: { width: 8, height: 8, borderRadius: 4 },
  accionesRow: { flexDirection: 'row', gap: 8 },
  accionChip: { flex: 1, backgroundColor: COLORES.primario + '15', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: COLORES.primario + '40' },
  accionChipTexto: { color: COLORES.primario, fontSize: 12, fontWeight: '600' },
  botonAgregar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORES.primario, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  botonAgregarTexto: { color: '#fff', fontSize: 12, fontWeight: '600' },
  rolSeccion: { marginBottom: 20 },
  rolHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  rolTitulo: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  especialistaCard: { backgroundColor: COLORES.superficie, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORES.borde },
  especialistaAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  accionesCol: { alignItems: 'flex-end', gap: 4 },
  estadoChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  estadoChipTexto: { fontSize: 11, fontWeight: '600' },
  accionLink: { color: COLORES.textoSub, fontSize: 11, textDecorationLine: 'underline' },
  reporteCard: { backgroundColor: COLORES.superficie, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORES.borde, marginBottom: 24 },
  reporteInfo: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', marginBottom: 16 },
  reporteTitulo: { color: COLORES.texto, fontWeight: '700', fontSize: 15, marginBottom: 6 },
  reporteDesc: { color: COLORES.textoSub, fontSize: 13, lineHeight: 20 },
  botonPDF: { backgroundColor: COLORES.primario, padding: 14, borderRadius: 10, alignItems: 'center' },
  botonPDFTexto: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  resumenLabel: { color: COLORES.textoSub, fontSize: 13 },
  resumenValor: { color: COLORES.texto, fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORES.superficie, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORES.borde },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo: { color: COLORES.texto, fontSize: 18, fontWeight: '700' },
  modalSubtitulo: { color: COLORES.texto, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  modalDesc: { color: COLORES.textoSub, fontSize: 13, marginBottom: 16 },
  modalLabel: { color: COLORES.textoSub, fontSize: 12, marginBottom: 10, letterSpacing: 0.5, fontWeight: '600' },
  modalInput: { backgroundColor: COLORES.fondo, borderRadius: 10, padding: 12, color: COLORES.texto, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORES.borde },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  rolChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORES.fondo, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORES.borde },
  rolChipTexto: { color: COLORES.textoSub, fontSize: 12, fontWeight: '500' },
  modalBotones: { flexDirection: 'row', gap: 10 },
  modalCancelar: { flex: 1, backgroundColor: COLORES.superficie2, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde },
  modalCancelarTexto: { color: COLORES.textoSub, fontWeight: '600' },
  modalConfirmar: { flex: 1, backgroundColor: COLORES.primario, padding: 14, borderRadius: 10, alignItems: 'center' },
  modalConfirmarTexto: { color: '#fff', fontWeight: '700' },
});
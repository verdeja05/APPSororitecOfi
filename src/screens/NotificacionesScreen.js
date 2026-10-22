import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Bell, MessageSquare, BookOpen, MapPin,
  FileText, Heart, ChevronLeft, AlertTriangle
} from 'lucide-react-native';
import api from '../services/api';

const COLORES = {
  primario: '#7C3AED', secundario: '#A78BFA', acento: '#C4B5FD',
  fondo: '#0D0B1A', superficie: '#16122A', superficie2: '#1E1A35',
  superficie3: '#2D1B69', borde: '#2E2850', bordeSuave: '#3D2F7A',
  texto: '#F3F1FF', textoSub: '#9B94C4', textoMuted: '#6B6490',
  exito: '#10B981', alerta: '#F59E0B', error: '#EF4444', rosa: '#EC4899',
};

const TIPO_CONFIG = {
  consulta_respondida: { Icon: FileText, color: '#3B82F6', bg: '#1E3A5F', label: 'Consulta', ruta: 'MisConsultas' },
  taller_confirmado: { Icon: BookOpen, color: '#10B981', bg: '#1A3A2E', label: 'Taller', ruta: 'Talleres' },
  comentario: { Icon: MessageSquare, color: COLORES.secundario, bg: '#2D1B69', label: 'Comentario', ruta: 'Home' },
  like: { Icon: Heart, color: '#EC4899', bg: '#3A1A2E', label: 'Me gusta', ruta: 'Home' },
  acompanamiento_aceptado: { Icon: MapPin, color: '#F59E0B', bg: '#3A2E1A', label: 'GPS Sorori', ruta: 'GPS' },
  alerta_panico: { Icon: AlertTriangle, color: '#EF4444', bg: '#3A1010', label: 'Alerta', ruta: 'GPS' },
};

export default function NotificacionesScreen({ navigation }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      cargar();
    }, [])
  );

  const cargar = async () => {
    try {
      const res = await api.get('/notificaciones');
      setNotificaciones(res.data);
      await api.put('/notificaciones/leer-todas');
    } catch (err) {
      console.log('Error notificaciones:', err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const tiempoTranscurrido = (fecha) => {
    const diff = Date.now() - new Date(fecha);
    const mins = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(horas / 24);
    if (dias > 0) return `hace ${dias}d`;
    if (horas > 0) return `hace ${horas}h`;
    if (mins > 0) return `hace ${mins}m`;
    return 'ahora';
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORES.texto} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitulo}>Notificaciones</Text>
          {noLeidas > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeTexto}>{noLeidas} nuevas</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {cargando ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORES.primario} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => { setRefrescando(true); cargar(); }}
              colors={[COLORES.primario]}
              tintColor={COLORES.primario}
            />
          }>
          {notificaciones.length === 0 ? (
            <View style={styles.vacio}>
              <View style={styles.vacioIcono}>
                <Bell size={36} color={COLORES.secundario} />
              </View>
              <Text style={styles.vacioTexto}>Sin notificaciones</Text>
              <Text style={styles.vacioSub}>Aqui apareceran tus novedades</Text>
            </View>
          ) : (
            <View style={styles.lista}>
              {notificaciones.map((n, i) => {
                const config = TIPO_CONFIG[n.tipo] || {
                  Icon: Bell, color: COLORES.primario,
                  bg: COLORES.superficie3, label: '', ruta: 'Home'
                };
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.card, !n.leida && styles.cardNoLeida]}
                    onPress={() => navigation.navigate(config.ruta)}
                    activeOpacity={0.75}>
                    <View style={styles.avatarContainer}>
                      <View style={[styles.avatarCirculo, { backgroundColor: config.bg }]}>
                        <config.Icon size={22} color={config.color} />
                      </View>
                    </View>
                    <View style={styles.contenido}>
                      <View style={styles.contenidoTop}>
                        <Text style={styles.cardTitulo} numberOfLines={1}>{n.titulo}</Text>
                        {!n.leida && <View style={styles.puntito} />}
                      </View>
                      <Text style={styles.cardMensaje} numberOfLines={2}>{n.mensaje}</Text>
                      <View style={styles.cardBottom}>
                        <View style={[styles.tipoBadge, { backgroundColor: config.bg }]}>
                          <config.Icon size={10} color={config.color} />
                          <Text style={[styles.tipoTexto, { color: config.color }]}>{config.label}</Text>
                        </View>
                        <Text style={styles.cardFecha}>{tiempoTranscurrido(n.fecha)}</Text>
                      </View>
                    </View>
                    {!n.leida && (
                      <View style={styles.flechaContainer}>
                        <View style={[styles.flechaDot, { backgroundColor: config.color }]} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondo },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORES.borde,
    backgroundColor: COLORES.superficie,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORES.superficie2, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerTitulo: { color: COLORES.texto, fontSize: 17, fontWeight: '700' },
  headerBadge: { backgroundColor: COLORES.primario + '30', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: COLORES.primario + '50' },
  headerBadgeTexto: { color: COLORES.acento, fontSize: 11, fontWeight: '600' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vacio: { alignItems: 'center', paddingTop: 80, gap: 16 },
  vacioIcono: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORES.superficie3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.bordeSuave },
  vacioTexto: { color: COLORES.texto, fontSize: 17, fontWeight: '600' },
  vacioSub: { color: COLORES.textoSub, fontSize: 13 },
  lista: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORES.superficie, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: COLORES.borde },
  cardNoLeida: { backgroundColor: COLORES.superficie2, borderColor: COLORES.bordeSuave },
  avatarContainer: { position: 'relative' },
  avatarCirculo: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.bordeSuave },
  contenido: { flex: 1 },
  contenidoTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardTitulo: { color: COLORES.texto, fontWeight: '700', fontSize: 14, flex: 1 },
  puntito: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.primario },
  cardMensaje: { color: COLORES.textoSub, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tipoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tipoTexto: { fontSize: 10, fontWeight: '700' },
  cardFecha: { color: COLORES.textoMuted, fontSize: 11 },
  flechaContainer: { alignItems: 'center', justifyContent: 'center' },
  flechaDot: { width: 8, height: 8, borderRadius: 4 },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
  TextInput, RefreshControl, Dimensions,
  Image, Modal, Linking
} from 'react-native';
import MapView, { Marker, UrlTile, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  MapPin, Users, Shield, Navigation, ChevronLeft,
  CheckCircle, Clock, Share2, AlertTriangle,
  UserCheck, Flag, RefreshCw, Star, X,
  Home, Moon, AlertCircle, Heart, Phone
} from 'lucide-react-native';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const COLORES = {
  primario: '#7C3AED', secundario: '#A78BFA', acento: '#C4B5FD',
  fondo: '#0D0B1A', superficie: '#16122A', superficie2: '#1E1A35',
  superficie3: '#2D1B69', borde: '#2E2850', texto: '#F3F1FF',
  textoSub: '#9B94C4', textoMuted: '#6B6490',
  exito: '#10B981', alerta: '#F59E0B', error: '#EF4444', rosa: '#EC4899',
};

const SITUACIONES = [
  { key: 'noche', label: 'Voy sola de noche', Icon: Moon },
  { key: 'insegura', label: 'Me siento insegura', Icon: AlertCircle },
  { key: 'casa', label: 'Necesito llegar a casa', Icon: Home },
  { key: 'acoso', label: 'Situacion de acoso', Icon: AlertTriangle },
  { key: 'salud', label: 'Necesito apoyo emocional', Icon: Heart },
  { key: 'otro', label: 'Otra situacion', Icon: Shield },
];

const TABS = [
  { key: 'solicitar', label: 'Pedir ayuda', Icon: Shield },
  { key: 'ayudar', label: 'Ayudar', Icon: Users },
  { key: 'mis', label: 'Historial', Icon: Clock },
];

export default function GPSScreen({ navigation }) {
  const [ubicacion, setUbicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [misAceptaciones, setMisAceptaciones] = useState([]);
  const [tab, setTab] = useState('solicitar');
  const [acompanamientoActivo, setAcompanamientoActivo] = useState(null);
  const [detalleActivo, setDetalleActivo] = useState(null);
  const [esAcompanante, setEsAcompanante] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [panico, setPanico] = useState(false);

  // Formulario
  const [situacionTipo, setSituacionTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [destino, setDestino] = useState('');

  // Modal calificacion
  const [modalCalificar, setModalCalificar] = useState(false);
  const [acompanamientoCalificar, setAcompanamientoCalificar] = useState(null);
  const [calificacion, setCalificacion] = useState(0);
  const [resena, setResena] = useState('');
  const [enviandoCalif, setEnviandoCalif] = useState(false);

  const mapRef = useRef(null);
  const intervaloRef = useRef(null);

  useEffect(() => {
    iniciar();
    intervaloRef.current = setInterval(cargarDatos, 8000);
    return () => clearInterval(intervaloRef.current);
  }, []);

  const iniciar = async () => {
    await obtenerUbicacion();
    await cargarDatos();
  };

  const obtenerUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicacion');
        setCargando(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUbicacion(loc.coords);
      await api.post('/acompanamientos/registrar-disponible', {
        latitud: loc.coords.latitude, longitud: loc.coords.longitude
      });
    } catch (err) {
      console.log('Error ubicacion:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarDatos = async () => {
    try {
      const [pendientes, mias, aceptaciones, disp] = await Promise.all([
        api.get('/acompanamientos/pendientes'),
        api.get('/acompanamientos/mis-solicitudes'),
        api.get('/acompanamientos/mis-aceptaciones'),
        api.get('/acompanamientos/disponibles'),
      ]);
      setSolicitudes(pendientes.data);
      setMisSolicitudes(mias.data);
      setMisAceptaciones(aceptaciones.data);
      setDisponibles(disp.data);

      const activoUsuaria = mias.data.find(s => ['aceptado', 'en_curso'].includes(s.estado));
      const activoAcompanante = aceptaciones.data.find(s => ['aceptado', 'en_curso'].includes(s.estado));

      if (activoUsuaria) {
        const detalle = await api.get(`/acompanamientos/${activoUsuaria._id}`);
        setAcompanamientoActivo(activoUsuaria);
        setDetalleActivo(detalle.data);
        setEsAcompanante(false);
      } else if (activoAcompanante) {
        const detalle = await api.get(`/acompanamientos/${activoAcompanante._id}`);
        setAcompanamientoActivo(activoAcompanante);
        setDetalleActivo(detalle.data);
        setEsAcompanante(true);
      } else {
        setAcompanamientoActivo(null);
        setDetalleActivo(null);
        setEsAcompanante(false);
      }
    } catch (err) {
      console.log('Error datos:', err);
    }
  };

  const refrescar = async () => {
    setRefrescando(true);
    await obtenerUbicacion();
    await cargarDatos();
    setRefrescando(false);
  };

  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
  };

  const activarPanico = async () => {
    setPanico(true);
    try {
      await api.post('/acompanamientos/solicitar', {
        latitud: ubicacion?.latitude,
        longitud: ubicacion?.longitude,
        descripcion: 'ALERTA DE PANICO - Necesito ayuda urgente',
        situacion_tipo: 'panico',
        destino: ''
      });
      Alert.alert(
        'Alerta enviada',
        'Tu solicitud de ayuda urgente fue enviada. Las acompanantes cercanas fueron notificadas.',
        [{ text: 'OK', onPress: () => setPanico(false) }]
      );
      cargarDatos();
      setTab('mis');
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar la alerta');
      setPanico(false);
    }
  };

  const solicitarAcompanamiento = async () => {
    if (!ubicacion) {
      Alert.alert('Sin ubicacion', 'Activa el GPS e intenta de nuevo');
      return;
    }
    if (!situacionTipo) {
      Alert.alert('Selecciona tu situacion', 'Por favor elige una opcion para que la acompanante sepa como ayudarte');
      return;
    }
    setEnviando(true);
    try {
      await api.post('/acompanamientos/solicitar', {
        latitud: ubicacion.latitude,
        longitud: ubicacion.longitude,
        descripcion,
        situacion_tipo: situacionTipo,
        destino,
      });
      Alert.alert('Solicitud enviada', 'Las acompanantes cercanas pueden ver tu peticion.');
      setDescripcion('');
      setDestino('');
      setSituacionTipo('');
      cargarDatos();
      setTab('mis');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo enviar');
    } finally {
      setEnviando(false);
    }
  };

  const aceptarSolicitud = async (sol) => {
    if (!ubicacion) return;
    const situacion = SITUACIONES.find(s => s.key === sol.situacion_tipo);
    Alert.alert(
      `Ayudar a ${sol.id_usuaria?.nombre_completo?.split(' ')[0] || 'esta sorori'}`,
      `${situacion ? situacion.label : ''}\n${sol.descripcion || ''}\n${sol.destino ? `Destino: ${sol.destino}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ir a ayudar',
          onPress: async () => {
            try {
              await api.put(`/acompanamientos/aceptar/${sol._id}`, {
                latitud: ubicacion.latitude, longitud: ubicacion.longitude
              });
              Alert.alert('Aceptado', 'Dirigete hacia ella.');
              cargarDatos();
              setTab('mis');
            } catch (err) {
              Alert.alert('Error', 'No se pudo aceptar');
            }
          }
        }
      ]
    );
  };

  const confirmarEncuentro = async (id, tipo) => {
    try {
      const ruta = tipo === 'acompanante'
        ? `/acompanamientos/confirmar-acompanante/${id}`
        : `/acompanamientos/confirmar-usuaria/${id}`;
      const res = await api.put(ruta);
      if (res.data.acompanamiento.estado === 'en_curso') {
        Alert.alert('Ya estan juntas', 'El recorrido ha comenzado.');
      } else {
        Alert.alert('Confirmado', 'Esperando que la otra tambien confirme...');
      }
      cargarDatos();
    } catch (err) {
      Alert.alert('Error', 'No se pudo confirmar');
    }
  };

  const confirmarLlegada = async (id, tipo) => {
    try {
      const ruta = tipo === 'acompanante'
        ? `/acompanamientos/llegada-acompanante/${id}`
        : `/acompanamientos/llegada-usuaria/${id}`;
      const res = await api.put(ruta);
      if (res.data.acompanamiento.estado === 'completado') {
        // Abrir modal de calificacion
        const ac = res.data.acompanamiento;
        setAcompanamientoCalificar(ac);
        setModalCalificar(true);
        cargarDatos();
      } else {
        Alert.alert('Confirmado', 'Esperando confirmacion de la otra...');
        cargarDatos();
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo confirmar llegada');
    }
  };

  const enviarCalificacion = async () => {
    if (calificacion === 0) {
      Alert.alert('Califica el recorrido', 'Por favor selecciona una calificacion');
      return;
    }
    setEnviandoCalif(true);
    try {
      await api.put(`/acompanamientos/calificar/${acompanamientoCalificar._id}`, {
        calificacion,
        resena,
        rol: esAcompanante ? 'acompanante' : 'usuaria'
      });
      Alert.alert('Gracias', 'Tu calificacion fue enviada.');
      setModalCalificar(false);
      setCalificacion(0);
      setResena('');
      cargarDatos();
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar la calificacion');
    } finally {
      setEnviandoCalif(false);
    }
  };

  const compartirRecorrido = async () => {
    if (!ubicacion) return;
    const url = `https://maps.google.com/?q=${ubicacion.latitude},${ubicacion.longitude}`;
    try {
      await Linking.openURL(`whatsapp://send?text=Estoy en un recorrido seguro con Sororitec. Mi ubicacion: ${url}`);
    } catch {
      Alert.alert('Sin WhatsApp', 'No se pudo abrir WhatsApp');
    }
  };

  const estadoColor = (estado) => ({
    pendiente: COLORES.alerta, aceptado: '#3B82F6',
    en_curso: COLORES.primario, completado: COLORES.exito, cancelado: COLORES.error,
  })[estado] || COLORES.textoSub;

  const estadoTexto = (estado) => ({
    pendiente: 'Buscando acompanante', aceptado: 'Yendo al encuentro',
    en_curso: 'En recorrido', completado: 'Completado', cancelado: 'Cancelado',
  })[estado] || estado;

  const markerOtra = () => {
    if (!detalleActivo) return null;
    if (esAcompanante) {
      const ub = detalleActivo.id_usuaria?.ubicacion_actual || detalleActivo.ubicacion_usuaria;
      if (ub?.latitud) return { ub, foto: detalleActivo.id_usuaria?.foto_perfil, nombre: detalleActivo.nombre_usuaria, color: COLORES.rosa };
    } else {
      const ub = detalleActivo.id_acompanante?.ubicacion_actual || detalleActivo.ubicacion_acompanante;
      if (ub?.latitud) return { ub, foto: detalleActivo.id_acompanante?.foto_perfil, nombre: detalleActivo.nombre_acompanante, color: COLORES.primario };
    }
    return null;
  };

  const otra = markerOtra();
  const sol = detalleActivo || acompanamientoActivo;
  const ubOtra = sol && (esAcompanante
    ? (sol.id_usuaria?.ubicacion_actual || sol.ubicacion_usuaria)
    : (sol.id_acompanante?.ubicacion_actual || sol.ubicacion_acompanante));
  const dist = calcularDistancia(ubicacion?.latitude, ubicacion?.longitude, ubOtra?.latitud, ubOtra?.longitud);
  const nombreOtra = sol && (esAcompanante ? sol.nombre_usuaria : sol.nombre_acompanante);
  const yaConfirme = sol && (esAcompanante ? sol.confirmacion_acompanante : sol.confirmacion_usuaria);
  const yaLlegue = sol && (esAcompanante ? sol.llegada_acompanante : sol.llegada_usuaria);
  const tipo = esAcompanante ? 'acompanante' : 'usuaria';

  return (
    <View style={styles.container}>

      {/* Modal calificacion */}
      <Modal visible={modalCalificar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Califica el recorrido</Text>
            <Text style={styles.modalSub}>
              {esAcompanante ? `Como fue acompanar a ${sol?.nombre_usuaria}?` : `Como fue tu acompanante ${sol?.nombre_acompanante}?`}
            </Text>

            <View style={styles.estrellas}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setCalificacion(n)}>
                  <Star
                    size={36}
                    color={n <= calificacion ? COLORES.alerta : COLORES.borde}
                    fill={n <= calificacion ? COLORES.alerta : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Escribe una resena (opcional)..."
              placeholderTextColor={COLORES.textoMuted}
              value={resena}
              onChangeText={setResena}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.modalCancelar}
                onPress={() => { setModalCalificar(false); setCalificacion(0); setResena(''); }}>
                <Text style={styles.modalCancelarTexto}>Omitir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmar}
                onPress={enviarCalificacion}
                disabled={enviandoCalif}>
                {enviandoCalif
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmarTexto}>Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={COLORES.texto} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MapPin size={16} color={COLORES.secundario} />
          <Text style={styles.headerTitulo}>GPS Sorori</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={refrescar}>
          <RefreshCw size={18} color={COLORES.texto} />
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <View style={styles.mapaContainer}>
        {cargando ? (
          <View style={styles.mapaLoading}>
            <ActivityIndicator color={COLORES.primario} size="large" />
            <Text style={styles.mapaLoadingTexto}>Obteniendo ubicacion...</Text>
          </View>
        ) : ubicacion ? (
          <MapView
            ref={mapRef}
            style={styles.mapa}
            initialRegion={{
              latitude: ubicacion.latitude,
              longitude: ubicacion.longitude,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
            customMapStyle={mapStyle}>
            <UrlTile
              urlTemplate="https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              maximumZ={19} flipY={false} tileSize={256}
            />

            {/* Mi ubicacion */}
            <Marker coordinate={{ latitude: ubicacion.latitude, longitude: ubicacion.longitude }}>
              <View style={styles.miMarker}>
                <View style={styles.miMarkerInner} />
              </View>
            </Marker>

            {/* Radio búsqueda */}
            {tab === 'solicitar' && (
              <Circle
                center={{ latitude: ubicacion.latitude, longitude: ubicacion.longitude }}
                radius={600}
                fillColor="rgba(124,58,237,0.07)"
                strokeColor="rgba(124,58,237,0.25)"
                strokeWidth={1}
              />
            )}

            {/* Acompanantes disponibles */}
            {tab === 'solicitar' && disponibles.map((d, i) =>
              d.ubicacion_actual?.latitud && (
                <Marker
                  key={`disp-${i}`}
                  coordinate={{ latitude: d.ubicacion_actual.latitud, longitude: d.ubicacion_actual.longitud }}
                  title={d.nombre_completo}>
                  <View style={styles.disponibleMarker}>
                    <View style={styles.disponibleDot} />
                  </View>
                </Marker>
              )
            )}

            {/* Solicitudes en mapa */}
            {tab === 'ayudar' && !acompanamientoActivo && solicitudes.map((s, i) =>
              s.ubicacion_usuaria?.latitud && (
                <Marker
                  key={`sol-${i}`}
                  coordinate={{ latitude: s.ubicacion_usuaria.latitud, longitude: s.ubicacion_usuaria.longitud }}
                  onPress={() => aceptarSolicitud(s)}>
                  <View style={styles.solicitudMarker}>
                    <AlertTriangle size={14} color="#fff" />
                  </View>
                </Marker>
              )
            )}

            {/* Otra persona en recorrido */}
            {otra && (
              <Marker coordinate={{ latitude: otra.ub.latitud, longitude: otra.ub.longitud }} title={otra.nombre}>
                <View style={[styles.otraMarker, { borderColor: otra.color }]}>
                  {otra.foto
                    ? <Image source={{ uri: otra.foto }} style={styles.otraMarkerImg} />
                    : <Users size={18} color={otra.color} />}
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={styles.mapaLoading}>
            <MapPin size={32} color={COLORES.borde} />
            <Text style={styles.mapaLoadingTexto}>Sin ubicacion disponible</Text>
          </View>
        )}

        {/* Boton panico SIEMPRE visible */}
        <TouchableOpacity
          style={[styles.botonPanico, panico && { opacity: 0.7 }]}
          onPress={() => {
            Alert.alert(
              'Alerta de panico',
              'Esto enviara una solicitud de ayuda URGENTE a todas las acompanantes cercanas. Confirmas?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Si, pedir ayuda urgente', style: 'destructive', onPress: activarPanico }
              ]
            );
          }}
          disabled={panico}>
          {panico
            ? <ActivityIndicator color="#fff" size="small" />
            : <Phone size={20} color="#fff" />}
        </TouchableOpacity>

        {/* Leyenda del mapa */}
        {tab === 'solicitar' && disponibles.length > 0 && (
          <View style={styles.leyenda}>
            <View style={styles.leyendaItem}>
              <View style={styles.disponibleDot} />
              <Text style={styles.leyendaTexto}>{disponibles.length} disponibles</Text>
            </View>
          </View>
        )}
      </View>

      {/* Panel activo */}
      {acompanamientoActivo && (
        <View style={styles.panelActivo}>
          <View style={styles.panelActivoHeader}>
            <View style={[styles.panelEstadoDot, { backgroundColor: estadoColor(sol.estado) }]} />
            <Text style={styles.panelActivoTitulo}>
              {sol.estado === 'aceptado' ? 'Yendo al encuentro' : 'Recorrido en curso'}
            </Text>
            <View style={[styles.estadoChip, { backgroundColor: estadoColor(sol.estado) + '20' }]}>
              <Text style={[styles.estadoChipTexto, { color: estadoColor(sol.estado) }]}>
                {estadoTexto(sol.estado)}
              </Text>
            </View>
          </View>

          <View style={styles.panelActivoInfo}>
            <View style={styles.panelActivoUsuaria}>
              <View style={styles.panelActivoAvatar}>
                {esAcompanante
                  ? <Shield size={16} color={COLORES.rosa} />
                  : <UserCheck size={16} color={COLORES.secundario} />}
              </View>
              <View>
                <Text style={styles.panelActivoLabel}>{esAcompanante ? 'Ayudando a' : 'Tu acompanante'}</Text>
                <Text style={styles.panelActivoNombre}>{nombreOtra}</Text>
              </View>
            </View>
            {dist && (
              <View style={styles.distanciaChip}>
                <Navigation size={12} color={COLORES.acento} />
                <Text style={styles.distanciaTexto}>{dist}</Text>
              </View>
            )}
          </View>

          {sol.destino ? (
            <View style={styles.destinoRow}>
              <MapPin size={12} color={COLORES.textoMuted} />
              <Text style={styles.destinoTexto}>Destino: {sol.destino}</Text>
            </View>
          ) : null}

          <View style={styles.panelAcciones}>
            {sol.estado === 'aceptado' && (
              !yaConfirme ? (
                <TouchableOpacity style={styles.botonConfirmar} onPress={() => confirmarEncuentro(sol._id, tipo)}>
                  <CheckCircle size={15} color="#fff" />
                  <Text style={styles.botonTexto}>Ya estamos juntas</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.esperandoRow}>
                  <Clock size={13} color={COLORES.textoSub} />
                  <Text style={styles.esperandoTexto}>Esperando confirmacion...</Text>
                </View>
              )
            )}

            {sol.estado === 'en_curso' && (
              <View style={styles.accionesEnCurso}>
                <TouchableOpacity style={styles.botonCompartir} onPress={compartirRecorrido}>
                  <Share2 size={15} color={COLORES.primario} />
                  <Text style={[styles.botonTexto, { color: COLORES.primario }]}>Compartir</Text>
                </TouchableOpacity>
                {!yaLlegue ? (
                  <TouchableOpacity style={styles.botonLlegada} onPress={() => confirmarLlegada(sol._id, tipo)}>
                    <Flag size={15} color="#fff" />
                    <Text style={styles.botonTexto}>Llegamos</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.esperandoRow}>
                    <Clock size={13} color={COLORES.textoSub} />
                    <Text style={styles.esperandoTexto}>Esperando...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map(({ key, label, Icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActivo]}
            onPress={() => setTab(key)}>
            <Icon size={15} color={tab === key ? COLORES.primario : COLORES.textoMuted} />
            <Text style={[styles.tabTexto, tab === key && styles.tabTextoActivo]}>
              {key === 'ayudar' && solicitudes.length > 0 ? `${label} (${solicitudes.length})` : label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido */}
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[COLORES.primario]} tintColor={COLORES.primario} />
        }>

        {/* PEDIR AYUDA */}
        {tab === 'solicitar' && (
          <View style={styles.seccion}>
            {disponibles.length > 0 ? (
              <View style={styles.disponiblesInfo}>
                <View style={styles.disponibleDot} />
                <Text style={styles.disponiblesTexto}>
                  {disponibles.length} acompanante{disponibles.length > 1 ? 's' : ''} disponible{disponibles.length > 1 ? 's' : ''} cerca de ti
                </Text>
              </View>
            ) : (
              <View style={[styles.disponiblesInfo, { borderColor: COLORES.alerta + '40', backgroundColor: COLORES.alerta + '10' }]}>
                <AlertCircle size={14} color={COLORES.alerta} />
                <Text style={[styles.disponiblesTexto, { color: COLORES.alerta }]}>
                  Sin acompanantes disponibles en este momento
                </Text>
              </View>
            )}

            <Text style={styles.seccionLabel}>Cual es tu situacion?</Text>
            <View style={styles.situacionesGrid}>
              {SITUACIONES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.situacionChip, situacionTipo === s.key && styles.situacionChipActivo]}
                  onPress={() => setSituacionTipo(s.key)}>
                  <s.Icon size={16} color={situacionTipo === s.key ? '#fff' : COLORES.textoSub} />
                  <Text style={[styles.situacionTexto, situacionTipo === s.key && styles.situacionTextoActivo]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.seccionLabel}>Destino (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="A donde necesitas llegar..."
              placeholderTextColor={COLORES.textoMuted}
              value={destino}
              onChangeText={setDestino}
            />

            <Text style={styles.seccionLabel}>Descripcion adicional (opcional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 70 }]}
              placeholder="Agrega mas detalles si quieres..."
              placeholderTextColor={COLORES.textoMuted}
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.botonSolicitar, (enviando || !situacionTipo) && { opacity: 0.6 }]}
              onPress={solicitarAcompanamiento}
              disabled={enviando || !situacionTipo}>
              {enviando
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Shield size={18} color="#fff" />
                    <Text style={styles.botonSolicitarTexto}>Solicitar acompanamiento</Text>
                  </>}
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <CheckCircle size={13} color={COLORES.exito} />
                <Text style={styles.infoTexto}>Ubicacion compartida</Text>
              </View>
              <View style={styles.infoItem}>
                <Shield size={13} color={COLORES.exito} />
                <Text style={styles.infoTexto}>100% confidencial</Text>
              </View>
            </View>
          </View>
        )}

        {/* AYUDAR */}
        {tab === 'ayudar' && (
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Users size={18} color={COLORES.primario} />
              <Text style={styles.seccionTitulo}>
                {solicitudes.length > 0 ? `${solicitudes.length} solicitudes cercanas` : 'Sin solicitudes activas'}
              </Text>
            </View>

            {solicitudes.length === 0 ? (
              <View style={styles.vacio}>
                <View style={styles.vacioIcono}>
                  <Users size={28} color={COLORES.textoMuted} />
                </View>
                <Text style={styles.vacioTexto}>Todo tranquilo por ahora</Text>
                <Text style={styles.vacioSub}>Las solicitudes de ayuda apareceran aqui</Text>
              </View>
            ) : (
              solicitudes.map((s, i) => {
                const situacion = SITUACIONES.find(sit => sit.key === s.situacion_tipo);
                const distancia = calcularDistancia(
                  ubicacion?.latitude, ubicacion?.longitude,
                  s.ubicacion_usuaria?.latitud, s.ubicacion_usuaria?.longitud
                );
                return (
                  <View key={i} style={styles.solicitudCard}>
                    <View style={styles.solicitudCardHeader}>
                      <View style={styles.solicitudAvatar}>
                        {s.id_usuaria?.foto_perfil
                          ? <Image source={{ uri: s.id_usuaria.foto_perfil }} style={styles.solicitudAvatarImg} />
                          : <Users size={20} color={COLORES.textoSub} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.solicitudNombre}>{s.id_usuaria?.nombre_completo || 'Sorori'}</Text>
                        <Text style={styles.solicitudHora}>
                          {new Date(s.fecha_solicitud).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      {distancia && (
                        <View style={styles.distanciaChip}>
                          <Navigation size={11} color={COLORES.acento} />
                          <Text style={styles.distanciaTexto}>{distancia}</Text>
                        </View>
                      )}
                    </View>

                    {situacion && (
                      <View style={styles.situacionTag}>
                        <situacion.Icon size={12} color={COLORES.secundario} />
                        <Text style={styles.situacionTagTexto}>{situacion.label}</Text>
                      </View>
                    )}

                    {s.destino ? (
                      <View style={styles.destinoRow}>
                        <MapPin size={11} color={COLORES.textoMuted} />
                        <Text style={styles.destinoTexto}>Destino: {s.destino}</Text>
                      </View>
                    ) : null}

                    {s.descripcion ? (
                      <Text style={styles.solicitudDesc}>{s.descripcion}</Text>
                    ) : null}

                    <TouchableOpacity style={styles.botonAceptar} onPress={() => aceptarSolicitud(s)}>
                      <UserCheck size={15} color="#fff" />
                      <Text style={styles.botonTexto}>Ir a ayudar</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* HISTORIAL */}
        {tab === 'mis' && (
          <View style={styles.seccion}>
            {misAceptaciones.length > 0 && (
              <>
                <Text style={styles.subTitulo}>Como acompanante</Text>
                {misAceptaciones.map((s, i) => (
                  <View key={`ac-${i}`} style={[styles.historialCard, ['aceptado', 'en_curso'].includes(s.estado) && styles.historialCardActivo]}>
                    <View style={styles.historialTop}>
                      <View style={styles.solicitudAvatar}>
                        {s.id_usuaria?.foto_perfil
                          ? <Image source={{ uri: s.id_usuaria.foto_perfil }} style={styles.solicitudAvatarImg} />
                          : <Users size={18} color={COLORES.textoSub} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.solicitudNombre}>{s.nombre_usuaria || 'Sorori'}</Text>
                        <Text style={styles.solicitudHora}>
                          {new Date(s.fecha_solicitud).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <View style={[styles.estadoChip, { backgroundColor: estadoColor(s.estado) + '20' }]}>
                        <Text style={[styles.estadoChipTexto, { color: estadoColor(s.estado) }]}>{estadoTexto(s.estado)}</Text>
                      </View>
                    </View>
                    {s.estado === 'completado' && s.calificacion_a_acompanante && (
                      <View style={styles.calificacionRow}>
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={14} color={n <= s.calificacion_a_acompanante ? COLORES.alerta : COLORES.borde} fill={n <= s.calificacion_a_acompanante ? COLORES.alerta : 'transparent'} />
                        ))}
                        <Text style={styles.calificacionTexto}>{s.calificacion_a_acompanante}/5</Text>
                      </View>
                    )}
                    {s.estado === 'aceptado' && !s.confirmacion_acompanante && (
                      <TouchableOpacity style={styles.botonConfirmar} onPress={() => confirmarEncuentro(s._id, 'acompanante')}>
                        <CheckCircle size={15} color="#fff" />
                        <Text style={styles.botonTexto}>Ya estamos juntas</Text>
                      </TouchableOpacity>
                    )}
                    {s.estado === 'en_curso' && !s.llegada_acompanante && (
                      <TouchableOpacity style={styles.botonLlegada} onPress={() => confirmarLlegada(s._id, 'acompanante')}>
                        <Flag size={15} color="#fff" />
                        <Text style={styles.botonTexto}>Confirmar llegada</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </>
            )}

            <Text style={styles.subTitulo}>Mis peticiones</Text>
            {misSolicitudes.length === 0 ? (
              <View style={styles.vacio}>
                <View style={styles.vacioIcono}>
                  <Clock size={28} color={COLORES.textoMuted} />
                </View>
                <Text style={styles.vacioTexto}>Sin solicitudes aun</Text>
              </View>
            ) : (
              misSolicitudes.map((s, i) => {
                const situacion = SITUACIONES.find(sit => sit.key === s.situacion_tipo);
                return (
                  <View key={`sol-${i}`} style={[styles.historialCard, ['aceptado', 'en_curso'].includes(s.estado) && styles.historialCardActivo]}>
                    <View style={styles.historialTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.solicitudNombre}>Solicitud {misSolicitudes.length - i}</Text>
                        <Text style={styles.solicitudHora}>
                          {new Date(s.fecha_solicitud).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <View style={[styles.estadoChip, { backgroundColor: estadoColor(s.estado) + '20' }]}>
                        <Text style={[styles.estadoChipTexto, { color: estadoColor(s.estado) }]}>{estadoTexto(s.estado)}</Text>
                      </View>
                    </View>

                    {situacion && (
                      <View style={styles.situacionTag}>
                        <situacion.Icon size={12} color={COLORES.secundario} />
                        <Text style={styles.situacionTagTexto}>{situacion.label}</Text>
                      </View>
                    )}

                    {s.nombre_acompanante && (
                      <Text style={styles.solicitudDesc}>Acompanante: {s.nombre_acompanante}</Text>
                    )}

                    {s.estado === 'completado' && s.calificacion_a_usuaria && (
                      <View style={styles.calificacionRow}>
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={14} color={n <= s.calificacion_a_usuaria ? COLORES.alerta : COLORES.borde} fill={n <= s.calificacion_a_usuaria ? COLORES.alerta : 'transparent'} />
                        ))}
                        <Text style={styles.calificacionTexto}>{s.calificacion_a_usuaria}/5</Text>
                      </View>
                    )}

                    {s.estado === 'aceptado' && !s.confirmacion_usuaria && (
                      <TouchableOpacity style={styles.botonConfirmar} onPress={() => confirmarEncuentro(s._id, 'usuaria')}>
                        <CheckCircle size={15} color="#fff" />
                        <Text style={styles.botonTexto}>Ya estamos juntas</Text>
                      </TouchableOpacity>
                    )}
                    {s.estado === 'en_curso' && !s.llegada_usuaria && (
                      <TouchableOpacity style={styles.botonLlegada} onPress={() => confirmarLlegada(s._id, 'usuaria')}>
                        <Flag size={15} color="#fff" />
                        <Text style={styles.botonTexto}>Confirmar llegada</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0D0B1A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9B94C4' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D0B1A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E1A35' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2E2850' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2D1B69' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#16122A' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondo },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 54, paddingBottom: 14,
    backgroundColor: COLORES.superficie, borderBottomWidth: 1, borderBottomColor: COLORES.borde,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORES.superficie2, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitulo: { color: COLORES.texto, fontSize: 17, fontWeight: '700' },

  mapaContainer: { height: height * 0.27, borderBottomWidth: 1, borderBottomColor: COLORES.borde },
  mapa: { flex: 1 },
  mapaLoading: { flex: 1, backgroundColor: COLORES.superficie, justifyContent: 'center', alignItems: 'center', gap: 12 },
  mapaLoadingTexto: { color: COLORES.textoSub, fontSize: 13 },

  miMarker: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORES.primario + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORES.primario },
  miMarkerInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORES.primario },
  disponibleMarker: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORES.exito + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORES.exito },
  disponibleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.exito },
  otraMarker: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORES.superficie, alignItems: 'center', justifyContent: 'center', borderWidth: 2, overflow: 'hidden' },
  otraMarkerImg: { width: 42, height: 42, borderRadius: 21 },
  solicitudMarker: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORES.error, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },

  botonPanico: {
    position: 'absolute', bottom: 14, right: 14,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORES.error,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: COLORES.error,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 8,
    borderWidth: 2, borderColor: '#fff',
  },

  leyenda: { position: 'absolute', bottom: 14, left: 14, backgroundColor: 'rgba(13,11,26,0.85)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORES.borde },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaTexto: { color: COLORES.exito, fontSize: 11, fontWeight: '600' },

  panelActivo: { backgroundColor: COLORES.superficie3, marginHorizontal: 14, marginTop: 10, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORES.primario + '40' },
  panelActivoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  panelEstadoDot: { width: 8, height: 8, borderRadius: 4 },
  panelActivoTitulo: { color: COLORES.texto, fontWeight: '700', fontSize: 13, flex: 1 },
  panelActivoInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  panelActivoUsuaria: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelActivoAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORES.superficie2, alignItems: 'center', justifyContent: 'center' },
  panelActivoLabel: { color: COLORES.textoMuted, fontSize: 11 },
  panelActivoNombre: { color: COLORES.texto, fontWeight: '600', fontSize: 13 },
  panelAcciones: { gap: 8 },
  accionesEnCurso: { flexDirection: 'row', gap: 8 },

  tabsContainer: { flexDirection: 'row', backgroundColor: COLORES.superficie, borderTopWidth: 1, borderTopColor: COLORES.borde, borderBottomWidth: 1, borderBottomColor: COLORES.borde, marginTop: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActivo: { borderBottomColor: COLORES.primario },
  tabTexto: { color: COLORES.textoMuted, fontSize: 11, fontWeight: '500' },
  tabTextoActivo: { color: COLORES.primario, fontWeight: '700' },

  scroll: { flex: 1 },
  seccion: { padding: 16 },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  seccionTitulo: { color: COLORES.texto, fontSize: 15, fontWeight: '700' },
  seccionLabel: { color: COLORES.textoSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10, marginTop: 14 },
  subTitulo: { color: COLORES.secundario, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },

  disponiblesInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORES.exito + '10', borderRadius: 10,
    padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: COLORES.exito + '30',
  },
  disponiblesTexto: { color: COLORES.exito, fontSize: 13, fontWeight: '500' },

  situacionesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  situacionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORES.superficie, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORES.borde,
    width: (width - 48) / 2,
  },
  situacionChipActivo: { backgroundColor: COLORES.primario, borderColor: COLORES.primario },
  situacionTexto: { color: COLORES.textoSub, fontSize: 12, flex: 1 },
  situacionTextoActivo: { color: '#fff', fontWeight: '600' },

  input: {
    backgroundColor: COLORES.superficie, borderRadius: 12,
    padding: 14, color: COLORES.texto, fontSize: 14,
    borderWidth: 1, borderColor: COLORES.borde, marginBottom: 4,
  },

  botonSolicitar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: COLORES.primario,
    padding: 16, borderRadius: 14, marginTop: 16, marginBottom: 12,
  },
  botonSolicitarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },

  infoRow: { flexDirection: 'row', gap: 16, backgroundColor: COLORES.superficie, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORES.borde },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoTexto: { color: COLORES.textoSub, fontSize: 12 },

  solicitudCard: { backgroundColor: COLORES.superficie, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORES.borde },
  solicitudCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  solicitudAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORES.superficie2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde },
  solicitudAvatarImg: { width: 42, height: 42, borderRadius: 21 },
  solicitudNombre: { color: COLORES.texto, fontWeight: '600', fontSize: 14 },
  solicitudHora: { color: COLORES.textoMuted, fontSize: 11, marginTop: 2 },
  solicitudDesc: { color: COLORES.textoSub, fontSize: 13, fontStyle: 'italic', marginBottom: 10 },

  situacionTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORES.superficie3, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 8 },
  situacionTagTexto: { color: COLORES.secundario, fontSize: 11, fontWeight: '600' },

  destinoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  destinoTexto: { color: COLORES.textoSub, fontSize: 12 },

  historialCard: { backgroundColor: COLORES.superficie, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORES.borde },
  historialCardActivo: { borderColor: COLORES.primario + '50' },
  historialTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },

  estadoChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  estadoChipTexto: { fontSize: 10, fontWeight: '700' },

  distanciaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORES.superficie3, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: COLORES.borde },
  distanciaTexto: { color: COLORES.acento, fontSize: 12, fontWeight: '600' },

  calificacionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  calificacionTexto: { color: COLORES.alerta, fontSize: 12, fontWeight: '600', marginLeft: 4 },

  botonAceptar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORES.exito, padding: 11, borderRadius: 10 },
  botonConfirmar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3B82F6', padding: 11, borderRadius: 10 },
  botonCompartir: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORES.superficie2, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: COLORES.primario },
  botonLlegada: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORES.exito, padding: 11, borderRadius: 10 },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },

  esperandoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', padding: 8 },
  esperandoTexto: { color: COLORES.textoSub, fontSize: 12, fontStyle: 'italic' },

  vacio: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  vacioIcono: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORES.superficie, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  vacioTexto: { color: COLORES.texto, fontSize: 15, fontWeight: '600' },
  vacioSub: { color: COLORES.textoSub, fontSize: 13, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: COLORES.superficie, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORES.borde },
  modalTitulo: { color: COLORES.texto, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  modalSub: { color: COLORES.textoSub, fontSize: 13, textAlign: 'center', marginBottom: 20 },
  estrellas: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  modalInput: { backgroundColor: COLORES.fondo, borderRadius: 12, padding: 12, color: COLORES.texto, fontSize: 14, minHeight: 80, borderWidth: 1, borderColor: COLORES.borde, marginBottom: 20, textAlignVertical: 'top' },
  modalBotones: { flexDirection: 'row', gap: 10 },
  modalCancelar: { flex: 1, backgroundColor: COLORES.superficie2, padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORES.borde },
  modalCancelarTexto: { color: COLORES.textoSub, fontWeight: '600' },
  modalConfirmar: { flex: 1, backgroundColor: COLORES.primario, padding: 14, borderRadius: 10, alignItems: 'center' },
  modalConfirmarTexto: { color: '#fff', fontWeight: '700' },
});
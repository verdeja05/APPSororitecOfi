import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
  TextInput, Linking, RefreshControl, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../services/api';

export default function GPSScreen({ navigation }) {
  const [ubicacion, setUbicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [misAceptaciones, setMisAceptaciones] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [tab, setTab] = useState('solicitar');
  const [acompanamientoActivo, setAcompanamientoActivo] = useState(null);
  const [detalleActivo, setDetalleActivo] = useState(null);
  const [esAcompanante, setEsAcompanante] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const mapRef = useRef(null);
  const intervaloRef = useRef(null);

  useEffect(() => {
    iniciar();
    intervaloRef.current = setInterval(() => {
      cargarDatos();
    }, 8000);
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
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación');
        setCargando(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      setUbicacion(loc.coords);
      await api.post('/acompanamientos/registrar-disponible', {
        latitud: loc.coords.latitude,
        longitud: loc.coords.longitude
      });
    } catch (err) {
      console.log('Error ubicación:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarDatos = async () => {
    try {
      const [pendientes, mias, aceptaciones] = await Promise.all([
        api.get('/acompanamientos/pendientes'),
        api.get('/acompanamientos/mis-solicitudes'),
        api.get('/acompanamientos/mis-aceptaciones'),
      ]);

      setSolicitudes(pendientes.data);
      setMisSolicitudes(mias.data);
      setMisAceptaciones(aceptaciones.data);

      // Buscar activo como usuaria
      const activoUsuaria = mias.data.find(s => ['aceptado', 'en_curso'].includes(s.estado));

      // Buscar activo como acompañante
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
      console.log('Error cargando datos:', err);
    }
  };

  const refrescar = async () => {
    setRefrescando(true);
    await obtenerUbicacion();
    await cargarDatos();
    setRefrescando(false);
  };

  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return '?';
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
  };

  const solicitarAcompanamiento = async () => {
    if (!ubicacion) {
      Alert.alert('Sin ubicación', 'Activa el GPS e intenta de nuevo');
      return;
    }
    Alert.alert(
      ' Solicitar acompañamiento',
      '¿Quieres enviar una solicitud a las acompañantes cercanas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, pedir ayuda',
          onPress: async () => {
            setEnviando(true);
            try {
              await api.post('/acompanamientos/solicitar', {
                latitud: ubicacion.latitude,
                longitud: ubicacion.longitude,
                descripcion
              });
              Alert.alert(' ¡Solicitud enviada!', 'Las acompañantes cercanas pueden ver tu petición');
              setDescripcion('');
              cargarDatos();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.mensaje || 'No se pudo enviar');
            } finally {
              setEnviando(false);
            }
          }
        }
      ]
    );
  };

  const aceptarSolicitud = async (sol) => {
    if (!ubicacion) return;
    Alert.alert(
      ' Ayudar a ' + (sol.id_usuaria?.nombre_completo?.split(' ')[0] || 'esta sorori'),
      `📝 ${sol.descripcion || 'Solicita acompañamiento'}\n\n¿Confirmas que vas a ayudarla?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: ' Sí, voy a ayudar',
          onPress: async () => {
            try {
              await api.put(`/acompanamientos/aceptar/${sol._id}`, {
                latitud: ubicacion.latitude,
                longitud: ubicacion.longitude
              });
              Alert.alert(' ¡Aceptado!', 'Dirígete hacia ella. Cuando se encuentren, ambas confirman.');
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
        Alert.alert(' ¡Ya están juntas!', '¡El recorrido ha comenzado! ¡Cuídense mucho!');
      } else {
        Alert.alert(' Confirmado', 'Esperando que la otra también confirme...');
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
        Alert.alert(' ¡Llegaron!', '¡Recorrido completado! ¡Gracias por usar Sororitec! ');
      } else {
        Alert.alert(' Confirmado', 'Esperando que la otra confirme la llegada...');
      }
      cargarDatos();
    } catch (err) {
      Alert.alert('Error', 'No se pudo confirmar llegada');
    }
  };

  const compartirRecorrido = async () => {
    try {
      const lat = ubicacion?.latitude;
      const lon = ubicacion?.longitude;
      const url = `https://maps.google.com/?q=${lat},${lon}`;
      await Linking.openURL(`whatsapp://send?text=Estoy en un recorrido seguro con Sororitec 💜 Mi ubicación en tiempo real: ${url}`);
    } catch {
      Alert.alert('Sin WhatsApp', 'No se pudo abrir WhatsApp');
    }
  };

  const estadoColor = (estado) => ({
    pendiente: '#FFA500',
    aceptado: '#2196F3',
    en_curso: '#7C3AED',
    completado: '#4CAF50',
    cancelado: '#f44336'
  })[estado] || '#666';

  const estadoTexto = (estado) => ({
    pendiente: ' Buscando acompañante',
    aceptado: ' Yendo al encuentro',
    en_curso: ' En recorrido',
    completado: ' Completado',
    cancelado: ' Cancelado'
  })[estado] || estado;

  // Marcador con foto de perfil
  const MarkerFoto = ({ foto, emoji, color }) => (
    <View style={[styles.markerFoto, { borderColor: color }]}>
      {foto ? (
        <Image source={{ uri: foto }} style={styles.markerImagen} />
      ) : (
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      )}
    </View>
  );

  const renderPanelActivo = () => {
    if (!acompanamientoActivo) return null;
    const sol = detalleActivo || acompanamientoActivo;
    const ubOtra = esAcompanante
      ? (sol.id_usuaria?.ubicacion_actual || sol.ubicacion_usuaria)
      : (sol.id_acompanante?.ubicacion_actual || sol.ubicacion_acompanante);
    const nombreOtra = esAcompanante
      ? (sol.nombre_usuaria || sol.id_usuaria?.nombre_completo)
      : (sol.nombre_acompanante || sol.id_acompanante?.nombre_completo);
    const yaConfirme = esAcompanante ? sol.confirmacion_acompanante : sol.confirmacion_usuaria;
    const yaLlegue = esAcompanante ? sol.llegada_acompanante : sol.llegada_usuaria;
    const tipoConfirmacion = esAcompanante ? 'acompanante' : 'usuaria';

    return (
      <View style={styles.panelActivo}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitulo}>
            {sol.estado === 'aceptado' ? ' Yendo al encuentro' : ' Recorrido en curso'}
          </Text>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor(sol.estado) }]}>
            <Text style={styles.estadoBadgeTexto}>{estadoTexto(sol.estado)}</Text>
          </View>
        </View>

        <Text style={styles.panelInfo}>
          {esAcompanante ? ' Ayudando a: ' : ' Acompañante: '}{nombreOtra}
        </Text>

        {ubOtra?.latitud && ubicacion && (
          <Text style={styles.panelDistancia}>
             Distancia entre ustedes: {calcularDistancia(
              ubicacion.latitude, ubicacion.longitude,
              ubOtra.latitud, ubOtra.longitud
            )}
          </Text>
        )}

        {sol.estado === 'aceptado' && (
          <View style={styles.panelBotones}>
            <Text style={styles.panelSubtitulo}>
              Cuando se encuentren, ambas deben confirmar 
            </Text>
            {!yaConfirme ? (
              <TouchableOpacity
                style={styles.botonConfirmar}
                onPress={() => confirmarEncuentro(sol._id, tipoConfirmacion)}>
                <Text style={styles.botonTexto}> Ya estamos juntas</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.esperando}> Esperando confirmación de la otra...</Text>
            )}
          </View>
        )}

        {sol.estado === 'en_curso' && (
          <View style={styles.panelBotones}>
            <TouchableOpacity style={styles.botonCompartir} onPress={compartirRecorrido}>
              <Text style={styles.botonTexto}> Compartir recorrido por WhatsApp</Text>
            </TouchableOpacity>
            {!yaLlegue ? (
              <TouchableOpacity
                style={styles.botonLlegada}
                onPress={() => confirmarLlegada(sol._id, tipoConfirmacion)}>
                <Text style={styles.botonTexto}> Confirmar llegada</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.esperando}> Esperando confirmación de la otra...</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Obtener marcadores para el mapa según estado activo
  const getMarkerOtra = () => {
    if (!detalleActivo) return null;
    const sol = detalleActivo;
    if (esAcompanante) {
      const ub = sol.id_usuaria?.ubicacion_actual || sol.ubicacion_usuaria;
      const foto = sol.id_usuaria?.foto_perfil;
      if (ub?.latitud) return { ub, foto, nombre: sol.nombre_usuaria, color: '#FF69B4' };
    } else {
      const ub = sol.id_acompanante?.ubicacion_actual || sol.ubicacion_acompanante;
      const foto = sol.id_acompanante?.foto_perfil;
      if (ub?.latitud) return { ub, foto, nombre: sol.nombre_acompanante, color: '#7C3AED' };
    }
    return null;
  };

  const markerOtra = getMarkerOtra();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}> GPS Sorori</Text>
        <TouchableOpacity onPress={refrescar}>
          <Text style={styles.refrescarBtn}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <View style={styles.mapaContainer}>
        {cargando ? (
          <View style={styles.mapaLoading}>
            <ActivityIndicator color="#7C3AED" />
            <Text style={{ color: '#aaa', marginTop: 8 }}>Obteniendo ubicación...</Text>
          </View>
        ) : ubicacion ? (
          <MapView
            ref={mapRef}
            style={styles.mapa}
            initialRegion={{
              latitude: ubicacion.latitude,
              longitude: ubicacion.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}>
            <UrlTile
              urlTemplate="https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              tileSize={256}
            />

            {/* Mi marcador */}
            <Marker
              coordinate={{ latitude: ubicacion.latitude, longitude: ubicacion.longitude }}
              title="Tú estás aquí">
              <View style={styles.miMarker}>
                <View style={styles.miMarkerPunto} />
              </View>
            </Marker>

            {/* Marcador de la otra persona en recorrido activo */}
            {markerOtra && (
              <Marker
                coordinate={{
                  latitude: markerOtra.ub.latitud,
                  longitude: markerOtra.ub.longitud,
                }}
                title={markerOtra.nombre || 'Sorori'}>
                <MarkerFoto
                  foto={markerOtra.foto}
                  emoji={esAcompanante ? '🌸' : '💜'}
                  color={markerOtra.color}
                />
              </Marker>
            )}

            {/* Solicitudes en el mapa (tab ayudar) */}
            {tab === 'ayudar' && !acompanamientoActivo && solicitudes.map((sol, i) =>
              sol.ubicacion_usuaria?.latitud && (
                <Marker
                  key={i}
                  coordinate={{
                    latitude: sol.ubicacion_usuaria.latitud,
                    longitude: sol.ubicacion_usuaria.longitud,
                  }}
                  title={sol.id_usuaria?.nombre_completo || 'Sorori'}
                  onPress={() => aceptarSolicitud(sol)}>
                  <MarkerFoto
                    foto={sol.id_usuaria?.foto_perfil}
                    emoji=""
                    color="#FF69B4"
                  />
                </Marker>
              )
            )}
          </MapView>
        ) : (
          <View style={styles.mapaLoading}>
            <Text style={{ color: '#aaa' }}>Sin ubicación</Text>
          </View>
        )}
      </View>

      {/* Panel activo */}
      {renderPanelActivo()}

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'solicitar', label: ' Pedir ayuda' },
          { key: 'ayudar', label: ` Ayudar (${solicitudes.length})` },
          { key: 'mis', label: ' Mis solicitudes' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActivo]}
            onPress={() => setTab(t.key)}>
            <Text style={[styles.tabTexto, tab === t.key && styles.tabTextoActivo]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }>

        {/* TAB: Pedir ayuda */}
        {tab === 'solicitar' && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>¿Necesitas una acompañante? </Text>
            <Text style={styles.seccionSub}>
              Una sorori cercana irá a acompañarte. Tu ubicación se compartirá con ella.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Describe tu situación (opcional)..."
              placeholderTextColor="#555"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              numberOfLines={2}
            />
            <TouchableOpacity
              style={styles.botonSolicitar}
              onPress={solicitarAcompanamiento}
              disabled={enviando}>
              {enviando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.botonTexto}>Solicitar acompañamiento</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* TAB: Ayudar */}
        {tab === 'ayudar' && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Solicitudes cercanas </Text>
            {solicitudes.length === 0 ? (
              <View style={styles.vacio}>
                <Text style={styles.vacioEmoji}></Text>
                <Text style={styles.vacioTexto}>No hay solicitudes pendientes</Text>
                <Text style={styles.vacioSub}>¡Todo está tranquilo por ahora!</Text>
              </View>
            ) : (
              solicitudes.map((sol, i) => {
                const dist = calcularDistancia(
                  ubicacion?.latitude, ubicacion?.longitude,
                  sol.ubicacion_usuaria?.latitud, sol.ubicacion_usuaria?.longitud
                );
                return (
                  <View key={i} style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardAvatar}>
                        {sol.id_usuaria?.foto_perfil ? (
                          <Image
                            source={{ uri: sol.id_usuaria.foto_perfil }}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                          />
                        ) : (
                          <Text style={{ fontSize: 22 }}></Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardNombre}>
                          {sol.id_usuaria?.nombre_completo || 'Sorori'}
                        </Text>
                        <Text style={styles.cardHora}>
                          {new Date(sol.fecha_solicitud).toLocaleTimeString('es-MX', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </Text>
                      </View>
                      <Text style={styles.cardDist}> {dist}</Text>
                    </View>
                    {sol.descripcion && (
                      <Text style={styles.cardDesc}>"{sol.descripcion}"</Text>
                    )}
                    <TouchableOpacity
                      style={styles.botonAceptar}
                      onPress={() => aceptarSolicitud(sol)}>
                      <Text style={styles.botonTexto}> Ir a ayudar</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB: Mis solicitudes */}
        {tab === 'mis' && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Mis solicitudes</Text>

            {/* Como acompañante */}
            {misAceptaciones.length > 0 && (
              <>
                <Text style={styles.seccionSubtitulo}>Como acompañante </Text>
                {misAceptaciones.map((sol, i) => (
                  <View key={`ac-${i}`} style={[styles.card, ['aceptado', 'en_curso'].includes(sol.estado) && styles.cardActivo]}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardAvatar}>
                        {sol.id_usuaria?.foto_perfil ? (
                          <Image
                            source={{ uri: sol.id_usuaria.foto_perfil }}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                          />
                        ) : (
                          <Text style={{ fontSize: 22 }}></Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardNombre}>
                          {sol.nombre_usuaria || sol.id_usuaria?.nombre_completo || 'Sorori'}
                        </Text>
                        <Text style={styles.cardHora}>
                          {new Date(sol.fecha_solicitud).toLocaleString('es-MX', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </Text>
                      </View>
                      <View style={[styles.estadoBadge, { backgroundColor: estadoColor(sol.estado) }]}>
                        <Text style={styles.estadoBadgeTexto}>{estadoTexto(sol.estado)}</Text>
                      </View>
                    </View>
                    {sol.descripcion && <Text style={styles.cardDesc}>"{sol.descripcion}"</Text>}

                    {sol.estado === 'aceptado' && !sol.confirmacion_acompanante && (
                      <TouchableOpacity
                        style={styles.botonConfirmar}
                        onPress={() => confirmarEncuentro(sol._id, 'acompanante')}>
                        <Text style={styles.botonTexto}> Ya estamos juntas</Text>
                      </TouchableOpacity>
                    )}
                    {sol.estado === 'aceptado' && sol.confirmacion_acompanante && (
                      <Text style={styles.esperando}> Esperando confirmación de ella...</Text>
                    )}
                    {sol.estado === 'en_curso' && (
                      <>
                        <TouchableOpacity style={styles.botonCompartir} onPress={compartirRecorrido}>
                          <Text style={styles.botonTexto}> Compartir recorrido</Text>
                        </TouchableOpacity>
                        {!sol.llegada_acompanante ? (
                          <TouchableOpacity
                            style={styles.botonLlegada}
                            onPress={() => confirmarLlegada(sol._id, 'acompanante')}>
                            <Text style={styles.botonTexto}> Confirmar llegada</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.esperando}> Esperando confirmación de ella...</Text>
                        )}
                      </>
                    )}
                  </View>
                ))}
              </>
            )}

            {/* Como usuaria */}
            <Text style={styles.seccionSubtitulo}>Mis peticiones </Text>
            {misSolicitudes.length === 0 ? (
              <View style={styles.vacio}>
                <Text style={styles.vacioEmoji}></Text>
                <Text style={styles.vacioTexto}>No has hecho solicitudes aún</Text>
              </View>
            ) : (
              misSolicitudes.map((sol, i) => (
                <View key={`sol-${i}`} style={[styles.card, ['aceptado', 'en_curso'].includes(sol.estado) && styles.cardActivo]}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardNombre}>Solicitud #{misSolicitudes.length - i}</Text>
                      <Text style={styles.cardHora}>
                        {new Date(sol.fecha_solicitud).toLocaleString('es-MX', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <View style={[styles.estadoBadge, { backgroundColor: estadoColor(sol.estado) }]}>
                      <Text style={styles.estadoBadgeTexto}>{estadoTexto(sol.estado)}</Text>
                    </View>
                  </View>

                  {sol.nombre_acompanante && (
                    <Text style={styles.cardDesc}> Acompañante: {sol.nombre_acompanante}</Text>
                  )}
                  {sol.descripcion && <Text style={styles.cardDesc}>"{sol.descripcion}"</Text>}

                  {sol.estado === 'aceptado' && !sol.confirmacion_usuaria && (
                    <TouchableOpacity
                      style={styles.botonConfirmar}
                      onPress={() => confirmarEncuentro(sol._id, 'usuaria')}>
                      <Text style={styles.botonTexto}> Ya estamos juntas</Text>
                    </TouchableOpacity>
                  )}
                  {sol.estado === 'aceptado' && sol.confirmacion_usuaria && (
                    <Text style={styles.esperando}> Esperando confirmación de tu acompañante...</Text>
                  )}
                  {sol.estado === 'en_curso' && (
                    <>
                      <TouchableOpacity style={styles.botonCompartir} onPress={compartirRecorrido}>
                        <Text style={styles.botonTexto}> Compartir recorrido</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
  style={styles.botonChat}
  onPress={() => navigation.navigate('ChatAcompanamiento', {
    id: sol._id,
    nombreOtra: nombreOtra
  })}>
  <Text style={styles.botonTexto}>💬 Abrir chat</Text>
</TouchableOpacity>


                      {!sol.llegada_usuaria ? (
                        <TouchableOpacity
                          style={styles.botonLlegada}
                          onPress={() => confirmarLlegada(sol._id, 'usuaria')}>
                          <Text style={styles.botonTexto}> Confirmar llegada</Text>
                        </TouchableOpacity>


                      ) : (
                        <Text style={styles.esperando}> Esperando confirmación de tu acompañante...</Text>
                      )}
                    </>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  volver: { color: '#9B6DFF', fontSize: 16 },
  titulo: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  refrescarBtn: { color: '#9B6DFF', fontSize: 22, fontWeight: 'bold' },
  mapaContainer: { height: 280, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#7C3AED' },
  mapa: { flex: 1 },
  mapaLoading: { flex: 1, backgroundColor: '#1E1B3A', justifyContent: 'center', alignItems: 'center' },
  miMarker: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C3AED', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  miMarkerPunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  markerFoto: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, backgroundColor: '#1E1B3A', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  markerImagen: { width: 44, height: 44, borderRadius: 22 },
  solicitudMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF69B4', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  panelActivo: { backgroundColor: '#2D1B69', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#7C3AED' },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitulo: { color: '#fff', fontWeight: 'bold', fontSize: 15, flex: 1 },
  panelInfo: { color: '#9B6DFF', fontSize: 13, marginBottom: 6 },
  panelDistancia: { color: '#fff', fontSize: 14, marginBottom: 10, textAlign: 'center', fontWeight: '700' },
  panelBotones: { gap: 8 },
  panelSubtitulo: { color: '#aaa', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#1E1B3A' },
  tabActivo: { borderBottomColor: '#7C3AED' },
  tabTexto: { color: '#555', fontSize: 11 },
  tabTextoActivo: { color: '#9B6DFF', fontWeight: 'bold' },
  content: { flex: 1 },
  seccion: { padding: 16 },
  seccionTitulo: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  seccionSubtitulo: { color: '#9B6DFF', fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  seccionSub: { color: '#aaa', fontSize: 13, marginBottom: 16, lineHeight: 20 },
  input: { backgroundColor: '#1E1B3A', borderRadius: 12, padding: 14, color: '#fff', fontSize: 14, minHeight: 60, marginBottom: 12 },
  botonSolicitar: { backgroundColor: '#7C3AED', padding: 16, borderRadius: 14, alignItems: 'center' },
  botonAceptar: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  botonConfirmar: { backgroundColor: '#2196F3', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  botonCompartir: { backgroundColor: '#FF9800', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  botonLlegada: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: '#1E1B3A', borderRadius: 14, padding: 14, marginBottom: 12 },
  cardActivo: { borderWidth: 1, borderColor: '#7C3AED' },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  cardAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2D1B69', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardNombre: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardHora: { color: '#555', fontSize: 11, marginTop: 2 },
  cardDist: { color: '#9B6DFF', fontSize: 12, fontWeight: '600' },
  cardDesc: { color: '#aaa', fontSize: 13, marginBottom: 6, fontStyle: 'italic' },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  estadoBadgeTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  esperando: { color: '#aaa', fontSize: 12, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  vacio: { alignItems: 'center', paddingVertical: 40 },
  vacioEmoji: { fontSize: 40, marginBottom: 12 },
  vacioTexto: { color: '#aaa', fontSize: 15, fontWeight: '600' },
  vacioSub: { color: '#555', fontSize: 13, marginTop: 4 },
  botonChat: { backgroundColor: '#1E1B3A', borderWidth: 1, borderColor: '#7C3AED', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
});
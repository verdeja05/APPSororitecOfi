// GPSScreen.js
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../services/api";

// No importamos react-native-maps directamente
// Usaremos importación dinámica

export default function GPSScreen({ navigation }) {
  const [ubicacion, setUbicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [acompanantesDisponibles, setAcompanantesDisponibles] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tab, setTab] = useState("solicitar");
  const [acompanamientoActivo, setAcompanamientoActivo] = useState(null);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [mostrarModalDestino, setMostrarModalDestino] = useState(false);
  const [destino, setDestino] = useState("");
  const [ruta, setRuta] = useState([]);
  const [puntoEncuentro, setPuntoEncuentro] = useState(null);
  const [MapComponents, setMapComponents] = useState(null);
  const mapRef = useRef(null);

  // Destinos predefinidos
  const destinosPredefinidos = [
    { nombre: "📚 Biblioteca", lat: 19.2826, lon: -99.1385 },
    { nombre: "🚌 Paradero", lat: 19.283, lon: -99.139 },
    { nombre: "🏠 Mi casa", lat: null, lon: null },
    { nombre: "☕ Cafetería", lat: 19.282, lon: -99.138 },
    { nombre: "🏛️ Rectoría", lat: 19.2835, lon: -99.1375 },
  ];

  // Cargar componentes del mapa solo en nativo
  useEffect(() => {
    if (Platform.OS !== "web") {
      import("react-native-maps").then((module) => {
        setMapComponents({
          MapView: module.default || module.MapView,
          Marker: module.Marker || module.Marker,
          UrlTile: module.UrlTile || module.UrlTile,
          Polyline: module.Polyline || module.Polyline,
        });
      });
    } else {
      // En web, intentamos cargar react-native-web-maps
      import("react-native-web-maps")
        .then((module) => {
          setMapComponents({
            MapView: module.default || module.MapView,
            Marker: module.Marker || module.Marker,
            UrlTile: () => null,
            Polyline: () => null,
          });
        })
        .catch(() => {
          // Si no está instalado, usamos null
          setMapComponents(null);
        });
    }
  }, []);

  const calcularDistancia = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "?";
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;
    if (distancia < 1) return `${(distancia * 1000).toFixed(0)} m`;
    return `${distancia.toFixed(1)} km`;
  };

  useEffect(() => {
    obtenerUbicacion();
    cargarDatos();
    const intervalo = setInterval(() => {
      if (acompanamientoActivo?.estado === "en_curso") {
        actualizarUbicacion();
      }
      cargarAcompanantesDisponibles();
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (acompanamientoActivo?.punto_encuentro) {
      setPuntoEncuentro(acompanamientoActivo.punto_encuentro);
    }
  }, [acompanamientoActivo]);

  const obtenerUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu ubicación");
        setCargando(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUbicacion(loc.coords);

      await api.post("/acompanamientos/registrar-disponible", {
        latitud: loc.coords.latitude,
        longitud: loc.coords.longitude,
      });
    } catch (err) {
      Alert.alert("Error", "No se pudo obtener tu ubicación");
    } finally {
      setCargando(false);
    }
  };

  const actualizarUbicacion = async () => {
    if (!ubicacion) return;
    try {
      await api.put("/acompanamientos/actualizar-ubicacion", {
        latitud: ubicacion.latitude,
        longitud: ubicacion.longitude,
      });
    } catch (err) {
      console.log("Error actualizando ubicación:", err);
    }
  };

  const cargarDatos = async () => {
    try {
      const [pendientes, mias, disponibles] = await Promise.all([
        api.get("/acompanamientos/pendientes"),
        api.get("/acompanamientos/mis-solicitudes"),
        api.get("/acompanamientos/disponibles"),
      ]);
      setSolicitudes(pendientes.data);
      setMisSolicitudes(mias.data);
      setAcompanantesDisponibles(disponibles.data);
      verificarAcompanamientoActivo(mias.data);
    } catch (err) {
      console.log("Error cargando datos:", err);
    }
  };

  const cargarAcompanantesDisponibles = async () => {
    try {
      const res = await api.get("/acompanamientos/disponibles");
      setAcompanantesDisponibles(res.data);
    } catch (err) {
      console.log("Error cargando disponibles:", err);
    }
  };

  const verificarAcompanamientoActivo = (solicitudes) => {
    const activo = solicitudes?.find(
      (s) => s.estado === "en_curso" || s.estado === "camino_encuentro",
    );
    setAcompanamientoActivo(activo);
    if (activo?.ruta) setRuta(activo.ruta);
  };

  const solicitarAcompanamiento = async (acompananteId, acompananteNombre) => {
    if (!ubicacion) {
      Alert.alert("Error", "No tenemos tu ubicación aún");
      return;
    }
    setEnviando(true);
    try {
      await api.post("/acompanamientos/solicitar", {
        acompanante_id: acompananteId,
        ubicacion_lat: ubicacion.latitude,
        ubicacion_lon: ubicacion.longitude,
        descripcion,
      });
      Alert.alert("🌸 Solicitud enviada", `Se notificó a ${acompananteNombre}`);
      setDescripcion("");
      setSolicitudSeleccionada(null);
      cargarDatos();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.mensaje || "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  };

  const aceptarSolicitud = async (
    solicitudId,
    usuariaId,
    usuariaNombre,
    lat,
    lon,
  ) => {
    try {
      await api.put(`/acompanamientos/aceptar/${solicitudId}`, {
        punto_encuentro_lat: lat,
        punto_encuentro_lon: lon,
      });
      Alert.alert(
        "✅ Aceptado",
        `Ahora dirígete al punto de encuentro para recoger a ${usuariaNombre}`,
      );
      cargarDatos();
    } catch (err) {
      Alert.alert("Error", "No se pudo aceptar");
    }
  };

  const iniciarRecorrido = async () => {
    if (!destino) {
      Alert.alert("Error", "Selecciona un destino");
      return;
    }

    let destinoLat = null,
      destinoLon = null;
    const destinoSel = destinosPredefinidos.find((d) => d.nombre === destino);

    if (destinoSel && destinoSel.lat) {
      destinoLat = destinoSel.lat;
      destinoLon = destinoSel.lon;
    } else if (destino === "🏠 Mi casa" && ubicacion) {
      destinoLat = ubicacion.latitude;
      destinoLon = ubicacion.longitude;
    }

    try {
      await api.put(`/acompanamientos/iniciar/${acompanamientoActivo._id}`, {
        destino: { nombre: destino, lat: destinoLat, lon: destinoLon },
      });
      setMostrarModalDestino(false);
      cargarDatos();
      Alert.alert("🚶‍♀️ Recorrido iniciado", `Síguelas hasta ${destino}`);
    } catch (err) {
      Alert.alert("Error", "No se pudo iniciar el recorrido");
    }
  };

  const finalizarAcompanamiento = async () => {
    try {
      await api.put(`/acompanamientos/finalizar/${acompanamientoActivo._id}`);
      Alert.alert(
        "¡Completado!",
        "Has llegado a salvo. ¡Gracias por usar Sororitec! 🌸",
      );
      setAcompanamientoActivo(null);
      setRuta([]);
      cargarDatos();
    } catch (err) {
      Alert.alert("Error", "No se pudo finalizar");
    }
  };

  const estadoColor = (estado) => {
    const colores = {
      pendiente: "#FFA500",
      aceptado: "#2196F3",
      camino_encuentro: "#FF9800",
      en_curso: "#7C3AED",
      completado: "#4CAF50",
      cancelado: "#f44336",
    };
    return colores[estado] || "#666";
  };

  const estadoTexto = (estado) => {
    const textos = {
      pendiente: "Buscando acompañante",
      aceptado: "Aceptado - En camino a encontrarte",
      camino_encuentro: "Yendo al encuentro",
      en_curso: "En recorrido",
      completado: "Completado",
      cancelado: "Cancelado",
    };
    return textos[estado] || estado;
  };

  // Renderizar el mapa
  const renderMap = () => {
    if (!MapComponents) {
      return (
        <View style={styles.mapaLoading}>
          <ActivityIndicator color="#7C3AED" />
        </View>
      );
    }

    const {
      MapView: MapComponent,
      Marker: MarkerComponent,
      UrlTile: UrlTileComponent,
      Polyline: PolylineComponent,
    } = MapComponents;

    return (
      <MapComponent
        ref={mapRef}
        style={styles.mapa}
        initialRegion={{
          latitude: ubicacion?.latitude || 19.2826,
          longitude: ubicacion?.longitude || -99.1385,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        {...(Platform.OS === "web" && {
          googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "YOUR_API_KEY",
        })}
      >
        {/* Capa de mapa - solo nativo */}
        {Platform.OS !== "web" && UrlTileComponent && (
          <UrlTileComponent
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
          />
        )}

        {/* Mi ubicación */}
        {ubicacion && (
          <MarkerComponent
            coordinate={{
              latitude: ubicacion.latitude,
              longitude: ubicacion.longitude,
            }}
            title="📍 Tú estás aquí"
            pinColor="#7C3AED"
          >
            <View style={styles.miUbicacionMarker}>
              <View style={styles.miUbicacionPunto} />
            </View>
          </MarkerComponent>
        )}

        {/* Acompañantes disponibles */}
        {tab === "solicitar" &&
          acompanantesDisponibles.map(
            (acc, i) =>
              acc.ubicacion_actual?.latitud && (
                <MarkerComponent
                  key={i}
                  coordinate={{
                    latitude: acc.ubicacion_actual.latitud,
                    longitude: acc.ubicacion_actual.longitud,
                  }}
                  title={`${acc.nombre_completo} ✨ Acompañante disponible`}
                  pinColor="#9C27B0"
                  onPress={() => {
                    Alert.alert(
                      "🌸 Sorori Disponible",
                      `${acc.nombre_completo} está cerca para acompañarte. ¿Quieres solicitar su ayuda?`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Solicitar ayuda",
                          onPress: () => {
                            setDescripcion("");
                            solicitarAcompanamiento(
                              acc._id,
                              acc.nombre_completo.split(" ")[0],
                            );
                          },
                        },
                      ],
                    );
                  }}
                >
                  <View style={styles.acompananteMarker}>
                    <Text style={styles.acompananteEmoji}>🌸</Text>
                  </View>
                </MarkerComponent>
              ),
          )}

        {/* Solicitudes pendientes */}
        {tab === "pendientes" &&
          solicitudes.map(
            (sol, i) =>
              sol.ubicacion_usuaria?.latitud && (
                <MarkerComponent
                  key={i}
                  coordinate={{
                    latitude: sol.ubicacion_usuaria.latitud,
                    longitude: sol.ubicacion_usuaria.longitud,
                  }}
                  title={`${sol.id_usuaria?.nombre_completo || "Sorori"} necesita ayuda`}
                  description={sol.descripcion || "Solicitud de acompañamiento"}
                  pinColor="#FF69B4"
                  onPress={() => {
                    const distancia = calcularDistancia(
                      ubicacion?.latitude,
                      ubicacion?.longitude,
                      sol.ubicacion_usuaria.latitud,
                      sol.ubicacion_usuaria.longitud,
                    );
                    Alert.alert(
                      "🆘 Alguien necesita ayuda",
                      `${sol.id_usuaria?.nombre_completo || "Una sorori"}\n💬 ${sol.descripcion || "Solicita acompañamiento"}\n📍 A ${distancia} de ti\n\n¿Quieres ayudarla?`,
                      [
                        { text: "Ahora no", style: "cancel" },
                        {
                          text: "🙋 Ir a ayudar",
                          onPress: () =>
                            aceptarSolicitud(
                              sol._id,
                              sol.id_usuaria?._id,
                              sol.id_usuaria?.nombre_completo?.split(" ")[0] ||
                                "ella",
                              sol.ubicacion_usuaria.latitud,
                              sol.ubicacion_usuaria.longitud,
                            ),
                        },
                      ],
                    );
                  }}
                >
                  <View style={styles.solicitudMarker}>
                    <Text style={styles.solicitudEmoji}>🆘</Text>
                  </View>
                </MarkerComponent>
              ),
          )}

        {/* Ruta dibujada - solo nativo */}
        {Platform.OS !== "web" && ruta.length > 0 && PolylineComponent && (
          <PolylineComponent
            coordinates={ruta}
            strokeColor="#7C3AED"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapComponent>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.volver}>{"< Volver"}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>🌸 GPS Sorori</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mapa */}
      <View style={styles.mapaContainer}>
        {cargando || !MapComponents ? (
          <View style={styles.mapaLoading}>
            <ActivityIndicator color="#7C3AED" />
            <Text style={{ color: "#aaa", marginTop: 10 }}>
              Cargando mapa...
            </Text>
          </View>
        ) : (
          renderMap()
        )}
      </View>

      {/* Panel de estado activo */}
      {acompanamientoActivo && (
        <View style={styles.activoContainer}>
          <Text style={styles.activoTitulo}>
            {acompanamientoActivo.estado === "camino_encuentro" &&
              "🚶‍♀️ Yendo al encuentro"}
            {acompanamientoActivo.estado === "en_curso" &&
              "🚶‍♀️ En recorrido seguro"}
            {acompanamientoActivo.estado === "aceptado" &&
              "✅ Acompañamiento aceptado"}
          </Text>

          {acompanamientoActivo.nombre_acompanante && (
            <Text style={styles.activoTexto}>
              Acompañante: {acompanamientoActivo.nombre_acompanante}
            </Text>
          )}

          {acompanamientoActivo.punto_encuentro && (
            <Text style={styles.activoTexto}>
              📍 Punto encuentro: a{" "}
              {calcularDistancia(
                ubicacion?.latitude,
                ubicacion?.longitude,
                acompanamientoActivo.punto_encuentro.lat,
                acompanamientoActivo.punto_encuentro.lon,
              )}
            </Text>
          )}

          {acompanamientoActivo.estado === "aceptado" && (
            <TouchableOpacity
              style={styles.botonLlegue}
              onPress={() => {
                Alert.alert(
                  "📍 ¿Ya llegaste al punto de encuentro?",
                  "Confirma que ya estás con tu acompañante para iniciar el recorrido",
                  [
                    { text: "Todavía no", style: "cancel" },
                    {
                      text: "¡Sí, ya estamos juntas!",
                      onPress: () => setMostrarModalDestino(true),
                    },
                  ],
                );
              }}
            >
              <Text style={styles.botonTexto}>
                📍 Ya llegué al punto de encuentro
              </Text>
            </TouchableOpacity>
          )}

          {acompanamientoActivo.estado === "en_curso" && (
            <>
              <Text style={styles.activoTexto}>
                Destino: {acompanamientoActivo.destino?.nombre || "Por definir"}
              </Text>
              <TouchableOpacity
                style={styles.botonFinalizar}
                onPress={finalizarAcompanamiento}
              >
                <Text style={styles.botonTexto}>🏁 Llegamos - Finalizar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Modal para elegir destino */}
      <Modal visible={mostrarModalDestino} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>🌸 ¿Hacia dónde van?</Text>
            <Text style={styles.modalSubtitulo}>
              Selecciona su destino final
            </Text>

            {destinosPredefinidos.map((dest, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.destinoOption,
                  destino === dest.nombre && styles.destinoSelected,
                ]}
                onPress={() => setDestino(dest.nombre)}
              >
                <Text style={styles.destinoTexto}>{dest.nombre}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelar}
                onPress={() => setMostrarModalDestino(false)}
              >
                <Text style={styles.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAceptar}
                onPress={iniciarRecorrido}
              >
                <Text style={styles.modalAceptarTexto}>Iniciar recorrido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tabs y contenido */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "solicitar" && styles.tabActivo]}
          onPress={() => setTab("solicitar")}
        >
          <Text
            style={[
              styles.tabTexto,
              tab === "solicitar" && styles.tabTextoActivo,
            ]}
          >
            🌸 Pedir ayuda
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "pendientes" && styles.tabActivo]}
          onPress={() => setTab("pendientes")}
        >
          <Text
            style={[
              styles.tabTexto,
              tab === "pendientes" && styles.tabTextoActivo,
            ]}
          >
            🙋 Ayudar ({solicitudes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "mis" && styles.tabActivo]}
          onPress={() => setTab("mis")}
        >
          <Text
            style={[styles.tabTexto, tab === "mis" && styles.tabTextoActivo]}
          >
            📋 Mis solicitudes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {tab === "solicitar" && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>
              🌸 ¿Necesitas una acompañante?
            </Text>
            <Text style={styles.seccionSubtitulo}>
              Toca cualquier punto morado 🌸 en el mapa para solicitar ayuda
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
              onPress={() => {
                if (!ubicacion) {
                  Alert.alert(
                    "Sin ubicación",
                    "Activa el GPS e intenta de nuevo",
                  );
                  return;
                }
                Alert.alert(
                  "🌸 Solicitar acompañamiento",
                  "¿Quieres enviar una solicitud a las acompañantes cercanas?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Sí, pedir ayuda",
                      onPress: async () => {
                        setEnviando(true);
                        try {
                          await api.post("/acompanamientos/solicitar", {
                            latitud: ubicacion.latitude,
                            longitud: ubicacion.longitude,
                            descripcion,
                          });
                          Alert.alert(
                            "🌸 ¡Solicitud enviada!",
                            "Las acompañantes cercanas pueden ver tu petición",
                          );
                          setDescripcion("");
                          cargarDatos();
                        } catch (err) {
                          Alert.alert(
                            "Error",
                            err.response?.data?.mensaje || "No se pudo enviar",
                          );
                        } finally {
                          setEnviando(false);
                        }
                      },
                    },
                  ],
                );
              }}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>
                  🌸 Solicitar acompañamiento
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {tab === "pendientes" && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>🙋 Solicitudes cercanas</Text>
            {solicitudes.length === 0 ? (
              <Text style={styles.vacio}>No hay solicitudes pendientes</Text>
            ) : (
              solicitudes.map((sol, i) => {
                const distancia = calcularDistancia(
                  ubicacion?.latitude,
                  ubicacion?.longitude,
                  sol.ubicacion_usuaria?.latitud,
                  sol.ubicacion_usuaria?.longitud,
                );
                return (
                  <View key={i} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardNombre}>
                        {sol.id_usuaria?.nombre_completo || "Sorori"}
                      </Text>
                      <View
                        style={[
                          styles.estadoBadge,
                          { backgroundColor: estadoColor(sol.estado) },
                        ]}
                      >
                        <Text style={styles.estadoTexto}>
                          {estadoTexto(sol.estado)}
                        </Text>
                      </View>
                    </View>
                    {sol.descripcion && (
                      <Text style={styles.cardDesc}>💬 {sol.descripcion}</Text>
                    )}
                    <Text style={styles.cardDistancia}>
                      📍 {distancia} de ti
                    </Text>
                    <Text style={styles.cardFecha}>
                      🕐 {new Date(sol.fecha_solicitud).toLocaleTimeString()}
                    </Text>
                    {sol.estado === "pendiente" && (
                      <TouchableOpacity
                        style={styles.botonAceptar}
                        onPress={() =>
                          aceptarSolicitud(
                            sol._id,
                            sol.id_usuaria?._id,
                            sol.id_usuaria?.nombre_completo?.split(" ")[0] ||
                              "ella",
                            sol.ubicacion_usuaria?.latitud,
                            sol.ubicacion_usuaria?.longitud,
                          )
                        }
                      >
                        <Text style={styles.botonTexto}>
                          🙋 Aceptar y ayudar
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {tab === "mis" && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>📋 Mis solicitudes</Text>
            {misSolicitudes.length === 0 ? (
              <Text style={styles.vacio}>No has hecho solicitudes aún</Text>
            ) : (
              misSolicitudes.map((sol, i) => (
                <View key={i} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardNombre}>Solicitud #{i + 1}</Text>
                    <View
                      style={[
                        styles.estadoBadge,
                        { backgroundColor: estadoColor(sol.estado) },
                      ]}
                    >
                      <Text style={styles.estadoTexto}>
                        {estadoTexto(sol.estado)}
                      </Text>
                    </View>
                  </View>
                  {sol.nombre_acompanante && (
                    <Text style={styles.cardDesc}>
                      🌸 Acompañante: {sol.nombre_acompanante}
                    </Text>
                  )}
                  {sol.descripcion && (
                    <Text style={styles.cardDesc}>💬 {sol.descripcion}</Text>
                  )}
                  <Text style={styles.cardFecha}>
                    🕐 {new Date(sol.fecha_solicitud).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D1A" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  volver: { color: "#9B6DFF", fontSize: 16 },
  titulo: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  mapaContainer: {
    height: 350,
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  mapa: { flex: 1 },
  mapaLoading: {
    flex: 1,
    backgroundColor: "#1E1B3A",
    justifyContent: "center",
    alignItems: "center",
  },
  miUbicacionMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  miUbicacionPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  acompananteMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#9C27B0",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  acompananteEmoji: { fontSize: 18 },
  solicitudMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF69B4",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  solicitudEmoji: { fontSize: 16 },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 8 },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#1E1B3A",
  },
  tabActivo: { borderBottomColor: "#7C3AED" },
  tabTexto: { color: "#666", fontSize: 12 },
  tabTextoActivo: { color: "#9B6DFF", fontWeight: "bold" },
  content: { flex: 1 },
  seccion: { padding: 16 },
  seccionTitulo: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  seccionSubtitulo: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    minHeight: 60,
    marginBottom: 16,
  },
  botonSolicitar: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  botonAceptar: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  botonLlegue: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  botonFinalizar: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  botonTexto: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  card: {
    backgroundColor: "#1E1B3A",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardNombre: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTexto: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  cardDesc: { color: "#ccc", fontSize: 13, marginBottom: 6 },
  cardDistancia: {
    color: "#9B6DFF",
    fontSize: 12,
    marginVertical: 4,
    fontWeight: "500",
  },
  cardFecha: { color: "#555", fontSize: 11 },
  vacio: { color: "#666", textAlign: "center", marginTop: 30, fontSize: 14 },
  activoContainer: {
    backgroundColor: "#2D1B69",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  activoTitulo: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  activoTexto: {
    color: "#9B6DFF",
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1E1B3A",
    borderRadius: 20,
    padding: 20,
    width: "85%",
  },
  modalTitulo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitulo: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  destinoOption: {
    backgroundColor: "#0D0D1A",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
  destinoSelected: { borderColor: "#7C3AED", backgroundColor: "#2D1B69" },
  destinoTexto: { color: "#fff", fontSize: 14 },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 10 },
  modalCancelar: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#333",
    alignItems: "center",
  },
  modalCancelarTexto: { color: "#fff" },
  modalAceptar: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    alignItems: "center",
  },
  modalAceptarTexto: { color: "#fff", fontWeight: "bold" },
});

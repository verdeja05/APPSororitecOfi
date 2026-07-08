// src/screens/ModerarPublicacionesScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import api from "../services/api";

export default function ModerarPublicacionesScreen({ navigation }) {
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarPublicaciones();
  }, []);

  const cargarPublicaciones = async () => {
    try {
      setLoading(true);
      const res = await api.get("/publicaciones");
      setPublicaciones(res.data);
    } catch (error) {
      console.error("Error cargando publicaciones:", error);
      Alert.alert("Error", "No se pudieron cargar las publicaciones");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarPublicaciones();
  };

  const eliminarPublicacion = (postId) => {
    Alert.alert(
      "Eliminar publicación",
      "¿Estás segura de eliminar esta publicación? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/publicaciones/${postId}`);
              Alert.alert("Éxito", "Publicación eliminada");
              cargarPublicaciones();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar la publicación");
            }
          },
        },
      ],
    );
  };

  const tiempoTranscurrido = (fecha) => {
    const diff = Date.now() - new Date(fecha);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(horas / 24);
    if (dias > 0) return `hace ${dias}d`;
    if (horas > 0) return `hace ${horas}h`;
    return "ahora";
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {item.foto_autor ? (
            <Image
              source={{ uri: item.foto_autor }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <Text style={{ fontSize: 18 }}>👩</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardNombre}>
            {item.es_anonima ? "Anónima" : item.nombre_autor || "Usuaria"}
          </Text>
          <Text style={styles.cardMeta}>
            {tiempoTranscurrido(item.fecha_publicacion)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.eliminarBtn}
          onPress={() => eliminarPublicacion(item._id)}
        >
          <Ionicons name="trash-outline" size={22} color="#ff4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.cardContenido}>{item.contenido}</Text>
      {item.imagen_url && (
        <Image
          source={{ uri: item.imagen_url }}
          style={styles.cardImagen}
          resizeMode="cover"
        />
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.cardInfo}>❤️ {item.likes || 0}</Text>
        <Text style={styles.cardInfo}>💬 {item.num_comentarios || 0}</Text>
        {item.categoria && (
          <View style={styles.categoriaBadge}>
            <Text style={styles.categoriaTexto}>{item.categoria}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>🛡️ Moderar Publicaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          {publicaciones.length} publicaciones en el foro
        </Text>
      </View>

      {loading ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.cargandoTexto}>Cargando publicaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={publicaciones}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7C3AED"]}
              tintColor="#7C3AED"
            />
          }
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="checkmark-circle" size={60} color="#27ae60" />
              <Text style={styles.vacioTexto}>No hay publicaciones</Text>
              <Text style={styles.vacioSubtexto}>¡El foro está limpio!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D1A" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#1E1B3A",
  },
  backBtn: { padding: 5 },
  headerTitulo: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  subHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#1E1B3A",
    borderBottomWidth: 1,
    borderBottomColor: "#2D1B69",
  },
  subHeaderText: { color: "#9B6DFF", fontSize: 14, fontWeight: "500" },
  lista: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2D1B69",
    alignItems: "center",
    justifyContent: "center",
  },
  cardNombre: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  cardMeta: { color: "#666", fontSize: 12, marginTop: 2 },
  cardContenido: { color: "#ccc", fontSize: 14, lineHeight: 20 },
  cardImagen: { width: "100%", height: 180, borderRadius: 10, marginTop: 10 },
  cardFooter: { flexDirection: "row", gap: 16, marginTop: 10 },
  cardInfo: { color: "#666", fontSize: 13 },
  categoriaBadge: {
    backgroundColor: "#2D1B69",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoriaTexto: { color: "#9B6DFF", fontSize: 11 },
  eliminarBtn: { padding: 5 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },
  cargandoTexto: { color: "#666", marginTop: 10 },
  vacio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  vacioTexto: { color: "#27ae60", fontSize: 18, marginTop: 10 },
  vacioSubtexto: { color: "#666", fontSize: 14, marginTop: 5 },
});

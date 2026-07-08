// src/screens/MisConsultasScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { consultasPsicopedagogiaService } from "../services/api";

export default function MisConsultasScreen({ navigation }) {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarConsultas();
  }, []);

  const cargarConsultas = async () => {
    try {
      setLoading(true);
      const data = await consultasPsicopedagogiaService.getMisConsultas();
      setConsultas(data);
    } catch (error) {
      console.error("Error cargando consultas:", error);
      Alert.alert("Error", "No se pudieron cargar tus consultas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarConsultas();
  };

  const getEstadoColor = (estado) => {
    const colores = {
      Pendiente: "#f39c12",
      "En revisión": "#3498db",
      Atendido: "#27ae60",
      Rechazado: "#e74c3c",
    };
    return colores[estado] || "#666";
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitulo}>
          {item.tipo || "Consulta psicopedagógica"}
        </Text>
        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(item.estado) },
          ]}
        >
          <Text style={styles.estadoTexto}>{item.estado || "Pendiente"}</Text>
        </View>
      </View>

      <Text style={styles.cardDescripcion} numberOfLines={3}>
        {item.descripcion}
      </Text>

      {item.respuesta && (
        <View style={styles.respuestaContainer}>
          <Text style={styles.respuestaLabel}>📩 Respuesta:</Text>
          <Text style={styles.respuestaTexto}>{item.respuesta}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.cardFecha}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.cardAnonimo}>
          {item.es_anonimo ? "🔒 Anónimo" : "👤 Identificado"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.cargandoTexto}>Cargando tus consultas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>🧠 Mis Consultas</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("CrearConsultaPsico")}
          style={styles.addBtn}
        >
          <Ionicons name="add-circle" size={28} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={consultas}
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
            <Ionicons name="document-text-outline" size={60} color="#444" />
            <Text style={styles.vacioTexto}>
              No tienes consultas registradas
            </Text>
            <TouchableOpacity
              style={styles.vacioBtn}
              onPress={() => navigation.navigate("CrearConsultaPsico")}
            >
              <Text style={styles.vacioBtnTexto}>Crear consulta</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D1A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#1E1B3A",
  },
  backBtn: {
    padding: 5,
  },
  headerTitulo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  addBtn: {
    padding: 5,
  },
  lista: {
    padding: 16,
    paddingBottom: 30,
  },
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitulo: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoTexto: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  cardDescripcion: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  respuestaContainer: {
    backgroundColor: "#0D0D1A",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  respuestaLabel: {
    color: "#9B6DFF",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  respuestaTexto: {
    color: "#aaa",
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  cardFecha: {
    color: "#666",
    fontSize: 12,
  },
  cardAnonimo: {
    color: "#666",
    fontSize: 12,
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cargandoTexto: {
    color: "#666",
    marginTop: 10,
  },
  vacio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  vacioTexto: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
  },
  vacioBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  vacioBtnTexto: {
    color: "#fff",
    fontWeight: "bold",
  },
});

// src/screens/MisQuejasScreen.js
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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
import { quejasLegalesService } from "../services/api";

export default function MisQuejasScreen({ navigation }) {
  const [quejas, setQuejas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarQuejas();
  }, []);

  const cargarQuejas = async () => {
    try {
      setLoading(true);
      const data = await quejasLegalesService.getMisQuejas();
      setQuejas(data);
    } catch (error) {
      console.error("Error cargando quejas:", error);
      Alert.alert("Error", "No se pudieron cargar tus quejas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarQuejas();
  };

  const getEstadoColor = (estado) => {
    const colores = {
      Pendiente: "#f39c12",
      "En revisión": "#3498db",
      "En seguimiento": "#9B6DFF",
      Atendido: "#27ae60",
      Rechazado: "#e74c3c",
    };
    return colores[estado] || "#666";
  };

  const getEstadoIcon = (estado) => {
    const iconos = {
      Pendiente: "⏳",
      "En revisión": "🔍",
      "En seguimiento": "💬",
      Atendido: "✅",
      Rechazado: "❌",
    };
    return iconos[estado] || "📋";
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.estado === "En seguimiento") {
          navigation.navigate("ChatLegal", { queja: item });
        } else {
          Alert.alert(
            "Detalle del caso",
            `Estado: ${item.estado}\n\nDescripción: ${item.descripcion}\n\n${item.respuesta ? `Respuesta: ${item.respuesta}` : "Aún no hay respuesta"}`,
          );
        }
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{getEstadoIcon(item.estado)}</Text>
        <Text style={styles.cardTitulo} numberOfLines={1}>
          {item.nombre_implicado || "Caso legal"}
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

      <Text style={styles.cardDescripcion} numberOfLines={2}>
        {item.descripcion}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardFecha}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.estado === "En seguimiento" && (
          <View style={styles.chatIndicator}>
            <Ionicons name="chatbubble" size={14} color="#7C3AED" />
            <Text style={styles.chatIndicatorText}>Chat activo</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.cargandoTexto}>Cargando tus quejas...</Text>
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
        <Text style={styles.headerTitulo}>📋 Mis Quejas</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("SolicitarApoyoLegal")}
          style={styles.addBtn}
        >
          <Ionicons name="add-circle" size={28} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={quejas}
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
            <Text style={styles.vacioTexto}>No tienes quejas registradas</Text>
            <TouchableOpacity
              style={styles.vacioBtn}
              onPress={() => navigation.navigate("SolicitarApoyoLegal")}
            >
              <Text style={styles.vacioBtnTexto}>Solicitar apoyo legal</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  addBtn: { padding: 5 },
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
    marginBottom: 8,
    gap: 8,
  },
  cardIcon: { fontSize: 18 },
  cardTitulo: { color: "#fff", fontSize: 15, fontWeight: "bold", flex: 1 },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  estadoTexto: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  cardDescripcion: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardFecha: { color: "#666", fontSize: 12 },
  chatIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  chatIndicatorText: { color: "#7C3AED", fontSize: 12, fontWeight: "bold" },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },
  cargandoTexto: { color: "#666", marginTop: 10 },
  vacio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  vacioTexto: { color: "#666", fontSize: 16, marginTop: 10 },
  vacioBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  vacioBtnTexto: { color: "#fff", fontWeight: "bold" },
});

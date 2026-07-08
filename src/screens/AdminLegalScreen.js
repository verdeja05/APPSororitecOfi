// src/screens/AdminLegalScreen.js
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { quejasLegalesService } from "../services/api";

export default function AdminLegalScreen({ navigation }) {
  const [quejas, setQuejas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQueja, setSelectedQueja] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("En revisión");

  useEffect(() => {
    cargarQuejas();
  }, []);

  const cargarQuejas = async () => {
    try {
      setLoading(true);
      const data = await quejasLegalesService.getQuejas();
      setQuejas(data);
    } catch (error) {
      console.error("Error cargando quejas:", error);
      Alert.alert("Error", "No se pudieron cargar las quejas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarQuejas();
  };

  const handleAceptar = async (quejaId) => {
    try {
      await quejasLegalesService.actualizarEstado(
        quejaId,
        "En revisión",
        "Caso aceptado para revisión",
      );
      Alert.alert(
        "✅ Aceptado",
        "El caso ha sido aceptado. Se iniciará el chat de seguimiento.",
      );
      cargarQuejas();
    } catch (error) {
      Alert.alert("Error", "No se pudo aceptar el caso");
    }
  };

  const handleDeclinar = async (quejaId) => {
    Alert.alert("Declinar caso", "¿Estás segura de declinar este caso?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Declinar",
        style: "destructive",
        onPress: async () => {
          try {
            await quejasLegalesService.actualizarEstado(
              quejaId,
              "Rechazado",
              "Caso declinado",
            );
            Alert.alert("Caso declinado", "El caso ha sido declinado");
            cargarQuejas();
          } catch (error) {
            Alert.alert("Error", "No se pudo declinar el caso");
          }
        },
      },
    ]);
  };

  const abrirChat = (queja) => {
    navigation.navigate("ChatLegal", { queja });
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
      Pendiente: "⚡",
      "En revisión": "🔍",
      "En seguimiento": "💬",
      Atendido: "✅",
      Rechazado: "❌",
    };
    return iconos[estado] || "📋";
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, item.estado === "Pendiente" && styles.cardPendiente]}
      onPress={() => {
        setSelectedQueja(item);
        setNuevoEstado(item.estado || "En revisión");
        setRespuesta(item.respuesta || "");
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardIcon}>{getEstadoIcon(item.estado)}</Text>
          <Text style={styles.cardTitulo} numberOfLines={1}>
            {item.nombre_implicado || "Caso legal"}
          </Text>
        </View>
        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(item.estado) },
          ]}
        >
          <Text style={styles.estadoTexto}>{item.estado || "Pendiente"}</Text>
        </View>
      </View>

      <Text style={styles.cardNombre}>
        {item.es_anonimo
          ? "🔒 Anónimo"
          : `👤 ${item.nombre_completo || "Usuario"}`}
      </Text>

      <Text style={styles.cardDescripcion} numberOfLines={2}>
        {item.descripcion}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardFecha}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.estado === "Pendiente" && (
          <View style={styles.cardAcciones}>
            <TouchableOpacity
              style={[styles.accionBtn, styles.accionAceptar]}
              onPress={() => handleAceptar(item._id)}
            >
              <Text style={styles.accionBtnTexto}>✅ Aceptar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.accionBtn, styles.accionDeclinar]}
              onPress={() => handleDeclinar(item._id)}
            >
              <Text style={styles.accionBtnTexto}>❌ Declinar</Text>
            </TouchableOpacity>
          </View>
        )}
        {item.estado === "En seguimiento" && (
          <TouchableOpacity
            style={[styles.accionBtn, styles.accionChat]}
            onPress={() => abrirChat(item)}
          >
            <Text style={styles.accionBtnTexto}>💬 Ver Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitulo}>👩‍⚖️ Dashboard Legal</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>
            {quejas.filter((q) => q.estado === "Pendiente").length}
          </Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>
            {quejas.filter((q) => q.estado === "En revisión").length}
          </Text>
          <Text style={styles.statLabel}>En revisión</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>
            {quejas.filter((q) => q.estado === "En seguimiento").length}
          </Text>
          <Text style={styles.statLabel}>En seguimiento</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumero, { color: "#27ae60" }]}>
            {quejas.filter((q) => q.estado === "Atendido").length}
          </Text>
          <Text style={styles.statLabel}>Atendidos</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.cargandoTexto}>Cargando casos...</Text>
        </View>
      ) : (
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
              <Ionicons name="checkmark-circle" size={60} color="#27ae60" />
              <Text style={styles.vacioTexto}>No hay casos pendientes</Text>
              <Text style={styles.vacioSubtexto}>¡Todo está al día!</Text>
            </View>
          }
        />
      )}

      {/* Modal de detalle */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedQueja(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Detalle del Caso</Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedQueja(null);
                  }}
                >
                  <Ionicons name="close" size={28} color="#e74c3c" />
                </TouchableOpacity>
              </View>

              {selectedQueja && (
                <>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Estado:</Text>
                    <View
                      style={[
                        styles.modalEstadoBadge,
                        {
                          backgroundColor: getEstadoColor(selectedQueja.estado),
                        },
                      ]}
                    >
                      <Text style={styles.modalEstadoTexto}>
                        {selectedQueja.estado}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>
                      Persona involucrada:
                    </Text>
                    <Text style={styles.modalInfoText}>
                      {selectedQueja.nombre_implicado || "No especificado"}
                    </Text>
                  </View>

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Relación:</Text>
                    <Text style={styles.modalInfoText}>
                      {selectedQueja.relacion || "No especificada"}
                    </Text>
                  </View>

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Contacto:</Text>
                    <Text style={styles.modalInfoText}>
                      {selectedQueja.contacto || "No especificado"}
                    </Text>
                  </View>

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Solicitante:</Text>
                    <Text style={styles.modalInfoText}>
                      {selectedQueja.es_anonimo
                        ? "🔒 Anónimo"
                        : selectedQueja.nombre_completo}
                    </Text>
                  </View>

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Descripción:</Text>
                    <Text
                      style={[styles.modalInfoText, styles.modalDescripcion]}
                    >
                      {selectedQueja.descripcion}
                    </Text>
                  </View>

                  {selectedQueja.respuesta && (
                    <View style={styles.modalInfo}>
                      <Text style={styles.modalInfoLabel}>Respuesta:</Text>
                      <Text
                        style={[styles.modalInfoText, styles.modalRespuesta]}
                      >
                        {selectedQueja.respuesta}
                      </Text>
                    </View>
                  )}

                  {selectedQueja.estado === "En seguimiento" && (
                    <TouchableOpacity
                      style={styles.botonChat}
                      onPress={() => {
                        setModalVisible(false);
                        abrirChat(selectedQueja);
                      }}
                    >
                      <Ionicons name="chatbubbles" size={20} color="#fff" />
                      <Text style={styles.botonChatTexto}>Ir al Chat</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#1E1B3A",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2D1B69",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumero: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  statLabel: { color: "#666", fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#2D1B69" },
  lista: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
  cardPendiente: { borderColor: "#f39c12", borderWidth: 2 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  cardIcon: { fontSize: 18 },
  cardTitulo: { color: "#fff", fontSize: 16, fontWeight: "bold", flex: 1 },
  estadoBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  estadoTexto: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  cardNombre: { color: "#9B6DFF", fontSize: 13, marginBottom: 6 },
  cardDescripcion: { color: "#ccc", fontSize: 14, lineHeight: 20 },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  cardFecha: { color: "#666", fontSize: 12 },
  cardAcciones: { flexDirection: "row", gap: 8 },
  accionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  accionAceptar: { backgroundColor: "#27ae60" },
  accionDeclinar: { backgroundColor: "#e74c3c" },
  accionChat: { backgroundColor: "#7C3AED" },
  accionBtnTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
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
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  modalInfo: { marginBottom: 12 },
  modalInfoLabel: {
    color: "#9B6DFF",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  modalInfoText: { color: "#ccc", fontSize: 14 },
  modalDescripcion: { lineHeight: 20, marginTop: 4 },
  modalRespuesta: { color: "#7C3AED", fontStyle: "italic" },
  modalEstadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  modalEstadoTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  botonChat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 10,
  },
  botonChatTexto: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

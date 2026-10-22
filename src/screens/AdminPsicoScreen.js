// src/screens/AdminPsicoScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { consultasPsicopedagogiaService } from "../services/api";

export default function AdminPsicoScreen({ navigation }) {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("En revisión");

  useEffect(() => {
    cargarConsultas();
  }, []);

  const cargarConsultas = async () => {
    try {
      setLoading(true);
      const data = await consultasPsicopedagogiaService.getConsultas();
      setConsultas(data);
    } catch (error) {
      console.error("Error cargando consultas:", error);
      Alert.alert("Error", "No se pudieron cargar las consultas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarConsultas();
  };

  const handleResponder = async () => {
    if (!respuesta.trim()) {
      Alert.alert("Error", "Por favor escribe una respuesta");
      return;
    }

    try {
      await consultasPsicopedagogiaService.actualizarEstado(
        selectedConsulta._id,
        nuevoEstado,
        respuesta,
      );
      Alert.alert("Éxito", "Consulta actualizada correctamente");
      setModalVisible(false);
      setRespuesta("");
      setSelectedConsulta(null);
      cargarConsultas();
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "No se pudo actualizar la consulta",
      );
    }
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
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedConsulta(item);
        setNuevoEstado(item.estado || "En revisión");
        setRespuesta(item.respuesta || "");
        setModalVisible(true);
      }}
    >
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

      <Text style={styles.cardNombre}>
        {item.es_anonimo
          ? "🔒 Anónimo"
          : `👤 ${item.nombre_autor || "Usuario"}`}
      </Text>

      <Text style={styles.cardDescripcion} numberOfLines={2}>
        {item.descripcion}
      </Text>

      <Text style={styles.cardFecha}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
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
        <Text style={styles.headerTitulo}>🧠 Admin Psicopedagogía</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subHeaderText}>
          {consultas.length} consultas pendientes
        </Text>
      </View>

      {loading ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.cargandoTexto}>Cargando consultas...</Text>
        </View>
      ) : (
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
              <Ionicons name="checkmark-circle" size={60} color="#27ae60" />
              <Text style={styles.vacioTexto}>No hay consultas pendientes</Text>
              <Text style={styles.vacioSubtexto}>¡Todo está al día!</Text>
            </View>
          }
        />
      )}

      {/* Modal de respuesta */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedConsulta(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>Responder consulta</Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedConsulta(null);
                  }}
                >
                  <Ionicons name="close" size={28} color="#e74c3c" />
                </TouchableOpacity>
              </View>

              {selectedConsulta && (
                <>
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Tipo:</Text>
                    <Text style={styles.modalInfoText}>
                      {selectedConsulta.tipo}
                    </Text>
                  </View>

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Usuario:</Text>
                    <Text style={styles.modalInfoText}>
                      {selectedConsulta.es_anonimo
                        ? "🔒 Anónimo"
                        : selectedConsulta.nombre_autor}
                    </Text>
                  </View>

                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoLabel}>Descripción:</Text>
                    <Text style={styles.modalInfoText}>
                      {selectedConsulta.descripcion}
                    </Text>
                  </View>

                  <Text style={styles.label}>Estado</Text>
                  <TextInput
                    style={styles.input}
                    value={nuevoEstado}
                    onChangeText={setNuevoEstado}
                    placeholder="En revisión, Atendido, Rechazado..."
                    placeholderTextColor="#666"
                  />

                  <Text style={styles.label}>Respuesta</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={respuesta}
                    onChangeText={setRespuesta}
                    placeholder="Escribe tu respuesta..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleResponder}
                  >
                    <Text style={styles.submitBtnText}>Responder</Text>
                  </TouchableOpacity>
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
  subHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#1E1B3A",
    borderBottomWidth: 1,
    borderBottomColor: "#2D1B69",
  },
  subHeaderText: {
    color: "#9B6DFF",
    fontSize: 14,
    fontWeight: "500",
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
    marginBottom: 8,
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
  cardNombre: {
    color: "#9B6DFF",
    fontSize: 13,
    marginBottom: 6,
  },
  cardDescripcion: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
  },
  cardFecha: {
    color: "#666",
    fontSize: 12,
    marginTop: 8,
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
    color: "#27ae60",
    fontSize: 18,
    marginTop: 10,
  },
  vacioSubtexto: {
    color: "#666",
    fontSize: 14,
    marginTop: 5,
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
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalInfo: {
    marginBottom: 12,
  },
  modalInfoLabel: {
    color: "#9B6DFF",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  modalInfoText: {
    color: "#ccc",
    fontSize: 14,
  },
  label: {
    color: "#9B6DFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0D0D1A",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

// src/screens/LegalScreen.js
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { legalesService } from "../services/api";

const LegalScreen = () => {
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    tipo: "Familiar",
    estado: "Pendiente",
    abogado: "",
    observaciones: "",
  });

  useEffect(() => {
    cargarCasos();
  }, []);

  const cargarCasos = async () => {
    try {
      setLoading(true);
      const data = await legalesService.getDocumentos();
      setCasos(data);
    } catch (error) {
      console.error("Error al cargar casos:", error);
      Alert.alert("Error", "No se pudieron cargar los casos legales.");
    } finally {
      setLoading(false);
    }
  };

  const guardarCaso = async () => {
    try {
      if (!formData.titulo.trim()) {
        Alert.alert("Error", "El título es obligatorio");
        return;
      }
      if (editando) {
        await legalesService.actualizarDocumento(editando, formData);
      } else {
        await legalesService.crearDocumento(formData);
      }
      Alert.alert(
        "Éxito",
        editando ? "Caso actualizado" : "Caso creado correctamente",
      );
      setModalVisible(false);
      setEditando(null);
      resetForm();
      cargarCasos();
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", error.message || "No se pudo guardar el caso");
    }
  };

  const eliminarCaso = (id, titulo) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás segura de eliminar "${titulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await legalesService.eliminarDocumento(id);
              Alert.alert("Éxito", "Caso eliminado correctamente");
              cargarCasos();
            } catch (error) {
              console.error("Error al eliminar:", error);
              Alert.alert("Error", "No se pudo eliminar el caso");
            }
          },
        },
      ],
    );
  };

  const editarCaso = (caso) => {
    setEditando(caso._id);
    setFormData({
      titulo: caso.titulo,
      descripcion: caso.descripcion || "",
      tipo: caso.tipo || "Familiar",
      estado: caso.estado || "Pendiente",
      abogado: caso.abogado || "",
      observaciones: caso.observaciones || "",
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      tipo: "Familiar",
      estado: "Pendiente",
      abogado: "",
      observaciones: "",
    });
    setEditando(null);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => editarCaso(item)}
      onLongPress={() => eliminarCaso(item._id, item.titulo)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitulo}>{item.titulo}</Text>
        <View
          style={[
            styles.estadoBadge,
            {
              backgroundColor:
                item.estado === "Resuelto"
                  ? "#27ae60"
                  : item.estado === "En proceso"
                    ? "#f39c12"
                    : "#e74c3c",
            },
          ]}
        >
          <Text style={styles.estadoTexto}>{item.estado || "Pendiente"}</Text>
        </View>
      </View>
      <Text style={styles.cardDescripcion} numberOfLines={2}>
        {item.descripcion || "Sin descripción"}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardTipo}>📋 {item.tipo || "General"}</Text>
        {item.abogado && (
          <Text style={styles.cardAbogado}>⚖️ {item.abogado}</Text>
        )}
      </View>
      <Text style={styles.cardFecha}>
        {new Date(item.createdAt || Date.now()).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>⚖️ Casos Legales</Text>
        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.botonAgregarTexto}>Nuevo Caso</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.cargandoTexto}>Cargando casos...</Text>
        </View>
      ) : (
        <FlatList
          data={casos}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="folder-open" size={60} color="#bdc3c7" />
              <Text style={styles.vacioTexto}>No hay casos legales</Text>
              <Text style={styles.vacioSubtexto}>
                Toca "+" para agregar uno
              </Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>
                  {editando ? "✏️ Editar Caso" : "📝 Nuevo Caso Legal"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                >
                  <Ionicons name="close" size={28} color="#e74c3c" />
                </TouchableOpacity>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Título *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.titulo}
                  onChangeText={(text) =>
                    setFormData({ ...formData, titulo: text })
                  }
                  placeholder="Ej: Caso de custodia familiar"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.descripcion}
                  onChangeText={(text) =>
                    setFormData({ ...formData, descripcion: text })
                  }
                  placeholder="Describe el caso..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Tipo</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.tipo}
                    onChangeText={(text) =>
                      setFormData({ ...formData, tipo: text })
                    }
                    placeholder="Familiar, Civil..."
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Estado</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.estado}
                    onChangeText={(text) =>
                      setFormData({ ...formData, estado: text })
                    }
                    placeholder="Pendiente, En proceso..."
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Abogado/a</Text>
                <TextInput
                  style={styles.input}
                  value={formData.abogado}
                  onChangeText={(text) =>
                    setFormData({ ...formData, abogado: text })
                  }
                  placeholder="Nombre del abogado/a"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.observaciones}
                  onChangeText={(text) =>
                    setFormData({ ...formData, observaciones: text })
                  }
                  placeholder="Observaciones adicionales..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>
              <TouchableOpacity
                style={styles.botonGuardar}
                onPress={guardarCaso}
              >
                <Text style={styles.botonGuardarTexto}>
                  {editando ? "Actualizar Caso" : "Guardar Caso"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonCancelar}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#2c3e50",
    borderBottomWidth: 1,
    borderBottomColor: "#34495e",
  },
  headerTitulo: { fontSize: 22, fontWeight: "bold", color: "white" },
  botonAgregar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  botonAgregarTexto: { color: "white", marginLeft: 5, fontWeight: "bold" },
  lista: { padding: 15, paddingBottom: 30 },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitulo: { fontSize: 17, fontWeight: "bold", color: "#2c3e50", flex: 1 },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  estadoTexto: { color: "white", fontSize: 11, fontWeight: "bold" },
  cardDescripcion: { fontSize: 14, color: "#7f8c8d", marginBottom: 8 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  cardTipo: { fontSize: 12, color: "#3498db" },
  cardAbogado: { fontSize: 12, color: "#9b59b6" },
  cardFecha: { fontSize: 11, color: "#95a5a6", marginTop: 5 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },
  cargandoTexto: { marginTop: 10, color: "#7f8c8d" },
  vacio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  vacioTexto: { fontSize: 18, color: "#7f8c8d", marginTop: 10 },
  vacioSubtexto: { fontSize: 14, color: "#bdc3c7", marginTop: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitulo: { fontSize: 20, fontWeight: "bold", color: "#2c3e50" },
  formGroup: { marginBottom: 15 },
  formRow: { flexDirection: "row" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#34495e" },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  botonGuardar: {
    backgroundColor: "#27ae60",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  botonGuardarTexto: { color: "white", fontSize: 16, fontWeight: "bold" },
  botonCancelar: { padding: 12, alignItems: "center", marginTop: 5 },
  botonCancelarTexto: { color: "#e74c3c", fontSize: 15 },
});

export default LegalScreen;

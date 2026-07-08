// src/screens/PsicopedagogiaScreen.js
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
import { psicopedagogiaService } from "../services/api";

const PsicopedagogiaScreen = () => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombreEstudiante: "",
    edad: "",
    diagnostico: "",
    dificultades: "",
    estado: "En evaluación",
    observaciones: "",
  });

  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      const data = await psicopedagogiaService.getRecursos();
      setEvaluaciones(data);
    } catch (error) {
      console.error("Error al cargar evaluaciones:", error);
      Alert.alert("Error", "No se pudieron cargar las evaluaciones");
    } finally {
      setLoading(false);
    }
  };

  const guardarEvaluacion = async () => {
    try {
      if (!formData.nombreEstudiante.trim()) {
        Alert.alert("Error", "El nombre del estudiante es obligatorio");
        return;
      }
      if (editando) {
        await psicopedagogiaService.actualizarRecurso(editando, formData);
      } else {
        await psicopedagogiaService.crearRecurso(formData);
      }
      Alert.alert(
        "Éxito",
        editando ? "Evaluación actualizada" : "Evaluación creada",
      );
      setModalVisible(false);
      setEditando(null);
      resetForm();
      cargarEvaluaciones();
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", error.message || "No se pudo guardar la evaluación");
    }
  };

  const eliminarEvaluacion = (id, nombre) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Eliminar evaluación de "${nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await psicopedagogiaService.eliminarRecurso(id);
              Alert.alert("Éxito", "Evaluación eliminada");
              cargarEvaluaciones();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar");
            }
          },
        },
      ],
    );
  };

  const editarEvaluacion = (item) => {
    setEditando(item._id);
    setFormData({
      nombreEstudiante: item.nombreEstudiante,
      edad: item.edad?.toString() || "",
      diagnostico: item.diagnostico || "",
      dificultades: item.dificultades || "",
      estado: item.estado || "En evaluación",
      observaciones: item.observaciones || "",
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      nombreEstudiante: "",
      edad: "",
      diagnostico: "",
      dificultades: "",
      estado: "En evaluación",
      observaciones: "",
    });
    setEditando(null);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => editarEvaluacion(item)}
      onLongPress={() => eliminarEvaluacion(item._id, item.nombreEstudiante)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitulo}>{item.nombreEstudiante}</Text>
        <View
          style={[
            styles.estadoBadge,
            {
              backgroundColor:
                item.estado === "Finalizado"
                  ? "#27ae60"
                  : item.estado === "En seguimiento"
                    ? "#f39c12"
                    : "#3498db",
            },
          ]}
        >
          <Text style={styles.estadoTexto}>
            {item.estado || "En evaluación"}
          </Text>
        </View>
      </View>
      {item.diagnostico && (
        <Text style={styles.cardDiagnostico}>🔍 {item.diagnostico}</Text>
      )}
      {item.dificultades && (
        <Text style={styles.cardDificultades} numberOfLines={2}>
          ⚠️ {item.dificultades}
        </Text>
      )}
      <View style={styles.cardFooter}>
        {item.edad && <Text style={styles.cardEdad}>🎂 {item.edad} años</Text>}
        <Text style={styles.cardFecha}>
          {new Date(item.createdAt || Date.now()).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>🧠 Psicopedagogía</Text>
        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.botonAgregarTexto}>Nueva Eva.</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#9b59b6" />
          <Text style={styles.cargandoTexto}>Cargando evaluaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={evaluaciones}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="people" size={60} color="#bdc3c7" />
              <Text style={styles.vacioTexto}>Sin evaluaciones</Text>
              <Text style={styles.vacioSubtexto}>
                Agrega una nueva evaluación
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
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>
                  {editando ? "✏️ Editar Evaluación" : "📝 Nueva Evaluación"}
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
                <Text style={styles.label}>Nombre del Estudiante *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nombreEstudiante}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nombreEstudiante: text })
                  }
                  placeholder="Nombre completo"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Edad</Text>
                <TextInput
                  style={styles.input}
                  value={formData.edad}
                  onChangeText={(text) =>
                    setFormData({ ...formData, edad: text })
                  }
                  placeholder="Edad del estudiante"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Diagnóstico</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.diagnostico}
                  onChangeText={(text) =>
                    setFormData({ ...formData, diagnostico: text })
                  }
                  placeholder="Diagnóstico principal"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Dificultades</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.dificultades}
                  onChangeText={(text) =>
                    setFormData({ ...formData, dificultades: text })
                  }
                  placeholder="Dificultades detectadas"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Estado</Text>
                <TextInput
                  style={styles.input}
                  value={formData.estado}
                  onChangeText={(text) =>
                    setFormData({ ...formData, estado: text })
                  }
                  placeholder="En evaluación, En seguimiento..."
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
                  placeholder="Observaciones adicionales"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>
              <TouchableOpacity
                style={styles.botonGuardar}
                onPress={guardarEvaluacion}
              >
                <Text style={styles.botonGuardarTexto}>
                  {editando ? "Actualizar" : "Guardar Evaluación"}
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
    backgroundColor: "#8e44ad",
    borderBottomWidth: 1,
    borderBottomColor: "#9b59b6",
  },
  headerTitulo: { fontSize: 22, fontWeight: "bold", color: "white" },
  botonAgregar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ecc71",
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
  cardDiagnostico: { fontSize: 14, color: "#2c3e50", marginBottom: 4 },
  cardDificultades: { fontSize: 13, color: "#e67e22", marginBottom: 8 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardEdad: { fontSize: 12, color: "#3498db" },
  cardFecha: { fontSize: 11, color: "#95a5a6" },
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
    backgroundColor: "#9b59b6",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  botonGuardarTexto: { color: "white", fontSize: 16, fontWeight: "bold" },
  botonCancelar: { padding: 12, alignItems: "center", marginTop: 5 },
  botonCancelarTexto: { color: "#e74c3c", fontSize: 15 },
});

export default PsicopedagogiaScreen;

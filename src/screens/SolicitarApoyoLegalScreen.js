// src/screens/SolicitarApoyoLegalScreen.js
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { quejasLegalesService } from "../services/api";

export default function SolicitarApoyoLegalScreen({ navigation }) {
  const { user } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  const [formData, setFormData] = useState({
    nombreImplicado: "",
    relacion: "",
    contacto: "",
    descripcion: "",
    nombreCompleto: user?.nombre_completo || "",
    correo: user?.correo_institucional || "",
  });

  const handleChange = (campo, valor) => {
    setFormData({ ...formData, [campo]: valor });
  };

  const seleccionarImagen = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImagenes([...imagenes, base64]);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const eliminarImagen = (index) => {
    const nuevasImagenes = [...imagenes];
    nuevasImagenes.splice(index, 1);
    setImagenes(nuevasImagenes);
  };

  const handleSubmit = async () => {
    if (!formData.nombreImplicado.trim()) {
      Alert.alert(
        "Error",
        "Por favor ingresa el nombre de la persona involucrada",
      );
      return;
    }
    if (!formData.descripcion.trim()) {
      Alert.alert("Error", "Por favor describe la situación");
      return;
    }

    setCargando(true);
    try {
      await quejasLegalesService.crearQueja({
        nombre_implicado: formData.nombreImplicado,
        relacion: formData.relacion,
        contacto: formData.contacto,
        descripcion: formData.descripcion,
        nombre_completo: esAnonimo ? null : formData.nombreCompleto,
        correo: esAnonimo ? null : formData.correo,
        es_anonimo: esAnonimo,
        imagenes: imagenes.length > 0 ? imagenes : null,
        estado: "Pendiente",
      });

      Alert.alert(
        "✅ ¡Solicitud enviada!",
        "Tu caso ha sido registrado. El equipo legal revisará tu solicitud y te contactará pronto.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo enviar la solicitud");
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>🆘 Solicitar Apoyo Legal</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.alertaContainer}>
            <Ionicons name="shield-checkmark" size={24} color="#9B6DFF" />
            <Text style={styles.alertaTexto}>
              Esta información es confidencial y solo será vista por el equipo
              legal
            </Text>
          </View>

          <Text style={styles.seccionTitulo}>👤 Persona Involucrada</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre completo *</Text>
            <TextInput
              style={styles.input}
              value={formData.nombreImplicado}
              onChangeText={(v) => handleChange("nombreImplicado", v)}
              placeholder="Nombre de la persona"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Relación con la persona</Text>
            <TextInput
              style={styles.input}
              value={formData.relacion}
              onChangeText={(v) => handleChange("relacion", v)}
              placeholder="Ej: Compañera de trabajo, Familiar, etc."
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contacto (teléfono/correo)</Text>
            <TextInput
              style={styles.input}
              value={formData.contacto}
              onChangeText={(v) => handleChange("contacto", v)}
              placeholder="Datos de contacto"
              placeholderTextColor="#666"
            />
          </View>

          <Text style={styles.seccionTitulo}>📝 Descripción del Caso</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Describe la situación *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descripcion}
              onChangeText={(v) => handleChange("descripcion", v)}
              placeholder="Describe detalladamente lo sucedido..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.seccionTitulo}>📎 Evidencias</Text>

          <TouchableOpacity
            style={styles.imagePickerBtn}
            onPress={seleccionarImagen}
          >
            <Ionicons name="camera" size={24} color="#9B6DFF" />
            <Text style={styles.imagePickerText}>Agregar foto o captura</Text>
          </TouchableOpacity>

          {imagenes.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagenesContainer}
            >
              {imagenes.map((img, index) => (
                <View key={index} style={styles.imagenWrapper}>
                  <Image source={{ uri: img }} style={styles.imagenPreview} />
                  <TouchableOpacity
                    style={styles.eliminarImagenBtn}
                    onPress={() => eliminarImagen(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.anonimoContainer}>
            <View>
              <Text style={styles.anonimoLabel}>
                Solicitar de forma anónima
              </Text>
              <Text style={styles.anonimoSubtexto}>
                Tu nombre no aparecerá en el caso
              </Text>
            </View>
            <Switch
              value={esAnonimo}
              onValueChange={setEsAnonimo}
              trackColor={{ false: "#1E1B3A", true: "#7C3AED" }}
              thumbColor={esAnonimo ? "#fff" : "#666"}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, cargando && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Enviar solicitud</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerTexto}>
            🔒 Todos los datos serán tratados con confidencialidad
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: { padding: 20 },
  alertaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  alertaTexto: {
    color: "#9B6DFF",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  seccionTitulo: {
    color: "#7C3AED",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 16,
  },
  formGroup: { marginBottom: 16 },
  label: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1E1B3A",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  imagePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#7C3AED",
    borderStyle: "dashed",
    gap: 10,
  },
  imagePickerText: { color: "#9B6DFF", fontSize: 15 },
  imagenesContainer: { flexDirection: "row", marginTop: 10 },
  imagenWrapper: { position: "relative", marginRight: 10 },
  imagenPreview: { width: 80, height: 80, borderRadius: 8 },
  eliminarImagenBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#0D0D1A",
    borderRadius: 12,
  },
  anonimoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  anonimoLabel: { color: "#fff", fontSize: 15, fontWeight: "500" },
  anonimoSubtexto: { color: "#666", fontSize: 12, marginTop: 4 },
  submitBtn: {
    backgroundColor: "#7C3AED",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 25,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  footerTexto: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
});

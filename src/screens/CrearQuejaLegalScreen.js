// src/screens/CrearQuejaLegalScreen.js
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

export default function CrearQuejaLegalScreen({ navigation }) {
  const { user } = useAuth();
  const [descripcion, setDescripcion] = useState("");
  const [imagenes, setImagenes] = useState([]);
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [tipoQueja, setTipoQueja] = useState("Laboral");

  const tiposQueja = [
    "Laboral",
    "Académico",
    "Discriminación",
    "Acoso",
    "Familiar",
    "Civil",
    "Otro",
  ];

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
    if (!descripcion.trim()) {
      Alert.alert("Error", "Por favor describe tu queja");
      return;
    }

    setCargando(true);
    try {
      await quejasLegalesService.crearQueja({
        descripcion,
        tipo: tipoQueja,
        imagenes: imagenes.length > 0 ? imagenes : null,
        es_anonimo: esAnonimo,
        nombre_autor: esAnonimo ? null : user?.nombre_completo,
      });

      Alert.alert(
        "✅ ¡Queja enviada!",
        "Tu queja ha sido enviada al departamento legal. Recibirás una respuesta pronto.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo enviar la queja");
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
          <Text style={styles.headerTitulo}>⚖️ Nueva Queja Legal</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Tipo de queja</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tiposContainer}
          >
            {tiposQueja.map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.tipoBtn,
                  tipoQueja === tipo && styles.tipoBtnActive,
                ]}
                onPress={() => setTipoQueja(tipo)}
              >
                <Text
                  style={[
                    styles.tipoBtnText,
                    tipoQueja === tipo && styles.tipoBtnTextActive,
                  ]}
                >
                  {tipo}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Descripción de la queja</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe detalladamente tu queja..."
            placeholderTextColor="#666"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Fotos (opcional)</Text>
          <TouchableOpacity
            style={styles.imagePickerBtn}
            onPress={seleccionarImagen}
          >
            <Ionicons name="camera" size={24} color="#9B6DFF" />
            <Text style={styles.imagePickerText}>Agregar foto</Text>
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
              <Text style={styles.anonimoLabel}>Publicar de forma anónima</Text>
              <Text style={styles.anonimoSubtexto}>
                Tu nombre no aparecerá en la queja
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
              <Text style={styles.submitBtnText}>Enviar queja</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.confidencialidad}>
            🔒 Esta queja es confidencial y será tratada con la máxima seriedad
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    padding: 20,
  },
  label: {
    color: "#9B6DFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 20,
  },
  tiposContainer: {
    flexDirection: "row",
    marginBottom: 5,
  },
  tipoBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1E1B3A",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
  tipoBtnActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  tipoBtnText: {
    color: "#aaa",
    fontSize: 14,
  },
  tipoBtnTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  textArea: {
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 15,
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
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
  imagePickerText: {
    color: "#9B6DFF",
    fontSize: 15,
  },
  imagenesContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  imagenWrapper: {
    position: "relative",
    marginRight: 10,
  },
  imagenPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
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
  anonimoLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  anonimoSubtexto: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: "#7C3AED",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 30,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  confidencialidad: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
});

// src/screens/CrearPublicacionScreen.js
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const categorias = ["pregunta", "consejo", "experiencia", "recurso", "otro"];

export default function CrearPublicacionScreen({ navigation }) {
  const { user } = useAuth();
  const [contenido, setContenido] = useState("");
  const [categoria, setCategoria] = useState("pregunta");
  const [esAnonima, setEsAnonima] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [imagen, setImagen] = useState(null);

  const handlePublicar = async () => {
    if (!contenido.trim()) {
      Alert.alert("Error", "Escribe algo para publicar");
      return;
    }
    setCargando(true);
    try {
      const res = await api.post("/publicaciones", {
        contenido,
        categoria,
        es_anonima: esAnonima,
        nombre_autor: user?.nombre_completo,
        imagen_url: imagen || null,
      });
      Alert.alert("¡Publicado! 🌸", "Tu publicación ya está visible", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.mensaje || "Error al publicar");
    } finally {
      setCargando(false);
    }
  };

  const seleccionarImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.2,
      base64: true,
    });
    if (!resultado.canceled) {
      const base64 = resultado.assets[0].base64;
      if (base64.length > 500000) {
        Alert.alert(
          "Imagen muy grande",
          "Por favor selecciona una imagen más pequeña",
        );
        return;
      }
      setImagen(`data:image/jpeg;base64,${base64}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelar}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Nueva publicación</Text>
        <TouchableOpacity
          style={styles.botonPublicar}
          onPress={handlePublicar}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.publicarTexto}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>CATEGORÍA</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriasRow}
        >
          {categorias.map((cat, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.categoriaBtn,
                categoria === cat && styles.categoriaBtnActivo,
              ]}
              onPress={() => setCategoria(cat)}
            >
              <Text
                style={[
                  styles.categoriaTxt,
                  categoria === cat && styles.categoriaTxtActivo,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>¿QUÉ QUIERES COMPARTIR?</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe aquí..."
          placeholderTextColor="#555"
          value={contenido}
          onChangeText={setContenido}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.imagenBtn} onPress={seleccionarImagen}>
          <Text style={styles.imagenBtnTexto}>📷 Agregar imagen</Text>
        </TouchableOpacity>

        {imagen && (
          <View style={styles.imagenPreview}>
            <Image source={{ uri: imagen }} style={styles.imagenImg} />
            <TouchableOpacity
              style={styles.quitarImagen}
              onPress={() => setImagen(null)}
            >
              <Text style={styles.quitarImagenTexto}>✕ Quitar</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.anonimaRow}>
          <View>
            <Text style={styles.anonimaTexto}>Publicar anónimamente</Text>
            <Text style={styles.anonimaSubtexto}>
              Tu nombre no aparecerá en la publicación
            </Text>
          </View>
          <Switch
            value={esAnonima}
            onValueChange={setEsAnonima}
            trackColor={{ false: "#1E1B3A", true: "#7C3AED" }}
            thumbColor={esAnonima ? "#fff" : "#666"}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D1A" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1B3A",
  },
  cancelar: { color: "#9B6DFF", fontSize: 16 },
  titulo: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  botonPublicar: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  publicarTexto: { color: "#fff", fontWeight: "bold" },
  content: { padding: 20 },
  label: {
    fontSize: 11,
    color: "#aaa",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 20,
  },
  categoriasRow: { marginBottom: 8 },
  categoriaBtn: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoriaBtnActivo: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  categoriaTxt: { color: "#666", fontSize: 13 },
  categoriaTxtActivo: { color: "#fff" },
  input: {
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 15,
    minHeight: 150,
  },
  anonimaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  anonimaTexto: { color: "#fff", fontSize: 15 },
  anonimaSubtexto: { color: "#666", fontSize: 12, marginTop: 4 },
  imagenBtn: {
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#7C3AED",
    borderStyle: "dashed",
  },
  imagenBtnTexto: { color: "#9B6DFF", fontSize: 15 },
  imagenPreview: { marginTop: 12, borderRadius: 12, overflow: "hidden" },
  imagenImg: { width: "100%", height: 200, borderRadius: 12 },
  quitarImagen: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    alignItems: "center",
  },
  quitarImagenTexto: { color: "#fff", fontSize: 13 },
});

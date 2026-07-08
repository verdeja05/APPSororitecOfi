// src/screens/PerfilScreen.js
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function PerfilScreen({ navigation }) {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    carrera: "",
    cuatrimestre: "",
    telefono: "",
    foto_perfil: null,
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const res = await api.get("/perfil/mi-perfil");
      setPerfil(res.data);
      setForm({
        bio: res.data.bio || "",
        carrera: res.data.carrera || "",
        cuatrimestre: res.data.cuatrimestre?.toString() || "",
        telefono: res.data.telefono || "",
        foto_perfil: res.data.foto_perfil || null,
      });
    } catch (err) {
      Alert.alert("Error", "No se pudo cargar el perfil");
    } finally {
      setCargando(false);
    }
  };

  const elegirFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setForm((prev) => ({ ...prev, foto_perfil: base64 }));
    }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    try {
      const res = await api.put("/perfil/actualizar", {
        ...form,
        cuatrimestre: form.cuatrimestre ? parseInt(form.cuatrimestre) : null,
      });
      setPerfil(res.data.usuaria);
      setEditando(false);
      Alert.alert("✅ ¡Listo!", "Tu perfil fue actualizado");
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBg}>
        <TouchableOpacity
          style={styles.volverBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.volverTexto}>{"< Volver"}</Text>
        </TouchableOpacity>
        {editando && (
          <TouchableOpacity
            style={styles.editarBtn}
            onPress={() => setEditando(false)}
          >
            <Text style={styles.editarTexto}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.perfilHeader}>
        <TouchableOpacity
          style={styles.fotoContainer}
          onPress={editando ? elegirFoto : null}
          activeOpacity={editando ? 0.7 : 1}
        >
          {form.foto_perfil ? (
            <Image source={{ uri: form.foto_perfil }} style={styles.foto} />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.fotoEmoji}>👩</Text>
            </View>
          )}
          {editando && (
            <View style={styles.fotoOverlay}>
              <Text style={styles.fotoOverlayTexto}>+</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.nombre}>{perfil?.nombre_completo}</Text>
        <Text style={styles.username}>
          @{perfil?.nombre_completo?.split(" ")[0]?.toLowerCase()}
        </Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolTexto}>
            {perfil?.rol === "acompanante"
              ? "🌸 Acompañante"
              : perfil?.rol === "administradora"
                ? "👑 Administradora"
                : "💜 Sorori"}
          </Text>
        </View>
      </View>

      <View style={styles.seccion}>
        {editando ? (
          <TextInput
            style={styles.inputBio}
            value={form.bio}
            onChangeText={(t) => setForm((prev) => ({ ...prev, bio: t }))}
            placeholder="Cuéntanos sobre ti..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        ) : (
          <Text style={styles.bio}>
            {perfil?.bio ||
              "🌸 Agrega una bio para que otras sororis te conozcan"}
          </Text>
        )}
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.tarjetaTitulo}>📚 Datos académicos</Text>
        <View style={styles.dato}>
          <Text style={styles.datoLabel}>Carrera</Text>
          {editando ? (
            <TextInput
              style={styles.inputDato}
              value={form.carrera}
              onChangeText={(t) => setForm((prev) => ({ ...prev, carrera: t }))}
              placeholder="Tu carrera"
              placeholderTextColor="#555"
            />
          ) : (
            <Text style={styles.datoValor}>
              {perfil?.carrera || "Sin especificar"}
            </Text>
          )}
        </View>
        <View style={styles.separador} />
        <View style={styles.dato}>
          <Text style={styles.datoLabel}>Cuatrimestre</Text>
          {editando ? (
            <TextInput
              style={styles.inputDato}
              value={form.cuatrimestre}
              onChangeText={(t) =>
                setForm((prev) => ({ ...prev, cuatrimestre: t }))
              }
              placeholder="Ej: 4"
              placeholderTextColor="#555"
              keyboardType="numeric"
              maxLength={2}
            />
          ) : (
            <Text style={styles.datoValor}>
              {perfil?.cuatrimestre
                ? `${perfil.cuatrimestre}° cuatrimestre`
                : "Sin especificar"}
            </Text>
          )}
        </View>
        <View style={styles.separador} />
        <View style={styles.dato}>
          <Text style={styles.datoLabel}>Correo</Text>
          <Text style={styles.datoValor}>{perfil?.correo_institucional}</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.dato}>
          <Text style={styles.datoLabel}>Teléfono</Text>
          {editando ? (
            <TextInput
              style={styles.inputDato}
              value={form.telefono}
              onChangeText={(t) =>
                setForm((prev) => ({ ...prev, telefono: t }))
              }
              placeholder="Tu número"
              placeholderTextColor="#555"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.datoValor}>
              {perfil?.telefono || "Sin especificar"}
            </Text>
          )}
        </View>
        <View style={styles.separador} />
        <View style={styles.dato}>
          <Text style={styles.datoLabel}>Miembro desde</Text>
          <Text style={styles.datoValor}>
            {new Date(perfil?.fecha_registro).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
            })}
          </Text>
        </View>
      </View>

      <View style={styles.botonesContainer}>
        {editando ? (
          <TouchableOpacity
            style={styles.botonGuardar}
            onPress={guardarPerfil}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonTexto}>💾 Guardar cambios</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.botonEditar}
            onPress={() => setEditando(true)}
          >
            <Text style={styles.botonTexto}>✏️ Editar perfil</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D1A" },
  loading: {
    flex: 1,
    backgroundColor: "#0D0D1A",
    justifyContent: "center",
    alignItems: "center",
  },
  headerBg: {
    height: 120,
    backgroundColor: "#1E1B3A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  volverTexto: { color: "#9B6DFF", fontSize: 16 },
  editarTexto: { color: "#ff6b6b", fontSize: 14 },
  perfilHeader: { alignItems: "center", marginTop: -50, paddingBottom: 20 },
  fotoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    position: "relative",
  },
  foto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#7C3AED",
  },
  fotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1E1B3A",
    borderWidth: 3,
    borderColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoEmoji: { fontSize: 44 },
  fotoOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoOverlayTexto: { fontSize: 16, color: "#fff" },
  nombre: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  username: { color: "#9B6DFF", fontSize: 14, marginBottom: 10 },
  rolBadge: {
    backgroundColor: "#2D1B69",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  rolTexto: { color: "#9B6DFF", fontSize: 13, fontWeight: "600" },
  seccion: { marginHorizontal: 20, marginTop: 16 },
  bio: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    fontStyle: "italic",
  },
  inputBio: {
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  tarjeta: {
    backgroundColor: "#1E1B3A",
    borderRadius: 20,
    margin: 20,
    padding: 20,
  },
  tarjetaTitulo: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 16,
  },
  dato: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  datoLabel: { color: "#666", fontSize: 13, flex: 1 },
  datoValor: { color: "#fff", fontSize: 13, flex: 2, textAlign: "right" },
  inputDato: {
    backgroundColor: "#0D0D1A",
    borderRadius: 8,
    padding: 8,
    color: "#fff",
    fontSize: 13,
    flex: 2,
    textAlign: "right",
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
  separador: { height: 1, backgroundColor: "#2D1B69" },
  botonesContainer: { marginHorizontal: 20 },
  botonEditar: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  botonGuardar: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  botonTexto: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});

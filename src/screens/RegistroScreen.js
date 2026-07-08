// src/screens/RegistroScreen.js
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../services/api";

export default function RegistroScreen() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({
    nombre_completo: "",
    correo_institucional: "",
    contrasena: "",
    carrera: "",
    cuatrimestre: "",
  });
  const [cargando, setCargando] = useState(false);

  const handleChange = (campo, valor) => {
    setForm({ ...form, [campo]: valor });
  };

  const handleSiguiente = () => {
    if (!form.nombre_completo || !form.correo_institucional) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }
    setPaso(2);
  };

  const handleRegistro = async () => {
    if (!form.contrasena || !form.carrera || !form.cuatrimestre) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }
    setCargando(true);
    try {
      await api.post("/auth/registro", {
        ...form,
        cuatrimestre: parseInt(form.cuatrimestre),
      });
      Alert.alert(
        "¡Registro exitoso! 🌸",
        "Tu cuenta está pendiente de validación.",
        [{ text: "OK", onPress: () => router.replace("/Login") }],
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.mensaje || "Error al registrarse",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.volver}
        onPress={() => (paso === 1 ? router.back() : setPaso(1))}
      >
        <Text style={styles.volverTexto}>{"< Volver"}</Text>
      </TouchableOpacity>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: paso === 1 ? "50%" : "100%" }]}
        />
      </View>

      <Text style={styles.titulo}>Únete a Sororitec</Text>
      <Text style={styles.subtitulo}>
        Paso {paso} de 2 — {paso === 1 ? "Tus datos" : "Tu carrera"}
      </Text>

      {paso === 1 ? (
        <>
          <Text style={styles.label}>NOMBRE COMPLETO</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ana García"
              placeholderTextColor="#888"
              value={form.nombre_completo}
              onChangeText={(v) => handleChange("nombre_completo", v)}
            />
          </View>

          <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="tu@correo.com"
              placeholderTextColor="#888"
              value={form.correo_institucional}
              onChangeText={(v) => handleChange("correo_institucional", v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.boton} onPress={handleSiguiente}>
            <Text style={styles.botonTexto}>Siguiente →</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>CONTRASEÑA</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#888"
              value={form.contrasena}
              onChangeText={(v) => handleChange("contrasena", v)}
              secureTextEntry
            />
          </View>

          <Text style={styles.label}>CARRERA</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ingeniería en Software"
              placeholderTextColor="#888"
              value={form.carrera}
              onChangeText={(v) => handleChange("carrera", v)}
            />
          </View>

          <Text style={styles.label}>CUATRIMESTRE</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="9"
              placeholderTextColor="#888"
              value={form.cuatrimestre}
              onChangeText={(v) => handleChange("cuatrimestre", v)}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={styles.boton}
            onPress={handleRegistro}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonTexto}>Registrarme →</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.terminos}>
        Al registrarte aceptas nuestros{" "}
        <Text style={styles.link}>Términos</Text> y{" "}
        <Text style={styles.link}>Política de privacidad</Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0D0D1A",
    padding: 24,
    paddingTop: 80,
  },
  volver: { position: "absolute", top: 50, left: 24 },
  volverTexto: { color: "#fff", fontSize: 16 },
  progressBar: {
    height: 4,
    backgroundColor: "#1E1B3A",
    borderRadius: 2,
    marginBottom: 32,
  },
  progressFill: { height: 4, backgroundColor: "#7C3AED", borderRadius: 2 },
  titulo: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitulo: { fontSize: 14, color: "#aaa", marginBottom: 32 },
  label: { fontSize: 11, color: "#aaa", letterSpacing: 1, marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1B3A",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  input: { flex: 1, color: "#fff", paddingVertical: 16, fontSize: 15 },
  boton: {
    backgroundColor: "#7C3AED",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  botonTexto: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  terminos: { color: "#666", textAlign: "center", fontSize: 12, marginTop: 8 },
  link: { color: "#9B6DFF" },
});

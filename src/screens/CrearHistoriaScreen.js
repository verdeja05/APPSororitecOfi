// src/screens/CrearHistoriaScreen.js
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { historiasService } from "../services/api";

const { width, height } = Dimensions.get("window");

const COLORES_FONDO = [
  "#7C3AED",
  "#9C27B0",
  "#E91E63",
  "#F44336",
  "#FF5722",
  "#FF9800",
  "#2196F3",
  "#009688",
  "#1E1B3A",
  "#000000",
];

const COLORES_TEXTO = ["#ffffff", "#000000", "#FFD700", "#FF69B4", "#00FF00"];

export default function CrearHistoriaScreen({ navigation }) {
  const [imagen, setImagen] = useState(null);
  const [contenido, setContenido] = useState("");
  const [colorFondo, setColorFondo] = useState("#7C3AED");
  const [colorTexto, setColorTexto] = useState("#ffffff");
  const [editandoTexto, setEditandoTexto] = useState(false);
  const [mostrarPaleta, setMostrarPaleta] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [modoTexto, setModoTexto] = useState(false);

  const posTexto = useRef(
    new Animated.ValueXY({ x: width / 2 - 100, y: height / 3 }),
  ).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !editandoTexto,
      onPanResponderGrant: () => {
        posTexto.setOffset({ x: posTexto.x._value, y: posTexto.y._value });
        posTexto.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: posTexto.x, dy: posTexto.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: () => posTexto.flattenOffset(),
    }),
  ).current;

  useEffect(() => {
    abrirCamara();
  }, []);

  const abrirCamara = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu cámara");
        setModoTexto(true);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled) {
        setImagen(`data:image/jpeg;base64,${result.assets[0].base64}`);
        setModoTexto(false);
      } else {
        setModoTexto(true);
      }
    } catch (err) {
      console.log("Error camara:", err);
      setModoTexto(true);
    }
  };

  const abrirGaleria = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled) {
        setImagen(`data:image/jpeg;base64,${result.assets[0].base64}`);
        setModoTexto(false);
      }
    } catch (err) {
      console.log("Error galeria:", err);
      Alert.alert("Error", "No se pudo abrir la galería");
    }
  };

  const publicar = async () => {
    if (!imagen && !contenido.trim()) {
      Alert.alert("Error", "Agrega una imagen o escribe algo");
      return;
    }
    setPublicando(true);
    try {
      await historiasService.crearHistoria({
        tipo: imagen ? "imagen" : "texto",
        contenido,
        imagen_url: imagen || null,
        color_fondo: colorFondo,
        color_texto: colorTexto,
      });
      Alert.alert("✅ ¡Publicada!", "Tu historia estará visible 24 horas", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo publicar");
      console.error("Error publicando:", err);
    } finally {
      setPublicando(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Fondo / Imagen */}
      <View
        style={[
          styles.fondo,
          { backgroundColor: imagen ? "#000" : colorFondo },
        ]}
      >
        {imagen && (
          <Image
            source={{ uri: imagen }}
            style={styles.imagenFondo}
            resizeMode="contain"
          />
        )}

        {/* Texto arrastrable */}
        {contenido ? (
          <Animated.View
            style={[
              styles.textoArrastrable,
              { transform: posTexto.getTranslateTransform() },
            ]}
            {...panResponder.panHandlers}
          >
            <Text style={[styles.textoHistoria, { color: colorTexto }]}>
              {contenido}
            </Text>
          </Animated.View>
        ) : null}

        {/* Input texto cuando se edita */}
        {editandoTexto && (
          <TouchableOpacity
            style={styles.inputOverlay}
            activeOpacity={1}
            onPress={() => setEditandoTexto(false)}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.inputTexto, { color: colorTexto }]}
                value={contenido}
                onChangeText={setContenido}
                placeholder="Escribe algo..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                autoFocus
                maxLength={200}
                textAlign="center"
              />
              <View style={styles.coloresTexto}>
                {COLORES_TEXTO.map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.colorTextoBtn,
                      { backgroundColor: c },
                      colorTexto === c && styles.colorSeleccionado,
                    ]}
                    onPress={() => setColorTexto(c)}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={styles.listo}
                onPress={() => setEditandoTexto(false)}
              >
                <Text style={styles.listoTexto}>Listo</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Barra superior */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Text style={styles.iconBtnTexto}>✕</Text>
        </TouchableOpacity>

        <View style={styles.topAcciones}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setEditandoTexto(true)}
          >
            <Text style={styles.iconBtnTexto}>Aa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setMostrarPaleta(!mostrarPaleta)}
          >
            <View
              style={[styles.colorMuestra, { backgroundColor: colorFondo }]}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={abrirCamara}>
            <Text style={styles.iconBtnTexto}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={abrirGaleria}>
            <Text style={styles.iconBtnTexto}>🖼️</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Paleta colores fondo */}
      {mostrarPaleta && (
        <View style={styles.paleta}>
          {COLORES_FONDO.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.colorBtn,
                { backgroundColor: c },
                colorFondo === c && styles.colorSeleccionado,
              ]}
              onPress={() => {
                setColorFondo(c);
                setMostrarPaleta(false);
              }}
            />
          ))}
        </View>
      )}

      {/* Barra inferior */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.galeriaBtn} onPress={abrirGaleria}>
          <Text style={styles.galeriaBtnTexto}>📁 Galería</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.publicarBtn}
          onPress={publicar}
          disabled={publicando}
        >
          {publicando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.publicarTexto}>Publicar →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fondo: { flex: 1 },
  imagenFondo: { width, height, position: "absolute" },
  textoArrastrable: {
    position: "absolute",
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    maxWidth: width - 40,
  },
  textoHistoria: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  inputOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: { width: width - 40, alignItems: "center", gap: 16 },
  inputTexto: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
    minHeight: 60,
  },
  coloresTexto: { flexDirection: "row", gap: 10 },
  colorTextoBtn: { width: 28, height: 28, borderRadius: 14 },
  listo: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  listoTexto: { color: "#fff", fontWeight: "bold" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topAcciones: { flexDirection: "row", gap: 8, alignItems: "center" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnTexto: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  colorMuestra: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#fff",
  },
  paleta: {
    position: "absolute",
    top: 100,
    right: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 12,
    width: 160,
  },
  colorBtn: { width: 32, height: 32, borderRadius: 16 },
  colorSeleccionado: { borderWidth: 3, borderColor: "#fff" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  galeriaBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  galeriaBtnTexto: { color: "#fff", fontWeight: "bold" },
  publicarBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
  },
  publicarTexto: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});

// src/screens/ChatLegalScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ChatLegalScreen({ navigation, route }) {
  const { queja } = route.params || {};
  const { user } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const flatListRef = useRef(null);
  const esAdmin =
    user?.correo_institucional?.includes("@utvtol.edu.mx") || false;

  useEffect(() => {
    setCargando(true);
    setTimeout(() => {
      setMensajes([
        {
          id: "1",
          texto: `Bienvenida al chat de seguimiento del caso #${queja?._id?.slice(-6) || "N/A"}`,
          remitente: "sistema",
          fecha: new Date().toISOString(),
        },
        {
          id: "2",
          texto: "El equipo legal revisará tu caso con atención.",
          remitente: "sistema",
          fecha: new Date().toISOString(),
        },
      ]);
      setCargando(false);
    }, 1000);
  }, []);

  const enviarMensaje = () => {
    if (!nuevoMensaje.trim()) return;

    const mensaje = {
      id: Date.now().toString(),
      texto: nuevoMensaje.trim(),
      remitente: esAdmin ? "admin" : "usuario",
      fecha: new Date().toISOString(),
      nombre: esAdmin ? "Abogacía" : user?.nombre_completo || "Usuaria",
    };

    setMensajes([...mensajes, mensaje]);
    setNuevoMensaje("");

    setTimeout(() => {
      const respuesta = {
        id: (Date.now() + 1).toString(),
        texto:
          "Gracias por tu mensaje. El equipo legal lo revisará y te responderá pronto.",
        remitente: "sistema",
        fecha: new Date().toISOString(),
        nombre: "Sistema",
      };
      setMensajes((prev) => [...prev, respuesta]);
    }, 2000);
  };

  const renderMensaje = ({ item }) => {
    const esSistema = item.remitente === "sistema";
    const esAdminMsg = item.remitente === "admin";
    const esUsuario = item.remitente === "usuario";

    let estiloContainer = styles.mensajeContainer;
    let estiloBurbuja = styles.mensajeBurbuja;
    let estiloTexto = styles.mensajeTexto;

    if (esSistema) {
      estiloContainer = [
        styles.mensajeContainer,
        styles.mensajeContainerSistema,
      ];
      estiloBurbuja = [styles.mensajeBurbuja, styles.mensajeBurbujaSistema];
      estiloTexto = [styles.mensajeTexto, styles.mensajeTextoSistema];
    } else if (esAdminMsg) {
      estiloContainer = [styles.mensajeContainer, styles.mensajeContainerAdmin];
      estiloBurbuja = [styles.mensajeBurbuja, styles.mensajeBurbujaAdmin];
      estiloTexto = [styles.mensajeTexto, styles.mensajeTextoAdmin];
    } else if (esUsuario) {
      estiloContainer = [
        styles.mensajeContainer,
        styles.mensajeContainerUsuario,
      ];
      estiloBurbuja = [styles.mensajeBurbuja, styles.mensajeBurbujaUsuario];
      estiloTexto = [styles.mensajeTexto, styles.mensajeTextoUsuario];
    }

    return (
      <View style={estiloContainer}>
        <View style={estiloBurbuja}>
          {item.nombre && !esSistema && (
            <Text style={styles.mensajeNombre}>{item.nombre}</Text>
          )}
          <Text style={estiloTexto}>{item.texto}</Text>
          <Text style={styles.mensajeFecha}>
            {new Date(item.fecha).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitulo}>💬 Seguimiento Legal</Text>
          <Text style={styles.headerSubtitulo}>
            Caso #{queja?._id?.slice(-6) || "N/A"} •{" "}
            {queja?.estado || "En seguimiento"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.cargandoTexto}>Cargando conversación...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensajes}
          renderItem={renderMensaje}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listaMensajes}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={nuevoMensaje}
            onChangeText={setNuevoMensaje}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.enviarBtn,
              !nuevoMensaje.trim() && styles.enviarBtnDisabled,
            ]}
            onPress={enviarMensaje}
            disabled={!nuevoMensaje.trim()}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D1A" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#1E1B3A",
    borderBottomWidth: 1,
    borderBottomColor: "#2D1B69",
  },
  backBtn: { padding: 5 },
  headerTitulo: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSubtitulo: { color: "#9B6DFF", fontSize: 12, marginTop: 2 },
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },
  cargandoTexto: { color: "#666", marginTop: 10 },
  listaMensajes: { padding: 16, paddingBottom: 20 },
  mensajeContainer: { marginBottom: 12 },
  mensajeContainerSistema: { alignItems: "center" },
  mensajeContainerAdmin: { alignItems: "flex-start" },
  mensajeContainerUsuario: { alignItems: "flex-end" },
  mensajeBurbuja: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 12,
  },
  mensajeBurbujaSistema: {
    backgroundColor: "#1E1B3A",
    borderWidth: 1,
    borderColor: "#2D1B69",
  },
  mensajeBurbujaAdmin: {
    backgroundColor: "#2D1B69",
  },
  mensajeBurbujaUsuario: {
    backgroundColor: "#7C3AED",
  },
  mensajeTexto: { fontSize: 15, lineHeight: 20 },
  mensajeTextoSistema: { color: "#666", fontStyle: "italic", fontSize: 13 },
  mensajeTextoAdmin: { color: "#fff" },
  mensajeTextoUsuario: { color: "#fff" },
  mensajeNombre: {
    color: "#9B6DFF",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  mensajeFecha: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#1E1B3A",
    borderTopWidth: 1,
    borderTopColor: "#2D1B69",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#0D0D1A",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44,
  },
  enviarBtn: {
    backgroundColor: "#7C3AED",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  enviarBtnDisabled: { opacity: 0.5 },
});

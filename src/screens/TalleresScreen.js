// src/screens/TalleresScreen.js
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TalleresScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.volver}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.volverTexto}>{"< Volver"}</Text>
      </TouchableOpacity>
      <Text style={styles.titulo}>📖 Talleres</Text>
      <Text style={styles.subtitulo}>Próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D1A",
    justifyContent: "center",
    alignItems: "center",
  },
  volver: { position: "absolute", top: 50, left: 24 },
  volverTexto: { color: "#fff", fontSize: 16 },
  titulo: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 12 },
  subtitulo: { color: "#aaa", fontSize: 16 },
});

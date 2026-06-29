import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Dimensions, SafeAreaView
} from 'react-native';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

export default function VerHistoriaScreen({ navigation, route }) {
  const { usuariaHistorias, indexInicial = 0, todasLasUsuarias, indexUsuaria = 0 } = route.params;
  const [historiaActual, setHistoriaActual] = useState(indexInicial);
  const [usuariaActual, setUsuariaActual] = useState(indexUsuaria);
  const progreso = useRef(new Animated.Value(0)).current;
  const animacion = useRef(null);

  const usuaria = todasLasUsuarias[usuariaActual];
  const historia = usuaria?.historias[historiaActual];

  useEffect(() => {
    iniciarProgreso();
    marcarVista();
    return () => animacion.current?.stop();
  }, [historiaActual, usuariaActual]);

  const iniciarProgreso = () => {
    progreso.setValue(0);
    animacion.current = Animated.timing(progreso, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    animacion.current.start(({ finished }) => {
      if (finished) siguiente();
    });
  };

  const marcarVista = async () => {
    try {
      if (historia?._id) {
        await api.put(`/historias/${historia._id}/vista`);
      }
    } catch (err) {}
  };

  const siguiente = () => {
  const u = todasLasUsuarias[usuariaActual];
  if (historiaActual < u.historias.length - 1) {
    setHistoriaActual(prev => prev + 1);
  } else if (usuariaActual < todasLasUsuarias.length - 1) {
    setUsuariaActual(prev => prev + 1);
    setHistoriaActual(0);
  } else {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }
};

  const anterior = () => {
    if (historiaActual > 0) {
      setHistoriaActual(prev => prev - 1);
    } else if (usuariaActual > 0) {
      setUsuariaActual(prev => prev - 1);
      setHistoriaActual(0);
    }
  };

  if (!usuaria || !historia) return null;

  return (
    <View style={[styles.container, { backgroundColor: historia.color_fondo || '#0D0D1A' }]}>
      {historia.imagen_url && (
        <Image source={{ uri: historia.imagen_url }} style={styles.imagenFondo} resizeMode="cover" />
      )}

      <SafeAreaView style={styles.overlay}>
        {/* Barras de progreso */}
        <View style={styles.barras}>
          {usuaria.historias.map((_, i) => (
            <View key={i} style={styles.barraContainer}>
              <Animated.View
                style={[
                  styles.barraProgreso,
                  {
                    width: i < historiaActual ? '100%'
                      : i === historiaActual
                        ? progreso.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : '0%'
                  }
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.usuariaInfo}>
            <View style={styles.avatarCirculo}>
              {usuaria.foto_perfil ? (
                <Image source={{ uri: usuaria.foto_perfil }} style={{ width: 36, height: 36, borderRadius: 18 }} />
              ) : (
                <Text style={{ fontSize: 18 }}></Text>
              )}
            </View>
            <View>
              <Text style={styles.nombreUsuaria}>{usuaria.nombre}</Text>
              <Text style={styles.tiempoHistoria}>
                {new Date(historia.fecha_creacion).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    navigation.navigate('Home');
  }
}}>
  <Text style={styles.cerrar}>✕</Text>
</TouchableOpacity>
        </View>

        {/* Contenido texto */}
        {historia.contenido ? (
          <View style={styles.contenidoContainer}>
            <Text style={styles.contenidoTexto}>{historia.contenido}</Text>
          </View>
        ) : null}

        {/* Zonas de toque */}
        <View style={styles.zonasToque}>
          <TouchableOpacity style={styles.zonaIzq} onPress={anterior} />
          <TouchableOpacity style={styles.zonaDer} onPress={siguiente} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imagenFondo: { position: 'absolute', width, height },
  overlay: { flex: 1 },
  barras: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8, gap: 4 },
  barraContainer: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  barraProgreso: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  usuariaInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCirculo: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  nombreUsuaria: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  tiempoHistoria: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  cerrar: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  contenidoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  contenidoTexto: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 6 },
  zonasToque: { position: 'absolute', top: 80, bottom: 0, left: 0, right: 0, flexDirection: 'row' },
  zonaIzq: { flex: 1 },
  zonaDer: { flex: 2 },
});
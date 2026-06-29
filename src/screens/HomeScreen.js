import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ActivityIndicator, Image,
    Modal, SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { usuaria, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [refrescando, setRefrescando] = useState(false);
  const [comentariosVisible, setComentariosVisible] = useState(false);
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [historiasUsuarias, setHistoriasUsuarias] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      cargarPublicaciones();
      cargarFotoPerfil();
      cargarHistorias();
    }, [])
  );

  const cargarPublicaciones = async () => {
    try {
      const res = await api.get('/publicaciones');
      setPublicaciones(res.data);
    } catch (err) {
      console.log('Error cargando publicaciones:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarFotoPerfil = async () => {
    try {
      const res = await api.get('/perfil/mi-perfil');
      setFotoPerfil(res.data.foto_perfil);
    } catch (err) {
      console.log('Error cargando foto:', err);
    }
  };

  const cargarHistorias = async () => {
    try {
      const res = await api.get('/historias');
      setHistoriasUsuarias(res.data);
    } catch (err) {
      console.log('Error cargando historias:', err);
    }
  };

  const refrescar = async () => {
    setRefrescando(true);
    await Promise.all([cargarPublicaciones(), cargarFotoPerfil(), cargarHistorias()]);
    setRefrescando(false);
  };

  const tiempoTranscurrido = (fecha) => {
    const diff = Date.now() - new Date(fecha);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(horas / 24);
    if (dias > 0) return `hace ${dias}d`;
    if (horas > 0) return `hace ${horas}h`;
    return 'ahora';
  };

  const darLike = async (postId) => {
    try {
      const res = await api.put(`/publicaciones/${postId}/like`);
      setPublicaciones(prev => prev.map(p =>
        p._id === postId
          ? { ...p, likes: res.data.likes, liked: res.data.liked }
          : p
      ));
    } catch (err) {
      console.log('Error like:', err);
    }
  };

  const abrirComentarios = async (post) => {
    setPublicacionSeleccionada(post);
    setComentariosVisible(true);
    setCargandoComentarios(true);
    try {
      const res = await api.get(`/publicaciones/${post._id}/comentarios`);
      setComentarios(res.data);
    } catch (err) {
      console.log('Error comentarios:', err);
    } finally {
      setCargandoComentarios(false);
    }
  };

  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const res = await api.post(`/publicaciones/${publicacionSeleccionada._id}/comentarios`, {
        contenido: nuevoComentario,
        es_anonimo: false
      });
      setComentarios(prev => [...prev, res.data.comentario]);
      setNuevoComentario('');
      setPublicaciones(prev => prev.map(p =>
        p._id === publicacionSeleccionada._id
          ? { ...p, num_comentarios: (p.num_comentarios || 0) + 1 }
          : p
      ));
    } catch (err) {
      console.log('Error enviando comentario:', err);
    } finally {
      setEnviandoComentario(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Modal comentarios */}
      <Modal visible={comentariosVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity
            style={styles.comentariosOverlay}
            activeOpacity={1}
            onPress={() => setComentariosVisible(false)}
          />
          <View style={styles.comentariosSheet}>
            <View style={styles.comentariosHeader}>
              <Text style={styles.comentariosTitulo}>Comentarios</Text>
              <TouchableOpacity onPress={() => setComentariosVisible(false)}>
                <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.comentariosList}>
              {cargandoComentarios ? (
                <ActivityIndicator color="#7C3AED" style={{ marginTop: 20 }} />
              ) : comentarios.length === 0 ? (
                <Text style={styles.sinComentarios}>Sé la primera en comentar 💜</Text>
              ) : (
                comentarios.map((c, i) => (
                  <View key={i} style={styles.comentarioItem}>
                    <View style={styles.comentarioAvatar}>
                      {c.foto_autor ? (
                        <Image source={{ uri: c.foto_autor }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                      ) : (
                        <Text style={{ fontSize: 18 }}>👩</Text>
                      )}
                    </View>
                    <View style={styles.comentarioBurbuja}>
                      <Text style={styles.comentarioNombre}>{c.nombre_autor}</Text>
                      <Text style={styles.comentarioTexto}>{c.contenido}</Text>
                      <Text style={styles.comentarioFecha}>{tiempoTranscurrido(c.fecha)}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.comentarioInput}>
              <View style={styles.comentarioAvatar}>
                {fotoPerfil ? (
                  <Image source={{ uri: fotoPerfil }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <Text style={{ fontSize: 18 }}>👤</Text>
                )}
              </View>
              <TextInput
                style={styles.comentarioTextInput}
                placeholder="Escribe un comentario..."
                placeholderTextColor="#555"
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                multiline
              />
              <TouchableOpacity
                onPress={enviarComentario}
                disabled={enviandoComentario || !nuevoComentario.trim()}>
                {enviandoComentario
                  ? <ActivityIndicator color="#7C3AED" size="small" />
                  : <Text style={[styles.enviarBtn, !nuevoComentario.trim() && { opacity: 0.3 }]}>💜</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal menú lateral */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.drawer}>
            <TouchableOpacity style={styles.cerrarBtn} onPress={() => setMenuVisible(false)}>
              <Text style={styles.cerrarTexto}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.perfilDrawer}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Perfil');
              }}>
              <View style={styles.avatarDrawer}>
                {fotoPerfil ? (
                  <Image source={{ uri: fotoPerfil }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                ) : (
                  <Text style={{ fontSize: 28 }}>👤</Text>
                )}
              </View>
              <Text style={styles.nombreDrawer}>{usuaria?.nombre_completo || 'Usuaria'}</Text>
              <Text style={styles.usernameDrawer}>@{usuaria?.nombre_completo?.split(' ')[0]?.toLowerCase() || 'sorori'}</Text>
              <Text style={{ color: '#7C3AED', fontSize: 12, marginTop: 4 }}>Ver mi perfil →</Text>
            </TouchableOpacity>

            {[
              { nombre: 'Inicio', icono: '🏠', ruta: 'Home' },
              { nombre: 'GPS Sorori', icono: '📍', ruta: 'GPS', badge: 'Nuevo' },
              { nombre: 'Foro', icono: '💬', ruta: 'Foro' },
              { nombre: 'Dudas médicas', icono: '🩺', ruta: 'DudasMedicas' },
              { nombre: 'Dudas legales', icono: '⚖️', ruta: 'DudasLegales' },
              { nombre: 'Talleres', icono: '📖', ruta: 'Talleres' },
              { nombre: 'Becas', icono: '🎓', ruta: 'Becas' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate(item.ruta);
                }}>
                <Text style={styles.menuIcono}>{item.icono}</Text>
                <Text style={styles.menuNombre}>{item.nombre}</Text>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTexto}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.drawerFooter}>
              <Text style={styles.footerTexto}>🛡️ Espacio seguro certificado</Text>
              <TouchableOpacity onPress={logout}>
                <Text style={styles.cerrarSesion}>Cerrar sesión</Text>
              </TouchableOpacity>
              <Text style={styles.copyright}>Sororitec © 2025</Text>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ padding: 10 }}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>sororitec</Text>
        <TouchableOpacity>
          <Text style={styles.headerIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }>

        {/* Historias */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>Historias</Text>
            <TouchableOpacity>
              <Text style={styles.verTodas}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>

            {/* Tu historia */}
            <TouchableOpacity
              style={styles.historiaItem}
              onPress={() => navigation.navigate('CrearHistoria')}>
              <View style={[styles.historiaCirculo, { borderColor: '#7C3AED' }]}>
                {fotoPerfil ? (
                  <Image source={{ uri: fotoPerfil }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                ) : (
                  <Text style={{ fontSize: 24 }}>👤</Text>
                )}
                <View style={styles.historiaMasBadge}>
                  <Text style={styles.historiaMasTexto}>+</Text>
                </View>
              </View>
              <Text style={styles.historiaNombre}>Tu historia</Text>
            </TouchableOpacity>

            {/* Historias de otras usuarias */}
            {historiasUsuarias.map((u, i) => (
              <TouchableOpacity
                key={i}
                style={styles.historiaItem}
                onPress={() => navigation.navigate('VerHistoria', {
                  usuariaHistorias: u,
                  indexInicial: 0,
                  todasLasUsuarias: historiasUsuarias,
                  indexUsuaria: i,
                })}>
                <View style={[styles.historiaCirculo, { borderColor: '#FF69B4' }]}>
                  {u.foto_perfil ? (
                    <Image source={{ uri: u.foto_perfil }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                  ) : (
                    <Text style={{ fontSize: 24 }}>👤</Text>
                  )}
                </View>
                <Text style={styles.historiaNombre}>
                  {u.nombre?.split(' ')[0] || 'Sorori'}
                </Text>
              </TouchableOpacity>
            ))}

          </ScrollView>
        </View>

        {/* Tendencias */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>🔥 Tendencias hoy</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {['#TallerDeCódigo', '#DerechosLaborales', '#SaludFem'].map((tag, i) => (
              <TouchableOpacity key={i} style={styles.tag}>
                <Text style={styles.tagTexto}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Publicaciones */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>Para ti</Text>
          </View>
          {cargando ? (
            <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 20 }} />
          ) : (
            publicaciones.map((post, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    {post.foto_autor ? (
                      <Image source={{ uri: post.foto_autor }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                    ) : (
                      <Text style={{ fontSize: 20 }}>👩</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.cardNombre}>
                        {post.es_anonima ? 'Anónima' : post.nombre_autor || 'Usuaria'}
                      </Text>
                      {post.categoria && (
                        <View style={styles.badgeCard}>
                          <Text style={styles.badgeCardTexto}>{post.categoria}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardMeta}>{tiempoTranscurrido(post.fecha_publicacion)}</Text>
                  </View>
                </View>
                <Text style={styles.cardContenido}>{post.contenido}</Text>
                {post.imagen_url && (
                  <Image source={{ uri: post.imagen_url }} style={styles.cardImagen} resizeMode="cover" />
                )}
                <View style={styles.cardFooter}>
                  <TouchableOpacity onPress={() => darLike(post._id)} style={styles.accionBtn}>
                    <Text style={[styles.cardAccion, post.liked && { color: '#ff6b9d' }]}>
                      {post.liked ? '♥' : '♡'} {post.likes || 0}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => abrirComentarios(post)} style={styles.accionBtn}>
                    <Text style={styles.cardAccion}>💬 {post.num_comentarios || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.accionBtn}>
                    <Text style={styles.cardAccion}>☆</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CrearPublicacion')}>
        <Text style={styles.fabTexto}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: { width: '75%', backgroundColor: '#0D0D1A', paddingTop: 50, paddingHorizontal: 10 },
  cerrarBtn: { position: 'absolute', top: 50, right: 16 },
  cerrarTexto: { color: '#fff', fontSize: 20 },
  perfilDrawer: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1E1B3A', marginBottom: 10 },
  avatarDrawer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1E1B3A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  nombreDrawer: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  usernameDrawer: { color: '#9B6DFF', fontSize: 13 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 4 },
  menuIcono: { fontSize: 20, marginRight: 14 },
  menuNombre: { color: '#fff', fontSize: 15, flex: 1 },
  badge: { backgroundColor: '#7C3AED', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTexto: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  drawerFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#1E1B3A', marginTop: 'auto' },
  footerTexto: { color: '#666', fontSize: 12, marginBottom: 12 },
  cerrarSesion: { color: '#ff6b6b', fontSize: 14, marginBottom: 8 },
  copyright: { color: '#444', fontSize: 11 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40 },
  menuIcon: { color: '#fff', fontSize: 24 },
  headerTitulo: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  headerIcon: { fontSize: 20 },
  seccion: { padding: 20, paddingBottom: 0 },
  seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seccionTitulo: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  verTodas: { color: '#9B6DFF', fontSize: 13 },
  historiaItem: { alignItems: 'center', marginRight: 16 },
  historiaCirculo: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1E1B3A', borderWidth: 2, borderColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  historiaNombre: { color: '#aaa', fontSize: 11, marginTop: 6 },
  historiaMasBadge: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0D0D1A' },
  historiaMasTexto: { color: '#fff', fontSize: 14, fontWeight: 'bold', lineHeight: 16 },
  tag: { backgroundColor: '#1E1B3A', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, borderWidth: 1, borderColor: '#7C3AED' },
  tagTexto: { color: '#9B6DFF', fontSize: 13 },
  card: { backgroundColor: '#1E1B3A', borderRadius: 16, padding: 16, marginTop: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2D1B69', alignItems: 'center', justifyContent: 'center' },
  cardNombre: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cardMeta: { color: '#666', fontSize: 12, marginTop: 2 },
  badgeCard: { backgroundColor: '#2D1B69', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeCardTexto: { color: '#9B6DFF', fontSize: 11 },
  cardContenido: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', gap: 20, marginTop: 12 },
  accionBtn: { flexDirection: 'row', alignItems: 'center' },
  cardAccion: { color: '#666', fontSize: 14 },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  fabTexto: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  cardImagen: { width: '100%', height: 200, borderRadius: 12, marginTop: 10 },
  comentariosOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  comentariosSheet: { backgroundColor: '#1E1B3A', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 20 },
  comentariosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#2D1B69' },
  comentariosTitulo: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  comentariosList: { maxHeight: 350, padding: 16 },
  sinComentarios: { color: '#666', textAlign: 'center', marginTop: 30, fontSize: 14 },
  comentarioItem: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  comentarioAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2D1B69', alignItems: 'center', justifyContent: 'center' },
  comentarioBurbuja: { flex: 1, backgroundColor: '#0D0D1A', borderRadius: 12, padding: 10 },
  comentarioNombre: { color: '#9B6DFF', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  comentarioTexto: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  comentarioFecha: { color: '#444', fontSize: 11, marginTop: 4 },
  comentarioInput: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#2D1B69', gap: 10 },
  comentarioTextInput: { flex: 1, backgroundColor: '#0D0D1A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: '#fff', fontSize: 14, maxHeight: 80 },
  enviarBtn: { fontSize: 24 },
});
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator, Image, Modal,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, KeyboardAvoidingView,
  Platform, RefreshControl, Dimensions, StatusBar
} from 'react-native';
import {
  Home, MapPin, MessageSquare, Stethoscope, Scale,
  BookOpen, Award, Bell, Menu, X, Heart, MessageCircle,
  Bookmark, Plus, ChevronRight, User, LogOut
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

const COLORES = {
  primario: '#7C3AED', secundario: '#A78BFA', acento: '#C4B5FD',
  fondo: '#0D0B1A', superficie: '#16122A', superficie2: '#1E1A35',
  superficie3: '#252040', borde: '#2E2850', texto: '#F3F1FF',
  textoSub: '#9B94C4', textoMuted: '#6B6490',
  exito: '#10B981', alerta: '#F59E0B', error: '#EF4444',
  rosa: '#EC4899', blanco: '#FFFFFF',
};

const MENU_ITEMS = [
  { nombre: 'Inicio', Icon: Home, ruta: 'Home' },
  { nombre: 'GPS Sorori', Icon: MapPin, ruta: 'GPS', badge: 'Nuevo' },
  { nombre: 'Foro', Icon: MessageSquare, ruta: 'Foro' },
  { nombre: 'Dudas medicas', Icon: Stethoscope, ruta: 'DudasMedicas' },
  { nombre: 'Dudas legales', Icon: Scale, ruta: 'DudasLegales' },
  { nombre: 'Talleres', Icon: BookOpen, ruta: 'Talleres' },
  { nombre: 'Becas', Icon: Award, ruta: 'Becas' },
];

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
  const [noLeidas, setNoLeidas] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      cargarPublicaciones();
      cargarFotoPerfil();
      cargarHistorias();
      cargarNoLeidas();
    }, [])
  );

  const cargarPublicaciones = async () => {
    try {
      const res = await api.get('/publicaciones');
      setPublicaciones(res.data);
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarFotoPerfil = async () => {
    try {
      const res = await api.get('/perfil/mi-perfil');
      setFotoPerfil(res.data.foto_perfil);
    } catch (err) {
      console.log('Error foto:', err);
    }
  };

  const cargarHistorias = async () => {
    try {
      const res = await api.get('/historias');
      setHistoriasUsuarias(res.data);
    } catch (err) {
      console.log('Error historias:', err);
    }
  };

  const cargarNoLeidas = async () => {
    try {
      const res = await api.get('/notificaciones/no-leidas');
      setNoLeidas(res.data.total);
    } catch (err) {
      console.log('Error notificaciones:', err);
    }
  };

  const refrescar = async () => {
    setRefrescando(true);
    await Promise.all([cargarPublicaciones(), cargarFotoPerfil(), cargarHistorias(), cargarNoLeidas()]);
    setRefrescando(false);
  };

  const tiempoTranscurrido = (fecha) => {
    const diff = Date.now() - new Date(fecha);
    const mins = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(horas / 24);
    if (dias > 0) return `hace ${dias}d`;
    if (horas > 0) return `hace ${horas}h`;
    if (mins > 0) return `hace ${mins}m`;
    return 'ahora';
  };

  const darLike = async (postId) => {
    try {
      const res = await api.put(`/publicaciones/${postId}/like`);
      setPublicaciones(prev => prev.map(p =>
        p._id === postId ? { ...p, likes: res.data.likes, liked: res.data.liked } : p
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
        contenido: nuevoComentario, es_anonimo: false
      });
      setComentarios(prev => [...prev, res.data.comentario]);
      setNuevoComentario('');
      setPublicaciones(prev => prev.map(p =>
        p._id === publicacionSeleccionada._id
          ? { ...p, num_comentarios: (p.num_comentarios || 0) + 1 } : p
      ));
    } catch (err) {
      console.log('Error comentario:', err);
    } finally {
      setEnviandoComentario(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.fondo} />

      {/* Modal comentarios */}
      <Modal visible={comentariosVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.comentariosOverlay} activeOpacity={1} onPress={() => setComentariosVisible(false)} />
          <View style={styles.comentariosSheet}>
            <View style={styles.comentariosHandle} />
            <View style={styles.comentariosHeader}>
              <Text style={styles.comentariosTitulo}>Comentarios</Text>
              <TouchableOpacity onPress={() => setComentariosVisible(false)}>
                <X size={20} color={COLORES.textoSub} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.comentariosList}>
              {cargandoComentarios ? (
                <ActivityIndicator color={COLORES.primario} style={{ marginTop: 24 }} />
              ) : comentarios.length === 0 ? (
                <View style={styles.sinComentariosContainer}>
                  <MessageCircle size={36} color={COLORES.borde} />
                  <Text style={styles.sinComentarios}>Se la primera en comentar</Text>
                </View>
              ) : (
                comentarios.map((c, i) => (
                  <View key={i} style={styles.comentarioItem}>
                    <View style={styles.comentarioAvatar}>
                      {c.foto_autor
                        ? <Image source={{ uri: c.foto_autor }} style={styles.comentarioAvatarImg} />
                        : <User size={16} color={COLORES.textoSub} />}
                    </View>
                    <View style={styles.comentarioBurbuja}>
                      <Text style={styles.comentarioNombre}>{c.nombre_autor}</Text>
                      <Text style={styles.comentarioTexto}>{c.contenido}</Text>
                      <Text style={styles.comentarioFecha}>{tiempoTranscurrido(c.fecha)}</Text>
                    </View>
                  </View>
                ))
              )}
              <View style={{ height: 16 }} />
            </ScrollView>
            <View style={styles.comentarioInput}>
              <View style={styles.comentarioAvatar}>
                {fotoPerfil
                  ? <Image source={{ uri: fotoPerfil }} style={styles.comentarioAvatarImg} />
                  : <User size={16} color={COLORES.textoSub} />}
              </View>
              <TextInput
                style={styles.comentarioTextInput}
                placeholder="Escribe un comentario..."
                placeholderTextColor={COLORES.textoMuted}
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                multiline
              />
              <TouchableOpacity
                onPress={enviarComentario}
                disabled={enviandoComentario || !nuevoComentario.trim()}
                style={[styles.enviarBtn, !nuevoComentario.trim() && { opacity: 0.3 }]}>
                {enviandoComentario
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <ChevronRight size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Drawer izquierdo */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerLogoRow}>
                <Text style={styles.drawerLogo}>sororitec</Text>
                <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.drawerCerrar}>
                  <X size={20} color={COLORES.textoSub} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.drawerPerfil}
              onPress={() => { setMenuVisible(false); navigation.navigate('Perfil'); }}>
              <View style={styles.drawerAvatar}>
                {fotoPerfil
                  ? <Image source={{ uri: fotoPerfil }} style={styles.drawerAvatarImg} />
                  : <User size={28} color={COLORES.textoSub} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerNombre}>{usuaria?.nombre_completo || 'Usuaria'}</Text>
                <Text style={styles.drawerUsername}>
                  @{usuaria?.nombre_completo?.split(' ')[0]?.toLowerCase() || 'sorori'}
                </Text>
              </View>
              <ChevronRight size={16} color={COLORES.primario} />
            </TouchableOpacity>

            <View style={styles.drawerSeparador} />

            <ScrollView style={styles.drawerItems} showsVerticalScrollIndicator={false}>
              {MENU_ITEMS.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.drawerItem}
                  onPress={() => { setMenuVisible(false); navigation.navigate(item.ruta); }}>
                  <View style={styles.drawerItemIcono}>
                    <item.Icon size={18} color={COLORES.primario} />
                  </View>
                  <Text style={styles.drawerItemNombre}>{item.nombre}</Text>
                  {item.badge && (
                    <View style={styles.drawerBadge}>
                      <Text style={styles.drawerBadgeTexto}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.drawerSeparador} />

            <View style={styles.drawerFooter}>
              <Text style={styles.drawerFooterTexto}>Espacio seguro certificado</Text>
              <TouchableOpacity style={styles.drawerLogout} onPress={logout}>
                <LogOut size={16} color={COLORES.error} />
                <Text style={styles.drawerLogoutTexto}>Cerrar sesion</Text>
              </TouchableOpacity>
              <Text style={styles.drawerCopyright}>Sororitec 2025</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.drawerBackdrop} onPress={() => setMenuVisible(false)} />
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerBtn}>
          <Menu size={22} color={COLORES.texto} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>sororitec</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Notificaciones')}>
          <Bell size={22} color={COLORES.texto} />
          {noLeidas > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeTexto}>
                {noLeidas > 9 ? '9+' : noLeidas}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            colors={[COLORES.primario]}
            tintColor={COLORES.primario}
          />
        }>

        {/* Historias */}
        <View style={styles.historiasWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historiasScroll}>
            <TouchableOpacity style={styles.historiaItem} onPress={() => navigation.navigate('CrearHistoria')}>
              <View style={[styles.historiaCirculo, { borderColor: COLORES.primario }]}>
                {fotoPerfil
                  ? <Image source={{ uri: fotoPerfil }} style={styles.historiaImg} />
                  : <User size={24} color={COLORES.textoSub} />}
                <View style={styles.historiaMasBadge}>
                  <Plus size={10} color="#fff" />
                </View>
              </View>
              <Text style={styles.historiaNombre}>Tu historia</Text>
            </TouchableOpacity>

            {historiasUsuarias.map((u, i) => (
              <TouchableOpacity
                key={i}
                style={styles.historiaItem}
                onPress={() => navigation.navigate('VerHistoria', {
                  usuariaHistorias: u, indexInicial: 0,
                  todasLasUsuarias: historiasUsuarias, indexUsuaria: i,
                })}>
                <View style={[styles.historiaCirculo, { borderColor: COLORES.rosa }]}>
                  {u.foto_perfil
                    ? <Image source={{ uri: u.foto_perfil }} style={styles.historiaImg} />
                    : <User size={24} color={COLORES.textoSub} />}
                </View>
                <Text style={styles.historiaNombre}>{u.nombre?.split(' ')[0] || 'Sorori'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.separador} />

        {/* Feed */}
        <View style={styles.feed}>
          {cargando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORES.primario} size="large" />
            </View>
          ) : publicaciones.length === 0 ? (
            <View style={styles.vacio}>
              <MessageSquare size={48} color={COLORES.borde} />
              <Text style={styles.vacioTexto}>No hay publicaciones aun</Text>
              <Text style={styles.vacioSub}>Se la primera en compartir algo</Text>
            </View>
          ) : (
            publicaciones.map((post, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardAvatar}>
                    {post.foto_autor
                      ? <Image source={{ uri: post.foto_autor }} style={styles.cardAvatarImg} />
                      : <User size={20} color={COLORES.textoSub} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardNombreRow}>
                      <Text style={styles.cardNombre}>
                        {post.es_anonima ? 'Anonima' : post.nombre_autor || 'Usuaria'}
                      </Text>
                      {post.categoria && (
                        <View style={styles.categoriaChip}>
                          <Text style={styles.categoriaTexto}>{post.categoria}</Text>
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

                <View style={styles.cardDivisor} />

                <View style={styles.cardAcciones}>
                  <TouchableOpacity style={styles.accionBtn} onPress={() => darLike(post._id)}>
                    <Heart
                      size={20}
                      color={post.liked ? COLORES.rosa : COLORES.textoSub}
                      fill={post.liked ? COLORES.rosa : 'transparent'}
                    />
                    <Text style={[styles.accionTexto, post.liked && { color: COLORES.rosa }]}>
                      {post.likes || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.accionBtn} onPress={() => abrirComentarios(post)}>
                    <MessageCircle size={20} color={COLORES.textoSub} />
                    <Text style={styles.accionTexto}>{post.num_comentarios || 0}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.accionBtn}>
                    <Bookmark size={20} color={COLORES.textoSub} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CrearPublicacion')}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORES.fondo },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 54,
    paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: COLORES.borde,
    backgroundColor: COLORES.fondo,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORES.superficie2,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitulo: { color: COLORES.blanco, fontSize: 20, fontWeight: '800', letterSpacing: 3 },
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORES.error,
    borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2,
    borderColor: COLORES.fondo,
  },
  bellBadgeTexto: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Drawer
  drawerOverlay: { flex: 1, flexDirection: 'row' },
  drawer: {
    width: width * 0.75, backgroundColor: COLORES.superficie,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 60,
    borderRightWidth: 1, borderRightColor: COLORES.borde,
  },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  drawerHeader: { paddingHorizontal: 20, paddingBottom: 16 },
  drawerLogoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  drawerLogo: { color: COLORES.blanco, fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  drawerCerrar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORES.superficie2,
    alignItems: 'center', justifyContent: 'center',
  },
  drawerPerfil: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: COLORES.superficie2,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORES.borde,
  },
  drawerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORES.superficie3,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORES.primario,
    overflow: 'hidden',
  },
  drawerAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  drawerNombre: { color: COLORES.blanco, fontWeight: '700', fontSize: 15 },
  drawerUsername: { color: COLORES.secundario, fontSize: 12, marginTop: 2 },
  drawerSeparador: { height: 1, backgroundColor: COLORES.borde, marginVertical: 8, marginHorizontal: 16 },
  drawerItems: { flex: 1, paddingHorizontal: 12 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 13, borderRadius: 12, marginBottom: 4, gap: 14,
  },
  drawerItemIcono: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORES.primario + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  drawerItemNombre: { color: COLORES.texto, fontSize: 14, flex: 1, fontWeight: '500' },
  drawerBadge: {
    backgroundColor: COLORES.primario, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  drawerBadgeTexto: { color: '#fff', fontSize: 10, fontWeight: '700' },
  drawerFooter: { padding: 20 },
  drawerFooterTexto: { color: COLORES.textoMuted, fontSize: 11, marginBottom: 14 },
  drawerLogout: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  drawerLogoutTexto: { color: COLORES.error, fontSize: 14, fontWeight: '600' },
  drawerCopyright: { color: COLORES.borde, fontSize: 11 },

  // Historias
  historiasWrapper: { paddingVertical: 18, paddingLeft: 16 },
  historiasScroll: { gap: 14, paddingRight: 16 },
  historiaItem: { alignItems: 'center', gap: 6 },
  historiaCirculo: {
    width: 66, height: 66, borderRadius: 33,
    backgroundColor: COLORES.superficie2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, overflow: 'hidden',
  },
  historiaImg: { width: 66, height: 66, borderRadius: 33 },
  historiaMasBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORES.primario,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORES.fondo,
  },
  historiaNombre: {
    color: COLORES.textoSub, fontSize: 11,
    fontWeight: '500', maxWidth: 66, textAlign: 'center',
  },
  separador: { height: 1, backgroundColor: COLORES.borde, marginHorizontal: 16 },

  // Feed
  feed: { padding: 16, gap: 14 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  vacio: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  vacioTexto: { color: COLORES.texto, fontSize: 16, fontWeight: '600' },
  vacioSub: { color: COLORES.textoSub, fontSize: 13 },

  // Cards
  card: {
    backgroundColor: COLORES.superficie, borderRadius: 18,
    borderWidth: 1, borderColor: COLORES.borde,
    overflow: 'hidden', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORES.superficie2,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde,
  },
  cardAvatarImg: { width: 42, height: 42, borderRadius: 21 },
  cardNombreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardNombre: { color: COLORES.blanco, fontWeight: '700', fontSize: 14 },
  categoriaChip: {
    backgroundColor: COLORES.primario + '25', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORES.primario + '40',
  },
  categoriaTexto: { color: COLORES.acento, fontSize: 10, fontWeight: '700' },
  cardMeta: { color: COLORES.textoMuted, fontSize: 12, marginTop: 2 },
  cardContenido: {
    color: COLORES.texto, fontSize: 15, lineHeight: 23,
    paddingHorizontal: 14, paddingBottom: 14,
  },
  cardImagen: { width: '100%', height: 260 },
  cardDivisor: { height: 1, backgroundColor: COLORES.borde },
  cardAcciones: {
    flexDirection: 'row', padding: 12,
    paddingHorizontal: 16, gap: 24, alignItems: 'center',
  },
  accionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accionTexto: { color: COLORES.textoSub, fontSize: 14, fontWeight: '500' },

  // Comentarios
  comentariosOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  comentariosSheet: {
    backgroundColor: COLORES.superficie,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '75%', paddingBottom: 20,
    borderTopWidth: 1, borderColor: COLORES.borde,
  },
  comentariosHandle: {
    width: 40, height: 4, backgroundColor: COLORES.borde,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  comentariosHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORES.borde,
  },
  comentariosTitulo: { color: COLORES.texto, fontSize: 15, fontWeight: '700' },
  comentariosList: { maxHeight: 360, padding: 16 },
  sinComentariosContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  sinComentarios: { color: COLORES.textoSub, fontSize: 14 },
  comentarioItem: { flexDirection: 'row', marginBottom: 14, gap: 10 },
  comentarioAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORES.superficie2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  comentarioAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  comentarioBurbuja: {
    flex: 1, backgroundColor: COLORES.superficie2,
    borderRadius: 14, padding: 10,
    borderWidth: 1, borderColor: COLORES.borde,
  },
  comentarioNombre: { color: COLORES.secundario, fontSize: 12, fontWeight: '700', marginBottom: 4 },
  comentarioTexto: { color: COLORES.texto, fontSize: 13, lineHeight: 20 },
  comentarioFecha: { color: COLORES.textoMuted, fontSize: 11, marginTop: 4 },
  comentarioInput: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderTopWidth: 1, borderTopColor: COLORES.borde, gap: 10,
  },
  comentarioTextInput: {
    flex: 1, backgroundColor: COLORES.superficie2,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    color: COLORES.texto, fontSize: 14, maxHeight: 80,
    borderWidth: 1, borderColor: COLORES.borde,
  },
  enviarBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORES.primario,
    alignItems: 'center', justifyContent: 'center',
  },

  // FAB
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORES.primario,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: COLORES.primario,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
});
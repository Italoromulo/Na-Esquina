import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, ArrowLeft, Store } from 'lucide-react-native';
import { router } from 'expo-router';
import GlassNav from '@/components/GlassNav';
import { favoritesService } from '@/services/favorites';
import { supabase } from '@/services/supabase';
import { useResponsive } from '@/hooks/useResponsive';

export default function FavoritosScreen() {
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [favorites, setFavorites] = useState<string[]>([]);
  const [restaurantesSupa, setRestaurantesSupa] = useState<any[]>([]);
  const [isLogged, setIsLogged] = useState(true);

  useEffect(() => {
    // Verificar se o usuário está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLogged(!!session);
    });

    // Carregar favoritos
    favoritesService.getFavorites().then(setFavorites);

    // Carregar restaurantes do Supabase
    supabase.from('restaurantes').select('*').then(({ data }) => {
      if (data) setRestaurantesSupa(data);
    });

    // Ouvir atualizações de favoritos
    const unsubscribe = favoritesService.subscribe(() => {
      favoritesService.getFavorites().then(setFavorites);
    });

    return unsubscribe;
  }, []);

  const toggleFav = async (id: string) => {
    await favoritesService.toggleFavorite(id);
  };

  // Filtrar apenas os restaurantes do Supabase favoritados
  const favoritedSupa = restaurantesSupa.filter((item) =>
    favorites.includes(String(item.id))
  );

  // Agora a tela só depende dos dados reais do Supabase
  const temFavoritos = favoritedSupa.length > 0;



  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#1A120D', '#0B0503', '#050302']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Header absolute */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#F2E4D4" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favoritos</Text>
          <View style={{ width: 40 }} /> {/* Spacer to center the title */}
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 85, paddingBottom: insets.bottom + 140 }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {!isLogged ? (
          <BlurView intensity={30} tint="dark" style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Heart size={42} color="#D97941" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Acesse seus favoritos</Text>
            <Text style={styles.emptyText}>
              Você precisa estar logado na sua conta para salvar e ver seus restaurantes favoritos.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Fazer Login</Text>
            </TouchableOpacity>
          </BlurView>
        ) : !temFavoritos ? (
          <BlurView intensity={30} tint="dark" style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Heart size={42} color="#746B63" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Sua lista está vazia</Text>
            <Text style={styles.emptyText}>
              Explore os melhores locais no início e toque no coração para salvar seus favoritos aqui.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>Ver Restaurantes</Text>
            </TouchableOpacity>
          </BlurView>
        ) : (
          <View style={[styles.listContainer, isTablet && styles.listContainerTablet]}>
            {/* Mantemos apenas a renderização dos dados que vêm do Supabase */}
            {favoritedSupa.map((item) => (
              <TouchableOpacity
                key={`supa-${item.id}`}
                style={[styles.card, isTablet && styles.cardTablet]}
                onPress={() => router.push(`/vendedor/${item.id}`)}
                activeOpacity={0.95}
              >
                {!!item.imagem_url && (
                  <Image source={{ uri: item.imagem_url }} style={styles.img} />
                )}

                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleFav(String(item.id))}
                  activeOpacity={0.7}
                >
                  <Heart size={18} color="#D97941" fill="#D97941" />
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Store size={16} color="#D97941" />
                    <Text style={styles.nomeRestaurante}>{item.nome}</Text>
                  </View>
                  <Text style={styles.categoriaTexto}>
                    {item.categoria || 'Sem categoria'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      <GlassNav scrollY={scrollY} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#0B0503',
  },
  containerTablet: {
    maxWidth: 960,
  },
  listContainerTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 5, 3, 0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 228, 212, 0.08)',
    zIndex: 100,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#F2E4D4',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#120806',
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
    overflow: 'hidden',
    width: '100%',
  },
  cardTablet: {
    width: '48%',
    marginBottom: 16,
  },
  img: {
    alignSelf: 'stretch',
    aspectRatio: 2.1,
    minHeight: 150,
    width: '100%',
    resizeMode: 'cover',
    backgroundColor: '#120806',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(11, 5, 3, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  infoContainer: {
    padding: 16,
  },
  nomeRestaurante: {
    color: '#F2E4D4',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoriaTexto: {
    color: 'rgba(242, 228, 212, 0.5)',
    fontSize: 14,
    marginBottom: 4,
  },
  textoClaro: {
    color: '#F2E4D4',
    fontSize: 14,
  },
  linhaMetricas: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  // Empty State
  emptyCard: {
    marginTop: 60,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
    padding: 30,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(217, 121, 65, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 121, 65, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#F2E4D4',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptyText: {
    color: 'rgba(242, 228, 212, 0.6)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  emptyButton: {
    marginTop: 10,
    backgroundColor: '#D97941',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    shadowColor: '#D97941',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#0B0503',
    fontSize: 15,
    fontWeight: '700',
  },
});

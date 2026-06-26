import { favoritesService } from "@/services/favorites";
import { supabase } from "@/services/supabase";
import { router, useFocusEffect } from "expo-router"; // 💡 Importado useFocusEffect
import { Heart } from "lucide-react-native";
import React, { useEffect, useState, useCallback } from "react"; // 💡 Importado useCallback
import {
  Image,
  Modal, 
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useLocation, calculateDistance, getAveragePrice } from "@/context/LocationContext";

interface CardsProps {
  activeCategory: string;
  searchQuery: string;
}

const normalizeText = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export default function Cards({ activeCategory, searchQuery }: CardsProps) {
  const { isTablet } = useResponsive();
  const {
    restaurantes: restaurantesSupa,
    carregarRestaurantes,
    userLocation,
    sortBy,
    minRating,
    maxDistance,
    maxPrice
  } = useLocation();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);

  // 💡 SEGREDO DO TEMPO REAL NA VOLTA: Força a releitura do banco toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      carregarRestaurantes();
      favoritesService.getFavorites().then(setFavorites);
    }, [])
  );

  useEffect(() => {
    if (restaurantesSupa.length === 0) {
      carregarRestaurantes();
    }

    favoritesService.getFavorites().then(setFavorites);

    const unsubscribe = favoritesService.subscribe(() => {
      favoritesService.getFavorites().then(setFavorites);
    });

    return unsubscribe;
  }, [restaurantesSupa]); 

  const toggleFav = async (id: any) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setModalVisivel(true);
      return;
    }

    await favoritesService.toggleFavorite(id);
    favoritesService.getFavorites().then(setFavorites);
  };

  const filteredRestaurantes = restaurantesSupa.filter((item) => {
    const matchesCategory = activeCategory === 'vendendo'
      ? item.status === true
      : !activeCategory || String(item.categoria_id) === activeCategory;

    if (!matchesCategory) return false;

    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      const matchesName = item.nome && normalizeText(item.nome).includes(normalizedQuery);
      const matchesCategoryName = item.categoria && normalizeText(item.categoria).includes(normalizedQuery);
      const matchesMenu = item.cardapio && Array.isArray(item.cardapio) && item.cardapio.some((prod: any) => 
        (prod.nome && normalizeText(prod.nome).includes(normalizedQuery)) ||
        (prod.descricao && normalizeText(prod.descricao).includes(normalizedQuery))
      );
      if (!(matchesName || matchesCategoryName || matchesMenu)) return false;
    }

    const rating = item.total_avaliacoes && item.total_avaliacoes > 0
      ? item.soma_notas / item.total_avaliacoes
      : 5.0;
    if (rating < minRating) return false;

    if (maxDistance < 99999) {
      if (!userLocation || !item.latitude || !item.longitude) return false;
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );
      if (distance > maxDistance) return false;
    }

    const avgPrice = getAveragePrice(item);
    if (avgPrice > maxPrice) return false;

    return true;
  });

  const sortedRestaurantes = [...filteredRestaurantes].sort((a, b) => {
    if (sortBy === 'avaliacao') {
      const ratingA = a.total_avaliacoes && a.total_avaliacoes > 0 ? a.soma_notas / a.total_avaliacoes : 5.0;
      const ratingB = b.total_avaliacoes && b.total_avaliacoes > 0 ? b.soma_notas / b.total_avaliacoes : 5.0;
      return ratingB - ratingA;
    }
    if (sortBy === 'distancia' && userLocation) {
      const distA = a.latitude && a.longitude ? calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) : 99999;
      const distB = b.latitude && b.longitude ? calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude) : 99999;
      return distA - distB;
    }
    if (sortBy === 'preco') {
      const priceA = getAveragePrice(a);
      const priceB = getAveragePrice(b);
      return priceA - priceB;
    }
    return 0;
  });

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      
      {/* MODAL PREMIUM CUSTOMIZADO */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atenção</Text>
            <Text style={styles.modalSubtitle}>
              Você precisa estar logado para favoritar um restaurante.
            </Text>

            <TouchableOpacity 
              style={styles.modalButtonPrimary} 
              onPress={() => {
                setModalVisivel(false);
                router.push('/login');
              }}
            >
              <Text style={styles.modalButtonTextPrimary}>Fazer login</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalButtonSecondary} 
              onPress={() => {
                setModalVisivel(false);
                router.push('/cadastro');
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>Cadastrar usuário</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalButtonCancel} 
              onPress={() => setModalVisivel(false)}
            >
              <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LISTAGEM DOS CARDS */}
      {sortedRestaurantes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum restaurante encontrado</Text>
          <Text style={styles.emptySubtext}>
            Tente buscar outro prato ou categoria
          </Text>
        </View>
      ) : (
        sortedRestaurantes.map((item) => {
          const isFav = favorites.includes(String(item.id));
          const rating = item.total_avaliacoes && item.total_avaliacoes > 0
            ? (item.soma_notas / item.total_avaliacoes).toFixed(1)
            : '5.0';

          const distance = (userLocation && item.latitude && item.longitude)
            ? calculateDistance(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude)
            : null;

          const distanceText = distance !== null
            ? (distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`)
            : null;

          const avgPrice = getAveragePrice(item);
          const priceTier = avgPrice <= 20 ? '$' : avgPrice <= 40 ? '$$' : '$$$';

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isTablet && styles.cardTablet]}
              onPress={() => {
                // 💡 Removido o setTimeout e deixado a navegação limpa, o useFocusEffect cuida do retorno!
                router.push(`/vendedor/${item.id}`);
              }}
              activeOpacity={0.95}
            >
              <Image source={{ uri: item.imagem_url }} style={styles.img} />

              <View style={[styles.statusBadge, item.status ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
                <Text style={styles.statusBadgeText}>{item.status ? "🟢 Online" : "🔴 Offline"}</Text>
              </View>

              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFav(item.id)}
                activeOpacity={0.7}
              >
                <Heart
                  size={18}
                  color={isFav ? "#D97941" : "#F2E4D4"}
                  fill={isFav ? "#D97941" : "transparent"}
                />
              </TouchableOpacity>

              <View style={styles.infoContainer}>
                <Text style={styles.nomeRestaurante}>{item.nome}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.estrela}>⭐</Text>
                  <Text style={styles.notaTexto}>{rating}</Text>
                  <Text style={styles.divisor}>·</Text>
                  <Text style={styles.categoriaTexto}>{item.categoria || 'Vendedor'}</Text>
                  <Text style={styles.divisor}>·</Text>
                  <Text style={styles.categoriaTexto}>{priceTier}</Text>
                  {distanceText && (
                    <>
                      <Text style={styles.divisor}>·</Text>
                      <Text style={styles.categoriaTexto}>{distanceText}</Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 50 },
  containerTablet: { flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "space-between", paddingTop: 30 },
  favoriteButton: { position: "absolute", top: 12, right: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(11, 5, 3, 0.65)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", zIndex: 10 },
  card: { backgroundColor: "#120806", borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: "rgba(242, 228, 212, 0.08)", overflow: "hidden", width: "100%" },
  cardTablet: { width: "48%", marginBottom: 16 },
  img: { alignSelf: "stretch", aspectRatio: 2.1, minHeight: 150, width: "100%", resizeMode: "cover", backgroundColor: "#120806" },
  infoContainer: { padding: 16 },
  nomeRestaurante: { color: "#F2E4D4", fontSize: 18, fontWeight: "600", marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  estrela: { fontSize: 12, marginRight: 4 },
  notaTexto: { color: "#D97941", fontSize: 14, fontWeight: "700", marginRight: 6 },
  divisor: { color: "rgba(242, 228, 212, 0.3)", fontSize: 14, marginRight: 6 },
  categoriaTexto: { color: "rgba(242, 228, 212, 0.5)", fontSize: 14 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 4 },
  emptyText: { color: '#F2E4D4', fontSize: 16, fontWeight: "600" },
  emptySubtext: { color: "rgba(242, 228, 212, 0.4)", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#130B08', borderRadius: 22, padding: 24, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: 'rgba(242, 228, 212, 0.08)', alignItems: 'center' },
  modalTitle: { color: '#D97941', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  modalSubtitle: { color: 'rgba(242, 228, 212, 0.7)', fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalButtonPrimary: { backgroundColor: '#D97941', width: '100%', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  modalButtonTextPrimary: { color: '#0B0503', fontWeight: '900', fontSize: 16 },
  modalButtonSecondary: { backgroundColor: 'rgba(217, 121, 65, 0.12)', borderWidth: 1, borderColor: 'rgba(217, 121, 65, 0.4)', width: '100%', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 14 },
  modalButtonTextSecondary: { color: '#F2E4D4', fontWeight: '800', fontSize: 15 },
  modalButtonCancel: { paddingVertical: 8 },
  modalButtonTextCancel: { color: 'rgba(242, 228, 212, 0.4)', fontWeight: '700', fontSize: 14 },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadgeOnline: {
    backgroundColor: "rgba(11, 5, 3, 0.85)",
    borderColor: "rgba(34, 197, 94, 0.5)",
  },
  statusBadgeOffline: {
    backgroundColor: "rgba(11, 5, 3, 0.85)",
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
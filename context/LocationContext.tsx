import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/services/supabase';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function getAveragePrice(item: any): number {
  if (!item.cardapio || item.cardapio.length === 0) return 20; // Default average price
  let total = 0;
  let count = 0;
  item.cardapio.forEach((prod: any) => {
    if (prod.preco) {
      const numStr = prod.preco.replace(/[^\d,]/g, '').replace(',', '.');
      const val = parseFloat(numStr);
      if (!isNaN(val)) {
        total += val;
        count++;
      }
    }
  });
  return count > 0 ? total / count : 20;
}

interface LocationContextType {
  userLocation: UserLocation | null;
  isLoading: boolean;
  requestLocation: () => Promise<void>;
  
  // Estados de Filtro e Feed Persistidos
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  restaurantes: any[];
  carregarRestaurantes: () => Promise<void>;

  // Novos filtros
  sortBy: string;
  setSortBy: (val: string) => void;
  minRating: number;
  setMinRating: (val: number) => void;
  maxDistance: number;
  setMaxDistance: (val: number) => void;
  maxPrice: number;
  setMaxPrice: (val: number) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados persistidos da página inicial
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantes, setRestaurantes] = useState<any[]>([]);

  // Novos estados para filtros e ordenação
  const [sortBy, setSortBy] = useState('relevancia');
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(99999);
  const [maxPrice, setMaxPrice] = useState(99999);

  const fetchCurrentPosition = async () => {
    try {
      const pos = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setUserLocation(coords);
      return coords;
    } catch (err) {
      console.error('Error getting current position:', err);
      return null;
    }
  };

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        await fetchCurrentPosition();
      }
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };

  const carregarRestaurantes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("restaurantes")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      const restaurantesBanco = data ?? [];
      const ids = restaurantesBanco.map((item: any) => item.id).filter(Boolean);
      let cardapiosPorRestaurante: Record<string, any[]> = {};

      if (ids.length > 0) {
        const { data: cardapiosData, error: erroCardapio } = await supabase
          .from("cardapios")
          .select("*")
          .in("restaurante_id", ids);

        if (!erroCardapio && cardapiosData) {
          cardapiosPorRestaurante = cardapiosData.reduce((acc: Record<string, any[]>, produto: any) => {
            const chave = String(produto.restaurante_id);
            if (!acc[chave]) acc[chave] = [];
            acc[chave].push(produto);
            return acc;
          }, {});
        }
      }

      setRestaurantes(
        restaurantesBanco.map((item: any) => ({
          ...item,
          cardapio: cardapiosPorRestaurante[String(item.id)] ?? [],
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar restaurantes no context:", error);
    }
  }, []);

  useEffect(() => {
    // Carrega restaurantes assim que o app inicia
    carregarRestaurantes();

    async function checkAndPrompt() {
      try {
        const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
        
        if (currentStatus === 'granted') {
          await fetchCurrentPosition();
        } else {
          if (Platform.OS === 'web') {
            if (confirm('Deseja ativar a localização para visualizar sua posição no mapa de entregas?')) {
              await requestLocation();
            }
          } else {
            Alert.alert(
              'Ativar Localização',
              'Deseja ativar a localização para visualizar sua posição no mapa de entregas?',
              [
                {
                  text: 'Agora Não',
                  style: 'cancel',
                },
                {
                  text: 'Ativar',
                  onPress: async () => {
                    await requestLocation();
                  },
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAndPrompt();
  }, []);

  const value = useMemo(() => ({
    userLocation,
    isLoading,
    requestLocation,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    restaurantes,
    carregarRestaurantes,
    sortBy,
    setSortBy,
    minRating,
    setMinRating,
    maxDistance,
    setMaxDistance,
    maxPrice,
    setMaxPrice,
  }), [
    userLocation,
    isLoading,
    activeCategory,
    searchQuery,
    restaurantes,
    carregarRestaurantes,
    sortBy,
    minRating,
    maxDistance,
    maxPrice
  ]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation deve ser usado dentro de um LocationProvider');
  }
  return context;
}

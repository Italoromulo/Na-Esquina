import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { darkMapStyle } from '@/constants/mapStyle';
import { useLocation } from '@/context/LocationContext';
import { supabase } from '@/services/supabase';
import { getMapPin } from '@/constants/pins';

type Destino = {
  latitude: number;
  longitude: number;
  nome?: string;
  endereco?: string;
  categoria_id?: number | string;
};

export default function RouteMap({ destino }: { destino: Destino }) {
  const { userLocation, requestLocation } = useLocation();
  const [coordsRota, setCoordsRota] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [loadingRota, setLoadingRota] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const mapRef = useRef<MapView | null>(null);

  const origem = useMemo(() => userLocation, [userLocation]);

  useEffect(() => {
    async function carregarCategorias() {
      const { data } = await supabase.from('categorias').select('id, nome');
      if (data) {
        setCategorias(data);
      }
    }
    carregarCategorias();
  }, []);

  const pinAsset = useMemo(() => {
    const cat = categorias.find(c => String(c.id) === String(destino.categoria_id));
    const catNome = cat ? cat.nome : '';
    return getMapPin(catNome);
  }, [categorias, destino.categoria_id]);

  useEffect(() => {
    carregarRota();
  }, [origem?.latitude, origem?.longitude, destino.latitude, destino.longitude]);

  async function carregarRota() {
    if (!origem) return;

    setLoadingRota(true);
    try {
      const resposta = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`
      );
      const dados = await resposta.json();
      const coordenadas = dados?.routes?.[0]?.geometry?.coordinates;

      if (Array.isArray(coordenadas)) {
        const rota = coordenadas.map(([longitude, latitude]: [number, number]) => ({ latitude, longitude }));
        setCoordsRota(rota);

        setTimeout(() => {
          mapRef.current?.fitToCoordinates(rota, {
            edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
            animated: true,
          });
        }, 250);
      }
    } catch (err) {
      setCoordsRota(origem ? [origem, { latitude: destino.latitude, longitude: destino.longitude }] : []);
    } finally {
      setLoadingRota(false);
    }
  }

  const initialRegion = origem ? {
    latitude: origem.latitude,
    longitude: origem.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: destino.latitude,
    longitude: destino.longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={darkMapStyle}
        initialRegion={initialRegion}
        showsUserLocation={false}
      >
        {origem && (
          <Marker coordinate={origem} title="Você" description="Sua localização atual" pinColor="#007AFF" />
        )}
        <Marker
          coordinate={{ latitude: destino.latitude, longitude: destino.longitude }}
          title={destino.nome || 'Destino'}
          description={destino.endereco}
        >
          <Image source={pinAsset} style={{ width: 36, height: 45 }} resizeMode="contain" />
        </Marker>
        {coordsRota.length > 1 && (
          <Polyline coordinates={coordsRota} strokeColor="#D97941" strokeWidth={5} />
        )}
      </MapView>

      {!origem && (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Ative sua localização</Text>
          <Text style={styles.permissionText}>Para desenhar a rota dentro do app, precisamos da sua posição atual.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestLocation}>
            <Text style={styles.permissionButtonText}>Usar minha localização</Text>
          </TouchableOpacity>
        </View>
      )}

      {loadingRota && (
        <View style={styles.loadingPill}>
          <ActivityIndicator color="#D97941" />
          <Text style={styles.loadingText}>Calculando rota...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 420, backgroundColor: '#0B0503', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)' },
  permissionCard: { position: 'absolute', left: 18, right: 18, bottom: 18, backgroundColor: '#130B08', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(217,121,65,0.28)' },
  permissionTitle: { color: '#F2E4D4', fontWeight: '900', fontSize: 17 },
  permissionText: { color: 'rgba(242,228,212,0.62)', marginTop: 5, lineHeight: 19 },
  permissionButton: { backgroundColor: '#D97941', borderRadius: 12, padding: 13, marginTop: 12, alignItems: 'center' },
  permissionButtonText: { color: '#0B0503', fontWeight: '900' },
  loadingPill: { position: 'absolute', top: 14, alignSelf: 'center', backgroundColor: '#130B08', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217,121,65,0.22)' },
  loadingText: { color: '#F2E4D4', fontWeight: '800' },
});

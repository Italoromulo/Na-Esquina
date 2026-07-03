import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { WebView } from 'react-native-webview';
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
  const [categorias, setCategorias] = useState<any[]>([]);
  const userLat = userLocation?.latitude ?? null;
  const userLon = userLocation?.longitude ?? null;

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

  const pinUri = useMemo(() => {
    let rawUri = '';
    if (typeof pinAsset === 'string') {
      rawUri = pinAsset;
    } else if (pinAsset && typeof pinAsset === 'object') {
      if (typeof (pinAsset as any).default === 'string') {
        rawUri = (pinAsset as any).default;
      } else if (typeof (pinAsset as any).uri === 'string') {
        rawUri = (pinAsset as any).uri;
      } else if (Image.resolveAssetSource) {
        rawUri = Image.resolveAssetSource(pinAsset as any)?.uri || '';
      }
    } else if (Image.resolveAssetSource) {
      rawUri = Image.resolveAssetSource(pinAsset as any)?.uri || '';
    }
    return rawUri;
  }, [pinAsset]);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background: #0B0503; }
        #map { width: 100vw; height: 100vh; background: #0B0503; }
        .leaflet-container { font-family: sans-serif; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const userLat = ${userLat ?? 'null'};
        const userLon = ${userLon ?? 'null'};
        const destLat = ${destino.latitude};
        const destLon = ${destino.longitude};
        const map = L.map('map', { attributionControl: false }).setView([userLat || destLat, userLon || destLon], userLat ? 14 : 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 }).addTo(map);
        
        try {
          const destIcon = L.icon({
            iconUrl: ${JSON.stringify(pinUri)},
            iconSize: [36, 45],
            iconAnchor: [18, 45],
            popupAnchor: [0, -42]
          });
          L.marker([destLat, destLon], { icon: destIcon }).addTo(map).bindPopup(${JSON.stringify(destino.nome || 'Destino')}).openPopup();
        } catch (error) {
          console.error("Erro ao renderizar ícone personalizado:", error);
          L.marker([destLat, destLon]).addTo(map).bindPopup(${JSON.stringify(destino.nome || 'Destino')}).openPopup();
        }

        if (userLat && userLon) {
          L.marker([userLat, userLon]).addTo(map).bindPopup('Você');
          fetch('https://router.project-osrm.org/route/v1/driving/' + userLon + ',' + userLat + ';' + destLon + ',' + destLat + '?overview=full&geometries=geojson')
            .then(r => r.json())
            .then(data => {
              if (!data.routes || !data.routes.length) return;
              const route = L.geoJSON(data.routes[0].geometry, { style: { color: '#D97941', weight: 5 } }).addTo(map);
              map.fitBounds(route.getBounds(), { padding: [40, 40] });
            });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        geolocationEnabled={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        nestedScrollEnabled={true}
        source={{ html: htmlContent }}
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      />

      {!userLocation && (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Ative sua localização</Text>
          <Text style={styles.permissionText}>Para desenhar a rota dentro do app, precisamos da sua posição atual.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestLocation}>
            <Text style={styles.permissionButtonText}>Usar minha localização</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 460, backgroundColor: '#0B0503', borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)' },
  permissionCard: { position: 'absolute', left: 18, right: 18, bottom: 18, backgroundColor: '#130B08', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(217,121,65,0.28)' },
  permissionTitle: { color: '#F2E4D4', fontWeight: '900', fontSize: 17 },
  permissionText: { color: 'rgba(242,228,212,0.62)', marginTop: 5, lineHeight: 19 },
  permissionButton: { backgroundColor: '#D97941', borderRadius: 12, padding: 13, marginTop: 12, alignItems: 'center' },
  permissionButtonText: { color: '#0B0503', fontWeight: '900' },
});

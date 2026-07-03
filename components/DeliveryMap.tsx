import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { ThemedText } from '@/components/themed-text';
import { Maximize2, Minimize2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation, calculateDistance, getAveragePrice } from '@/context/LocationContext';
import { getMapPin } from '@/constants/pins';

const normalizeText = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

// 💡 Função auxiliar robusta para verificar se a loja está dentro do horário de funcionamento
const estaNoHorarioDeFuncionamento = (horaInicio?: string, horaFim?: string) => {
  if (!horaInicio || !horaFim) return true;

  try {
    const agora = new Date();
    const horasAtuais = agora.getHours();
    const minutosAtuais = agora.getMinutes();
    const tempoAtualEmMinutos = horasAtuais * 60 + minutosAtuais;

    const converterParaMinutos = (horaStr: string) => {
      const partes = horaStr.split(':');
      const h = parseInt(partes[0], 10);
      const m = partes[1] ? parseInt(partes[1], 10) : 0;
      return isNaN(h) ? null : h * 60 + m;
    };

    const inicioMinutos = converterParaMinutos(horaInicio);
    const fimMinutos = converterParaMinutos(horaFim);

    if (inicioMinutos === null || fimMinutos === null) return true;

    if (fimMinutos < inicioMinutos) {
      return tempoAtualEmMinutos >= inicioMinutos || tempoAtualEmMinutos <= fimMinutos;
    }

    return tempoAtualEmMinutos >= inicioMinutos && tempoAtualEmMinutos <= fimMinutos;
  } catch (error) {
    console.error("Erro ao calcular horário de funcionamento:", error);
    return true;
  }
};

export default function DeliveryMap() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const {
    userLocation,
    restaurantes,
    searchQuery,
    minRating,
    maxDistance,
    maxPrice,
  } = useLocation();

  useEffect(() => {
    async function carregarCategorias() {
      const { data } = await supabase.from('categorias').select('id, nome');
      if (data) {
        setCategorias(data);
      }
    }
    carregarCategorias();
  }, []);

  const filteredRestaurantes = restaurantes.filter((item) => {
    if (item.offline === true || item.offline === 'true') return false;
    if (item.status === false || item.status === 'false') return false;

    // if (!estaNoHorarioDeFuncionamento(item.hora_inicio, item.hora_fim)) return false;

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
        parseFloat(item.latitude),
        parseFloat(item.longitude)
      );
      if (!isNaN(distance) && distance > maxDistance) return false;
    }

    const avgPrice = getAveragePrice(item);
    if (avgPrice > maxPrice) return false;

    return true;
  });

  const mapKey = useMemo(() => {
    return filteredRestaurantes.map(r => `${r.id}_${r.latitude}_${r.longitude}`).join('|');
  }, [filteredRestaurantes]);

  const markersJs = filteredRestaurantes
    .filter(r => {
      const lat = parseFloat(String(r.latitude));
      const lon = parseFloat(String(r.longitude));
      return !isNaN(lat) && !isNaN(lon);
    })
    .map(
      r => {
        const cat = categorias.find(c => String(c.id) === String(r.categoria_id));
        const catNome = cat ? cat.nome : '';
        const pinAsset = getMapPin(catNome);
        
        let pinUri = '';
        if (typeof pinAsset === 'string') {
          pinUri = pinAsset;
        } else if (pinAsset && typeof pinAsset === 'object') {
          if (typeof pinAsset.default === 'string') {
            pinUri = pinAsset.default;
          } else if (typeof pinAsset.uri === 'string') {
            pinUri = pinAsset.uri;
          } else if (Image.resolveAssetSource) {
            pinUri = Image.resolveAssetSource(pinAsset)?.uri || '';
          }
        } else if (Image.resolveAssetSource) {
          pinUri = Image.resolveAssetSource(pinAsset)?.uri || '';
        }

        return `
          try {
            const icon${r.id} = L.icon({
              iconUrl: ${JSON.stringify(pinUri)},
              iconSize: [36, 45],
              iconAnchor: [18, 45],
              popupAnchor: [0, -42]
            });

            const marker${r.id} = L.marker([${parseFloat(r.latitude)}, ${parseFloat(r.longitude)}], { icon: icon${r.id} })
              .addTo(map)
              .bindPopup(${JSON.stringify(r.nome)});

            marker${r.id}.on('click', () => {
              criarRota(${parseFloat(r.latitude)}, ${parseFloat(r.longitude)});
            });
          } catch (error) {
            console.error("Erro ao renderizar ícone personalizado para ${r.nome}:", error);
            const marker${r.id} = L.marker([${parseFloat(r.latitude)}, ${parseFloat(r.longitude)}])
              .addTo(map)
              .bindPopup(${JSON.stringify(r.nome)});

            marker${r.id}.on('click', () => {
              criarRota(${parseFloat(r.latitude)}, ${parseFloat(r.longitude)});
            });
          }
        `;
      }
    )
    .join('\n');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background: #0a0a0a; }
        #map { width: 100vw; height: 100vh; background: #0a0a0a; }
        .leaflet-container { font-family: sans-serif; }
        .leaflet-bar { 
          border: 1px solid rgba(255, 255, 255, 0.1) !important; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.8) !important; 
          border-radius: 8px !important; 
          overflow: hidden; 
        }
        .leaflet-bar a { 
          background-color: rgba(26, 26, 26, 0.1) !important; 
          backdrop-filter: blur(2px) !important; 
          -webkit-backdrop-filter: blur(5px) !important; 
          color: #F8FAFC !important; 
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; 
          transition: background 0.2s ease;
        }
        .leaflet-bar a:hover { 
          background-color: rgba(42, 42, 42, 0.7) !important; 
        }
        .leaflet-bar a:last-child {
          border-bottom: none !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var defaultLat = -22.9008;
        var defaultLon = -43.5654;
        var userLat = ${userLocation ? userLocation.latitude : 'null'};
        var userLon = ${userLocation ? userLocation.longitude : 'null'};

        var map = L.map('map', { 
          zoomControl: false, 
          attributionControl: false 
        }).setView([userLat || defaultLat, userLon || defaultLon], userLat ? 16 : 17);
        
        let currentRoute = null;
        let removeRouteBtn = null;

        function limparTodasAsRotas() {
          map.eachLayer(function(layer) {
            if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
              map.removeLayer(layer);
            }
          });
          currentRoute = null;
        }

        async function criarRota(destLat, destLon) {
          var startLat = userLat;
          var startLon = userLon;

          if (!startLat || !startLon) {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(async function(position) {
                desenharRota(position.coords.latitude, position.coords.longitude, destLat, destLon);
              });
            }
            return;
          }

          desenharRota(startLat, startLon, destLat, destLon);
        }

        async function desenharRota(startLat, startLon, destLat, destLon) {
          limparTodasAsRotas();

          const response = await fetch(
            'https://router.project-osrm.org/route/v1/driving/' +
            startLon + ',' + startLat + ';' +
            destLon + ',' + destLat +
            '?overview=full&geometries=geojson'
          );

          const data = await response.json();

          if (!data.routes || !data.routes.length) {
            return;
          }

          limparTodasAsRotas();

          currentRoute = L.geoJSON(data.routes[0].geometry, {
            style: {
              color: '#D97941',
              weight: 5
            }
          }).addTo(map);

          map.fitBounds(currentRoute.getBounds(), {
            padding: [50, 50]
          });

          if (!removeRouteBtn) {
            removeRouteBtn = L.control({ position: 'topright' });
            removeRouteBtn.onAdd = function() {
              const div = L.DomUtil.create('div');
              div.innerHTML =
                '<div id="remove-route-btn" ' +
                'style="' +
                'background:#dc2626;' +
                'color:white;' +
                'width:40px;' +
                'height:40px;' +
                'display:flex;' +
                'align-items:center;' +
                'justify-content:center;' +
                'border-radius:8px;' +
                'cursor:pointer;' +
                'font-weight:bold;' +
                'font-size:22px;' +
                'box-shadow:0 4px 12px rgba(0,0,0,.4);' +
                '">' +
                '×' +
                '</div>';
              return div;
            };
            removeRouteBtn.addTo(map);

            setTimeout(function() {
              const btn = document.getElementById('remove-route-btn');
              if (btn) {
                btn.onclick = function() {
                  limparTodasAsRotas();
                  if (removeRouteBtn) {
                    removeRouteBtn.remove();
                    removeRouteBtn = null;
                  }
                };
              }
            }, 100);
          }
        }

        ${markersJs}

        L.control.zoom({ position: 'topright' }).addTo(map);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        if (userLat && userLon) {
          var style = document.createElement('style');
          style.type = 'text/css';
          style.innerHTML = 
            '.gps-marker { position: relative; width: 14px; height: 14px; } ' +
            '.gps-dot { width: 14px; height: 14px; border-radius: 50%; background: #007AFF; border: 2px solid #FFFFFF; box-shadow: 0 0 5px rgba(0,0,0,0.5); } ' +
            '.gps-pulse { position: absolute; top: -10px; left: -10px; width: 34px; height: 34px; border-radius: 50%; background: rgba(0, 122, 255, 0.3); animation: gps-pulse 2s infinite ease-out; pointer-events: none; } ' +
            '@keyframes gps-pulse { 0% { transform: scale(0.3); opacity: 0.8; } 100% { transform: scale(1.2); opacity: 0; } }';
          document.getElementsByTagName('head')[0].appendChild(style);

          var gpsIcon = L.divIcon({
            html: '<div class="gps-marker"><div class="gps-pulse"></div><div class="gps-dot"></div></div>',
            className: 'gps-custom-icon',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          
          L.marker([userLat, userLon], { icon: gpsIcon }).addTo(map)
            .bindPopup('<b>Sua Localização</b><br>Você está aqui.')
            .openPopup();
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.mapCard, { height: isExpanded ? 620 : 320 }]}>
      <BlurView intensity={10} tint="dark" style={styles.mapLabel}>
        <ThemedText style={styles.labelText}>Rio de Janeiro</ThemedText>
      </BlurView>
      <WebView
        key={mapKey}
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
        containerStyle={{ borderRadius: 24 }}
      />

      <TouchableOpacity
        style={styles.expandBtn}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <BlurView intensity={15} tint="dark" style={styles.expandBlur}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'transparent', 'rgba(255, 255, 255, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {isExpanded ? (
            <Minimize2 size={18} color="#F2E4D4" style={{ zIndex: 1 }} />
          ) : (
            <Maximize2 size={18} color="#F2E4D4" style={{ zIndex: 1 }} />
          )}
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0000004d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 10,
    marginBottom: 40,
  },
  mapLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 2,
    overflow: 'hidden',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  expandBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.3)',
  },
  expandBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.05)',
    borderRadius: 14,
    overflow: 'hidden',
  },
});
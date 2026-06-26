import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import RouteMap from '@/components/RouteMap';

type Restaurante = {
  id: number | string;
  nome?: string;
  endereco?: string;
  latitude?: number | null;
  longitude?: number | null;
  categoria_id?: number | string;
};

export default function RotaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);

  useEffect(() => {
    carregarDestino();
  }, [id]);

  async function carregarDestino() {
    if (!id) return;
    setLoading(true);

    const { data } = await supabase
      .from('restaurantes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    setRestaurante(data);
    setLoading(false);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#D97941" size="large" /></View>;
  }

  if (!restaurante?.latitude || !restaurante?.longitude) {
    return (
      <View style={styles.centerPadding}>
        <Text style={styles.title}>Rota indisponível</Text>
        <Text style={styles.subtitle}>Esse vendedor ainda não possui coordenadas salvas no app.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
        <ArrowLeft size={20} color="#F2E4D4" />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.kicker}>Rota pelo app</Text>
        <Text style={styles.title}>{restaurante.nome || 'Destino'}</Text>
        <Text style={styles.subtitle}>{restaurante.endereco || 'Endereço não informado'}</Text>
      </View>

      <View style={styles.mapWrap}>
        <RouteMap destino={{
          latitude: Number(restaurante.latitude),
          longitude: Number(restaurante.longitude),
          nome: restaurante.nome,
          endereco: restaurante.endereco,
          categoria_id: restaurante.categoria_id,
        }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0503', padding: 20, paddingTop: 52 },
  center: { flex: 1, backgroundColor: '#0B0503', alignItems: 'center', justifyContent: 'center' },
  centerPadding: { flex: 1, backgroundColor: '#0B0503', alignItems: 'center', justifyContent: 'center', padding: 24 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(242,228,212,0.06)', borderWidth: 1, borderColor: 'rgba(242,228,212,0.10)', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, marginBottom: 18 },
  backText: { color: '#F2E4D4', fontWeight: '800' },
  header: { marginBottom: 14 },
  kicker: { color: '#D97941', fontWeight: '900', textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.8 },
  title: { color: '#F2E4D4', fontSize: 28, fontWeight: '900', marginTop: 4, textAlign: 'left' },
  subtitle: { color: 'rgba(242,228,212,0.62)', marginTop: 6, lineHeight: 20 },
  mapWrap: { flex: 1, minHeight: 420 },
  button: { backgroundColor: '#D97941', borderRadius: 14, padding: 14, marginTop: 18 },
  buttonText: { color: '#0B0503', fontWeight: '900' },
});

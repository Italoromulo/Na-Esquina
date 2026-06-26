import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useLocation } from '@/context/LocationContext';

const filtrosRapidos = [
  { id: '', label: 'Todos' },
  { id: 'vendendo', label: 'Vendendo agora' },
];

export default function FiltrosScreen() {
  const { activeCategory, setActiveCategory } = useLocation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
        <ArrowLeft size={20} color="#F2E4D4" />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Filtros</Text>
      <Text style={styles.subtitle}>Ajuste rapidamente o que aparece na tela inicial.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Filtros rápidos</Text>
        {filtrosRapidos.map((filtro) => (
          <TouchableOpacity
            key={filtro.id || 'todos'}
            style={[styles.option, activeCategory === filtro.id && styles.optionActive]}
            onPress={() => {
              setActiveCategory(filtro.id);
              router.back();
            }}
          >
            <Text style={[styles.optionText, activeCategory === filtro.id && styles.optionTextActive]}>{filtro.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.note}>As categorias principais continuam no topo da home. Esta tela fica pronta para receber distância, avaliação e outros filtros depois.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0B0503', padding: 24, paddingTop: 54 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(242,228,212,0.06)', borderWidth: 1, borderColor: 'rgba(242,228,212,0.10)', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, marginBottom: 20 },
  backText: { color: '#F2E4D4', fontWeight: '800' },
  title: { color: '#F2E4D4', fontSize: 30, fontWeight: '900' },
  subtitle: { color: 'rgba(242,228,212,0.62)', marginTop: 6, marginBottom: 18 },
  card: { backgroundColor: '#130B08', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)' },
  sectionTitle: { color: '#D97941', fontSize: 17, fontWeight: '900', marginBottom: 12 },
  option: { backgroundColor: '#1A120D', borderRadius: 14, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(242,228,212,0.07)' },
  optionActive: { backgroundColor: '#D97941', borderColor: '#F2A172' },
  optionText: { color: '#F2E4D4', fontWeight: '900' },
  optionTextActive: { color: '#0B0503' },
  note: { color: 'rgba(242,228,212,0.50)', marginTop: 16, lineHeight: 20 },
});

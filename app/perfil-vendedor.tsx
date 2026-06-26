import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useResponsive } from '@/hooks/useResponsive';

export default function PerfilVendedor() {
  const { isTablet } = useResponsive();
  const [online, setOnline] = useState(false);

  const vendedor = {
    id: '1',
    nome: 'João do Pastel',
    categoria: 'Pastel e Caldo de Cana',
    descricao: 'Vendo pastel frito na hora, caldo de cana gelado e refrigerantes.',
    horario: 'Segunda a sábado, 16h às 22h',
    regiao: 'Campo Grande - RJ',
    telefone: '5521999999999',
    imagem: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=500',
  };

  function alternarStatus() {
    setOnline((atual) => !atual);
    Alert.alert(
      'Status atualizado',
      !online ? 'Você está vendendo agora.' : 'Você saiu do modo vendendo agora.'
    );
  }

  function abrirWhatsapp() {
    Linking.openURL(`https://wa.me/${vendedor.telefone}`);
  }

  return (
    <ScrollView style={[styles.container, isTablet && styles.containerTablet]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Image source={{ uri: vendedor.imagem }} style={styles.avatar} />
        <Text style={styles.nome}>{vendedor.nome}</Text>
        <Text style={styles.categoria}>{vendedor.categoria}</Text>

        <TouchableOpacity
          style={[styles.statusButton, online ? styles.statusOnline : styles.statusOffline]}
          onPress={alternarStatus}
        >
          <Text style={styles.statusText}>{online ? '🟢 Estou vendendo agora' : '🔴 Não estou vendendo'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sobre o vendedor</Text>
        <Text style={styles.text}>{vendedor.descricao}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações</Text>
        <Text style={styles.info}>📍 {vendedor.regiao}</Text>
        <Text style={styles.info}>🕒 {vendedor.horario}</Text>
        <Text style={styles.info}>⭐ 4.8 de avaliação</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={abrirWhatsapp}>
        <Text style={styles.primaryButtonText}>Chamar no WhatsApp</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push(`/vendedor/${vendedor.id}`)}>
        <Text style={styles.secondaryButtonText}>Ver página pública</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1115' },
  containerTablet: {
    maxWidth: 768,
    alignSelf: 'center',
    width: '100%',
  },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 14 },
  nome: { color: '#fff', fontSize: 26, fontWeight: '800' },
  categoria: { color: '#a1a1aa', fontSize: 15, marginTop: 4 },
  statusButton: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 999 },
  statusOnline: { backgroundColor: '#15803d' },
  statusOffline: { backgroundColor: '#7f1d1d' },
  statusText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#171a21', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#272b35' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  text: { color: '#d4d4d8', lineHeight: 22 },
  info: { color: '#d4d4d8', marginTop: 8 },
  primaryButton: { backgroundColor: '#22c55e', padding: 16, borderRadius: 14, marginTop: 8 },
  primaryButtonText: { color: '#fff', textAlign: 'center', fontWeight: '800' },
  secondaryButton: { backgroundColor: '#272b35', padding: 16, borderRadius: 14, marginTop: 12 },
  secondaryButtonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});

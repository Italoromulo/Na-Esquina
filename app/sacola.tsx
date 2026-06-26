import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, ShoppingBag } from 'lucide-react-native';
import { useResponsive } from '@/hooks/useResponsive';

export default function SacolaScreen() {
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }, isTablet && styles.containerTablet]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sacola</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <BlurView intensity={30} tint="dark" style={styles.closeBlur}>
            <X size={20} color="#F2E4D4" />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Conteúdo Simples / Vazio */}
      <View style={styles.content}>
        <ShoppingBag size={48} color="rgba(212, 197, 176, 0.4)" style={styles.icon} />
        <Text style={styles.emptyText}>Sua sacola está vazia</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0503', // Background 1 (Dark)
  },
  containerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 228, 212, 0.06)', // Background 1 (Light) with low opacity
  },
  headerTitle: {
    color: '#F2E4D4', // Background 1 (Light)
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  closeBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(242, 228, 212, 0.05)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80, 
  },
  icon: {
    marginBottom: 16,
  },
  emptyText: {
    color: 'rgba(242, 228, 212, 0.6)', // Background 1 (Light) with opacity
    fontSize: 16,
    fontWeight: '500',
  },
});

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Home, User, Users } from 'lucide-react-native';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Alert, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function GlassNav({ scrollY }: any) {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/';
  const isFavoritos = pathname === '/favoritos';
  const isMembros = pathname === '/membros';
  const isPerfil = pathname === '/conta';

  const opacity = 1;
  const translateY = 0;

  return (
  <Animated.View
  style={[
    styles.container,
    {
      opacity,
      transform: [{ translateY }],
    },
  ]}
>
      {/* Camada 1: O corpo do vidro com Blur mais suave, no estilo do botão de Zoom/Rio */}
      <BlurView intensity={32} tint="dark" style={styles.glass}>
        
        {/* Camada 2: Gradiente sutil para simular reflexo de luz */}
        <LinearGradient
          colors={['rgba(89, 44, 5, 0.25)', 'transparent', 'rgba(217, 121, 65, 0.20)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />

        <View style={styles.content}>
          {/* INÍCIO */}
          <TouchableOpacity 
            style={[styles.navItem, isHome && styles.activeItem]} 
            onPress={() => router.replace('/(tabs)')}
          >
            <Home size={22} color={isHome ? '#D97941' : '#746B63'} />
            <Text style={[styles.text, isHome && { color: '#D97941', fontWeight: 'bold' }]}>Início</Text>
          </TouchableOpacity>

          {/* FAVORITOS */}
          <TouchableOpacity 
            style={[styles.navItem, isFavoritos && styles.activeItem]} 
            onPress={() => router.replace('/favoritos')}
          >
            <Heart size={22} color={isFavoritos ? '#D97941' : '#746B63'} />
            <Text style={[styles.text, isFavoritos && { color: '#D97941', fontWeight: 'bold' }]}>Favoritos</Text>
          </TouchableOpacity>

          {/* MEMBROS */}
          <TouchableOpacity 
            style={[styles.navItem, isMembros && styles.activeItem]} 
            onPress={() => router.replace('/membros')}
          >
            <Users size={22} color={isMembros ? '#D97941' : '#746B63'} />
            <Text style={[styles.text, isMembros && { color: '#D97941', fontWeight: 'bold' }]}>Membros</Text>
          </TouchableOpacity>

          {/* PERFIL */}
          <TouchableOpacity 
            style={[styles.navItem, isPerfil && styles.activeItem]} 
            onPress={() => router.replace('/conta')}
          >
            <User size={22} color={isPerfil ? '#D97941' : '#746B63'} />
            <Text style={[styles.text, isPerfil && { color: '#D97941', fontWeight: 'bold' }]}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    borderRadius: 28,
    // Sombra de profundidade (Ambient Occlusion)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 111111111111111210,
  },
  glass: {
    borderRadius: 28,
    overflow: 'hidden',
    // Estilo semelhante ao botão do Rio de Janeiro / Zoom
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    backgroundColor: Platform.OS === 'android' ? 'rgba(19, 11, 8, 0.94)' : 'rgba(26, 26, 26, 0.1)',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject, // Cobre todo o fundo do vidro
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 7,
    zIndex: 1, // Fica acima do gradiente
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    paddingVertical: 8,
    borderRadius: 18,
  },
  activeItem: {
    backgroundColor: 'rgba(217, 121, 65, 0.15)', // Brasa with opacity
    borderWidth: 1,
    borderColor: 'rgba(217, 121, 65, 0.25)',
  },
  text: {
    fontSize: 11,
    color: '#746B63', // Background 2 (Light)
    marginTop: 4,
    letterSpacing: 0.5,
  }
});

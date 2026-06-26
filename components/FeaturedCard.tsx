import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Flame, Sparkles } from 'lucide-react-native'; 
import { supabase } from '@/services/supabase';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(screenWidth - 46, 340);
const CARD_GAP = 14;

// 💡 Definição dos estilos visuais por tipo de promoção para badges únicas e chamativas
// 💡 CORES INDIVIDUAIS E EXCLUSIVAS PARA CADA BADGE (Destaque, Promo, Combo, Favorito)
const PROMO_THEMES: Record<string, { bg: string; border: string; text: string }> = {
  'semana':   { bg: 'rgba(217, 121, 65, 0.25)', border: 'rgba(217, 121, 65, 0.6)',   text: '#D97941' }, // Laranja Premium
  'dia':      { bg: 'rgba(220, 38, 38, 0.25)',  border: 'rgba(220, 38, 38, 0.6)',    text: '#EF4444' }, // Vermelho Alerta
  'combo':    { bg: 'rgba(16, 185, 129, 0.25)', border: 'rgba(16, 185, 129, 0.6)',   text: '#10B981' }, // Verde Combo
  'favorito': { bg: 'rgba(139, 92, 246, 0.25)', border: 'rgba(139, 92, 246, 0.6)',   text: '#8B5CF6' }, // Roxo Favorito
  'simples':  { bg: 'rgba(59, 130, 246, 0.25)', border: 'rgba(59, 130, 246, 0.6)',   text: '#3B82F6' }, // Azul Recomendado
};

export default function FeaturedCard() {
  const [promosSupa, setPromosSupa] = useState<any[]>([]);

  useEffect(() => {
    carregarDestaques();
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDestaques();
    }, [])
  );

  async function carregarDestaques() {
    const { data, error } = await supabase
      .from('restaurantes')
      .select('*')
      .or('semana_destaque.eq.true,dia_promo.eq.true,destaque.eq.true,combo_especial.eq.true,mais_vendido.eq.true')
      .eq('offline', false);

    if (error) {
      console.error("Erro ao carregar destaques do Supabase:", error);
      return;
    }

    if (data) {
      const formatados = data.map((item) => {
        let tag = 'NOVIDADE';
        let badge = item.desconto_texto || 'CONFIRA';
        let isSpecial = false;
        let type = 'simples'; // Chave de cor fallback

        if (item.semana_destaque) {
          tag = 'DESTAQUE DA SEMANA';
          badge = item.desconto_texto || '20% OFF';
          isSpecial = true;
          type = 'semana';
        } else if (item.dia_promo) {
          tag = 'PROMOÇÃO DO DIA';
          type = 'dia';
          if (item.porcentagem_desconto !== null && item.porcentagem_desconto !== undefined) {
            badge = `${item.porcentagem_desconto}% OFF`;
          } else {
            badge = item.desconto_texto || 'OFERTA';
          }
        } else if (item.combo_especial) {
          tag = 'COMBO ESPECIAL';
          badge = item.desconto_texto || 'PREÇO TOP';
          type = 'combo';
        } else if (item.mais_vendido) {
          tag = 'MAIS VENDIDO';
          badge = item.desconto_texto || 'O FAVORITO';
          type = 'favorito';
        } else if (item.destaque) {
          tag = 'RECOMENDADO';
          badge = item.desconto_texto || 'DESTAQUE';
          type = 'simples';
        }

        return {
          id: String(item.id),
          title: item.nome,
          description: item.descricao || 'Nenhuma descrição informada.',
          image: item.imagem_url,
          tag,
          badge,
          isSpecial,
          type // 💡 Vincula o tipo de cor aqui
        };
      });

      setPromosSupa(formatados);
    }
  }

  if (promosSupa.length === 0) return null;

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
      >
        {promosSupa.map((promo) => {
          // Puxa o tema de cores específico baseado na tag da promoção atual
         const temaVisual = PROMO_THEMES[promo.type] || PROMO_THEMES['simples'];

          return (
            <View key={promo.id} style={styles.cardContainer}>
              <ImageBackground 
                source={{ uri: promo.image }}
                style={styles.imageBackground}
                imageStyle={styles.imageStyle}
              >
                <LinearGradient
                  colors={['rgba(11, 5, 3, 0.1)', 'rgba(11, 5, 3, 0.92)']}
                  style={StyleSheet.absoluteFillObject}
                />
                
                <View style={styles.topRow}>
                  <View style={[
                    styles.tagContainer,
                    promo.isSpecial ? styles.tagSpecialContainer : null
                  ]}>
                    {promo.isSpecial ? (
                      <Flame size={12} color="#D97941" fill="#D97941" />
                    ) : (
                      <Sparkles size={12} color="#F2E4D4" />
                    )}
                    <Text style={[
                      styles.tagText,
                      promo.isSpecial ? styles.tagSpecialText : null
                    ]}>{promo.tag}</Text>
                  </View>
                  
                  {/* 💡 CORES DINÂMICAS NAS BADGES: Injetando estilos inline mapeados do objeto premium */}
                  <BlurView 
                    intensity={40} 
                    tint="dark" 
                    style={[styles.badgeBlur, { backgroundColor: temaVisual.bg, borderColor: temaVisual.border }]}
                  >
                    <Text style={[styles.badgeText, { color: temaVisual.text }]}>{promo.badge}</Text>
                  </BlurView>
                </View>

                <View style={styles.bottomSection}>
                  <View style={styles.contentContainer}>
                    <Text style={styles.storeName}>{promo.title}</Text>
                    <Text style={styles.promoDescription} numberOfLines={2}>
                      {promo.description}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.actionButton} 
                    activeOpacity={0.85}
                    onPress={() => router.push(`/vendedor/${promo.id}`)}
                  >
                    <Text style={styles.actionButtonText}>Aproveitar</Text>
                    <ArrowRight size={14} color="#0B0503" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

              </ImageBackground>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    marginHorizontal: -20,
    left: 20,
    marginBottom: 5,
    marginTop: 25,
  },
  scrollContainer: {
    paddingHorizontal: 1,
    gap: CARD_GAP,
    paddingBottom: 15,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
    backgroundColor: '#120806',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  imageBackground: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  imageStyle: {
    resizeMode: 'cover',
    opacity: 0.9,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 5, 3, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.15)',
    gap: 5,
  },
  tagSpecialContainer: {
    borderColor: 'rgba(217, 121, 65, 0.25)',
  },
  tagText: {
    color: '#F2E4D4',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tagSpecialText: {
    color: '#D97941',
  },
  badgeBlur: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  storeName: {
    color: '#F2E4D4',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  promoDescription: {
    color: 'rgba(242, 228, 212, 0.72)',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '400',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97941',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#D97941',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonText: {
    color: '#0B0503',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
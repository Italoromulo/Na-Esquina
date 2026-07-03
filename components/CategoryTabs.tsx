import React, { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { BlurView } from 'expo-blur';
import { ScrollView, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';

//  export type Category = 'all' | 'burguer' | 'pizza' | 'salgados' | 'doces';

interface CategoryTabsProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}


export default function CategoryTabs({ activeCategory, onSelectCategory }: CategoryTabsProps) {

  const [categoriasSupa, setCategoriasSupa] = useState<any[]>([]);

  useEffect(() => {
      carregarCategorias();
      return ;
  }, []);

  async function carregarCategorias() {
      const { data, error } = await supabase
          .from('categorias')
          .select('*');

      console.log(data);
      console.log(error);

      if (data) {
          setCategoriasSupa(data);
      }

  }

 

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollWrapper}
    >
      {categoriasSupa.map((cat) => {
        const isActive = activeCategory === String(cat.id);

        return (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.7}
            onPress={() => onSelectCategory(cat.nome === 'Todos' ? '' : String(cat.id))}
            style={[styles.tabWrapper, isActive && styles.tabActiveWrapper]}
            >
            <BlurView
              intensity={isActive ? 50 : 20}
              tint="dark"
              style={[
                styles.tabBlur,
                isActive && styles.tabActiveBlur,
              ]}
            >
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {cat.nome}
              </Text>
            </BlurView>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollWrapper: {
    marginTop: 14,
  },
  container: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 20,
  },
  tabWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  tabActiveWrapper: {
    borderColor: 'transparent',
    shadowColor: '#A60321',
    shadowOpacity: 0.4,
    elevation: 8,
  },
  tabBlur: {
    paddingVertical: 6,
    width: 70.5,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Platform.OS === 'android' ? 'rgba(30, 20, 15, 0.9)' : 'rgba(255, 255, 255, 0.03)',
  },
  tabActiveBlur: {
    backgroundColor: Platform.OS === 'android' ? 'rgba(166, 3, 33, 0.9)' : 'rgba(166, 3, 33, 0.4)',
  },
  emoji: {
    fontSize: 18,
  },
  label: {
    color: '#746B63',
    fontSize: 11,
    fontWeight: '500',
  },
  labelActive: {
    color: '#F2E4D4',
    fontWeight: '600',
  },
});

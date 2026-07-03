import { BlurView } from 'expo-blur';
import { SlidersHorizontal, X } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  onFilterPress?: () => void;
  style?: any;
}

export default function SearchHeader({
  searchQuery,
  setSearchQuery,
  onFilterPress,
  style,
}: SearchHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={50} tint="dark" style={styles.searchBar} experimentalBlurMethod="dimeaxis">
        <TextInput
          style={styles.input}
          placeholder="Buscar restaurantes ou pratos..."
          placeholderTextColor="rgba(212, 197, 176, 0.6)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearBtn} 
            onPress={() => setSearchQuery('')} 
            activeOpacity={0.7}
          >
            <X size={18} color="rgba(242, 228, 212, 0.6)" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.filterBtn} onPress={onFilterPress} activeOpacity={0.7}>
          <BlurView intensity={60} tint="dark" style={styles.filterBlur} experimentalBlurMethod="dimeaxis">
            <SlidersHorizontal size={18} color="#F2E4D4" />
          </BlurView>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  searchBar: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingLeft: 16,
    paddingRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  input: {
    flex: 1,
    color: '#F2E4D4',
    fontSize: 15,
    fontFamily: 'Inter_400Regular', // ou padrão do projeto
    paddingVertical: 0, // fix android padding
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  clearBtn: {
    padding: 8,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 10,
  },
  filterBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 121, 65, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 121, 65, 0.3)',
    borderRadius: 12,
  },
});

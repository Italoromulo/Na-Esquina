import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Star, MapPin, DollarSign, ArrowUpDown } from 'lucide-react-native';
import { useLocation } from '@/context/LocationContext';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FilterModal({ visible, onClose }: FilterModalProps) {
  const {
    sortBy,
    setSortBy,
    minRating,
    setMinRating,
    maxDistance,
    setMaxDistance,
    maxPrice,
    setMaxPrice,
    userLocation,
  } = useLocation();

  // Estados locais para edição antes de aplicar
  const [localSortBy, setLocalSortBy] = useState(sortBy);
  const [localMinRating, setLocalMinRating] = useState(minRating);
  const [localMaxDistance, setLocalMaxDistance] = useState(maxDistance);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Sincroniza estados locais com o contexto ao abrir o modal
  useEffect(() => {
    if (visible) {
      setLocalSortBy(sortBy);
      setLocalMinRating(minRating);
      setLocalMaxDistance(maxDistance);
      setLocalMaxPrice(maxPrice);
    }
  }, [visible, sortBy, minRating, maxDistance, maxPrice]);

  const handleApply = () => {
    setSortBy(localSortBy);
    setMinRating(localMinRating);
    setMaxDistance(localMaxDistance);
    setMaxPrice(localMaxPrice);
    onClose();
  };

  const handleClear = () => {
    setLocalSortBy('relevancia');
    setLocalMinRating(0);
    setLocalMaxDistance(99999);
    setLocalMaxPrice(99999);
  };

  const sortOptions = [
    { id: 'relevancia', label: 'Relevância (Padrão)' },
    { id: 'distancia', label: 'Mais próximo', disabled: !userLocation },
    { id: 'avaliacao', label: 'Melhor avaliação' },
    { id: 'preco', label: 'Menor preço do prato' },
  ];

  const distanceOptions = [
    { value: 99999, label: 'Qualquer' },
    { value: 1, label: '1 km' },
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
  ];

  const ratingOptions = [
    { value: 0, label: 'Qualquer' },
    { value: 4.0, label: '⭐ 4.0+' },
    { value: 4.5, label: '⭐ 4.5+' },
  ];

  const priceOptions = [
    { value: 99999, label: 'Qualquer' },
    { value: 20, label: 'Até R$ 20' },
    { value: 40, label: 'Até R$ 40' },
    { value: 60, label: 'Até R$ 60' },
  ];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Filtros e Ordenação</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.75}>
                  <X size={20} color="#F2E4D4" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
                {/* 1. Ordenação */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ArrowUpDown size={16} color="#D97941" style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Ordenar por</Text>
                  </View>
                  <View style={styles.optionsGrid}>
                    {sortOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        disabled={opt.disabled}
                        style={[
                          styles.optionBtn,
                          localSortBy === opt.id && styles.optionBtnActive,
                          opt.disabled && styles.optionBtnDisabled,
                        ]}
                        onPress={() => setLocalSortBy(opt.id)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            localSortBy === opt.id && styles.optionTextActive,
                            opt.disabled && styles.optionTextDisabled,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {!userLocation && (
                    <Text style={styles.warningText}>
                      * Ative a geolocalização para ordenar por proximidade.
                    </Text>
                  )}
                </View>

                {/* 2. Distância */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MapPin size={16} color="#D97941" style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Distância máxima</Text>
                  </View>
                  <View style={styles.optionsRow}>
                    {distanceOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        disabled={!userLocation && opt.value !== 99999}
                        style={[
                          styles.chipBtn,
                          localMaxDistance === opt.value && styles.chipBtnActive,
                          !userLocation && opt.value !== 99999 && styles.chipBtnDisabled,
                        ]}
                        onPress={() => setLocalMaxDistance(opt.value)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            localMaxDistance === opt.value && styles.chipTextActive,
                            !userLocation && opt.value !== 99999 && styles.chipTextDisabled,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 3. Avaliação */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Star size={16} color="#D97941" style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Avaliação mínima</Text>
                  </View>
                  <View style={styles.optionsRow}>
                    {ratingOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.chipBtn,
                          localMinRating === opt.value && styles.chipBtnActive,
                        ]}
                        onPress={() => setLocalMinRating(opt.value)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            localMinRating === opt.value && styles.chipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 4. Preço Máximo */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <DollarSign size={16} color="#D97941" style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Preço médio dos pratos</Text>
                  </View>
                  <View style={styles.optionsRow}>
                    {priceOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.chipBtn,
                          localMaxPrice === opt.value && styles.chipBtnActive,
                        ]}
                        onPress={() => setLocalMaxPrice(opt.value)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            localMaxPrice === opt.value && styles.chipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}
                  activeOpacity={0.75}
                >
                  <Text style={styles.clearButtonText}>Limpar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApply}
                  activeOpacity={0.75}
                >
                  <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 5, 3, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#130B08',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: '#F2E4D4',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(242, 228, 212, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.1)',
  },
  scrollArea: {
    flexGrow: 0,
    marginBottom: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    color: '#D97941',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1C120E',
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.06)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: '#D97941',
    borderColor: '#F2A172',
  },
  optionBtnDisabled: {
    backgroundColor: 'rgba(28, 18, 14, 0.4)',
    borderColor: 'rgba(242, 228, 212, 0.02)',
  },
  optionText: {
    color: '#F2E4D4',
    fontSize: 14,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#0B0503',
  },
  optionTextDisabled: {
    color: 'rgba(242, 228, 212, 0.25)',
  },
  warningText: {
    color: 'rgba(242, 228, 212, 0.4)',
    fontSize: 11,
    marginTop: 6,
    paddingLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chipBtn: {
    backgroundColor: '#1C120E',
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chipBtnActive: {
    backgroundColor: '#D97941',
    borderColor: '#F2A172',
  },
  chipBtnDisabled: {
    backgroundColor: 'rgba(28, 18, 14, 0.4)',
    borderColor: 'rgba(242, 228, 212, 0.02)',
  },
  chipText: {
    color: '#F2E4D4',
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#0B0503',
  },
  chipTextDisabled: {
    color: 'rgba(242, 228, 212, 0.25)',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(242, 228, 212, 0.08)',
    paddingTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(242, 228, 212, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.1)',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#F2E4D4',
    fontSize: 16,
    fontWeight: '700',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#D97941',
    alignItems: 'center',
    shadowColor: '#D97941',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: '#0B0503',
    fontSize: 16,
    fontWeight: '900',
  },
});

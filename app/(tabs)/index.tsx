import React, { useCallback, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassNav from '@/components/GlassNav';
import Cards from '@/components/Cards';
import { ThemedView } from '@/components/themed-view';
import DeliveryMap from '@/components/DeliveryMap';
import SearchHeader from '@/components/SearchHeader';
import CategoryTabs from '@/components/CategoryTabs';
import FeaturedCard from '@/components/FeaturedCard';
import AccountButton from '@/components/AccountButton';
import VendorDashboard from '@/components/VendorDashboard';
import { useResponsive } from '@/hooks/useResponsive';
import { useLocation } from '@/context/LocationContext';
import { useFocusEffect } from '@react-navigation/native';
import FilterModal from '@/components/FilterModal';

export default function HomeScreen() {
  const { isTablet } = useResponsive();
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory, carregarRestaurantes } = useLocation();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarRestaurantes();
    }, [carregarRestaurantes])
  );

  return (
    <ThemedView style={[styles.container, isTablet && styles.containerTablet]}>
      <BlurView
        intensity={40}
        tint="dark"
        style={[
          styles.topHeaderContainer,
          { paddingTop: insets.top + 10 }
        ]}
      >
        <View style={styles.headerRow}>
          <SearchHeader 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFilterPress={() => setIsFilterModalVisible(true)}
            style={styles.searchHeader}
          />
          <AccountButton style={styles.accountBtn} />
        </View>

        <CategoryTabs 
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
      </BlurView>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 180, paddingBottom: insets.bottom + 120 }
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}>

        <View style={styles.header}>
        </View>

        {!searchQuery ? (
          <>
            <VendorDashboard />
            <DeliveryMap />
            <FeaturedCard />
          </>
        ) : null}

        <Cards activeCategory={activeCategory} searchQuery={searchQuery} />
      </Animated.ScrollView>

      <GlassNav scrollY={scrollY} />
      <FilterModal 
        visible={isFilterModalVisible} 
        onClose={() => setIsFilterModalVisible(false)} 
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: '#0B0503',
  },
  containerTablet: {
    maxWidth: 960,
  },
  topHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 5, 3, 0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 228, 212, 0.08)',
    zIndex: 100,
    paddingBottom: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchHeader: {
    flex: 1,
    paddingRight: 0,
  },
  accountBtn: {
    marginRight: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
    zIndex: 2,
    width: '100%',
  },
});

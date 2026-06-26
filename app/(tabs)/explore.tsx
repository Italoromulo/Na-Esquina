import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import GlassNav from '@/components/GlassNav';
import { useResponsive } from '@/hooks/useResponsive';

export default function ExploreScreen() {
  const { isTablet } = useResponsive();

  return (
    <ThemedView style={[styles.container, isTablet && styles.containerTablet]}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Membros</ThemedText>
      </ThemedView>
      
      <ThemedText>
        Aqui você pode listar os membros do seu projeto (Vitor, Luiz, Diogo, etc).
      </ThemedText>

      {/* Mantendo a sua barra de vidro aqui também */}
      <GlassNav />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: '#0B0503',
  },
  containerTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
});
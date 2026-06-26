import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  // Breakpoints padrão
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  return {
    width,
    height,
    isTablet,
    isDesktop,
    isMobile,
  };
}

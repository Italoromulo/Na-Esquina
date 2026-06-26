import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastMessage = {
  id: number;
  title: string;
  message?: string;
  variant?: ToastVariant;
};

interface AppToastProps {
  toast: ToastMessage | null;
  onHide?: () => void;
}

export default function AppToast({ toast, onHide }: AppToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-18)).current;

  useEffect(() => {
    if (!toast) return;

    opacity.setValue(0);
    translateY.setValue(-18);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -18,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => onHide?.());
    }, 2300);

    return () => clearTimeout(timer);
  }, [toast?.id]);

  if (!toast) return null;

  const variant = toast.variant ?? 'info';
  const icon = variant === 'success' ? '✅' : variant === 'error' ? '⚠️' : 'ℹ️';

  const variantStyle = variant === 'success' ? styles.success : variant === 'error' ? styles.error : styles.info;

  return (
    <Animated.View style={[styles.wrapper, { opacity, transform: [{ translateY }] }]} pointerEvents="none">
      <View style={[styles.toast, variantStyle]}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{toast.title}</Text>
          {!!toast.message && <Text style={styles.message}>{toast.message}</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 42,
    left: 18,
    right: 18,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 520,
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    backgroundColor: '#130B08',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  success: {
    borderColor: 'rgba(34,197,94,0.45)',
  },
  error: {
    borderColor: 'rgba(239,68,68,0.45)',
  },
  info: {
    borderColor: 'rgba(217,121,65,0.45)',
  },
  icon: {
    fontSize: 20,
  },
  title: {
    color: '#F2E4D4',
    fontWeight: '900',
    fontSize: 14,
  },
  message: {
    color: 'rgba(242,228,212,0.68)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});

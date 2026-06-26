import { Video } from 'expo-av';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const videoRef = useRef<Video | null>(null);
  const [progressWidth] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate progress bar to 100% over 1800ms
    Animated.timing(progressWidth, {
      toValue: 100,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    const timeout = setTimeout(() => {
      router.replace('/(tabs)');
    }, 1800);

    return () => clearTimeout(timeout);
  }, [progressWidth]);

  const progressPercentage = progressWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.screen}>
      <View style={styles.videoWrapper}>
        {Platform.OS === 'web' ? (
          // expo-av não aplica resizeMode corretamente no web (vídeo fica
          // colado à esquerda/cortado). Usamos a tag <video> HTML nativa,
          // que respeita object-fit normalmente.
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            // @ts-ignore - require de asset funciona como string de URI no Metro web
            src={require('../assets/Splash/splash-screen.mp4')}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '80%',
              height: '60%',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
            }}
          />
        ) : (
          <Video
            ref={videoRef}
            source={require('../assets/Splash/splash-screen.mp4')}
            style={styles.video}
            status={{
              shouldPlay: true,
              isLooping: true,
            }}
            resizeMode="contain"
            isMuted
            volume={0}
            useNativeControls={false}
          />
        )}
      </View>
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            { width: progressPercentage },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '80%',
    height: '60%',
  },
  progressContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D97941',
  },
});

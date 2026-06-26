import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function Logo() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logoImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 5,
  },
  logoImage: {
    width: 350,
    height: 120,
    resizeMode: 'contain',
  },
});
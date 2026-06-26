import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Esconde a barra de baixo padrão do Expo
        tabBarStyle: { display: 'none' },
        // Esconde o título que fica no topo da tela
        headerShown: false,
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
      
    </Tabs>
  );
}
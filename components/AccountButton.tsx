import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { LogIn, User, LayoutDashboard } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { useIsFocused } from '@react-navigation/native';

export default function AccountButton({ style }: { style?: any }) {
  const [isLogged, setIsLogged] = useState(false);
  const [isVendedor, setIsVendedor] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    async function checkUser(session: any) {
      if (!session) {
        setIsLogged(false);
        setIsVendedor(false);
        return;
      }
      setIsLogged(true);

      try {
        const metadata = session.user?.user_metadata ?? {};
        const { data: usuarioBanco } = await supabase
          .from('usuarios')
          .select('tipo_usuario')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        const vendedor = usuarioBanco?.tipo_usuario === 'vendedor' || metadata.tipo_conta === 'vendedor' || !!metadata.loja;
        setIsVendedor(vendedor);
      } catch (err) {
        console.error("Erro ao verificar vendedor no AccountButton:", err);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      checkUser(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [isFocused]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.replace('/(tabs)');
  }

  if (!isLogged) {
    return (
      <TouchableOpacity style={[styles.enterButton, style]} onPress={() => router.push('/login')} activeOpacity={0.85}>
        <LogIn size={17} color="#F2E4D4" />
        <Text style={styles.enterText}>Entrar</Text>
      </TouchableOpacity>
    );
  }

  if (isVendedor) {
    return (
      <TouchableOpacity style={[styles.profileButton, style]} onPress={() => router.push('/painel-vendedor')} activeOpacity={0.85}>
        <LayoutDashboard size={20} color="#F2E4D4" />
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity style={[styles.profileButton, style]} onPress={() => setMenuOpen(true)} activeOpacity={0.85}>
        <User size={20} color="#F2E4D4" />
      </TouchableOpacity>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push('/conta');
              }}
            >
              <Text style={styles.menuText}>Ver conta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={[styles.menuText, styles.logoutText]}>Sair</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 121, 65, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(217, 121, 65, 0.45)',
  },
  enterText: {
    color: '#F2E4D4',
    fontWeight: '700',
    fontSize: 13,
  },
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D97941',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: 18,
  },
  menu: {
    width: 165,
    borderRadius: 18,
    backgroundColor: '#1A120D',
    borderWidth: 1,
    borderColor: 'rgba(242,228,212,0.10)',
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242,228,212,0.07)',
  },
  menuText: {
    color: '#F2E4D4',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutText: {
    color: '#D97941',
  },
});

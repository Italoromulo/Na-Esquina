import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LayoutDashboard, MapPin, PackagePlus, Power } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import AppToast, { ToastMessage } from '@/components/AppToast';
import { useLocation } from '@/context/LocationContext';

type LojaResumo = {
  id?: number | string;
  nome?: string;
  categoria?: string;
  endereco?: string;
  status?: boolean;
  offline?: boolean; 
  cardapio?: any[];
  imagem?: string; 
};

export default function VendorDashboard() {
  const { carregarRestaurantes } = useLocation(); 
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [loja, setLoja] = useState<LojaResumo | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function showToast(title: string, message: string, variant: 'success' | 'error' | 'info' = 'info') {
    setToast({ id: Date.now(), title, message, variant });
  }

  useFocusEffect(
    useCallback(() => {
      carregarLoja();

      const { data: listener } = supabase.auth.onAuthStateChange(() => {
        carregarLoja();
      });

      return () => listener.subscription.unsubscribe();
    }, [])
  );

  async function carregarLoja() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      setLoja(null);
      setLoading(false);
      return;
    }

    const metadata = auth.user.user_metadata ?? {};

    const { data: usuarioBanco } = await supabase
      .from('usuarios')
      .select('tipo_usuario')
      .eq('auth_id', auth.user.id)
      .maybeSingle();

    const isVendedor = usuarioBanco?.tipo_usuario === 'vendedor' || metadata.tipo_conta === 'vendedor' || !!metadata.loja;

    if (!isVendedor) {
      setLoja(null);
      setLoading(false);
      return;
    }

    const { data: lojaBanco } = await supabase
      .from('restaurantes')
      .select('*')
      .eq('id_usuario', auth.user.id)
      .maybeSingle();

    if (lojaBanco) {
      const { data: cardapioBanco } = await supabase
        .from('cardapios')
        .select('id')
        .eq('restaurante_id', lojaBanco.id);

      setLoja({ 
        ...lojaBanco, 
        cardapio: cardapioBanco ?? [],
        offline: !!lojaBanco.offline, 
        imagem: lojaBanco.foto_url || lojaBanco.imagem_url || lojaBanco.foto || lojaBanco.imagem 
      });
    } else {
      setLoja({ 
        id: 'metadata', 
        ...(metadata.loja ?? {}), 
        status: !!metadata.loja?.status,
        offline: !!metadata.loja?.offline,
        imagem: metadata.loja?.foto_url || metadata.loja?.imagem 
      });
    }

    setLoading(false);
  }

  async function alternarStatus() {
    if (!loja) return;
    setSalvando(true);
    const novoStatus = !loja.status; // 💡 Controla estritamente o STATUS agora
    const { data: auth } = await supabase.auth.getUser();

    try {
      if (loja.id && loja.id !== 'metadata') {
        const { error } = await supabase
          .from('restaurantes')
          .update({ 
            status: novoStatus // 💡 Alterando estritamente a coluna status
          })
          .eq('id', loja.id);
        if (error) throw error;
      }

      await supabase.auth.updateUser({
        data: {
          ...(auth.user?.user_metadata ?? {}),
          tipo_conta: 'vendedor',
          loja: {
            ...(auth.user?.user_metadata?.loja ?? {}),
            status: novoStatus,
          },
        },
      });

      await supabase
        .from('usuarios')
        .update({ tipo_usuario: 'vendedor' })
        .eq('auth_id', auth.user?.id);

      setLoja((atual) => (atual ? { ...atual, status: novoStatus } : atual));
      
      await carregarRestaurantes();

      showToast(
        novoStatus ? 'Você está online' : 'Você saiu do mapa', 
        novoStatus ? 'Seu ponto aparece como vendendo agora.' : 'Seu ponto ficou offline.', 
        'success'
      );
    } catch (err: any) {
      showToast('Status não alterado', err.message || 'Não foi possível atualizar o status.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator color="#D97941" />
      </View>
    );
  }

  if (!loja) return null;

  return (
    <View style={styles.card}>
      <AppToast toast={toast} onHide={() => setToast(null)} />
      <View style={styles.headerRow}>
        
        {loja.imagem ? (
          <Image source={{ uri: loja.imagem }} style={styles.avatarImage} />
        ) : (
          <View style={styles.iconBox}>
            <LayoutDashboard size={20} color="#D97941" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>Área do vendedor</Text>
          <Text style={styles.title}>{loja.nome || 'Seu ponto'}</Text>
        </View>

        {!loja.offline && (
          <View style={[styles.statusPill, loja.status && styles.statusPillOn]}>
            <Text style={styles.statusText}>{loja.status ? 'Online' : 'Offline'}</Text>
          </View>
        )}
      </View>

      {loja.offline ? (
        <View style={styles.inativoContainer}>
          <Text style={styles.inativoText}>Restaurante Inativo</Text>
          <Text style={styles.inativoSubtext}>Acesse o painel completo para reativar o ponto.</Text>
        </View>
      ) : (
        <>
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricNumber}>{loja.cardapio?.length || 0}</Text>
              <Text style={styles.metricLabel}>itens</Text>
            </View>
            <View style={styles.metricBoxWide}>
              <MapPin size={14} color="rgba(242, 228, 212, 0.62)" />
              <Text style={styles.metricLabel} numberOfLines={1}>{loja.endereco || 'Local não informado'}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, loja.status && styles.actionButtonDanger]} onPress={alternarStatus} disabled={salvando}>
              <Power size={16} color="#0B0503" />
              <Text style={styles.actionText}>{salvando ? 'Salvando...' : loja.status ? 'Parar' : 'Vender agora'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/cadastro-vendedor')}>
              <PackagePlus size={16} color="#F2E4D4" />
              <Text style={styles.secondaryText}>Adicionar item</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity style={styles.panelLink} onPress={() => router.push('/painel-vendedor')}>
        <Text style={styles.panelLinkText}>Abrir painel completo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingCard: { backgroundColor: '#130B08', borderRadius: 22, padding: 20, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(242, 228, 212, 0.08)' },
  card: { backgroundColor: '#130B08', borderRadius: 24, padding: 16, marginBottom: 22, borderWidth: 1, borderColor: 'rgba(217, 121, 65, 0.22)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(217, 121, 65, 0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(217, 121, 65, 0.28)' },
  avatarImage: { width: 42, height: 42, borderRadius: 15, resizeMode: 'cover', backgroundColor: 'rgba(217, 121, 65, 0.14)' },
  kicker: { color: '#D97941', fontWeight: '900', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: '#F2E4D4', fontSize: 18, fontWeight: '900', marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(166, 27, 52, 0.18)' },
  statusPillOn: { backgroundColor: 'rgba(30, 160, 90, 0.22)' },
  statusText: { color: '#F2E4D4', fontSize: 11, fontWeight: '900' },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metricBox: { width: 74, backgroundColor: 'rgba(11, 5, 3, 0.45)', borderRadius: 16, padding: 12, alignItems: 'center' },
  metricBoxWide: { flex: 1, backgroundColor: 'rgba(11, 5, 3, 0.45)', borderRadius: 16, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  metricNumber: { color: '#D97941', fontSize: 20, fontWeight: '900' },
  metricLabel: { color: 'rgba(242, 228, 212, 0.62)', fontSize: 12, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionButton: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: '#D97941', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  actionButtonDanger: { backgroundColor: '#F2A172' },
  actionText: { color: '#0B0503', fontWeight: '900' },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: 'rgba(242, 228, 212, 0.06)', borderWidth: 1, borderColor: 'rgba(242, 228, 212, 0.10)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  secondaryText: { color: '#F2E4D4', fontWeight: '900' },
  panelLink: { marginTop: 16, alignItems: 'center' },
  panelLinkText: { color: 'rgba(242, 228, 212, 0.62)', fontWeight: '800' },
  inativoContainer: {
    backgroundColor: 'rgba(217, 121, 65, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 121, 65, 0.25)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  inativoText: {
    color: '#D97941', 
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inativoSubtext: {
    color: 'rgba(242, 228, 212, 0.52)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  }
});
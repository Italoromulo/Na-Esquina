import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import GlassNav from '@/components/GlassNav';
import { useResponsive } from '@/hooks/useResponsive';
import AppToast, { ToastMessage } from '@/components/AppToast';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



type Vendedor = {
  id: number | string;
  nome?: string;
  categoria?: string;
  descricao?: string;
  endereco?: string;
  imagem_url?: string;
  status?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  destaque?: boolean;
  semana_destaque?: boolean;
  dia_promo?: boolean;
  combo_especial?: boolean;
  mais_vendido?: boolean;
  porcentagem_desconto?: number | null; // 💡 Nova coluna tipada
};

type PromocaoKey = 'semana_destaque' | 'dia_promo' | 'combo_especial' | 'mais_vendido' | 'destaque';

const PROMO_OPTIONS: Array<{ key: PromocaoKey; title: string; subtitle: string }> = [
  { key: 'semana_destaque', title: 'Destaque da semana', subtitle: 'Sobe com maior força no FeaturedCards' },
  { key: 'dia_promo', title: 'Promoção do dia', subtitle: 'Mostra como promoção ativa' },
  { key: 'combo_especial', title: 'Combo especial', subtitle: 'Ideal para combos e kits' },
  { key: 'mais_vendido', title: 'Mais vendido', subtitle: 'Marca a loja como favorita do público' },
  { key: 'destaque', title: 'Recomendado', subtitle: 'Aparece como destaque simples' },
];

export default function PainelVendedorScreen() {
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoPromo, setSalvandoPromo] = useState(false);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [totalItensCardapio, setTotalItensCardapio] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [descontoTexto, setDescontoTexto] = useState('');
  const [promos, setPromos] = useState<Record<PromocaoKey, boolean>>({
    semana_destaque: false,
    dia_promo: false,
    combo_especial: false,
    mais_vendido: false,
    destaque: false,
  });
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    carregarVendedor();
  }, []);

  function showToast(title: string, message: string, variant: 'success' | 'error' | 'info' = 'info') {
    setToast({ id: Date.now(), title, message, variant });
  }

  function aplicarPromosDaLoja(loja: Vendedor) {
    setPromos({
      semana_destaque: !!loja.semana_destaque,
      dia_promo: !!loja.dia_promo,
      combo_especial: !!loja.combo_especial,
      mais_vendido: !!loja.mais_vendido,
      destaque: !!loja.destaque,
    });
    
    // 💡 Recupera a informação direto do campo numérico se ele existir
    if (loja.porcentagem_desconto !== undefined && loja.porcentagem_desconto !== null) {
      setDescontoTexto(`${loja.porcentagem_desconto}%`);
    } else {
      const numerosSalvos = String(loja.porcentagem_desconto || '').replace(/\D/g, '');
      setDescontoTexto(numerosSalvos ? `${numerosSalvos}%` : '');
    }
  }

  async function carregarVendedor() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      router.replace('/login');
      return;
    }

    const { data: lojaBanco, error } = await supabase
      .from('restaurantes')
      .select('*')
      .eq('id_usuario', auth.user.id)
      .maybeSingle();

    if (error) {
      showToast('Erro ao carregar painel', error.message, 'error');
      setLoading(false);
      return;
    }

    if (lojaBanco) {
      setVendedor(lojaBanco);
      aplicarPromosDaLoja(lojaBanco);

      const { count, error: erroCount } = await supabase
        .from('cardapios')
        .select('*', { count: 'exact', head: true })
        .eq('restaurante_id', lojaBanco.id);

      if (!erroCount && count !== null) setTotalItensCardapio(count);
    } else {
      const lojaMeta = auth.user.user_metadata?.loja;
      if (lojaMeta) {
        const vendedorMeta = {
          id: 'metadata',
          ...lojaMeta,
          status: !!lojaMeta.status,
        } as Vendedor;
        setVendedor(vendedorMeta);
        aplicarPromosDaLoja(vendedorMeta);
      }
    }

    setLoading(false);
  }

  async function alternarVendendoAgora() {
    if (!vendedor) return;
    setSalvando(true);

    const novoStatus = !vendedor.status;
    const { data: auth } = await supabase.auth.getUser();

    try {
      if (vendedor.id !== 'metadata') {
        const { error } = await supabase
          .from('restaurantes')
          .update({ status: novoStatus, offline: !novoStatus })
          .eq('id', vendedor.id);

        if (error) throw error;
      }

      await supabase.auth.updateUser({
        data: {
          ...(auth.user?.user_metadata ?? {}),
          tipo_conta: 'vendedor',
          loja: {
            ...(auth.user?.user_metadata?.loja ?? {}),
            status: novoStatus,
            offline: !novoStatus,
          },
        },
      });

      setVendedor((atual) => (atual ? { ...atual, status: novoStatus } : atual));
      showToast(novoStatus ? 'Você está online' : 'Você saiu do mapa', novoStatus ? 'Sua loja aparece como vendendo agora.' : 'Sua loja ficou offline para os clientes.', 'success');
    } catch (err: any) {
      showToast('Alteração não realizada', err.message || 'Não foi possível atualizar o status.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function atualizarLocalizacao() {
    if (!vendedor) return;
    setSalvando(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permissão necessária', 'Autorize o acesso à localização para aparecer no mapa.', 'error');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;

      if (vendedor.id !== 'metadata') {
        const { error } = await supabase
          .from('restaurantes')
          .update({ latitude, longitude })
          .eq('id', vendedor.id);
        if (error) throw error;
      }

      setVendedor((atual) => (atual ? { ...atual, latitude, longitude } : atual));
      showToast('Localização updated', 'Seu ponto foi sincronizado no mapa.', 'success');
    } catch (err: any) {
      showToast('Alteração não realizada', err.message || 'Não foi possível atualizar a localização.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  function togglePromo(key: PromocaoKey) {
    const valorAtual = promos[key];
    
    const novoEstadoPromos = {
      semana_destaque: false,
      dia_promo: false,
      combo_especial: false,
      mais_vendido: false,
      destaque: false,
    };

    novoEstadoPromos[key] = !valorAtual;
    setPromos(novoEstadoPromos);
  }

  // 💡 MÁSCARA COM EXIBIÇÃO EM TEMPO REAL DO SÍMBOLO DE PORCENTAGEM
  const tratarMudarDesconto = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, '');
    
    if (!apenasNumeros) {
      setDescontoTexto('');
      return;
    }

    const valorNumero = Number(apenasNumeros);
    if (valorNumero > 100) {
      setDescontoTexto('100%');
      return;
    }

    setDescontoTexto(`${apenasNumeros}%`);
  };

  async function salvarDestaques() {
    if (!vendedor || vendedor.id === 'metadata') {
      showToast('Cadastre sua loja', 'Salve sua loja no Supabase antes de configurar destaques.', 'error');
      return;
    }

    const algumDestaqueAtivo = Object.values(promos).some(Boolean);
    
    // 💡 Processamento para envio ao Banco de dados
    let descontoFinalTexto = null;
    let porcentagemDescontoNum = null;

    if (promos.dia_promo && descontoTexto.trim()) {
      const numeroLimpo = descontoTexto.replace('%', '').trim();
      if (numeroLimpo) {
        porcentagemDescontoNum = parseInt(numeroLimpo, 10);
        descontoFinalTexto = `${numeroLimpo}% OFF`;
      }
    }

    setSalvandoPromo(true);
    try {
      const payload = {
        destaque: promos.destaque,
        semana_destaque: promos.semana_destaque,
        dia_promo: promos.dia_promo,
        combo_especial: promos.combo_especial,
        mais_vendido: promos.mais_vendido,
        porcentagem_desconto: porcentagemDescontoNum, // 💡 Gravando o número puro
      };

      const { error } = await supabase
        .from('restaurantes')
        .update(payload)
        .eq('id', vendedor.id);

      if (error) throw error;

      setVendedor((atual) => (atual ? { ...atual, ...payload } : atual));
      showToast(
        algumDestaqueAtivo ? 'Destaque updated' : 'Destaques removidos',
        algumDestaqueAtivo ? 'Sua loja pode aparecer nos FeaturedCards.' : 'Sua loja não ficará mais como destaque.',
        'success'
      );
    } catch (err: any) {
      showToast('Alteração não realizada', err.message || 'Não foi possível salvar os destaques.', 'error');
    } finally {
      setSalvandoPromo(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#D97941" size="large" /></View>;
  }

  if (!vendedor) {
    return (
      <View style={[styles.screenContainer, isTablet && styles.screenContainerTablet, { paddingTop: insets.top + 24, paddingHorizontal: 24, flex: 1 }]}>
        <AppToast toast={toast} onHide={() => setToast(null)} />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
          <ArrowLeft size={20} color="#F2E4D4" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.title}>Seu perfil de vendedor está incompleto</Text>
          <Text style={styles.subtitle}>Cadastre sua loja para habilitar essa função.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/cadastro-vendedor')}>
            <Text style={styles.buttonText}>Completar perfil do vendedor</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const destaqueAtivo = Object.values(promos).some(Boolean);

  return (
    <View style={[styles.screenContainer, isTablet && styles.screenContainerTablet]}>
      <AppToast toast={toast} onHide={() => setToast(null)} />

      <TouchableOpacity
        style={[styles.fixedBackButton, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        activeOpacity={0.75}
      >
        <ArrowLeft size={20} color="#F2E4D4" />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <Animated.ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 68, paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <Text style={styles.brand}>Na Esquina</Text>
        <Text style={styles.title}>Painel do vendedor</Text>

        <View style={styles.heroCard}>
          {!!vendedor.imagem_url && <Image source={{ uri: vendedor.imagem_url }} style={styles.cover} />}
          <Text style={styles.nome}>{vendedor.nome || 'Meu ponto'}</Text>
          <Text style={styles.meta}>{vendedor.endereco || 'Região não informada'}</Text>

          <View style={styles.pillsRow}>
            <View style={[styles.statusPill, vendedor.status && styles.statusPillOn]}>
              <Text style={styles.statusText}>{vendedor.status ? '🟢 Vendendo agora' : '🔴 Fora do mapa'}</Text>
            </View>
            {destaqueAtivo && (
              <View style={styles.featuredPill}>
                <Text style={styles.statusText}>⭐ Em destaque</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}><Text style={styles.metricNumber}>{totalItensCardapio}</Text><Text style={styles.metricLabel}>Itens</Text></View>
          <View style={styles.metricCard}><Text style={styles.metricNumber}>5.0</Text><Text style={styles.metricLabel}>Avaliação</Text></View>
          <View style={styles.metricCard}><Text style={styles.metricNumber}>{vendedor.status ? 'Ativo' : 'Off'}</Text><Text style={styles.metricLabel}>Status</Text></View>
        </View>

        <TouchableOpacity style={[styles.bigToggle, vendedor.status && styles.bigToggleOn]} onPress={alternarVendendoAgora} disabled={salvando}>
          <Text style={styles.bigToggleText}>{salvando ? 'Salvando...' : vendedor.status ? 'Parar de vender agora' : 'Estou vendendo agora'}</Text>
        </TouchableOpacity>

        <View style={styles.promoCard}>
          <Text style={styles.sectionTitle}>Destaques e promoções</Text>
          <Text style={styles.sectionHint}>Marque como sua loja deve aparecer nos FeaturedCards da tela inicial.</Text>

          {promos.dia_promo && (
            <TextInput
              style={styles.input}
              placeholder="Ex: 20%"
              placeholderTextColor="rgba(242,228,212,0.45)"
              value={descontoTexto}
              onChangeText={tratarMudarDesconto}
              keyboardType="number-pad"
              maxLength={4} // 💡 Aumentado para 4 para suportar "100%" confortavelmente
            />
          )}

          <View style={styles.promoGrid}>
            {PROMO_OPTIONS.map((opcao) => {
              const ativo = promos[opcao.key];
              return (
                <TouchableOpacity
                  key={opcao.key}
                  style={[styles.promoOption, ativo && styles.promoOptionActive]}
                  onPress={() => togglePromo(opcao.key)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.promoTitle, ativo && styles.promoTitleActive]}>{ativo ? '✓ ' : ''}{opcao.title}</Text>
                  <Text style={[styles.promoSubtitle, ativo && styles.promoSubtitleActive]}>{opcao.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.savePromoButton} onPress={salvarDestaques} disabled={salvandoPromo} activeOpacity={0.85}>
            <Text style={styles.savePromoText}>{salvandoPromo ? 'Salvando...' : 'Salvar destaque/promoção'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/cadastro-vendedor')}>
          <Text style={styles.secondaryButtonText}>Editar perfil e produtos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={atualizarLocalizacao} disabled={salvando}>
          <Text style={styles.secondaryButtonText}>Atualizar localização no mapa</Text>
        </TouchableOpacity>

        {vendedor.id !== 'metadata' && (
          <TouchableOpacity style={styles.button} onPress={() => router.push(`/vendedor/${vendedor.id}`)}>
            <Text style={styles.secondaryButtonText}>Ver como cliente</Text>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>
      <GlassNav scrollY={scrollY} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0B0503', alignItems: 'center', justifyContent: 'center' },
  centerPadding: { flex: 1, backgroundColor: '#0B0503', padding: 24, alignItems: 'center', justifyContent: 'center' },
  screenContainer: { flex: 1, backgroundColor: '#0B0503', width: '100%', maxWidth: 600, alignSelf: 'center' },
  screenContainerTablet: { maxWidth: 768 },
  container: { padding: 24, paddingTop: 58, paddingBottom: 120 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(242,228,212,0.06)', borderWidth: 1, borderColor: 'rgba(242,228,212,0.10)', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, marginBottom: 16 },
  fixedBackButton: {
    position: 'absolute',
    left: 20,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(11, 5, 3, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(242,228,212,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backText: { color: '#F2E4D4', fontWeight: '800' },
  brand: { color: '#D97941', fontSize: 34, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  title: { color: '#F2E4D4', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: 'rgba(242,228,212,0.62)', textAlign: 'center', marginBottom: 20 },
  heroCard: { backgroundColor: '#1A120D', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)', marginTop: 16 },
  cover: { height: 170, borderRadius: 18, marginBottom: 14, backgroundColor: '#120806', resizeMode: 'cover' },
  nome: { color: '#F2E4D4', fontSize: 24, fontWeight: '900' },
  meta: { color: 'rgba(242,228,212,0.62)', marginTop: 4, fontSize: 14, lineHeight: 18 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(166,27,52,0.18)' },
  statusPillOn: { backgroundColor: 'rgba(30,160,90,0.2)' },
  featuredPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(217,121,65,0.18)', borderWidth: 1, borderColor: 'rgba(217,121,65,0.35)' },
  statusText: { color: '#F2E4D4', fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metricCard: { flex: 1, backgroundColor: '#120806', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(242,228,212,0.07)' },
  metricNumber: { color: '#D97941', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  metricLabel: { color: 'rgba(242,228,212,0.58)', textAlign: 'center', marginTop: 4 },
  bigToggle: { marginTop: 18, backgroundColor: '#D97941', padding: 18, borderRadius: 18 },
  bigToggleOn: { backgroundColor: '#A61B34' },
  bigToggleText: { color: '#fff', textAlign: 'center', fontSize: 17, fontWeight: '900' },
  promoCard: { backgroundColor: '#130B08', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)', marginTop: 16 },
  sectionTitle: { color: '#F2E4D4', fontSize: 20, fontWeight: '900' },
  sectionHint: { color: 'rgba(242,228,212,0.58)', marginTop: 5, marginBottom: 14, lineHeight: 19 },
  input: { backgroundColor: '#1A120D', color: '#F2E4D4', borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)', marginBottom: 12 },
  promoGrid: { gap: 10 },
  promoOption: { backgroundColor: '#1A120D', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(242,228,212,0.07)' },
  promoOptionActive: { backgroundColor: 'rgba(217,121,65,0.18)', borderColor: 'rgba(217,121,65,0.45)' },
  promoTitle: { color: '#F2E4D4', fontWeight: '900', fontSize: 15 },
  promoTitleActive: { color: '#D97941' },
  promoSubtitle: { color: 'rgba(242,228,212,0.52)', marginTop: 4, lineHeight: 17, fontSize: 12 },
  promoSubtitleActive: { color: 'rgba(242,228,212,0.72)' },
  savePromoButton: { backgroundColor: '#D97941', padding: 15, borderRadius: 14, marginTop: 14, alignItems: 'center' },
  savePromoText: { color: '#0B0503', fontWeight: '900' },
  button: { backgroundColor: '#D97941', padding: 16, borderRadius: 16, marginTop: 12 },
  buttonText: { color: '#0B0503', textAlign: 'center', fontWeight: '900', fontSize: 16 },
  secondaryButton: { backgroundColor: '#1A120D', padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)' },
  secondaryButtonText: { color: '#F2E4D4', textAlign: 'center', fontWeight: '800' },
});
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, LayoutDashboard, LogOut, PackagePlus, Store, UserRound, UserPen } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import GlassNav from '@/components/GlassNav';

type UserMetadata = {
  nome?: string;
  telefone?: string;
  tipo_conta?: string;
  avatar_url?: string;
  loja?: {
    id?: string | number;
    nome?: string;
    categoria?: string;
    endereco?: string;
    descricao?: string;
    imagem_url?: string;
    hora_inicio?: string;
    hora_fim?: string;
    cardapio?: Array<{ id?: string; nome?: string; preco?: string; descricao?: string; imagem_url?: string | null }>;
  };
};

export default function ContaScreen() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [metadata, setMetadata] = useState<UserMetadata>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    carregarConta();
  }, []);

  const aplicarMascaraTelefone = (txt: string) => {
    const numeros = txt.replace(/\D/g, '');
    if (numeros.length <= 2) return `(${numeros}`;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  async function carregarConta() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    setEmail(authData.user.email ?? '');

    try {
      // 1. Puxa as infos do usuário logado
      const { data: usuarioBanco } = await supabase
        .from('usuarios')
        .select('avatar_url, telefone, nome, tipo_usuario')
        .eq('auth_id', authData.user.id)
        .maybeSingle();

      // 2. Puxa as infos estruturadas da loja relacional
      const { data: lojaBanco } = await supabase
        .from('restaurantes')
        .select('*')
        .eq('id_usuario', authData.user.id)
        .maybeSingle();

      let cardapioFinal = [];

      // 3. Se a loja existir, traz o cardápio em tempo real do banco de dados
      if (lojaBanco) {
        const { data: cardapioBanco } = await supabase
          .from('cardapios')
          .select('*')
          .eq('restaurante_id', lojaBanco.id);
        
        if (cardapioBanco) {
          cardapioFinal = cardapioBanco;
        }
      }

      setMetadata({
        ...(authData.user.user_metadata ?? {}),
        nome: usuarioBanco?.nome || authData.user.user_metadata?.nome,
        tipo_conta: usuarioBanco?.tipo_usuario || authData.user.user_metadata?.tipo_conta,
        avatar_url: usuarioBanco?.avatar_url || null,
        telefone: usuarioBanco?.telefone || authData.user.user_metadata?.telefone,
        loja: lojaBanco ? {
          id: lojaBanco.id,
          nome: lojaBanco.nome,
          categoria: String(lojaBanco.categoria || lojaBanco.categoria_nome || lojaBanco.categoria_id || ''),
          endereco: lojaBanco.endereco,
          descricao: lojaBanco.descricao,
          imagem_url: lojaBanco.imagem_url,
          hora_inicio: lojaBanco.hora_inicio,
          hora_fim: lojaBanco.hora_fim,
          cardapio: cardapioFinal,
        } : null
      } as UserMetadata);

    } catch (err) {
      console.error("Erro ao puxar dados relacionais completos do banco:", err);
      setMetadata((authData.user.user_metadata ?? {}) as UserMetadata);
    } finally {
      setLoading(false);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/(tabs)');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D97941" />
      </View>
    );
  }

  const isVendedor = metadata.tipo_conta === 'vendedor' || !!metadata.loja;
  const iniciais = (metadata.nome || email || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.screenContainer}>
      <Animated.ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 160 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
          <ArrowLeft size={20} color="#F2E4D4" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.profileHero}>
          <TouchableOpacity 
            style={styles.editPencilButton} 
            onPress={() => router.push('/cadastro')} 
            activeOpacity={0.7}
          >
            <UserPen size={18} color="#D97941" />
          </TouchableOpacity>

          {metadata.avatar_url ? (
            <Image source={{ uri: metadata.avatar_url }} style={styles.userAvatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{iniciais}</Text>
            </View>
          )}
          
          <Text style={styles.title}>{metadata.nome || 'Minha conta'}</Text>
          
          <View style={styles.onlineContainer}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>

          <View style={styles.typePill}>
            {isVendedor ? <Store size={14} color="#D97941" /> : <UserRound size={14} color="#D97941" />}
            <Text style={styles.typePillText}>{isVendedor ? 'Vendedor' : 'Cliente'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dados pessoais</Text>
          <InfoLine label="Nome" value={metadata.nome || 'Não informado'} />
          <InfoLine label="E-mail" value={email || 'Não informado'} />
          <InfoLine label="Telefone" value={metadata.telefone ? aplicarMascaraTelefone(String(metadata.telefone)) : 'Não informado'} />
        </View>

        {metadata.loja && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Store size={20} color="#D97941" />
              <Text style={styles.sectionTitle}>Minha loja</Text>
            </View>

            <InfoLine label="Nome da loja" value={metadata.loja.nome || 'Não informado'} />
            <InfoLine label="Nicho" value={metadata.loja.categoria || 'Não informado'} />
            <InfoLine label="Endereço" value={metadata.loja.endereco || 'Não informado'} />

            {!!metadata.loja.descricao && <Text style={styles.description}>{metadata.loja.descricao}</Text>}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{metadata.loja.cardapio?.length || 0}</Text>
                <Text style={styles.statLabel}>Itens</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>5.0</Text>
                <Text style={styles.statLabel}>Avaliação</Text>
              </View>
            </View>

            {!!metadata.loja.cardapio?.length && (
              <View style={styles.menuList}>
                <Text style={styles.menuTitle}>Últimos itens cadastrados</Text>
                {metadata.loja.cardapio.slice(0, 3).map((produto, index) => (
                  <View key={produto.id || `${produto.nome}-${index}`} style={styles.menuItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuName}>{produto.nome}</Text>
                      {!!produto.descricao && <Text style={styles.menuDescription} numberOfLines={1}>{produto.descricao}</Text>}
                    </View>
                    {!!produto.preco && <Text style={styles.menuPrice}>{produto.preco}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {isVendedor && (
          <TouchableOpacity style={styles.button} onPress={() => router.push('/painel-vendedor')} activeOpacity={0.85}>
            <LayoutDashboard size={18} color="#0B0503" />
            <Text style={styles.buttonText}>Abrir painel do vendedor</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/cadastro-vendedor')} activeOpacity={0.85}>
          <PackagePlus size={18} color="#F2E4D4" />
          <Text style={styles.secondaryButtonText}>{metadata.loja ? 'Editar loja/cardápio' : 'Cadastrar loja'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={sair} activeOpacity={0.85}>
          <LogOut size={18} color="#F2E4D4" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
      <GlassNav scrollY={scrollY} />
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0503' },
  screenContainer: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: '#0B0503' },
  container: { flexGrow: 1, padding: 24, paddingTop: 54 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(242,228,212,0.06)', borderWidth: 1, borderColor: 'rgba(242,228,212,0.10)', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, marginBottom: 16 },
  backText: { color: '#F2E4D4', fontWeight: '800' },
  profileHero: { alignItems: 'center', backgroundColor: '#130B08', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(217,121,65,0.20)', padding: 22, marginBottom: 16, position: 'relative' },
  editPencilButton: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(217, 121, 65, 0.1)', borderWidth: 1, borderColor: 'rgba(217, 121, 65, 0.25)', width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#D97941', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  userAvatarImage: { width: 96, height: 96, borderRadius: 48, marginBottom: 14, backgroundColor: '#1A120D', borderWidth: 2, borderColor: '#D97941' },
  avatarImage: { width: 96, height: 96, borderRadius: 30, marginBottom: 14, backgroundColor: '#1A120D' },
  avatarText: { color: '#0B0503', fontSize: 28, fontWeight: '900' },
  title: { fontSize: 26, color: '#F2E4D4', fontWeight: '900', textAlign: 'center' },
  onlineContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', boxShadow: '0px 0px 8px rgba(34, 197, 94, 0.6)' },
  onlineText: { color: '#22C55E', fontWeight: '700', fontSize: 13 },
  subtitle: { color: 'rgba(242,228,212,0.58)', marginTop: 5, textAlign: 'center' },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(217,121,65,0.14)', borderWidth: 1, borderColor: 'rgba(217,121,65,0.25)' },
  typePillText: { color: '#F2E4D4', fontWeight: '900', fontSize: 12 },
  card: { backgroundColor: '#1A120D', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(242,228,212,0.07)', marginBottom: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionTitle: { color: '#D97941', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  infoLine: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(242,228,212,0.06)' },
  label: { color: 'rgba(242,228,212,0.48)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '800' },
  value: { color: '#F2E4D4', fontSize: 16, fontWeight: '700' },
  description: { color: 'rgba(242,228,212,0.65)', marginTop: 12, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: { flex: 1, backgroundColor: 'rgba(11,5,3,0.45)', borderRadius: 16, padding: 14, alignItems: 'center' },
  statNumber: { color: '#D97941', fontSize: 22, fontWeight: '900' },
  statLabel: { color: 'rgba(242,228,212,0.56)', marginTop: 3, fontWeight: '800' },
  menuList: { marginTop: 16, gap: 10 },
  menuTitle: { color: '#F2E4D4', fontWeight: '900', fontSize: 15 },
  menuItem: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, backgroundColor: 'rgba(11,5,3,0.45)', borderRadius: 14 },
  menuName: { color: '#F2E4D4', fontWeight: '900' },
  menuPrice: { color: '#D97941', fontWeight: '900' },
  menuDescription: { color: 'rgba(242,228,212,0.52)', marginTop: 3, fontSize: 12 },
  button: { backgroundColor: '#D97941', padding: 16, borderRadius: 16, marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { color: '#0B0503', textAlign: 'center', fontWeight: '900', fontSize: 16 },
  secondaryButton: { backgroundColor: '#130B08', padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryButtonText: { color: '#F2E4D4', textAlign: 'center', fontWeight: '900', fontSize: 16 },
  logoutButton: { backgroundColor: 'rgba(166,27,52,0.24)', borderWidth: 1, borderColor: 'rgba(166,27,52,0.38)', padding: 16, borderRadius: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: '#F2E4D4', textAlign: 'center', fontWeight: '900', fontSize: 16 },
});
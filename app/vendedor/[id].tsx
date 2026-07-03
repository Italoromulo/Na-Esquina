import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Star } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { useResponsive } from '@/hooks/useResponsive';

type Produto = { 
  id: string | number; 
  nome?: string; 
  preco?: string; 
  descricao?: string; 
  imagem_url?: string | null;
  soma_notas?: number;
  total_avaliacoes?: number;
};

type Vendedor = {
  id: string | number;
  nome?: string;
  categoria?: string;
  descricao?: string;
  endereco?: string;
  imagem_url?: string;
  status?: boolean;
  hora_inicio?: string;
  hora_fim?: string;
  telefone?: string;
  whatsapp?: string;
  latitude?: number | null;
  longitude?: number | null;
  data_cadastro?: string;
  soma_notas?: number;       // 💡 Adicionado para controle local de notas
  total_avaliacoes?: number; // 💡 Adicionado para controle local de notas
};

export default function DetalheVendedorScreen() {
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [cardapio, setCardapio] = useState<Produto[]>([]);
  const [favoritado, setFavoritado] = useState(false);
  const [produtoDetalhado, setProdutoDetalhado] = useState<Produto | null>(null);
  const [modalProdutoVisivel, setModalProdutoVisivel] = useState(false);
  
  // Estados para Médias de Avaliação da Loja
  const [mediaLoja, setMediaLoja] = useState<string>('0.0');
  const [qtdAvaliacoesLoja, setQtdAvaliacoesLoja] = useState<number>(0);
  const [isNovoNaPlataforma, setIsNovoNaPlataforma] = useState(false);

  // Estados do Modal de Avaliação
  const [modalVisivel, setModalVisivel] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState(0);
  const [avaliandoTipo, setAvaliandoTipo] = useState<'loja' | 'item'>('loja');
  const [idAlvoAvaliacao, setIdAlvoAvaliacao] = useState<string | number | null>(null);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [comentariosLoja, setComentariosLoja] = useState<any[]>([]);
  const [comentariosProduto, setComentariosProduto] = useState<any[]>([]);
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);

  useEffect(() => {
    carregar();
  }, [id]);

  async function carregar() {
    if (!id) return;
    
    const { data: authData } = await supabase.auth.getUser();

    // 1. Busca os dados do restaurante (trazendo as novas colunas de notas criadas)
    const { data: restauranteData } = await supabase
      .from('restaurantes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (restauranteData) {
      setVendedor(restauranteData);

      // 💡 VALIDACÃO 5 DIAS: Verifica se a loja foi criada há menos de 5 dias
      if (restauranteData.data_cadastro) {
        const dataCriacao = new Date(restauranteData.data_cadastro);
        const dataAtual = new Date();
        const diferencaDias = Math.floor((dataAtual.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24));
        setIsNovoNaPlataforma(diferencaDias <= 5);
      }

      // 💡 BUSCA FAVORITO: Verifica se o usuário atual já favoritou esse ponto
      if (authData?.user) {
        const { data: favData } = await supabase
          .from('favoritos')
          .select('id')
          .eq('usuario_id', authData.user.id)
          .eq('restaurante_id', id)
          .maybeSingle();
        
        if (favData) setFavoritado(true);
      }

      // 💡 CORREÇÃO: Puxando a média diretamente das novas colunas da tabela restaurantes
      if (restauranteData.total_avaliacoes && restauranteData.total_avaliacoes > 0) {
        const media = (restauranteData.soma_notas / restauranteData.total_avaliacoes).toFixed(1);
        setMediaLoja(media);
        setQtdAvaliacoesLoja(restauranteData.total_avaliacoes);
      } else {
        setMediaLoja('0.0');
        setQtdAvaliacoesLoja(0);
      }

      // 2. Busca o cardápio relacional atualizado
      const { data: cardapioData } = await supabase
        .from('cardapios')
        .select('*')
        .eq('restaurante_id', id);

      if (cardapioData) {
        setCardapio(cardapioData);
      }

      // 💡 BUSCA AVALIAÇÕES DA LOJA: Carrega as avaliações com comentários da loja
      try {
        const { data: avaliacoesData } = await supabase
          .from('avaliacoes')
          .select('*')
          .eq('restaurante_id', Number(id))
          .is('produto_id', null)
          .order('created_at', { ascending: false });

        if (avaliacoesData) {
          setComentariosLoja(avaliacoesData);
        }
      } catch (err) {
        console.error("Erro ao carregar avaliações da loja:", err);
      }
    }

    setLoading(false);
  }

  async function alternarFavorito() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      Alert.alert('Atenção', 'Faça login para favoritar estabelecimentos.');
      return;
    }

    const novoStatus = !favoritado;
    setFavoritado(novoStatus); 

    if (novoStatus) {
      const { error } = await supabase
        .from('favoritos')
        .insert({ usuario_id: authData.user.id, restaurante_id: Number(id) });
      if (error) console.error("Erro ao favoritar:", error);
    } else {
      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('usuario_id', authData.user.id)
        .eq('restaurante_id', Number(id));
      if (error) console.error("Erro ao desfavoritar:", error);
    }
  }

  function abrirWhatsApp() {
    const numero = (vendedor?.whatsapp || vendedor?.telefone || '').replace(/\D/g, '');
    if (!numero) return;
    const numeroFinal = numero.startsWith('55') ? numero : `55${numero}`;
    Linking.openURL(`https://wa.me/${numeroFinal}`);
  }

  function abrirRota() {
    if (!vendedor?.latitude || !vendedor?.longitude) {
      Alert.alert('Rota indisponível', 'Esse vendedor ainda não possui localização salva no app.');
      return;
    }

    router.push(`/rota/${vendedor.id}`);
  }

  async function carregarComentariosProduto(produtoId: string | number) {
    setCarregandoComentarios(true);
    setComentariosProduto([]);
    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('produto_id', Number(produtoId))
        .order('created_at', { ascending: false });

      if (data) {
        setComentariosProduto(data);
      }
    } catch (err) {
      console.error("Erro ao carregar comentários do produto:", err);
    } finally {
      setCarregandoComentarios(false);
    }
  }

  function abrirDetalhesProduto(produto: Produto) {
    setProdutoDetalhado(produto);
    setModalProdutoVisivel(true);
    carregarComentariosProduto(produto.id);
  }

  function fecharDetalhesProduto() {
    setModalProdutoVisivel(false);
    setProdutoDetalhado(null);
  }

  function avaliarProdutoDetalhado() {
    if (!produtoDetalhado) return;
    const produtoId = produtoDetalhado.id;
    fecharDetalhesProduto();
    abrirModalAvaliacao('item', produtoId);
  }

  function abrirModalAvaliacao(tipo: 'loja' | 'item', alvoId: string | number) {
    setAvaliandoTipo(tipo);
    setIdAlvoAvaliacao(alvoId);
    setNotaSelecionada(0);
    setComentarioTexto('');
    setModalVisivel(true);
  }

  async function submeterAvaliacao() {
    if (notaSelecionada === 0) {
      Alert.alert("Atenção", "Selecione pelo menos 1 estrela.");
      return;
    }

    const idRestauranteNumerico = Number(id);

    if (isNaN(idRestauranteNumerico)) {
      Alert.alert("Erro", "ID do restaurante inválido.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      Alert.alert("Atenção", "Você precisa estar logado para enviar uma avaliação.");
      return;
    }

    try {
      // 1. Salva a avaliação detalhada na tabela 'avaliacoes'
      const { error: erroInserirAvaliacao } = await supabase
        .from('avaliacoes')
        .insert({
          usuario_id: authData.user.id,
          usuario_nome: authData.user.user_metadata?.nome || 'Usuário Anônimo',
          restaurante_id: idRestauranteNumerico,
          produto_id: avaliandoTipo === 'item' ? Number(idAlvoAvaliacao) : null,
          nota: notaSelecionada,
          comentario: comentarioTexto.trim() || null,
        });

      if (erroInserirAvaliacao) {
        console.error("❌ Erro ao salvar comentário na tabela 'avaliacoes':", erroInserirAvaliacao);
      }

      if (avaliandoTipo === 'loja') {
        console.log("Atualizando notas diretamente no Restaurante...");

        // 2. Calcula e incrementa os contadores atômicos da loja
        const novaSomaLoja = (vendedor?.soma_notas || 0) + notaSelecionada;
        const novoTotalLoja = (vendedor?.total_avaliacoes || 0) + 1;

        const { error: erroUpdateLoja } = await supabase
          .from('restaurantes')
          .update({ 
            soma_notas: novaSomaLoja, 
            total_avaliacoes: novoTotalLoja 
          })
          .eq('id', idRestauranteNumerico);

        if (erroUpdateLoja) {
          console.error("❌ Erro ao atualizar contadores em 'restaurantes':", erroUpdateLoja);
          throw erroUpdateLoja;
        }

        // Atualiza os estados em tempo de execução para o cliente ver na hora
        const novaMedia = (novaSomaLoja / novoTotalLoja).toFixed(1);
        setMediaLoja(novaMedia);
        setQtdAvaliacoesLoja(novoTotalLoja);
        setVendedor(atual => atual ? { ...atual, soma_notas: novaSomaLoja, total_avaliacoes: novoTotalLoja } : null);

        // Atualiza a listagem de comentários da loja localmente
        const { data: avaliacoesLojaData } = await supabase
          .from('avaliacoes')
          .select('*')
          .eq('restaurante_id', idRestauranteNumerico)
          .is('produto_id', null)
          .order('created_at', { ascending: false });
        if (avaliacoesLojaData) setComentariosLoja(avaliacoesLojaData);

        Alert.alert('Sucesso!', 'Sua avaliação do estabelecimento foi registrada!');

      } else {
        console.log("Atualizando notas diretamente no Item do Cardápio...");

        // 3. Incrementa o contador atômico direto na linha do produto na tabela cardapios
        const produtoAlvo = cardapio.find(p => p.id === idAlvoAvaliacao);
        const novaSomaItem = (produtoAlvo?.soma_notas || 0) + notaSelecionada;
        const novoTotalItem = (produtoAlvo?.total_avaliacoes || 0) + 1;

        const { error: erroUpdateItem } = await supabase
          .from('cardapios')
          .update({ 
            soma_notas: novaSomaItem, 
            total_avaliacoes: novoTotalItem 
          })
          .eq('id', idAlvoAvaliacao);

        if (erroUpdateItem) {
          console.error("❌ Erro ao atualizar contadores em 'cardapios':", erroUpdateItem);
          throw erroUpdateItem;
        }

        // Atualiza o cardápio local para pintar as estrelas e mostrar a média na hora
        setCardapio(atual => 
          atual.map(p => p.id === idAlvoAvaliacao ? { ...p, soma_notas: novaSomaItem, total_avaliacoes: novoTotalItem } : p)
        );

        // Atualiza a listagem de comentários do produto localmente
        carregarComentariosProduto(idAlvoAvaliacao!);

        Alert.alert('Sucesso!', 'Sua avaliação do produto foi registrada!');
      }
      
    } catch (err: any) {
      console.error("🔥 Erro completo capturado no Catch:", err);
      Alert.alert('Erro ao salvar', 'O banco rejeitou a operação. Tente novamente.');
    } finally {
      setModalVisivel(false);
      setComentarioTexto('');
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#D97941" size="large" /></View>;

  if (!vendedor) {
    return (
      <View style={styles.centerPadding}>
        <Text style={styles.title}>Vendedor não encontrado</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}><Text style={styles.buttonText}>Voltar</Text></TouchableOpacity>
      </View>
    );
  }

  const temTelefoneValido = !!(vendedor.whatsapp || vendedor.telefone);

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.innerContainer, isTablet && styles.screenTablet]}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
          {!!vendedor.imagem_url && <Image source={{ uri: vendedor.imagem_url }} style={styles.cover} />}

          <View style={styles.card}>
            <View style={styles.topRow}>
              {(() => {
                const isOnline = vendedor.status === true || vendedor.status === 'true';
                return (
                  <View style={[styles.statusPill, isOnline ? styles.statusPillOn : styles.statusPillOff]}>
                    <Text style={[styles.statusText, isOnline ? styles.statusTextOn : styles.statusTextOff]}>
                      {isOnline ? '🟢 Vendendo agora' : '🔴 Fora do horário'}
                    </Text>
                  </View>
                );
              })()}

              <View style={styles.topActions}>
                <TouchableOpacity style={styles.iconCircleButton} onPress={alternarFavorito}>
                  <Heart size={20} color={favoritado ? '#A61B34' : '#F2E4D4'} fill={favoritado ? '#A61B34' : 'transparent'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircleButton} onPress={() => abrirModalAvaliacao('loja', vendedor.id)}>
                  <Star size={20} color="#D97941" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.nome}>{vendedor.nome}</Text>
            <Text style={styles.meta}>{vendedor.categoria || 'Vendedor de rua'}</Text>
            {!!vendedor.descricao && <Text style={styles.description}>{vendedor.descricao}</Text>}

            <View style={styles.infoBox}>
              <Text style={styles.label}>Local</Text>
              <Text style={styles.value}>{vendedor.endereco || 'Local não informado'}</Text>
              
              <Text style={styles.label}>Horário</Text>
              <Text style={styles.value}>{vendedor.hora_inicio && vendedor.hora_fim ? `De ${vendedor.hora_inicio} até ${vendedor.hora_fim}` : 'Horário não informado'}</Text>
              
              <Text style={styles.label}>Avaliação</Text>
              <Text style={styles.value}>
                ⭐ {mediaLoja} · ({qtdAvaliacoesLoja} avaliações) {isNovoNaPlataforma && '· 🔥 Novo na plataforma'}
              </Text>
            </View>

            {comentariosLoja.length > 0 && (
              <View style={styles.lojaCommentsContainer}>
                <Text style={styles.lojaCommentsTitle}>Comentários dos clientes</Text>
                {comentariosLoja.slice(0, 3).map((av, idx) => (
                  <View key={av.id || idx} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>{av.usuario_nome}</Text>
                      <Text style={styles.commentStars}>{"★".repeat(av.nota)}{"☆".repeat(5 - av.nota)}</Text>
                    </View>
                    {!!av.comentario && <Text style={styles.commentText}>{av.comentario}</Text>}
                    <Text style={styles.commentDate}>
                      {new Date(av.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={abrirRota}><Text style={styles.actionText}>Traçar rota</Text></TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButtonDark, temTelefoneValido && styles.whatsappActiveButton]} 
                onPress={abrirWhatsApp}
              >
                <Text style={styles.actionText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, styles.menuCard]}>
            <Text style={styles.sectionTitle}>Produtos / cardápio</Text>
            {cardapio.length ? (
              <View style={[isTablet && styles.produtosGrid]}>
                {cardapio.map((produto, index) => {
                  const mediaItem = produto.total_avaliacoes && produto.total_avaliacoes > 0 
                    ? (produto.soma_notas! / produto.total_avaliacoes).toFixed(1) 
                    : null;

                  return (
                    <TouchableOpacity
                      key={produto.id || index}
                      style={[styles.produtoItem, isTablet && styles.produtoItemTablet]}
                      activeOpacity={0.82}
                      onPress={() => abrirDetalhesProduto(produto)}
                    >
                      {!!produto.imagem_url && <Image source={{ uri: produto.imagem_url }} style={styles.produtoImg} />}
                      <View style={{ flex: 1 }}>
                        <View style={styles.itemTitleRow}>
                          <Text style={styles.produtoNome}>{produto.nome}</Text>
                          <TouchableOpacity onPress={() => abrirModalAvaliacao('item', produto.id || index)} style={styles.itemStarClick}>
                            <Star size={16} color="#D97941" fill={mediaItem ? "#D97941" : "transparent"} />
                          </TouchableOpacity>
                        </View>
                        
                        {!!produto.preco && <Text style={styles.produtoPreco}>{produto.preco}</Text>}
                        
                        {mediaItem && (
                          <Text style={styles.itemNotaText}>⭐ {mediaItem} ({produto.total_avaliacoes} votos)</Text>
                        )}
                        
                        {!!produto.descricao && <Text style={styles.produtoDesc} numberOfLines={2}>{produto.descricao}</Text>}
                        <Text style={styles.verDetalhesText}>Toque para ver detalhes</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : <Text style={styles.empty}>Esse vendedor ainda não cadastrou produtos.</Text>}
          </View>
        </ScrollView>

        <TouchableOpacity style={[styles.floatingBackButton, { top: insets.top + 12 }]} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#F2E4D4" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalProdutoVisivel} transparent={true} animationType="fade" onRequestClose={fecharDetalhesProduto}>
        <View style={styles.modalOverlay}>
          <View style={styles.produtoModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.produtoModalContent}>
              {!!produtoDetalhado?.imagem_url ? (
                <Image source={{ uri: produtoDetalhado.imagem_url }} style={styles.produtoModalImagem} />
              ) : (
                <View style={styles.produtoModalImagemPlaceholder}>
                  <Text style={styles.produtoModalEmoji}>🍽️</Text>
                </View>
              )}

              <Text style={styles.produtoModalTitulo}>{produtoDetalhado?.nome || 'Item do cardápio'}</Text>
              {!!produtoDetalhado?.preco && <Text style={styles.produtoModalPreco}>{produtoDetalhado.preco}</Text>}

              <View style={styles.produtoModalInfoBox}>
                <Text style={styles.produtoModalLabel}>Descrição</Text>
                <Text style={styles.produtoModalDescricao}>
                  {produtoDetalhado?.descricao || 'Esse item ainda não possui descrição cadastrada.'}
                </Text>
              </View>

              <View style={styles.produtoModalInfoBox}>
                <Text style={styles.produtoModalLabel}>Avaliação do item</Text>
                <Text style={styles.produtoModalDescricao}>
                  {produtoDetalhado?.total_avaliacoes && produtoDetalhado.total_avaliacoes > 0
                    ? `⭐ ${(Number(produtoDetalhado.soma_notas || 0) / produtoDetalhado.total_avaliacoes).toFixed(1)} · ${produtoDetalhado.total_avaliacoes} avaliações`
                    : 'Ainda sem avaliações. Seja o primeiro a avaliar.'}
                </Text>
              </View>

              <View style={styles.produtoModalInfoBox}>
                <Text style={styles.produtoModalLabel}>Comentários dos clientes</Text>
                {carregandoComentarios ? (
                  <ActivityIndicator size="small" color="#D97941" style={{ marginVertical: 8 }} />
                ) : comentariosProduto.length > 0 ? (
                  comentariosProduto.map((av, idx) => (
                    <View key={av.id || idx} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUser}>{av.usuario_nome}</Text>
                        <Text style={styles.commentStars}>{"★".repeat(av.nota)}{"☆".repeat(5 - av.nota)}</Text>
                      </View>
                      {!!av.comentario && <Text style={styles.commentText}>{av.comentario}</Text>}
                      <Text style={styles.commentDate}>
                        {new Date(av.created_at).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.produtoModalDescricao}>Nenhum comentário sobre este produto ainda.</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.produtoModalActions}>
              <TouchableOpacity style={styles.produtoModalSecondaryButton} onPress={fecharDetalhesProduto}>
                <Text style={styles.produtoModalSecondaryText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.produtoModalPrimaryButton} onPress={avaliarProdutoDetalhado}>
                <Text style={styles.produtoModalPrimaryText}>Avaliar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisivel} transparent={true} animationType="fade" onRequestClose={() => setModalVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {avaliandoTipo === 'loja' ? 'Avaliar estabelecimento' : 'Avaliar produto'}
            </Text>
            <Text style={styles.modalSubtitle}>Quantas estrelas este item merece?</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((estrela) => (
                <TouchableOpacity key={estrela} onPress={() => setNotaSelecionada(estrela)}>
                  <Star size={36} color="#D97941" fill={estrela <= notaSelecionada ? "#D97941" : "transparent"} />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Escreva seu comentário (opcional)"
              placeholderTextColor="rgba(242,228,212,0.45)"
              value={comentarioTexto}
              onChangeText={setComentarioTexto}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisivel(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitButton} onPress={submeterAvaliacao}>
                <Text style={styles.modalSubmitText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0B0503' },
  innerContainer: { flex: 1, position: 'relative' },
  screen: { flex: 1, backgroundColor: '#0B0503' },
  screenTablet: { maxWidth: 960, alignSelf: 'center', width: '100%', borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(242, 228, 212, 0.08)' },
  floatingBackButton: { position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(11, 5, 3, 0.65)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', zIndex: 10 },
  container: { paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0B0503', alignItems: 'center', justifyContent: 'center' },
  centerPadding: { flex: 1, backgroundColor: '#0B0503', padding: 24, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 260, backgroundColor: '#120806' },
  card: { margin: 18, marginTop: -28, backgroundColor: '#1A120D', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  topActions: { flexDirection: 'row', gap: 8 },
  iconCircleButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(242,228,212,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(242,228,212,0.1)' },
  menuCard: { marginTop: 25 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(239, 68, 68, 0.16)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  statusPillOn: { backgroundColor: 'rgba(34, 197, 94, 0.16)', borderColor: 'rgba(34, 197, 94, 0.3)' },
  statusPillOff: {},
  statusText: { fontWeight: '900' },
  statusTextOn: { color: '#4ADE80' },
  statusTextOff: { color: '#FCA5A5' },
  nome: { color: '#F2E4D4', fontSize: 28, fontWeight: '900' },
  title: { color: '#F2E4D4', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  meta: { color: '#D97941', marginTop: 4, fontWeight: '800' },
  description: { color: 'rgba(242,228,212,0.68)', lineHeight: 21, marginTop: 12 },
  infoBox: { marginTop: 16, backgroundColor: 'rgba(11,5,3,0.45)', borderRadius: 16, padding: 14 },
  label: { color: 'rgba(242,228,212,0.45)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  value: { color: '#F2E4D4', fontWeight: '700', marginTop: 3 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionButton: { flex: 1, backgroundColor: '#D97941', borderRadius: 14, padding: 14 },
  actionButtonDark: { flex: 1, backgroundColor: '#120806', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)' },
  whatsappActiveButton: { backgroundColor: '#25D366', borderColor: '#20BA4E' },
  actionText: { color: '#fff', textAlign: 'center', fontWeight: '900' },
  sectionTitle: { color: '#F2E4D4', fontSize: 20, fontWeight: '900', marginBottom: 12 },
  produtoItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(242,228,212,0.06)' },
  itemTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemStarClick: { padding: 4, paddingRight: 0 },
  produtoImg: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#120806' },
  produtoNome: { color: '#F2E4D4', fontWeight: '900', fontSize: 16, flex: 1 },
  produtoPreco: { color: '#D97941', fontWeight: '900', marginTop: 3 },
  itemNotaText: { color: '#D97941', fontSize: 12, fontWeight: '800', marginTop: 2 },
  produtoDesc: { color: 'rgba(242,228,212,0.58)', marginTop: 3 },
  verDetalhesText: { color: 'rgba(217,121,65,0.82)', fontSize: 12, fontWeight: '800', marginTop: 6 },
  empty: { color: 'rgba(242,228,212,0.55)' },
  button: { backgroundColor: '#D97941', padding: 16, borderRadius: 16, marginTop: 18 },
  buttonText: { color: '#fff', fontWeight: '900' },
  produtosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  produtoItemTablet: { width: '48%', borderTopWidth: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(242,228,212,0.06)', paddingBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  produtoModalContainer: { width: '100%', maxWidth: 420, maxHeight: '88%', backgroundColor: '#1A120D', borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(242,228,212,0.1)' },
  produtoModalContent: { paddingBottom: 18 },
  produtoModalImagem: { width: '100%', height: 230, backgroundColor: '#120806' },
  produtoModalImagemPlaceholder: { width: '100%', height: 180, backgroundColor: '#120806', alignItems: 'center', justifyContent: 'center' },
  produtoModalEmoji: { fontSize: 52 },
  produtoModalTitulo: { color: '#F2E4D4', fontSize: 24, fontWeight: '900', paddingHorizontal: 20, marginTop: 18 },
  produtoModalPreco: { color: '#D97941', fontSize: 22, fontWeight: '900', paddingHorizontal: 20, marginTop: 6 },
  produtoModalInfoBox: { marginHorizontal: 20, marginTop: 16, backgroundColor: 'rgba(11,5,3,0.45)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(242,228,212,0.06)' },
  produtoModalLabel: { color: 'rgba(242,228,212,0.45)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '900', marginBottom: 6 },
  produtoModalDescricao: { color: 'rgba(242,228,212,0.78)', lineHeight: 21, fontWeight: '600' },
  produtoModalActions: { flexDirection: 'row', gap: 12, padding: 18, borderTopWidth: 1, borderTopColor: 'rgba(242,228,212,0.08)', backgroundColor: '#1A120D' },
  produtoModalSecondaryButton: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#120806', borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)' },
  produtoModalSecondaryText: { color: '#F2E4D4', textAlign: 'center', fontWeight: '800' },
  produtoModalPrimaryButton: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#D97941' },
  produtoModalPrimaryText: { color: '#fff', textAlign: 'center', fontWeight: '900' },
  modalContainer: { width: '100%', maxWidth: 340, backgroundColor: '#1A120D', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(242,228,212,0.1)' },
  modalTitle: { color: '#F2E4D4', fontSize: 20, fontWeight: '900', marginBottom: 8 },
  modalSubtitle: { color: 'rgba(242,228,212,0.6)', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  starsContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  modalButtonsContainer: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelButton: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#120806', borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)' },
  modalCancelText: { color: '#F2E4D4', textAlign: 'center', fontWeight: '800' },
  modalSubmitButton: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: '#D97941' },
  modalSubmitText: { color: '#fff', textAlign: 'center', fontWeight: '900' },
  commentInput: {
    width: '100%',
    backgroundColor: '#120806',
    color: '#F2E4D4',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(242,228,212,0.1)',
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 20,
  },
  lojaCommentsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(242,228,212,0.06)',
    paddingTop: 12,
  },
  lojaCommentsTitle: {
    color: '#D97941',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  commentItem: {
    backgroundColor: 'rgba(11,5,3,0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(242,228,212,0.04)',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    color: '#F2E4D4',
    fontWeight: '800',
    fontSize: 13,
  },
  commentStars: {
    color: '#D97941',
    fontSize: 12,
  },
  commentText: {
    color: 'rgba(242,228,212,0.7)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  commentDate: {
    color: 'rgba(242,228,212,0.35)',
    fontSize: 11,
    textAlign: 'right',
  },
});
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, ChevronDown, PackagePlus, Store } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useResponsive } from '@/hooks/useResponsive';
import AppToast, { ToastMessage } from '@/components/AppToast';
import * as Location from 'expo-location';

type Produto = {
  id: string;
  nome: string;
  preco: string;
  descricao: string;
  imagemUriLocal: string | null;
  imagem_url?: string | null;
  ja_salvo_no_banco?: boolean;
};

type Categoria = {
  id: number | string;
  nome: string;
  emoji?: string;
};

type PromocoesLoja = {
  destaque: boolean;
  semana_destaque: boolean;
  dia_promo: boolean;
  combo_especial: boolean;
  mais_vendido: boolean;
  desconto_texto: string | null;
};

export default function CadastroVendedorScreen() {
  const { isTablet } = useResponsive();
  const [carregandoTela, setCarregandoTela] = useState(true);
  const [lojaId, setLojaId] = useState<number | string | null>(null);
  const [nomeLoja, setNomeLoja] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | number>('');
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]);
  
  // Estados de Endereço e Validação
  const [cep, setCep] = useState('');
  const [numero, setNumero] = useState('');
  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('Rio de Janeiro');
  const [estado, setEstado] = useState('RJ');
  const [endereco, setEndereco] = useState('');
  const [whatsapp, setWhatsapp] = useState(''); // 💡 DEVOLVIDO AQUI
  const [cepValido, setCepValido] = useState<boolean | null>(null);

  // Coordenadas guardadas em estado para gravação relacional estável
  const [latitudeBanco, setLatitudeBanco] = useState(-22.9068);
  const [longitudeBanco, setLongitudeBanco] = useState(-43.1729);

  const [descricaoLoja, setDescricaoLoja] = useState('');
  const [produtoNome, setProdutoNome] = useState('');
  const [produtoPreco, setProdutoPreco] = useState('');
  const [produtoDescricao, setProdutoDescricao] = useState('');
  const [produtoImagemLocal, setProdutoImagemLocal] = useState<string | null>(null);
  const [cardapio, setCardapio] = useState<Produto[]>([]);
  const [produtosParaRemover, setProdutosParaRemover] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(null);
  const [imagemUrlExistente, setImagemUrlExistente] = useState<string | null>(null);
  const [subindoImagem, setSubindoImagem] = useState(false);
  const [promocoesExistentes, setPromocoesExistentes] = useState<PromocoesLoja>({
    destaque: false,
    semana_destaque: false,
    dia_promo: false,
    combo_especial: false,
    mais_vendido: false,
    desconto_texto: null,
  });

  const categorySelected = useMemo(
    () => listaCategorias.find((cat) => String(cat.id) === String(categoriaId)),
    [listaCategorias, categoriaId]
  );

  function showToast(title: string, message: string, variant: 'success' | 'error' | 'info' = 'info') {
    setToast({ id: Date.now(), title, message, variant });
  }

  const formatarCep = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, '');
    if (apenasNumeros.length <= 5) return apenasNumeros;
    return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5, 8)}`;
  };

  const formatarWhatsapp = (texto: string) => {
    const numeros = texto.replace(/\D/g, '');
    if (!numeros) return '';
    if (numeros.length <= 2) return `(${numeros}`;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  function preencherEnderecoPelaConcatenacao(enderecoBanco: string) {
    const cepEncontrado = enderecoBanco.match(/\|\s*([0-9]{5}-?[0-9]{3})\.?/);
    if (cepEncontrado?.[1]) setCep(formatarCep(cepEncontrado[1]));

    const enderecoSemCep = enderecoBanco.split('|')[0].trim();
    const [ruaNumeroParte, bairroCidadeParte = ''] = enderecoSemCep.split(' - ');
    const [ruaParte = '', numeroParte = ''] = ruaNumeroParte.split(',');
    const bairroCidadeMatch = bairroCidadeParte.match(/^(.*?),\s*(.*?)\s*-\s*([A-Z]{2})$/i);

    let ruaLimpa = ruaParte.trim();
    if (ruaLimpa.includes(',')) {
      ruaLimpa = ruaLimpa.split(',')[0].trim();
    }

    setRua(ruaLimpa);
    setNumero(numeroParte.trim());

    if (bairroCidadeMatch) {
      setBairro(bairroCidadeMatch[1].trim());
      setCidade(bairroCidadeMatch[2].trim() || 'Rio de Janeiro');
      setEstado(bairroCidadeMatch[3].trim().toUpperCase() || 'RJ');
    } else if (bairroCidadeParte) {
      setBairro(bairroCidadeParte.trim());
    }

    setCepValido(true);
  }

  async function buscarCoordenadasPorTexto(enderecoCompleto: string) {
    try {
      const urlEncoded = encodeURIComponent(enderecoCompleto);
      const resposta = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${urlEncoded}&limit=1&email=italoromulo.dev@gmail.com`);
      const dados = await resposta.json();

      if (dados && dados.length > 0) {
        setLatitudeBanco(parseFloat(dados[0].lat));
        setLongitudeBanco(parseFloat(dados[0].lon));
        console.log("📍 Coordenadas obtidas com sucesso via HTTP:", dados[0].lat, dados[0].lon);
      }
    } catch (err) {
      console.log("Erro no geocode HTTP secundário, usando fallbacks seguros.");
    }
  }

  async function buscarCep(cepDigitado: string) {
    const cepLimpo = cepDigitado.replace(/\D/g, '');
    
    if (cepLimpo.length < 8) {
      setRua('');
      setBairro('');
      setCepValido(null);
      return;
    }

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();

      if (dados.erro) {
        setCepValido(false);
        setRua('');
        setBairro('');
        return;
      }

      setCepValido(true);
      setRua(dados.logradouro || '');
      setBairro(dados.bairro || '');
      setCidade(dados.localidade || 'Rio de Janeiro');
      setEstado(dados.uf || 'RJ');

      const stringParaMapa = `${dados.logradouro}, ${dados.bairro}, ${dados.localidade} - ${dados.uf}`;
      buscarCoordenadasPorTexto(stringParaMapa);

    } catch (err) {
      console.error('Erro ao buscar o CEP:', err);
      setCepValido(false);
    }
  }

  function validarHorarioCompleto(horario: string): boolean {
    if (!horario) return true;
    if (horario.length < 5) return false;
    const [horas, minutos] = horario.split(':').map(Number);
    return horas >= 0 && horas < 24 && minutos >= 0 && minutos < 60;
  }

  function tratarBlurHorario(horario: string, tipo: 'inicio' | 'fim') {
    if (horario && !validarHorarioCompleto(horario)) {
      showToast('Horário inválido', 'Insira uma hora válida entre 00:00 e 23:59.', 'error');
      if (tipo === 'inicio') setHoraInicio('');
      else setHoraFim('');
    }
  }

  useEffect(() => {
    if (cepValido === false) {
      setEndereco('CEP INDISPONÍVEL');
    } else if (rua || bairro) {
      let ruaFormatada = rua.trim();
      
      if (ruaFormatada.includes(cidade)) {
        ruaFormatada = ruaFormatada.split(cidade)[0].replace(/,\s*$/, '').trim();
      }

      const textoConcatenado = `${ruaFormatada}${numero ? `, ${numero.trim()}` : ''} - ${bairro.trim()}, ${cidade.trim()} - ${estado.trim()} | ${cep.trim()}.`;
      setEndereco(textoConcatenado); // 💡 CORRIGIDO AQUI
    } else {
      setEndereco('');
    }
  }, [rua, numero, bairro, cidade, estado, cep, cepValido]);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  async function carregarDadosIniciais() {
    setCarregandoTela(true);

    const [{ data: categoriasData, error: categoriasError }, { data: auth }] = await Promise.all([
      supabase.from('categorias').select('id, nome, emoji').order('nome', { ascending: true }),
      supabase.auth.getUser(),
    ]);

    if (categoriasError) {
      console.error('Erro ao buscar categorias do Supabase:', categoriasError.message);
    }

    const categories = categoriasData ?? [];
    setListaCategorias(categories);

    if (!auth.user) {
      setCarregandoTela(false);
      showToast('Login necessário', 'Crie uma conta ou entre antes de cadastrar sua loja.', 'error');
      setTimeout(() => router.replace('/login'), 650);
      return;
    }

    const { data: lojaBanco } = await supabase
      .from('restaurantes')
      .select('*')
      .eq('id_usuario', auth.user.id)
      .maybeSingle();

    if (lojaBanco) {
      setLojaId(lojaBanco.id);
      setNomeLoja(lojaBanco.nome ?? '');
      setCategoriaId(lojaBanco.categoria_id ?? categories[0]?.id ?? '');
      setEndereco(lojaBanco.endereco ?? '');
      setDescricaoLoja(lojaBanco.descricao ?? '');
      setWhatsapp(formatarWhatsapp(String(lojaBanco.whatsapp || lojaBanco.telefone || '')));
      setImagemUrlExistente(lojaBanco.imagem_url ?? null);
      
      setHoraInicio(lojaBanco.hora_inicio ?? '');
      setHoraFim(lojaBanco.hora_fim ?? '');
      
      setLatitudeBanco(lojaBanco.latitude ?? -22.9068);
      setLongitudeBanco(lojaBanco.longitude ?? -43.1729);
      setPromocoesExistentes({
        destaque: !!lojaBanco.destaque,
        semana_destaque: !!lojaBanco.semana_destaque,
        dia_promo: !!lojaBanco.dia_promo,
        combo_especial: !!lojaBanco.combo_especial,
        mais_vendido: !!lojaBanco.mais_vendido,
        desconto_texto: lojaBanco.desconto_texto ?? null,
      });

      if (lojaBanco.endereco) {
        try {
          preencherEnderecoPelaConcatenacao(lojaBanco.endereco);
        } catch (e) {
          setRua(lojaBanco.endereco);
        }
      }

      const { data: cardapioBanco } = await supabase
        .from('cardapios')
        .select('*')
        .eq('restaurante_id', lojaBanco.id);

      if (cardapioBanco) {
        setCardapio(
          cardapioBanco.map((item) => ({
            id: String(item.id),
            nome: item.nome,
            preco: item.preco,
            descricao: item.descricao ?? '',
            imagemUriLocal: null,
            imagem_url: item.imagem_url,
            ja_salvo_no_banco: true,
          }))
        );
      }
    } else if (categories.length > 0) {
      setCategoriaId(categories[0].id);
    }

    setCarregandoTela(false);
  }

  async function escolherImagemLoja() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!resultado.canceled) {
      setImagemSelecionada(resultado.assets[0].uri);
      setImagemUrlExistente(null);
    }
  }

  async function escolherImagemProduto() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!resultado.canceled) {
      setProdutoImagemLocal(resultado.assets[0].uri);
    }
  }

  async function enviarArquivoStorage(uriLocal: string): Promise<string | null> {
    try {
      const resposta = await fetch(uriLocal);
      const blob = await resposta.blob();
      const nomeArquivo = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { error } = await supabase.storage
        .from('imagens-lojas')
        .upload(nomeArquivo, blob, { contentType: 'image/jpeg', upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('imagens-lojas').getPublicUrl(nomeArquivo);
      return publicUrl;
    } catch (err) {
      console.error('Erro no upload do arquivo:', err);
      return null;
    }
  }

  function formatarHorario(texto: string) {
    const apenasNumeros = texto.replace(/\D/g, '');
    if (apenasNumeros.length <= 2) return apenasNumeros;
    return `${apenasNumeros.slice(0, 2)}:${apenasNumeros.slice(2, 4)}`;
  }

  function adicionarProduto() {
    const precoNumeros = produtoPreco.replace(/\D/g, '');
    if (!produtoNome.trim() || !produtoPreco.trim()) {
      showToast('Dados inválidos', 'Informe o nome e o preço do produto.', 'error');
      return;
    }

    if (!precoNumeros || Number(precoNumeros) <= 0) {
      showToast('Preço inválido', 'Informe um preço maior que zero.', 'error');
      return;
    }

    // 💡 LIMITADOR: Converte para número real (ex: 9999800 vira 99998.00) e valida
    const valorCentavos = Number(precoNumeros);
    if (valorCentavos > 999900) {
      showToast('Preço muito alto', 'O preço máximo permitido para um item é R$ 99.998,00.', 'error');
      return;
    }

    setCardapio((atual) => [
      ...atual,
      {
        id: String(Date.now()),
        nome: produtoNome.trim(),
        preco: produtoPreco.trim(),
        descricao: produtoDescricao.trim(),
        imagemUriLocal: produtoImagemLocal,
        imagem_url: null,
        ja_salvo_no_banco: false,
      },
    ]);

    setProdutoNome('');
    setProdutoPreco('');
    setProdutoDescricao('');
    setProdutoImagemLocal(null);
  }

  function removerProduto(id: string, jaSalvo: boolean | undefined) {
    if (jaSalvo) {
      setProdutosParaRemover((atuais) => Array.from(new Set([...atuais, id])));
    }
    setCardapio((atual) => atual.filter((produto) => produto.id !== id));
    showToast('Item marcado para remover', 'A exclusão será confirmada ao salvar as alterações.', 'info');
  }

  async function finalizarCadastro() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      showToast('Login necessário', 'Crie uma conta ou entre antes de cadastrar sua loja.', 'error');
      setTimeout(() => router.replace('/login'), 650);
      return;
    }

    if (!nomeLoja.trim() || nomeLoja.trim().length < 2) {
      showToast('Dados inválidos', 'Informe um nome válido para a loja.', 'error');
      return;
    }

    if (!categoriaId) {
      showToast('Dados inválidos', 'Selecione o nicho da loja.', 'error');
      return;
    }

    const whatsappLimpo = whatsapp.replace(/\D/g, '');
    if (!whatsappLimpo || whatsappLimpo.length < 10) {
      showToast('WhatsApp inválido', 'Informe um WhatsApp com DDD para a loja.', 'error');
      return;
    }

    setLoading(true);
    try {
      let queryValidaWhats = supabase
        .from('restaurantes')
        .select('id')
        .eq('whatsapp', whatsappLimpo);

      if (lojaId) {
        queryValidaWhats = queryValidaWhats.neq('id', lojaId);
      }

      const { data: existeLojaWhats, error: erroValidacaoWhats } = await queryValidaWhats.maybeSingle();

      if (erroValidacaoWhats) throw erroValidacaoWhats;

      if (existeLojaWhats) {
        showToast('WhatsApp indisponível', 'Este número de telefone já está associado a outra loja cadastrada.', 'error');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Erro ao validar unicidade do WhatsApp:", err);
      setLoading(false);
      return;
    }

    if (cepValido === false) {
      showToast('CEP indisponível', 'Não é possível salvar um endereço com CEP inválido.', 'error');
      return;
    }

    if (!cep.trim() || !rua.trim() || !bairro.trim() || !numero.trim()) {
      showToast('Dados incompletos', 'Preencha CEP, número, rua e bairro.', 'error');
      return;
    }

    if (!validarHorarioCompleto(horaInicio) || !validarHorarioCompleto(horaFim)) {
      showToast('Horário inválido', 'Por favor, revise os campos de funcionamento utilizando o padrão de 24h.', 'error');
      setLoading(false);
      return;
    }

    const horarioIncompleto = (horaInicio && !horaFim) || (!horaInicio && horaFim);
    if (horarioIncompleto) {
      showToast('Horário inválido', 'Preencha o horário de início e fim.', 'error');
      setLoading(false);
      return;
    }

    setSubindoImagem(true);

    try {
      let latFinal = latitudeBanco;
      let lngFinal = longitudeBanco;

      if (Platform.OS !== 'web') {
        try {
          const enderecoLimpo = `${rua.trim()}${numero ? `, ${numero.trim()}` : ''} - ${bairro.trim()}, ${cidade.trim()} - ${estado.trim()}`;
          const resultadoGeocode = await Location.geocodeAsync(enderecoLimpo);
          if (resultadoGeocode && resultadoGeocode.length > 0) {
            latFinal = resultadoGeocode[0].latitude;
            lngFinal = resultadoGeocode[0].longitude;
          }
        } catch (geoErr) {
          console.log("Geocode nativo ignorado.");
        }
      }

      let urlLojaFinal = imagemUrlExistente;
      if (imagemSelecionada) {
        const urlUpload = await enviarArquivoStorage(imagemSelecionada);
        if (urlUpload) urlLojaFinal = urlUpload;
      }

      const payloadBanco = {
        nome: nomeLoja.trim(),
        descricao: descricaoLoja.trim(),
        categoria_id: Number(categoriaId),
        imagem_url: urlLojaFinal,
        endereco: endereco.trim(),
        whatsapp: whatsappLimpo,
        latitude: latFinal,
        longitude: lngFinal,
        destaque: promocoesExistentes.destaque,
        semana_destaque: promocoesExistentes.semana_destaque,
        dia_promo: promocoesExistentes.dia_promo,
        combo_especial: promocoesExistentes.combo_especial,
        mais_vendido: promocoesExistentes.mais_vendido,
        desconto_texto: promocoesExistentes.desconto_texto,
        id_usuario: data.user.id,
        hora_inicio: horaInicio,
        hora_fim: horaFim
      };

      let idDaLojaSalva = lojaId;

      if (lojaId) {
        const { error: erroUpdate } = await supabase
          .from('restaurantes')
          .update(payloadBanco)
          .eq('id', lojaId);
        if (erroUpdate) throw erroUpdate;
      } else {
        const { data: novaLoja, error: erroInsert } = await supabase
          .from('restaurantes')
          .insert({
            ...payloadBanco,
            status: true,
            offline: false, // 💡 Força offline como false para novos cadastros aparecerem na home e no mapa
          })
          .select('id')
          .single();
        
        if (erroInsert) throw erroInsert;
        idDaLojaSalva = novaLoja.id;
      }

      if (produtosParaRemover.length > 0) {
        const { error: erroRemocaoCardapio } = await supabase
          .from('cardapios')
          .delete()
          .in('id', produtosParaRemover);

        if (erroRemocaoCardapio) throw erroRemocaoCardapio;
      }

      await Promise.all(
        cardapio.map(async (produto) => {
          if (produto.ja_salvo_no_banco) return;

          let imagemPratoFinal = null;
          if (produto.imagemUriLocal) {
            const urlPratoUpload = await enviarArquivoStorage(produto.imagemUriLocal);
            if (urlPratoUpload) imagemPratoFinal = urlPratoUpload;
          }

          const { error: erroCardapio } = await supabase
            .from('cardapios')
            .insert({
              restaurante_id: idDaLojaSalva,
              nome: produto.nome,
              preco: produto.preco,
              descricao: produto.descricao,
              imagem_url: imagemPratoFinal,
            });

          if (erroCardapio) throw erroCardapio;
        })
      );

      await supabase.auth.updateUser({
        data: {
          ...(data.user.user_metadata ?? {}),
          tipo_conta: 'vendedor',
          loja: {
            nome: nomeLoja.trim(),
            categoria_id: Number(categoriaId),
            endereco: endereco.trim(),
            descricao: descricaoLoja.trim(),
            whatsapp: whatsappLimpo,
            imagem_url: urlLojaFinal,
            id: idDaLojaSalva,
            hora_inicio: horaInicio,
            hora_fim: horaFim
          },
        },
      });

      await supabase
        .from('usuarios')
        .update({ tipo_usuario: 'vendedor' })
        .eq('auth_id', data.user.id);

      setProdutosParaRemover([]);
      showToast(lojaId ? 'Alterações realizadas' : 'Loja cadastrada', 'Loja e cardápio atualizados com sucesso.', 'success');
      setTimeout(() => router.replace('/painel-vendedor'), 800);
    } catch (err: any) {
      console.error("Erro detalhado no salvamento:", err);
      showToast('Alterações não realizadas', err.message || 'Erro desconhecido', 'error');
    } finally {
      setLoading(false);
      setSubindoImagem(false);
    }
  }

  const capaPreview = imagemSelecionada || imagemUrlExistente;

  return (
    <>
      <AppToast toast={toast} onHide={() => setToast(null)} />
      <ScrollView contentContainerStyle={[styles.container, isTablet && styles.containerTablet]} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
        <ArrowLeft size={20} color="#F2E4D4" />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.headerBlock}>
        <View style={styles.headerIcon}>
          <Store size={28} color="#D97941" />
        </View>
        <Text style={styles.brand}>Na Esquina</Text>
        <Text style={styles.title}>{lojaId ? 'Editar loja' : 'Cadastro da loja'}</Text>
        <Text style={styles.subtitle}>Monte o perfil do seu ponto e mantenha o cardápio atualizado quando quiser.</Text>
      </View>

      <TouchableOpacity
        style={[styles.imageSelector, capaPreview ? styles.imageSelectorFilled : styles.imageSelectorEmpty]}
        onPress={escolherImagemLoja}
        activeOpacity={0.8}
      >
        {capaPreview ? (
          <Image source={{ uri: capaPreview }} style={styles.previewImage} />
        ) : (
          <Text style={styles.imageSelectorText}>+ Adicionar foto da capa ou logotipo</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Nome da loja"
        placeholderTextColor="rgba(242,228,212,0.45)"
        value={nomeLoja}
        onChangeText={setNomeLoja}
      />

      <TextInput
        style={styles.input}
        placeholder="WhatsApp da loja"
        placeholderTextColor="rgba(242,228,212,0.45)"
        value={whatsapp}
        onChangeText={(texto) => setWhatsapp(formatarWhatsapp(texto))}
        keyboardType="phone-pad"
        maxLength={15}
      />

      <View style={styles.nichoBox}>
        <View style={styles.nichoHeader}>
          <View>
            <Text style={styles.label}>Nicho da loja</Text>
            <Text style={styles.helperText}>Clique aqui em qual categoria seu restaurante faz parte.</Text>
          </View>
          <ChevronDown size={20} color="#D97941" />
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={categoriaId}
            onValueChange={(itemValue) => setCategoriaId(itemValue)}
            style={styles.picker}
            dropdownIconColor="#D97941"
          >
            {listaCategorias.map((cat) => (
              <Picker.Item key={cat.id} label={`${cat.emoji ? `${cat.emoji} ` : ''}${cat.nome}`} value={cat.id} color="#F2E4D4" style={styles.pickerItem} />
            ))}
          </Picker>
        </View>
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descrição da loja (Opcional)"
        placeholderTextColor="rgba(242,228,212,0.45)"
        value={descricaoLoja}
        onChangeText={setDescricaoLoja}
        multiline
      />

      <View style={styles.horarioContainer}>
        <Text style={styles.labelHorario}>Horário de funcionamento (Formato 24h)</Text>
        <View style={styles.linhaInputs}>
          <View style={styles.colunaInput}>
            <TextInput
              style={styles.inputMetade}
              placeholder="De. Ex: 18:00"
              placeholderTextColor="rgba(242,228,212,0.45)"
              value={horaInicio}
              maxLength={5}
              keyboardType="number-pad"
              onChangeText={(texto) => setHoraInicio(formatarHorario(texto))}
              onBlur={() => tratarBlurHorario(horaInicio, 'inicio')}
            />
          </View>
          <Text style={styles.textoSeparador}>até</Text>
          <View style={styles.colunaInput}>
            <TextInput
              style={styles.inputMetade}
              placeholder="Até. Ex: 23:30"
              placeholderTextColor="rgba(242,228,212,0.45)"
              value={horaFim}
              maxLength={5}
              keyboardType="number-pad"
              onChangeText={(texto) => setHoraFim(formatarHorario(texto))}
              onBlur={() => tratarBlurHorario(horaFim, 'fim')}
            />
          </View>
        </View>
      </View>

      <View style={styles.linhaLaranja} />

      <Text style={styles.labelSecao}>Endereço do Ponto</Text>
      
      <View style={styles.linhaInputs}>
        <TextInput
          style={[styles.input, { flex: 2 }]}
          placeholder="CEP (Ex: 23070-000)"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={cep}
          keyboardType="numeric"
          maxLength={9}
          onChangeText={(texto) => {
            const cepFormatado = formatarCep(texto);
            setCep(cepFormatado);
            buscarCep(cepFormatado); 
          }}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Número"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={numero}
          onChangeText={setNumero}
          keyboardType="numeric"
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nome da Rua / Avenida (Auto)"
        placeholderTextColor="rgba(242,228,212,0.45)"
        value={rua}
        onChangeText={setRua}
      />

      <View style={styles.linhaInputs}>
        <TextInput
          style={[styles.input, { flex: 2 }]}
          placeholder="Bairro (Auto)"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={bairro}
          onChangeText={setBairro}
        />
        <TextInput
          style={[styles.input, { flex: 1, backgroundColor: 'rgba(242,228,212,0.03)', color: 'rgba(242,228,212,0.6)', textAlign: 'center' }]}
          value={estado}
          editable={false}
        />
      </View>

      <Text style={styles.labelSubInput}>Visualização do endereço completo:</Text>
      <TextInput
        style={[
          styles.input, 
          styles.inputDisabled, 
          cepValido === false && styles.inputErrorText
        ]}
        value={endereco}
        placeholder="Digite o CEP e o Número para gerar o endereço completo..."
        placeholderTextColor="rgba(242,228,212,0.25)"
        editable={false}
        multiline
      />

      <View style={styles.linhaLaranja} />

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <PackagePlus size={20} color="#D97941" />
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Adicionar item ao cardápio</Text>
            <Text style={styles.sectionHint}>Use essa área para cadastrar novos produtos no cardápio da loja.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.imageSelectorProduto, produtoImagemLocal ? styles.imageSelectorProdutoFilled : styles.imageSelectorProdutoEmpty]}
          onPress={escolherImagemProduto}
          activeOpacity={0.8}
        >
          {produtoImagemLocal ? (
            <Image source={{ uri: produtoImagemLocal }} style={styles.previewImage} />
          ) : (
            <Text style={styles.imageSelectorProdutoText}>+ Adicionar foto do prato / produto</Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Nome do produto"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={produtoNome}
          onChangeText={setProdutoNome}
        />

        <TextInput
          style={styles.input}
          placeholder="Preço. Ex: R$ 24,90"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={produtoPreco}
          keyboardType="number-pad"
          onChangeText={(texto) => {
            const apenasNumeros = texto.replace(/\D/g, '');
            if (!apenasNumeros) {
              setProdutoPreco('');
              return;
            }
            
            // 💡 LIMITADOR EM TEMPO DE DIGITAÇÃO: Não deixa ultrapassar R$ 99.998,00 (9999800 centavos)
            const valorNumerico = Number(apenasNumeros);
            if (valorNumerico > 9999800) {
              return; // Bloqueia a digitação de novos números
            }

            const valorFormatado = (valorNumerico / 100).toFixed(2);
            setProdutoPreco(`R$ ${valorFormatado.replace('.', ',')}`);
          }}
        />

        <TextInput
          style={[styles.input, styles.textAreaSmall]}
          placeholder="Descrição do produto"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={produtoDescricao}
          onChangeText={setProdutoDescricao}
          multiline
        />

        <TouchableOpacity style={styles.secondaryButton} onPress={adicionarProduto} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>+ Adicionar ao cardápio</Text>
        </TouchableOpacity>
      </View>

      {cardapio.length > 0 && (
        <View style={styles.containerListaCardapio}>
          <Text style={styles.tituloListaCardapio}>Cardápio da loja ({cardapio.length})</Text>
          <View style={[isTablet && styles.menuGridTablet]}>
            {cardapio.map((produto) => (
              <View key={produto.id} style={[styles.menuItem, isTablet && styles.menuItemTablet]}>
                {(produto.imagemUriLocal || produto.imagem_url) && (
                  <Image source={{ uri: produto.imagemUriLocal || produto.imagem_url || '' }} style={styles.imagemProdutoItem} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuName}>{produto.nome}</Text>
                  <Text style={styles.menuPrice}>{produto.preco}</Text>
                  {!!produto.descricao && <Text style={styles.menuDescription} numberOfLines={2}>{produto.descricao}</Text>}
                </View>
                <TouchableOpacity onPress={() => removerProduto(produto.id, produto.ja_salvo_no_banco)} activeOpacity={0.75} style={styles.botaoRemover}>
                  <Text style={styles.removeText}>Remover</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={finalizarCadastro}
        disabled={loading || subindoImagem}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>
          {subindoImagem ? 'Enviando arquivos...' : loading ? 'Salvando dados...' : lojaId ? 'Salvar alterações' : 'Finalizar cadastro'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.75}>
        <Text style={styles.secondaryLink}>Pular por enquanto</Text>
      </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0B0503', alignItems: 'center', justifyContent: 'center' },
  container: { flexGrow: 1, padding: 24, paddingTop: 48, backgroundColor: '#0B0503' },
  containerTablet: { maxWidth: 720, alignSelf: 'center', width: '100%' },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(242,228,212,0.06)', borderWidth: 1, borderColor: 'rgba(242,228,212,0.10)', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, marginBottom: 18 },
  backText: { color: '#F2E4D4', fontWeight: '800' },
  headerBlock: { alignItems: 'center', marginBottom: 18 },
  headerIcon: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(217,121,65,0.14)', borderWidth: 1, borderColor: 'rgba(217,121,65,0.28)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brand: { color: '#D97941', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  title: { color: '#F2E4D4', fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  subtitle: { color: 'rgba(242,228,212,0.62)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  imageSelector: { backgroundColor: '#1A120D', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(217, 121, 65, 0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden', paddingHorizontal: 15 },
  imageSelectorEmpty: { height: 60, borderStyle: 'dashed' },
  imageSelectorFilled: { height: 178, borderStyle: 'solid' },
  imageSelectorText: { color: 'rgba(242, 228, 212, 0.58)', fontSize: 14, fontWeight: '800' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  labelSecao: { color: '#D97941', fontSize: 15, fontWeight: '900', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  labelSubInput: { color: 'rgba(242,228,212,0.4)', fontSize: 12, fontWeight: '700', marginBottom: 5, paddingLeft: 2 },
  inputDisabled: { backgroundColor: 'rgba(26,18,13,0.45)', borderColor: 'rgba(242,228,212,0.03)', color: '#F2E4D4' },
  inputErrorText: { color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontWeight: '800' },
  input: { backgroundColor: '#1A120D', color: '#F2E4D4', borderRadius: 12, padding: 15, marginBottom: 13, fontSize: 16, borderWidth: 1, borderColor: 'rgba(242,228,212,0.07)' },
  nichoBox: { backgroundColor: '#130B08', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(217,121,65,0.22)', marginBottom: 13 },
  nichoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 4, paddingBottom: 10 },
  label: { color: '#F2E4D4', fontSize: 14, fontWeight: '900' },
  helperText: { color: 'rgba(242,228,212,0.52)', fontSize: 12, marginTop: 3 },
  pickerContainer: { backgroundColor: '#1A120D', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(242,228,212,0.07)', overflow: 'hidden', justifyContent: 'center' },
  picker: { color: '#F2E4D4', height: 55, width: '100%', backgroundColor: 'transparent' },
  pickerItem: { backgroundColor: '#1A120D', fontSize: 16 },
  horarioContainer: { marginBottom: 13 },
  labelHorario: { color: '#F2E4D4', fontSize: 14, fontWeight: '800', marginBottom: 6, paddingLeft: 4 },
  linhaInputs: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  colunaInput: { flex: 1 },
  inputMetade: { backgroundColor: '#1A120D', color: '#F2E4D4', borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: 'rgba(242,228,212,0.07)', textAlign: 'center' },
  textoSeparador: { color: 'rgba(242, 228, 212, 0.5)', fontSize: 15, fontWeight: '600' },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  textAreaSmall: { minHeight: 70, textAlignVertical: 'top' },
  card: { backgroundColor: '#130B08', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)', marginTop: 8, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  sectionTitle: { color: '#F2E4D4', fontWeight: '900', fontSize: 18 },
  sectionHint: { color: 'rgba(242,228,212,0.52)', marginTop: 3, lineHeight: 18 },
  imageSelectorProduto: { backgroundColor: '#1A120D', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(242, 228, 212, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 13, overflow: 'hidden', paddingHorizontal: 15 },
  imageSelectorProdutoEmpty: { height: 52, borderStyle: 'dashed' },
  imageSelectorProdutoFilled: { height: 124, borderStyle: 'solid' },
  imageSelectorProdutoText: { color: 'rgba(242, 228, 212, 0.45)', fontSize: 13, fontWeight: '700' },
  secondaryButton: { backgroundColor: 'rgba(217,121,65,0.18)', borderWidth: 1, borderColor: 'rgba(217,121,65,0.45)', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 4 },
  secondaryButtonText: { color: '#F2E4D4', fontWeight: '900' },
  containerListaCardapio: { marginBottom: 20, paddingHorizontal: 2 },
  tituloListaCardapio: { color: '#D97941', fontWeight: '900', fontSize: 18, marginBottom: 10, letterSpacing: -0.2 },
  menuGridTablet: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  menuItem: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: '#130B08', padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(242,228,212,0.05)' },
  menuItemTablet: { width: '48%', marginBottom: 0 },
  imagemProdutoItem: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#1A120D' },
  menuName: { color: '#F2E4D4', fontWeight: '800', fontSize: 15 },
  menuPrice: { color: '#D97941', fontWeight: '800', marginTop: 2, fontSize: 14 },
  menuDescription: { color: 'rgba(242,228,212,0.45)', marginTop: 3, fontSize: 11, lineHeight: 14 },
  botaoRemover: { paddingVertical: 8, paddingHorizontal: 4 },
  removeText: { color: '#D97941', fontWeight: '800', fontSize: 12 },
  button: { backgroundColor: '#D97941', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#0B0503', fontWeight: '900', fontSize: 16 },
  secondaryLink: { color: 'rgba(242,228,212,0.6)', textAlign: 'center', marginTop: 18, marginBottom: 24, fontWeight: '700' },
  linhaLaranja: { height: 1, backgroundColor: '#D97941', width: '100%', marginVertical: 16, opacity: 0.8 },
});
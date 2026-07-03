import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, Camera, Eye, EyeOff, Store, UserRound } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import * as ImagePicker from 'expo-image-picker';
import AppToast, { ToastMessage } from '@/components/AppToast';

type TipoConta = 'cliente' | 'vendedor';

type UsuarioBanco = {
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  data_nasc?: string | null;
  tipo_usuario?: string | null;
  avatar_url?: string | null;
};

export default function CadastroScreen() {
  const [modoEdicao, setModoEdicao] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [tipoConta, setTipoConta] = useState<TipoConta>('cliente');
  const [nome, setNome] = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrlAtual, setAvatarUrlAtual] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [ocultarSenha, setOcultarSenha] = useState(true);
  const [ocultarConfirmarSenha, setOcultarConfirmarSenha] = useState(true);

  const telefoneLimpo = telefone.replace(/\D/g, '');
  const avatarPreview = avatarUri || avatarUrlAtual;

  useEffect(() => {
    carregarDadosSeEstiverLogado();
  }, []);

  function showToast(title: string, message: string, variant: 'success' | 'error' | 'info' = 'info') {
    setToast({ id: Date.now(), title, message, variant });
  }

  const formatarData = (texto: string) => {
    const numerosPure = texto.replace(/\D/g, '');
    if (numerosPure.length <= 2) return numerosPure;
    if (numerosPure.length <= 4) return `${numerosPure.slice(0, 2)}/${numerosPure.slice(2)}`;
    return `${numerosPure.slice(0, 2)}/${numerosPure.slice(2, 4)}/${numerosPure.slice(4, 8)}`;
  };

  const dataBancoParaTela = (data?: string | null) => {
    if (!data) return '';
    const [ano, mes, dia] = String(data).split('-');
    if (!ano || !mes || !dia) return '';
    return `${dia.slice(0, 2)}/${mes}/${ano}`;
  };

  const formatarTelefone = (texto: string) => {
    const numeros = texto.replace(/\D/g, '');
    if (!numeros) return '';
    if (numeros.length <= 2) return `(${numeros}`;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  async function carregarDadosSeEstiverLogado() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    setModoEdicao(true);
    setAuthUserId(auth.user.id);
    setEmail(auth.user.email ?? '');

    const { data: usuarioBanco } = await supabase
      .from('usuarios')
      .select('nome,email,telefone,data_nasc,tipo_usuario,avatar_url')
      .eq('auth_id', auth.user.id)
      .maybeSingle<UsuarioBanco>();

    const metadata = auth.user.user_metadata ?? {};
    const tipo = (usuarioBanco?.tipo_usuario || metadata.tipo_conta || 'cliente') as TipoConta;

    setNome(usuarioBanco?.nome || metadata.nome || '');
    setTelefone(formatarTelefone(String(usuarioBanco?.telefone || metadata.telefone || '')));
    setDataNasc(dataBancoParaTela(usuarioBanco?.data_nasc));
    setTipoConta(tipo === 'vendedor' ? 'vendedor' : 'cliente');
    setAvatarUrlAtual(usuarioBanco?.avatar_url || metadata.avatar_url || null);
  }

  async function selecionarImagem() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      showToast('Permissão necessária', 'Autorize o acesso às fotos para escolher uma imagem.', 'error');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!resultado.canceled && resultado.assets?.[0]?.uri) {
      setAvatarUri(resultado.assets[0].uri);
    }
  }

  async function uploadAvatar(userId: string, uriLocal: string): Promise<string | null> {
    try {
      if (uriLocal.startsWith('http')) return uriLocal;
      const resposta = await fetch(uriLocal);
      const blob = await resposta.blob();
      const nomeArquivo = `${userId}/perfil.jpg`;

      const { error: erroUpload } = await supabase.storage
        .from('midias-usuario')
        .upload(nomeArquivo, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (erroUpload) throw erroUpload;

      const { data: { publicUrl } } = supabase.storage
        .from('midias-usuario')
        .getPublicUrl(nomeArquivo);

      return publicUrl;
    } catch (err) {
      console.error('Erro ao fazer upload do avatar:', err);
      return null;
    }
  }

  function validarCampos() {
    if (!nome.trim() || !email.trim()) {
      showToast('Dados incompletos', 'Preencha nome e e-mail.', 'error');
      return false;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailValido) {
      showToast('Dados inválidos', 'Informe um e-mail válido.', 'error');
      return false;
    }

    if (telefoneLimpo && (telefoneLimpo.length < 10 || telefoneLimpo.length > 11)) {
      showToast('Dados inválidos', 'Informe um telefone com DDD.', 'error');
      return false;
    }

    if (!modoEdicao && !senha.trim()) {
      showToast('Senha obrigatória', 'Informe uma senha para criar sua conta.', 'error');
      return false;
    }

    if (dataNasc.trim() && dataNasc.length < 10) {
      showToast('Data inválida', 'Use o formato DD/MM/AAAA.', 'error');
      return false;
    }

    if (dataNasc.length === 10) {
      const [dia, mes, ano] = dataNasc.split('/').map(Number);
      if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || ano < 1900 || ano > new Date().getFullYear()) {
        showToast('Data inválida', 'Insira uma data de nascimento válida.', 'error');
        return false;
      }
    }

    if (senha || confirmarSenha || !modoEdicao) {
      if (senha.length < 6) {
        showToast('Senha fraca', 'A senha precisa ter pelo menos 6 caracteres.', 'error');
        return false;
      }

      if (senha !== confirmarSenha) {
        showToast('Senhas diferentes', 'As senhas não são iguais.', 'error');
        return false;
      }
    }

    return true;
  }

  async function atualizarContaExistente() {
    if (!authUserId) return;

    let urlPublicaFoto = avatarUrlAtual;
    if (avatarUri) {
      urlPublicaFoto = await uploadAvatar(authUserId, avatarUri);
    }

    const dataBanco = dataNasc.length === 10 ? dataNasc.split('/').reverse().join('-') : null;

    const payloadUsuario = {
      auth_id: authUserId,
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefoneLimpo || null,
      data_nasc: dataBanco,
      tipo_usuario: tipoConta,
      username: email.split('@')[0],
      reset_senha: false,
      avatar_url: urlPublicaFoto,
    };

    const { data: atualizado, error: erroUpdate } = await supabase
      .from('usuarios')
      .update(payloadUsuario)
      .eq('auth_id', authUserId)
      .select('auth_id')
      .maybeSingle();

    if (erroUpdate) throw erroUpdate;

    if (!atualizado) {
      const { error: erroInsert } = await supabase
        .from('usuarios')
        .insert(payloadUsuario);
      if (erroInsert) throw erroInsert;
    }

    const updateAuthPayload: any = {
      data: {
        nome: nome.trim(),
        telefone: telefoneLimpo,
        tipo_conta: tipoConta,
        avatar_url: urlPublicaFoto,
      },
    };

    if (senha) updateAuthPayload.password = senha;
    if (email.trim()) updateAuthPayload.email = email.trim();

    const { error: erroAuthUpdate } = await supabase.auth.updateUser(updateAuthPayload);
    if (erroAuthUpdate) throw erroAuthUpdate;
  }

  async function criarContaNova() {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          nome: nome.trim(),
          telefone: telefoneLimpo,
          tipo_conta: tipoConta,
        },
      },
    });

    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error('Não foi possível obter o ID do usuário gerado.');

    let urlPublicaFoto = null;
    if (avatarUri) {
      urlPublicaFoto = await uploadAvatar(userId, avatarUri);
    }

    const dataBanco = dataNasc.length === 10 ? dataNasc.split('/').reverse().join('-') : null;

    const { error: erroUsuario } = await supabase
      .from('usuarios')
      .insert({
        auth_id: userId,
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefoneLimpo || null,
        data_nasc: dataBanco,
        tipo_usuario: tipoConta,
        username: email.split('@')[0],
        reset_senha: false,
        avatar_url: urlPublicaFoto,
      });

    if (erroUsuario) throw erroUsuario;
  }

  async function cadastrar() {
    if (!validarCampos()) return;

    setLoading(true);

    try {
      if (modoEdicao) {
        await atualizarContaExistente();
        showToast('Alterações realizadas', 'Sua conta foi atualizada com sucesso.', 'success');
        setTimeout(() => router.replace('/conta'), 800);
      } else {
        await criarContaNova();
        showToast('Cadastro realizado', tipoConta === 'vendedor' ? 'Agora configure sua loja.' : 'Conta criada com sucesso.', 'success');
        setTimeout(() => {
          if (tipoConta === 'vendedor') router.push('/cadastro-vendedor');
          else router.replace('/(tabs)');
        }, 850);
      }
    } catch (err: any) {
      console.error('Erro ao salvar cadastro:', err);
      showToast(modoEdicao ? 'Alterações não realizadas' : 'Cadastro não realizado', err.message || 'Tente novamente em alguns instantes.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppToast toast={toast} onHide={() => setToast(null)} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
          <ArrowLeft size={20} color="#F2E4D4" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>{modoEdicao ? 'Alterar conta' : 'Criar conta'}</Text>
        <Text style={styles.subtitle}>{modoEdicao ? 'Atualize seus dados puxados do Supabase.' : 'Escolha como você quer usar o app antes de continuar.'}</Text>

        <View style={styles.choiceRow}>
          <TouchableOpacity
            style={[styles.choiceCard, tipoConta === 'cliente' && styles.choiceCardActive]}
            onPress={() => setTipoConta('cliente')}
            activeOpacity={0.85}
          >
            <UserRound size={20} color={tipoConta === 'cliente' ? '#0B0503' : '#D97941'} />
            <Text style={[styles.choiceTitle, tipoConta === 'cliente' && styles.choiceTitleActive]}>Cliente</Text>
            <Text style={[styles.choiceText, tipoConta === 'cliente' && styles.choiceTextActive]}>Encontrar vendedores</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.choiceCard, tipoConta === 'vendedor' && styles.choiceCardActive]}
            onPress={() => setTipoConta('vendedor')}
            activeOpacity={0.85}
          >
            <Store size={20} color={tipoConta === 'vendedor' ? '#0B0503' : '#D97941'} />
            <Text style={[styles.choiceTitle, tipoConta === 'vendedor' && styles.choiceTitleActive]}>Vendedor</Text>
            <Text style={[styles.choiceText, tipoConta === 'vendedor' && styles.choiceTextActive]}>Cadastrar minha loja</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={selecionarImagem} activeOpacity={0.8}>
            {avatarPreview ? (
              <Image source={{ uri: avatarPreview }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Camera size={26} color="rgba(242,228,212,0.4)" />
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              <Camera size={12} color="#0B0503" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Foto de perfil (opcional)</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={styles.input}
          placeholder="Data de nascimento (DD/MM/AAAA)"
          placeholderTextColor="rgba(242,228,212,0.45)"
          keyboardType="numeric"
          maxLength={10}
          value={dataNasc}
          onChangeText={(text) => setDataNasc(formatarData(text))}
        />

        <TextInput
          style={styles.input}
          placeholder="Telefone"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={telefone}
          onChangeText={(text) => setTelefone(formatarTelefone(text))}
          keyboardType="phone-pad"
          maxLength={15}
        />

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder={modoEdicao ? 'Nova senha (opcional)' : 'Senha'}
            placeholderTextColor="rgba(242,228,212,0.45)"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={ocultarSenha}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setOcultarSenha(!ocultarSenha)}
            activeOpacity={0.7}
          >
            {ocultarSenha ? (
              <EyeOff size={20} color="rgba(242,228,212,0.55)" />
            ) : (
              <Eye size={20} color="#D97941" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder={modoEdicao ? 'Confirmar nova senha' : 'Confirmar senha'}
            placeholderTextColor="rgba(242,228,212,0.45)"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry={ocultarConfirmarSenha}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setOcultarConfirmarSenha(!ocultarConfirmarSenha)}
            activeOpacity={0.7}
          >
            {ocultarConfirmarSenha ? (
              <EyeOff size={20} color="rgba(242,228,212,0.55)" />
            ) : (
              <Eye size={20} color="#D97941" />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={cadastrar} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.buttonText}>
            {loading ? (modoEdicao ? 'Salvando...' : 'Cadastrando...') : modoEdicao ? 'Salvar alterações' : tipoConta === 'vendedor' ? 'Continuar para loja' : 'Criar conta cliente'}
          </Text>
        </TouchableOpacity>

        {!modoEdicao && (
          <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.75}>
            <Text style={styles.link}>
              Já tenho conta. <Text style={styles.linkHighlight}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.75}>
          <Text style={styles.secondaryLink}>Voltar para o app</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: '#0B0503' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0B0503' },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(242,228,212,0.06)', borderWidth: 1, borderColor: 'rgba(242,228,212,0.10)', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, marginBottom: 20 },
  backText: { color: '#F2E4D4', fontWeight: '800' },
  logo: { width: 340, height: 100, resizeMode: 'contain', alignSelf: 'center', marginBottom: 12 },
  title: { color: '#F2E4D4', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: 'rgba(242,228,212,0.62)', textAlign: 'center', marginTop: 8, marginBottom: 18 },
  choiceRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  choiceCard: { flex: 1, minHeight: 96, backgroundColor: '#130B08', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(242,228,212,0.08)', justifyContent: 'center', gap: 5 },
  choiceCardActive: { backgroundColor: '#D97941', borderColor: '#F2A172' },
  choiceTitle: { color: '#F2E4D4', fontSize: 16, fontWeight: '900' },
  choiceTitleActive: { color: '#0B0503' },
  choiceText: { color: 'rgba(242,228,212,0.56)', fontSize: 12, fontWeight: '700' },
  choiceTextActive: { color: 'rgba(11,5,3,0.72)' },
  avatarContainer: { alignItems: 'center', marginBottom: 20, gap: 6 },
  avatarWrapper: { width: 84, height: 84, borderRadius: 42, position: 'relative' },
  avatarImage: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: '#D97941' },
  avatarPlaceholder: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#1A120D', borderWidth: 1, borderColor: 'rgba(242,228,212,0.1)', justifyContent: 'center', alignItems: 'center' },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#D97941', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0B0503' },
  avatarLabel: { color: 'rgba(242,228,212,0.5)', fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: '#1A120D', color: '#F2E4D4', borderRadius: 12, paddingHorizontal: 15, height: 54, marginBottom: 13, fontSize: 16, borderWidth: 1, borderColor: 'rgba(242,228,212,0.07)' },
  passwordContainer: { flexDirection: 'row', backgroundColor: '#1A120D', borderRadius: 12, marginBottom: 13, borderWidth: 1, borderColor: 'rgba(242,228,212,0.07)', alignItems: 'center', height: 54 },
  inputPassword: { flex: 1, color: '#F2E4D4', paddingHorizontal: 15, fontSize: 16, height: '100%' },
  eyeButton: { paddingHorizontal: 15, justifyContent: 'center', alignItems: 'center', height: '100%' },
  button: { backgroundColor: '#D97941', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#0B0503', fontWeight: '900', fontSize: 16 },
  link: { color: '#F2E4D4', textAlign: 'center', marginTop: 18, fontWeight: '700' },
  linkHighlight: { color: '#D97941', fontWeight: '800' },
  secondaryLink: { color: 'rgba(242,228,212,0.55)', textAlign: 'center', marginTop: 16, fontWeight: '700' },
});
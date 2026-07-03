import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useResponsive } from '@/hooks/useResponsive';
// 💡 Importando os ícones do olhinho
import { Eye, EyeOff } from 'lucide-react-native';
import AppToast, { ToastMessage } from '@/components/AppToast';

async function testInternetConnection(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 400;
  } catch (err) {
    return false;
  }
}

export default function LoginScreen() {
  const { isTablet } = useResponsive();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  // 💡 Novo estado: controla se a senha está oculta (true) ou visível (false)
  const [ocultarSenha, setOcultarSenha] = useState(true);

  function showToast(title: string, message: string, variant: 'success' | 'error' | 'info' = 'info') {
    setToast({ id: Date.now(), title, message, variant });
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      showToast('Campos obrigatórios', 'Preencha o e-mail e a senha.', 'error');
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailValido) {
      showToast('Dados inválidos', 'Informe um e-mail válido.', 'error');
      return;
    }

    setLoading(true);

    const isConnected = await testInternetConnection();
    if (!isConnected) {
      setLoading(false);
      showToast('Sem internet', 'Você precisa estar conectado à internet para logar.', 'error');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      showToast('Login incorreto', 'Confira seu e-mail e senha e tente novamente.', 'error');
      return;
    }

    showToast('Login realizado', 'Entrando no app...', 'success');
    setTimeout(() => router.replace('/(tabs)'), 650);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, isTablet && styles.containerTablet]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppToast toast={toast} onHide={() => setToast(null)} />
      <View style={[styles.card, isTablet && styles.cardTablet]}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Entrar na conta</Text>
        <Text style={styles.subtitle}>Entre para ver sua conta, loja e cardápio.</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="rgba(242,228,212,0.45)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* 💡 Novo Container: Alinha o Input e o Botão do Olhinho lado a lado */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Senha"
            placeholderTextColor="rgba(242,228,212,0.45)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={ocultarSenha} // Vinculado ao nosso estado dinâmico
          />
          <TouchableOpacity 
            style={styles.eyeButton} 
            onPress={() => setOcultarSenha(!ocultarSenha)}
            activeOpacity={0.7}
          >
            {ocultarSenha ? (
              <EyeOff size={20} color="rgba(242,228,212,0.55)" />
            ) : (
              <Eye size={20} color="#D97941" /> // Fica laranja marcante quando exibe a senha
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/cadastro')} activeOpacity={0.75}>
          <Text style={styles.link}>
            Ainda não tenho conta. <Text style={styles.linkHighlight}>Cadastrar</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(tabs)')} activeOpacity={0.75}>
          <Text style={styles.secondaryLink}>Voltar para o app</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0503',
    justifyContent: 'center',
    padding: 24,
  },
  containerTablet: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#130B08',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(242,228,212,0.08)',
    width: '100%',
  },
  cardTablet: {
    width: 480,
  },
  logo: {
    width: 240,
    height: 80,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F2E4D4',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(242,228,212,0.62)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  input: {
    backgroundColor: '#1A120D',
    color: '#F2E4D4',
    borderRadius: 12,
    padding: 15,
    marginBottom: 13,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(242,228,212,0.07)',
  },
  passwordContainer: { // 💡 Envolve o input de senha e o ícone
    flexDirection: 'row',
    backgroundColor: '#1A120D',
    borderRadius: 12,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: 'rgba(242,228,212,0.07)',
    alignItems: 'center',
    height: 54, // Fixed height to prevent circular dependency layout bugs
  },
  inputPassword: { // 💡 Input ocupa quase todo o espaço, deixando a rebarba pro ícone
    flex: 1,
    color: '#F2E4D4',
    paddingHorizontal: 15,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: { // 💡 Centraliza o olhinho perfeitamente na direita
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  button: {
    backgroundColor: '#D97941',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#0B0503', // 💡 Corrigido para combinar com o botão laranja das outras telas
    fontWeight: '900',
    fontSize: 16,
  },
  link: {
    color: '#F2E4D4',
    textAlign: 'center',
    marginTop: 18,
    fontWeight: '700',
  },
  linkHighlight: {
    color: '#D97941',
    fontWeight: '800',
  },
  secondaryLink: {
    color: 'rgba(242,228,212,0.55)',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '700',
  },
});
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassNav from '@/components/GlassNav';
import { Colors } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';


const COLORS = {
  brasa: Colors.dark.tint,

  textPrimary: Colors.dark.text,
  textSecondary: Colors.dark.icon,

  bgDark1: Colors.dark.background,
  bgDark2: '#1A120D',

  carmesin: '#A61B34',
  borgonho: '#6D1A36',
  mogno: '#5B2C1D',
  ferrugem: '#A14A28',
};



const { width } = Dimensions.get('window');

interface Member {
  id: number;
  name: string;
  role: string;
  image: any;
  bio: string;
  github?: string;
  color: string;
}

const members: Member[] = [
  {
    id: 1,
    name: 'Victor Lucena',
    role: 'Designer e Front',
    image: require('../assets/images/victor.png'),
    bio: 'Responsável pelo Desenvolvimento de toda a identidade visual do Na Esquina e o desenvolvimento das telas do Na Esquina.',
    github: 'https://github.com/lucenavicc',
    color: COLORS.carmesin,
  },
  {
    id: 2,
    name: 'Italo romulo',
    role: 'Front developer',
    image: require('../assets/images/italo.png'),
    bio: 'Desenvolveu a estrutura das telas',
    github: 'https://github.com/italoromulo',
    color: COLORS.borgonho,
  },
  {
    id: 3,
    name: 'Luiz',
    role: 'Backend Developer',
    image: require('../assets/images/luiz.png'),
    bio: 'Está na função do desenvolvimento do Back do Na Esquina',
    github: 'https://github.com/luizdiaz1',
    color: COLORS.mogno,
  },
  {
    id: 4,
    name: 'Diogo Bello',
    role: 'Front developer',
    image: require('../assets/images/Diogo.png'),
    bio: 'Desenvolveu e auxiliou na estrutura das telas do Na Esquina',
    github: 'https://github.com/Dioguinto',
    color: COLORS.ferrugem,
  },
  {
    id: 5,
    name: 'Yan Oliveira',
    role: 'Backend Developer',
    image: require('../assets/images/yan.png'),
    bio: 'Responsável pela magia (Backend e Supabase) do projeto Na Esquina',
    github: 'https://github.com/yanosmartins',
    color: COLORS.ferrugem,
  },
  {
    id: 6,
    name: 'Specie',
    role: 'Documentação e front developer',
    image: require('../assets/images/specie.png'),
    bio: 'Estruturou toda a documentação e auxiliou na estrutura das telas do Na Esquina',
    github: 'https://github.com',
    color: COLORS.ferrugem,
  },
];

interface StatItem {
  label: string;
  value: string;
  icon: string;
}

const stats: StatItem[] = [
  { label: 'Membros', value: '6', icon: '👥' },
  { label: 'Commits', value: '120+', icon: '📦' },
  { label: 'Semanas', value: '8', icon: '📅' },
  { label: 'Café', value: '∞', icon: '☕' },
];

function MemberCard({ member, index }: { member: Member; index: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.memberCard, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{ flex: 1 }}
      >
        {/* Accent bar */}
        <View style={[styles.cardAccent, { backgroundColor: member.color }]} />

        <View style={styles.cardContent}>
          {/* Avatar */}
          <View style={[styles.avatar, { borderColor: member.color }]}>
            <Image source={member.image} style={styles.avatarImage} />
          </View>

          {/* Info */}
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <View style={[styles.rolePill, { backgroundColor: `${member.color}30` }]}>
              <Text style={[styles.roleText, { color: member.color }]}>{member.role}</Text>
            </View>
            <Text style={styles.memberBio}>{member.bio}</Text>
          </View>

          {/* Social links */}
          <View style={styles.socialRow}>
            {member.github && (
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => member.github && Linking.openURL(member.github)}
              >
                <FontAwesome name="github" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MembrosScreen() {
  const { isTablet, isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Segunda API Real (Frase de inspiração para a equipe)
  useEffect(() => {
    fetch('https://api.adviceslip.com/advice')
      .then((res) => res.json())
      .then((data) => {
        setAdvice(data.slip.advice);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.bgDark2, COLORS.bgDark1, '#050302']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Glow orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <View style={styles.contentWrapper}>
        <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: (insets.top || 44) + 8, paddingBottom: insets.bottom + 120 },
          ]}
        >
        {/* ── HERO SECTION ── */}
        <View style={styles.hero}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Na Esquina</Text>
          <Text style={styles.appTagline}>Encontre comida perto de você</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>v1.0.0 · Beta</Text>
          </View>
        </View>

        {/* ── ABOUT SECTION ── */}
        <BlurView intensity={60} tint="dark" style={styles.aboutCard} experimentalBlurMethod="dimeaxis">
          <View style={styles.aboutHeader}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.brasa} />
            <Text style={styles.sectionTitle}>Sobre o Projeto</Text>
          </View>
          <Text style={styles.aboutText}>
            O <Text style={styles.highlight}>Na Esquina</Text> é uma plataforma que conecta
            vendedores ambulantes a clientes próximos em tempo real. Desenvolvido por estudantes
            do curso de <Text style={styles.highlight}>Analise e Desenvolvimento de Sistemas</Text> do Centro
            Universitário Augusto Mota Unisuam, sob orientação do <Text style={styles.highlight}>Prof. Marcelo Furtado e Prof. Vinicius Pinto</Text>
          </Text>
          <Text style={[styles.aboutText, { marginTop: 8 }]}>
            Nosso objetivo é dar visibilidade e ferramentas digitais para os vendedores de rua,
            criando uma rede de economia local mais forte e acessível.
          </Text>
        </BlurView>

        {/* ── ADVICE API SECTION ── */}
        <BlurView intensity={60} tint="dark" style={styles.aboutCard} experimentalBlurMethod="dimeaxis">
          <View style={styles.aboutHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.brasa} />
            <Text style={styles.sectionTitle}>Mensagem do Dia (API)</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.brasa} />
          ) : (
            <Text style={[styles.aboutText, { fontStyle: 'italic', color: COLORS.textPrimary }]}>
              "{advice}"
            </Text>
          )}
        </BlurView>

        {/* ── STATS ── */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <BlurView key={stat.label} intensity={50} tint="dark" style={styles.statCard} experimentalBlurMethod="dimeaxis">
              <Text style={styles.statEmoji}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </BlurView>
          ))}
        </View>

        {/* ── TECH STACK ── */}
        <BlurView intensity={60} tint="dark" style={styles.techCard} experimentalBlurMethod="dimeaxis">
          <View style={styles.aboutHeader}>
            <Ionicons name="code-slash-outline" size={20} color={COLORS.brasa} />
            <Text style={styles.sectionTitle}>Stack Tecnológica</Text>
          </View>
          <View style={styles.techGrid}>
            {[
              { label: 'React Native', emoji: '⚛️' },
              { label: 'Expo', emoji: '🔷' },
              { label: 'TypeScript', emoji: '🔵' },
              { label: 'Zustand', emoji: '🐻' },
              { label: 'TanStack Query', emoji: '🔄' },
              { label: 'Firebase', emoji: '🔥' },
              { label: 'Expo Go', emoji: '📱' },
              { label: 'MySql', emoji: '🎲' },
            ].map((tech) => (
              <View key={tech.label} style={styles.techPill}>
                <Text style={styles.techEmoji}>{tech.emoji}</Text>
                <Text style={styles.techLabel}>{tech.label}</Text>
              </View>
            ))}
          </View>
        </BlurView>

        {/* ── TEAM SECTION ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="people-outline" size={20} color={COLORS.brasa} />
          <Text style={styles.sectionTitle}>Nossa Equipe</Text>
        </View>

        <View style={isTablet ? styles.membersGrid : undefined}>
          {members.map((member, index) => (
            <View key={member.id} style={isTablet ? { width: isDesktop ? '31%' : '48%', marginBottom: 16 } : undefined}>
              <MemberCard member={member} index={index} />
            </View>
          ))}
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Todos os direitos reservados. Na Esquina © 2026
          </Text>
          <Text style={styles.footerSubText}>Unisuam</Text>
        </View>
        </Animated.ScrollView>
        <GlassNav scrollY={scrollY} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0503',
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    position: 'relative',
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },

  // Decorative orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 260,
    height: 260,
    top: -60,
    right: -80,
    backgroundColor: 'rgba(166, 3, 33, 0.12)',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 200,
    left: -80,
    backgroundColor: 'rgba(217, 121, 65, 0.08)',
  },

  // ── HERO ──
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  logoImage: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 1,
    alignSelf: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  versionPill: {
    marginTop: 4,
    backgroundColor: 'rgba(217, 121, 65, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(217, 121, 65, 0.35)',
  },
  versionText: {
    fontSize: 12,
    color: COLORS.brasa,
    fontWeight: '600',
  },

  // ── ABOUT ──
  aboutCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
    gap: 10,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  aboutText: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  highlight: {
    color: COLORS.brasa,
    fontWeight: '600',
  },

  // ── STATS ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
    gap: 4,
  },
  statEmoji: {
    fontSize: 22,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ── TECH STACK ──
  techCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
    gap: 14,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 228, 212, 0.04)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
  },
  techEmoji: {
    fontSize: 14,
  },
  techLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // ── MEMBER CARD ──
  memberCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(242, 228, 212, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
    overflow: 'hidden',
  },
  cardAccent: {
    height: 3,
    width: '100%',
  },
  cardContent: {
    padding: 18,
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(18,8,6,0.8)',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  memberInfo: {
    gap: 6,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rolePill: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  memberBio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(242, 228, 212, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(242, 228, 212, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── FOOTER ──
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footerSubText: {
    fontSize: 11,
    color: `${COLORS.textSecondary}80`,
  },
});
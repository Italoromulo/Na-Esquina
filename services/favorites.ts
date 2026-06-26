import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

const STORAGE_KEY = '@na_esquina_favorites';

// Memory fallback for native if localStorage is not available
let memoryFavorites: string[] = [];

export const favoritesService = {
  async getFavorites(): Promise<string[]> {
    try {
      // 1. Pega a sessão do usuário ativo no Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // 2. Busca na tabela de favoritos filtrando pelo ID do usuário
      const { data, error } = await supabase
        .from('favoritos')
        .select('restaurante_id')
        .eq('usuario_id', session.user.id);

      if (error) throw error;

      // 3. Mapeia e transforma os IDs numéricos em String para bater com o estado do React
      return data ? data.map(fav => String(fav.restaurante_id)) : [];
    } catch (e) {
      console.warn("Erro ao ler favoritos do Supabase:", e);
      return [];
    }
  },

  async saveFavorites(favorites: string[]): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } else {
        memoryFavorites = favorites;
      }
    } catch (e) {
      console.warn('Error saving favorites', e);
      memoryFavorites = favorites;
    }
  },

  async isFavorite(id: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.includes(id);
  },

  async toggleFavorite(id: any): Promise<boolean> {
    try {
      // 1. Pega a sessão do usuário ativo no Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const userId = String(session.user.id);
      const restauranteIdNumero = parseInt(String(id), 10);

      // 2. Consulta o banco na hora para saber se a linha real existe
      const { data: jaExiste, error: searchError } = await supabase
        .from('favoritos')
        .select('id')
        .eq('usuario_id', userId)
        .eq('restaurante_id', restauranteIdNumero)
        .maybeSingle();

      if (searchError) {
        console.error('Erro ao checar existência no banco:', searchError);
        return false;
      }

      if (jaExiste) {
        // 3. Se a linha já existe no banco físico, deleta ela
        const { error: deleteError } = await supabase
          .from('favoritos')
          .delete()
          .eq('id', jaExiste.id);

        if (deleteError) {
          console.error('Erro detalhado do Supabase no DELETE:', deleteError);
          return false;
        }
      } else {
        // 4. Se não existe no banco, insere
        const { error: insertError } = await supabase
          .from('favoritos')
          .insert({
            usuario_id: userId,
            restaurante_id: restauranteIdNumero
          });

        if (insertError) {
          console.error('Erro detalhado do Supabase no INSERT:', insertError);
          return false;
        }
      }

      // 5. Sincroniza o serviço local para atualizar o coraçãozinho na tela na hora
      this.notifyListeners();
      return true;
    } catch (err) {
      console.error('Erro crítico na execução do toggleFavorite:', err);
      return false;
    }
  },

  // Simple event system to notify components when favorites change
  listeners: new Set<() => void>(),

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },

  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error(e);
      }
    });
  }
};

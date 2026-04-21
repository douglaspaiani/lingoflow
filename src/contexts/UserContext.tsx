"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AppData, ConquistaDesbloqueada } from '../types';

interface UserContextType {
  currentUser: User | null;
  data: AppData | null;
  conquistaEmDestaque: ConquistaDesbloqueada | null;
  refreshData: () => Promise<void>;
  updateProgress: (
    xpToAdd: number,
    lessonId?: string,
    estatisticasDesempenho?: { acertos?: number; erros?: number }
  ) => Promise<void>;
  registrarConquistasDesbloqueadas: (conquistas: ConquistaDesbloqueada[]) => void;
  dispensarConquistaEmDestaque: () => void;
  logout: (redirectPath?: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filaConquistasDesbloqueadas, setFilaConquistasDesbloqueadas] = useState<ConquistaDesbloqueada[]>([]);
  const [conquistaEmDestaque, setConquistaEmDestaque] = useState<ConquistaDesbloqueada | null>(null);

  const registrarConquistasDesbloqueadas = (conquistas: ConquistaDesbloqueada[]) => {
    if (!Array.isArray(conquistas) || conquistas.length === 0) return;

    setFilaConquistasDesbloqueadas((filaAtual) => {
      const idsJaNaFila = new Set(filaAtual.map((conquista) => conquista.conquistaId));
      if (conquistaEmDestaque?.conquistaId) {
        idsJaNaFila.add(conquistaEmDestaque.conquistaId);
      }

      const novasConquistas = conquistas.filter((conquista) => {
        const idValido = typeof conquista?.conquistaId === 'string' && conquista.conquistaId.length > 0;
        if (!idValido) return false;
        if (idsJaNaFila.has(conquista.conquistaId)) return false;
        idsJaNaFila.add(conquista.conquistaId);
        return true;
      });

      return [...filaAtual, ...novasConquistas];
    });
  };

  const dispensarConquistaEmDestaque = () => {
    setConquistaEmDestaque(null);
  };

  useEffect(() => {
    if (conquistaEmDestaque || filaConquistasDesbloqueadas.length === 0) return;
    const [proximaConquista, ...restante] = filaConquistasDesbloqueadas;
    setConquistaEmDestaque(proximaConquista);
    setFilaConquistasDesbloqueadas(restante);
  }, [filaConquistasDesbloqueadas, conquistaEmDestaque]);

  const refreshData = async () => {
    try {
      // Fetch Global Data
      const res = await fetch('/api/data', { cache: 'no-store' });
      const d = await res.json();
      setData(d);

      // Fetch Logged-in User
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (meRes.ok) {
        const corpoResposta = await meRes.json();
        const user = corpoResposta?.user as User | null;
        const novasConquistas = Array.isArray(corpoResposta?.novasConquistasDesbloqueadas)
          ? corpoResposta.novasConquistasDesbloqueadas
          : [];

        setCurrentUser(user || null);
        registrarConquistasDesbloqueadas(novasConquistas);
        
        // Sync theme with database preference
        if (user?.theme && typeof window !== 'undefined') {
          const currentTheme = localStorage.getItem('theme');
          if (currentTheme !== user.theme) {
            localStorage.setItem('theme', user.theme);
            if (user.theme === 'dark') {
              window.document.documentElement.classList.add('dark');
            } else {
              window.document.documentElement.classList.remove('dark');
            }
            // Trigger a re-render by dispatching an event if necessary, or just rely on layout
            window.dispatchEvent(new Event('storage'));
          }
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const logout = async (redirectPath = '/login') => {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_session');
    }
    setCurrentUser(null);
    setData(null);
    setConquistaEmDestaque(null);
    setFilaConquistasDesbloqueadas([]);
    window.location.href = redirectPath;
  };

  const updateProgress = async (
    xpToAdd: number,
    lessonId?: string,
    estatisticasDesempenho?: { acertos?: number; erros?: number }
  ) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xpToAdd,
          lessonId,
          acertos: estatisticasDesempenho?.acertos ?? 0,
          erros: estatisticasDesempenho?.erros ?? 0
        })
      });
      if (res.ok) {
        const corpoResposta = await res.json();
        const usuarioAtualizado = corpoResposta?.user ?? corpoResposta;
        const novasConquistas = Array.isArray(corpoResposta?.novasConquistasDesbloqueadas)
          ? corpoResposta.novasConquistasDesbloqueadas
          : [];

        setCurrentUser(usuarioAtualizado);
        registrarConquistasDesbloqueadas(novasConquistas);
        
        // Refresh global data silently
        fetch('/api/data', { cache: 'no-store' }).then(r => r.json()).then(setData);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar progresso');
      }
    } catch (err) {
      const mensagemErro = err instanceof Error ? err.message.toLowerCase() : '';
      const erroEsperadoDeEnergia = mensagemErro.includes('sem energia suficiente');
      if (!erroEsperadoDeEnergia) {
        console.error(err);
      }
      throw err;
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        data,
        conquistaEmDestaque,
        refreshData,
        updateProgress,
        registrarConquistasDesbloqueadas,
        dispensarConquistaEmDestaque,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

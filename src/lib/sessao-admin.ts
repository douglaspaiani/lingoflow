import { User } from '@/types';

type SessaoAdminLocal = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

export const obterSessaoAdminLocal = (): SessaoAdminLocal | null => {
  if (typeof window === 'undefined') return null;

  const sessaoAdminSalva = localStorage.getItem('admin_session');
  if (!sessaoAdminSalva || sessaoAdminSalva === 'undefined') return null;

  try {
    const sessao = JSON.parse(sessaoAdminSalva) as SessaoAdminLocal;
    if (!sessao?.id || sessao.role !== 'ADMIN') return null;
    return sessao;
  } catch {
    return null;
  }
};

export const montarUsuarioAdminVirtual = (sessaoAdmin: SessaoAdminLocal): User => ({
  id: `admin-${sessaoAdmin.id}`,
  name: sessaoAdmin.name || 'Administrador',
  username: 'admin',
  role: 'ADMIN',
  points: 0,
  streak: 0,
  level: 0,
  xp: 0,
  energy: 0,
  completedLessons: [],
  following: [],
  followers: [],
  classRoomId: null,
  avatar: '',
  coverPhoto: '',
});

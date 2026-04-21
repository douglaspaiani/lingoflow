"use client";
import Link from 'next/link';
import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, LineChart, Layout, Save, Sparkles, User as UserIcon, 
  Star, Settings, LogOut, ChevronRight, BookOpen, Layers, Edit3, 
  CheckCircle2, XCircle, ShieldCheck, Mail, Lock, Flame, Search,
  ArrowLeft, AlertTriangle, X, Users, Presentation, Check, Hash, Zap, Moon, Sun, Edit2, ChevronsUpDown, LifeBuoy, ChevronDown, GraduationCap, Phone, ImagePlus, RotateCcw, RotateCw, Gamepad2, Upload,
  Trophy, Award, Crown, Medal, Target, Rocket, Gem, Heart
} from 'lucide-react';
import { useTheme } from '@/components/Providers';
import { Level, AppData, Exercise, User, Lesson, AdminUser, Room, Professor, JogoFaseImagem, Conquista, TipoRequisitoConquista } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import {
  CORES_PREDEFINIDAS_CONQUISTA,
  ICONES_CONQUISTA_DISPONIVEIS,
  OPCOES_TIPO_REQUISITO_CONQUISTA
} from '@/lib/conquistas-config';

type AdminTab = 'dashboard' | 'profile' | 'content' | 'achievements' | 'users' | 'rooms' | 'playground' | 'teachers' | 'admins' | 'energy';
type AdminSubview = 'list' | 'add' | 'edit';
type ProfessorSubview = 'list' | 'add' | 'edit';
type ConquistaSubview = 'list' | 'add' | 'edit';
type RequisitoConquistaFormulario = {
  id: string;
  tipo: TipoRequisitoConquista;
  valorMinimo: number;
};
type FormularioConquista = {
  id?: string;
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  ativa: boolean;
  requisitos: RequisitoConquistaFormulario[];
};
type FormularioEdicaoAluno = {
  id: string;
  nome: string;
  usuario: string;
  turmaId: string;
  novaSenha: string;
};
type FormularioProfessor = {
  nome: string;
  usuario: string;
  email: string;
  telefone: string;
  foto: string;
  senha: string;
  turmaIds: string[];
};
type SubAbaPlayground = 'lista' | 'gerenciar';
type JogoPlaygroundDisponivel = {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  totalFases: number;
};
type FasePlaygroundFormulario = {
  id: string;
  nivel: number;
  ordem: number;
  imagem: string;
  traducaoCorreta: string;
  ativo: boolean;
};
type RegistroHistoricoRelatorioAluno = {
  id: string;
  origem: 'APP_PRINCIPAL' | 'JOGO_EXTRA' | string;
  jogo: string;
  acertos: number;
  erros: number;
  porcentagemAcerto: number;
  horario: string;
  lessonId?: string | null;
  sessaoJogoId?: string | null;
};
type DadosRelatorioAlunoAdmin = {
  aluno: {
    id: string;
    nome: string;
    usuario: string;
    avatar?: string;
  };
  resumo: {
    totalAcertos: number;
    totalErros: number;
    totalRespostas: number;
    porcentagemTotal: number;
    totalRegistros: number;
  };
  historico: RegistroHistoricoRelatorioAluno[];
};

const TAB_LABELS: Record<AdminTab, string> = {
  dashboard: 'Dashboard',
  profile: 'Meu Perfil',
  content: 'Conteúdo',
  achievements: 'Conquistas',
  users: 'Alunos',
  rooms: 'Turmas',
  playground: 'Playground',
  teachers: 'Professores',
  admins: 'Administradores',
  energy: 'Energia'
};

const MAPA_ICONES_CONQUISTA_ADMIN = {
  Trophy,
  Star,
  Flame,
  Award,
  Crown,
  Medal,
  Target,
  Rocket,
  Zap,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Users,
  Gem,
  Heart
};

function gerarIdTemporarioConquista() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function criarFormularioConquistaVazio(): FormularioConquista {
  return {
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    icone: 'Trophy',
    ativa: true,
    requisitos: [
      {
        id: gerarIdTemporarioConquista(),
        tipo: 'LICOES_CONCLUIDAS',
        valorMinimo: 1
      }
    ]
  };
}

export default function Admin() {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [entrandoAdmin, setEntrandoAdmin] = useState(false);
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Admin section subviews
  const [adminSubview, setAdminSubview] = useState<AdminSubview>('list');
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [adminFormError, setAdminFormError] = useState('');
  const [salvandoFormularioAdmin, setSalvandoFormularioAdmin] = useState(false);
  const [professorSubview, setProfessorSubview] = useState<ProfessorSubview>('list');
  const [professorEmEdicao, setProfessorEmEdicao] = useState<Professor | null>(null);
  const [conquistaSubview, setConquistaSubview] = useState<ConquistaSubview>('list');
  const [conquistaEmEdicao, setConquistaEmEdicao] = useState<Conquista | null>(null);
  const [deleteConquistaId, setDeleteConquistaId] = useState<string | null>(null);
  const [formularioConquista, setFormularioConquista] = useState<FormularioConquista>(criarFormularioConquistaVazio());
  const [erroFormularioConquista, setErroFormularioConquista] = useState('');
  const [salvandoConquista, setSalvandoConquista] = useState(false);
  const [formularioProfessor, setFormularioProfessor] = useState<FormularioProfessor>({
    nome: '',
    usuario: '',
    email: '',
    telefone: '',
    foto: '',
    senha: '',
    turmaIds: []
  });
  const [erroFormularioProfessor, setErroFormularioProfessor] = useState('');
  const [salvandoProfessor, setSalvandoProfessor] = useState(false);
  const [formularioMeuPerfilAdmin, setFormularioMeuPerfilAdmin] = useState({
    nome: '',
    email: '',
    novaSenha: '',
    confirmarNovaSenha: ''
  });
  const [salvandoMeuPerfilAdmin, setSalvandoMeuPerfilAdmin] = useState(false);
  const [erroMeuPerfilAdmin, setErroMeuPerfilAdmin] = useState('');
  const [sucessoMeuPerfilAdmin, setSucessoMeuPerfilAdmin] = useState('');
  const [deleteProfessorId, setDeleteProfessorId] = useState<string | null>(null);
  const [buscaTurmaProfessor, setBuscaTurmaProfessor] = useState('');
  const [modalRecorteFotoProfessorAberto, setModalRecorteFotoProfessorAberto] = useState(false);
  const [fotoProfessorOriginal, setFotoProfessorOriginal] = useState('');
  const [larguraFotoProfessorOriginal, setLarguraFotoProfessorOriginal] = useState(0);
  const [alturaFotoProfessorOriginal, setAlturaFotoProfessorOriginal] = useState(0);
  const [zoomRecorteFotoProfessor, setZoomRecorteFotoProfessor] = useState(1);
  const [deslocamentoXRecorteFotoProfessor, setDeslocamentoXRecorteFotoProfessor] = useState(0);
  const [deslocamentoYRecorteFotoProfessor, setDeslocamentoYRecorteFotoProfessor] = useState(0);
  const [rotacaoRecorteFotoProfessor, setRotacaoRecorteFotoProfessor] = useState(0);
  const [erroFotoProfessor, setErroFotoProfessor] = useState('');
  const [gerandoFotoProfessorRecortada, setGerandoFotoProfessorRecortada] = useState(false);
  const [fasesPlaygroundImagem, setFasesPlaygroundImagem] = useState<FasePlaygroundFormulario[]>([]);
  const [subAbaPlayground, setSubAbaPlayground] = useState<SubAbaPlayground>('lista');
  const [jogosPlaygroundDisponiveis, setJogosPlaygroundDisponiveis] = useState<JogoPlaygroundDisponivel[]>([]);
  const [jogoPlaygroundSelecionado, setJogoPlaygroundSelecionado] = useState<JogoPlaygroundDisponivel | null>(null);
  const [nivelPlaygroundSelecionado, setNivelPlaygroundSelecionado] = useState(1);
  const [carregandoPlayground, setCarregandoPlayground] = useState(false);
  const [salvandoPlayground, setSalvandoPlayground] = useState(false);
  const [erroPlayground, setErroPlayground] = useState('');
  const [sucessoPlayground, setSucessoPlayground] = useState('');
  const [idFaseSelecionadaParaUploadImagem, setIdFaseSelecionadaParaUploadImagem] = useState<string | null>(null);

  // Content state
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Turmas state
  const [isManagingStudents, setIsManagingStudents] = useState<string | null>(null); // roomId
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentsForRoom, setSelectedStudentsForRoom] = useState<string[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState<Room | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [novoNivelTurma, setNovoNivelTurma] = useState(1);
  const [hoveredRoomCode, setHoveredRoomCode] = useState<string | null>(null);
  const [alunoEmEdicao, setAlunoEmEdicao] = useState<User | null>(null);
  const [formularioAluno, setFormularioAluno] = useState<FormularioEdicaoAluno | null>(null);
  const [erroEdicaoAluno, setErroEdicaoAluno] = useState('');
  const [salvandoAluno, setSalvandoAluno] = useState(false);
  const [modalRelatorioAlunoAberto, setModalRelatorioAlunoAberto] = useState(false);
  const [carregandoRelatorioAluno, setCarregandoRelatorioAluno] = useState(false);
  const [erroRelatorioAluno, setErroRelatorioAluno] = useState('');
  const [dadosRelatorioAluno, setDadosRelatorioAluno] = useState<DadosRelatorioAlunoAdmin | null>(null);
  const [salvandoTurmaAlunos, setSalvandoTurmaAlunos] = useState(false);
  const [salvandoModalTurma, setSalvandoModalTurma] = useState(false);
  const [buscaTurma, setBuscaTurma] = useState('');
  const [buscaNomeTurmaEnergia, setBuscaNomeTurmaEnergia] = useState('');
  const [seletorTurmaAberto, setSeletorTurmaAberto] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [suporteAberto, setSuporteAberto] = useState(false);
  const areaMenuUsuarioRef = useRef<HTMLDivElement | null>(null);
  const areaSuporteRef = useRef<HTMLDivElement | null>(null);
  const inputArquivoFotoProfessorRef = useRef<HTMLInputElement | null>(null);
  const inputArquivoImagemFasePlaygroundRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchData();
    const savedAdmin = localStorage.getItem('admin_session');
    if (savedAdmin && savedAdmin !== 'undefined') {
      try {
        setAdminUser(JSON.parse(savedAdmin));
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Invalid admin session data");
        localStorage.removeItem('admin_session');
      }
    }
    setIsCheckingSession(false);
  }, []);

  useEffect(() => {
    const fecharMenusAoClicarFora = (evento: MouseEvent) => {
      const alvo = evento.target as Node;

      if (areaMenuUsuarioRef.current && !areaMenuUsuarioRef.current.contains(alvo)) {
        setMenuUsuarioAberto(false);
      }

      if (areaSuporteRef.current && !areaSuporteRef.current.contains(alvo)) {
        setSuporteAberto(false);
      }
    };

    document.addEventListener('mousedown', fecharMenusAoClicarFora);
    return () => document.removeEventListener('mousedown', fecharMenusAoClicarFora);
  }, []);

  const fetchData = async () => {
    try {
      const resposta = await fetch('/api/data', { cache: 'no-store' });
      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        console.error('Erro ao buscar /api/data:', dados);
        return;
      }

      setData(dados);
    } catch (erro) {
      console.error('Falha de conexão ao buscar /api/data:', erro);
    }
  };

  const buscarDadosPlaygroundAdmin = async () => {
    setCarregandoPlayground(true);
    try {
      const resposta = await fetch('/api/playground/admin/traduzir-imagem', { cache: 'no-store' });
      if (!resposta.ok) {
        const dadosErro = await resposta.json().catch(() => null);
        setErroPlayground(dadosErro?.error || 'Não foi possível carregar os dados do Playground.');
        setJogosPlaygroundDisponiveis([]);
        return;
      }

      const dados = await resposta.json();
      const jogoRecebido = dados?.jogo;
      const fasesRecebidas = Array.isArray(dados?.jogo?.fasesImagem) ? dados.jogo.fasesImagem : [];
      setFasesPlaygroundImagem(
        fasesRecebidas.map((fase: JogoFaseImagem) => ({
          id: fase.id,
          nivel: Number(fase.nivel) || 1,
          ordem: Number(fase.ordem) || 0,
          imagem: fase.imagem || '',
          traducaoCorreta: fase.traducaoCorreta || '',
          ativo: fase.ativo !== false
        }))
      );

      if (jogoRecebido && typeof jogoRecebido.id === 'string') {
        const jogoDisponivel: JogoPlaygroundDisponivel = {
          id: jogoRecebido.id,
          slug: typeof jogoRecebido.slug === 'string' ? jogoRecebido.slug : 'traduzir-imagem',
          nome: typeof jogoRecebido.nome === 'string' ? jogoRecebido.nome : 'Traduza a Imagem',
          descricao: typeof jogoRecebido.descricao === 'string' && jogoRecebido.descricao.trim().length > 0
            ? jogoRecebido.descricao.trim()
            : 'Jogo de tradução com imagens por fase e nível.',
          ativo: jogoRecebido.ativo !== false,
          totalFases: fasesRecebidas.length
        };

        setJogosPlaygroundDisponiveis([jogoDisponivel]);
        setJogoPlaygroundSelecionado((estadoAtual) => {
          if (!estadoAtual) return estadoAtual;
          if (estadoAtual.id !== jogoDisponivel.id) return estadoAtual;
          return jogoDisponivel;
        });
      } else {
        setJogosPlaygroundDisponiveis([]);
      }

      setErroPlayground('');
    } catch (erro) {
      console.error(erro);
      setErroPlayground('Erro de conexão ao carregar Playground.');
      setJogosPlaygroundDisponiveis([]);
    } finally {
      setCarregandoPlayground(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    buscarDadosPlaygroundAdmin();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'playground') return;
    if (jogosPlaygroundDisponiveis.length > 0 || carregandoPlayground) return;
    buscarDadosPlaygroundAdmin();
  }, [activeTab, isLoggedIn, jogosPlaygroundDisponiveis.length, carregandoPlayground]);

  const abrirGerenciamentoJogoPlayground = async (jogo: JogoPlaygroundDisponivel) => {
    setJogoPlaygroundSelecionado(jogo);
    setSubAbaPlayground('gerenciar');
    await buscarDadosPlaygroundAdmin();
  };

  const voltarParaListaJogosPlayground = () => {
    setSubAbaPlayground('lista');
    setErroPlayground('');
    setSucessoPlayground('');
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (entrandoAdmin) return;
    setLoginError('');
    setEntrandoAdmin(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res.ok) {
        const result = await res.json();
        setAdminUser(result.user);
        setIsLoggedIn(true);
        localStorage.setItem('admin_session', JSON.stringify(result.user));
      } else {
        setLoginError('Acesso negado. Verifique email e senha.');
      }
    } catch (err) {
      setLoginError('Erro de conexão ao servidor.');
    } finally {
      setEntrandoAdmin(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('admin_session');
    setIsLoggedIn(false);
    setAdminUser(null);
    window.location.href = '/admin';
  };

  const syncContent = async (updatedLevels: Level[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levels: updatedLevels })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const syncUsers = async (updatedUsers: User[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/update-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: updatedUsers })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const syncRooms = async (updatedRooms: Room[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/update-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms: updatedRooms })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const syncSettings = async (updatedSettings: any) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnergyCombo = async (roomId: string, amount: number) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/energy-combo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, amount })
      });
      if (res.ok) {
        fetchData();
        alert(`Bônus de +${amount} de energia aplicado com sucesso para a turma!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!adminUser) return;

    const administradorAtual =
      data?.admins?.find((administrador) => administrador.id === adminUser.id) || adminUser;

    setFormularioMeuPerfilAdmin((estadoAtual) => ({
      ...estadoAtual,
      nome: administradorAtual.name || '',
      email: administradorAtual.email || ''
    }));
  }, [adminUser, data?.admins]);

  const salvarMeuPerfilAdministrador = async () => {
    const nomeLimpo = formularioMeuPerfilAdmin.nome.trim();
    const emailLimpo = formularioMeuPerfilAdmin.email.trim().toLowerCase();
    const novaSenhaLimpa = formularioMeuPerfilAdmin.novaSenha.trim();
    const confirmarNovaSenhaLimpa = formularioMeuPerfilAdmin.confirmarNovaSenha.trim();

    setErroMeuPerfilAdmin('');
    setSucessoMeuPerfilAdmin('');

    if (!nomeLimpo || !emailLimpo) {
      setErroMeuPerfilAdmin('Nome e e-mail são obrigatórios.');
      return;
    }

    if (novaSenhaLimpa.length > 0 && novaSenhaLimpa.length < 6) {
      setErroMeuPerfilAdmin('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }

    if (novaSenhaLimpa !== confirmarNovaSenhaLimpa) {
      setErroMeuPerfilAdmin('A confirmação de senha não confere.');
      return;
    }

    setSalvandoMeuPerfilAdmin(true);
    setIsSaving(true);
    try {
      const resposta = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nomeLimpo,
          email: emailLimpo,
          password: novaSenhaLimpa
        })
      });

      const dadosResposta = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErroMeuPerfilAdmin(dadosResposta?.error || 'Não foi possível salvar seu perfil.');
        return;
      }

      const usuarioAtualizado = dadosResposta?.admin;
      if (usuarioAtualizado?.id) {
        setAdminUser((estadoAtual) => (estadoAtual ? { ...estadoAtual, ...usuarioAtualizado } : usuarioAtualizado));
        localStorage.setItem('admin_session', JSON.stringify({ ...adminUser, ...usuarioAtualizado }));
      }

      setFormularioMeuPerfilAdmin((estadoAtual) => ({
        ...estadoAtual,
        novaSenha: '',
        confirmarNovaSenha: ''
      }));
      setSucessoMeuPerfilAdmin('Perfil atualizado com sucesso.');
      await fetchData();
    } catch (erro) {
      console.error(erro);
      setErroMeuPerfilAdmin('Erro de conexão ao salvar seu perfil.');
    } finally {
      setSalvandoMeuPerfilAdmin(false);
      setIsSaving(false);
    }
  };

  if (isCheckingSession) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-20 w-20 rounded-3xl flex items-center justify-center overflow-hidden p-2 shadow-xl">
                <img src="/images/logo.png" alt="Logotipo do sistema" className="w-full h-full object-contain" />
              </div>
              <span
                className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-500 tracking-tight pb-1"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                lingoflow
              </span>
            </div>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Administração do Sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                  placeholder="admin@app.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {loginError && (
              <p className="text-red-500 text-xs font-black uppercase text-center">{loginError}</p>
            )}

            <button 
              type="submit"
              disabled={entrandoAdmin}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black py-5 rounded-3xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {entrandoAdmin && <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {entrandoAdmin ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const levels = data?.levels || [];
  const users = data?.users || [];
  const conquistas = data?.conquistas || [];
  const admins = data?.admins || [];
  const professores = data?.teachers || [];
  const rooms = data?.rooms || [];
  const turmasFiltradasBonificacaoEnergia = rooms.filter((turma) =>
    turma.name.toLowerCase().includes(buscaNomeTurmaEnergia.trim().toLowerCase())
  );
  const nomeUsuarioLogado = adminUser?.name || 'Usuário';
  const cargoUsuarioLogado = adminUser?.role === 'ADMIN' ? 'Administrador' : 'Usuário';
  const linkWhatsSuporte = 'https://wa.me/5551994727036';

  const obterRotuloTipoRequisitoConquista = (tipo: TipoRequisitoConquista) => {
    return (
      OPCOES_TIPO_REQUISITO_CONQUISTA.find((opcao) => opcao.tipo === tipo)?.titulo ||
      tipo
    );
  };

  const obterDescricaoTipoRequisitoConquista = (tipo: TipoRequisitoConquista) => {
    return (
      OPCOES_TIPO_REQUISITO_CONQUISTA.find((opcao) => opcao.tipo === tipo)?.descricao ||
      'Requisito configurável da conquista.'
    );
  };

  const obterIconeConquistaNoAdmin = (icone: string) => {
    return MAPA_ICONES_CONQUISTA_ADMIN[icone as keyof typeof MAPA_ICONES_CONQUISTA_ADMIN] || Trophy;
  };

  const normalizarUsuario = (valor: string) => {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
  };

  const formatarTelefoneProfessor = (valor: string) => {
    const apenasDigitos = valor.replace(/\D/g, '').slice(0, 11);

    if (apenasDigitos.length === 0) return '';
    if (apenasDigitos.length <= 2) return `(${apenasDigitos}`;

    const ddd = apenasDigitos.slice(0, 2);
    const numeroSemDdd = apenasDigitos.slice(2);

    if (apenasDigitos.length <= 6) {
      return `(${ddd}) ${numeroSemDdd}`;
    }

    if (apenasDigitos.length <= 10) {
      const primeiraParte = numeroSemDdd.slice(0, 4);
      const segundaParte = numeroSemDdd.slice(4);
      return segundaParte ? `(${ddd}) ${primeiraParte}-${segundaParte}` : `(${ddd}) ${primeiraParte}`;
    }

    const primeiraParteCelular = numeroSemDdd.slice(0, 5);
    const segundaParteCelular = numeroSemDdd.slice(5);
    return segundaParteCelular
      ? `(${ddd}) ${primeiraParteCelular}-${segundaParteCelular}`
      : `(${ddd}) ${primeiraParteCelular}`;
  };

  const formatarOrigemResultadoRelatorio = (origem: string) => {
    if (origem === 'APP_PRINCIPAL') return 'Atividade';
    if (origem === 'JOGO_EXTRA') return 'Jogo extra';
    return origem || 'Não informado';
  };

  const formatarHorarioResultadoRelatorio = (horarioIso: string) => {
    if (!horarioIso) return '-';
    const dataHorario = new Date(horarioIso);
    if (Number.isNaN(dataHorario.getTime())) return '-';
    return dataHorario.toLocaleString('pt-BR');
  };

  const obterTurmaDoAluno = (idAluno: string) => {
    return rooms.find((turma) => turma.studentIds.includes(idAluno));
  };

  const abrirRelatorioAluno = async (aluno: User) => {
    setModalRelatorioAlunoAberto(true);
    setCarregandoRelatorioAluno(true);
    setErroRelatorioAluno('');
    setDadosRelatorioAluno(null);
    try {
      const resposta = await fetch(`/api/admin/alunos/${aluno.id}/relatorio`, { cache: 'no-store' });
      const dados = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErroRelatorioAluno(dados?.error || 'Não foi possível carregar o relatório do aluno.');
        return;
      }
      setDadosRelatorioAluno(dados);
    } catch (erro) {
      console.error(erro);
      setErroRelatorioAluno('Erro de conexão ao carregar o relatório do aluno.');
    } finally {
      setCarregandoRelatorioAluno(false);
    }
  };

  const fecharRelatorioAluno = () => {
    setModalRelatorioAlunoAberto(false);
    setCarregandoRelatorioAluno(false);
    setErroRelatorioAluno('');
    setDadosRelatorioAluno(null);
  };

  const abrirEdicaoAluno = (aluno: User) => {
    const turmaAtual = aluno.classRoomId || obterTurmaDoAluno(aluno.id)?.id || '';
    setAlunoEmEdicao(aluno);
    setFormularioAluno({
      id: aluno.id,
      nome: aluno.name,
      usuario: aluno.username,
      turmaId: turmaAtual,
      novaSenha: ''
    });
    setErroEdicaoAluno('');
    setBuscaTurma('');
    setSeletorTurmaAberto(false);
  };

  const fecharEdicaoAluno = () => {
    setAlunoEmEdicao(null);
    setFormularioAluno(null);
    setErroEdicaoAluno('');
    setBuscaTurma('');
    setSeletorTurmaAberto(false);
  };

  const salvarEdicaoAluno = async () => {
    if (!formularioAluno) return;

    const nomeLimpo = formularioAluno.nome.trim();
    const usuarioLimpo = normalizarUsuario(formularioAluno.usuario.trim());

    if (!nomeLimpo || !usuarioLimpo) {
      setErroEdicaoAluno('Nome e usuário são obrigatórios.');
      return;
    }

    setSalvandoAluno(true);
    setIsSaving(true);
    try {
      // Atualização centralizada da conta do aluno, incluindo turma e senha opcional.
      const resposta = await fetch('/api/admin/update-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formularioAluno.id,
          name: nomeLimpo,
          username: usuarioLimpo,
          classRoomId: formularioAluno.turmaId || null,
          password: formularioAluno.novaSenha.trim()
        })
      });

      if (!resposta.ok) {
        const dadosErro = await resposta.json().catch(() => null);
        setErroEdicaoAluno(dadosErro?.error || 'Não foi possível salvar as alterações.');
        return;
      }

      await fetchData();
      fecharEdicaoAluno();
    } catch (erro) {
      console.error(erro);
      setErroEdicaoAluno('Erro de conexão ao salvar o aluno.');
    } finally {
      setSalvandoAluno(false);
      setIsSaving(false);
    }
  };

  const turmasFiltradas = rooms.filter((turma) =>
    turma.name.toLowerCase().includes(buscaTurma.toLowerCase())
  );
  const turmaSelecionadaNoFormulario = rooms.find(
    (turma) => turma.id === formularioAluno?.turmaId
  );
  const TAMANHO_PREVIEW_RECORTE_FOTO = 320;
  const TAMANHO_SAIDA_RECORTE_FOTO = 512;
  const escalaBasePreviewFotoProfessor = larguraFotoProfessorOriginal > 0 && alturaFotoProfessorOriginal > 0
    ? Math.max(TAMANHO_PREVIEW_RECORTE_FOTO / larguraFotoProfessorOriginal, TAMANHO_PREVIEW_RECORTE_FOTO / alturaFotoProfessorOriginal)
    : 1;
  const larguraPreviewFotoProfessor = larguraFotoProfessorOriginal * escalaBasePreviewFotoProfessor * zoomRecorteFotoProfessor;
  const alturaPreviewFotoProfessor = alturaFotoProfessorOriginal * escalaBasePreviewFotoProfessor * zoomRecorteFotoProfessor;

  const abrirModalRecorteFotoProfessor = (fotoBase64: string) => {
    const imagem = new Image();
    imagem.onload = () => {
      setFotoProfessorOriginal(fotoBase64);
      setLarguraFotoProfessorOriginal(imagem.width);
      setAlturaFotoProfessorOriginal(imagem.height);
      setZoomRecorteFotoProfessor(1);
      setDeslocamentoXRecorteFotoProfessor(0);
      setDeslocamentoYRecorteFotoProfessor(0);
      setRotacaoRecorteFotoProfessor(0);
      setErroFotoProfessor('');
      setModalRecorteFotoProfessorAberto(true);
    };
    imagem.onerror = () => {
      setErroFotoProfessor('Não foi possível carregar a imagem selecionada.');
    };
    imagem.src = fotoBase64;
  };

  const selecionarArquivoFotoProfessor = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      setErroFotoProfessor('Selecione apenas arquivos de imagem.');
      evento.target.value = '';
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = String(leitor.result || '');
      if (!resultado.startsWith('data:image/')) {
        setErroFotoProfessor('Formato de imagem inválido.');
        return;
      }
      abrirModalRecorteFotoProfessor(resultado);
    };
    leitor.onerror = () => setErroFotoProfessor('Erro ao ler o arquivo da foto.');
    leitor.readAsDataURL(arquivo);
    evento.target.value = '';
  };

  const aplicarRecorteFotoProfessor = async () => {
    if (!fotoProfessorOriginal || larguraFotoProfessorOriginal <= 0 || alturaFotoProfessorOriginal <= 0) return;

    setGerandoFotoProfessorRecortada(true);
    try {
      const imagem = await new Promise<HTMLImageElement>((resolve, reject) => {
        const novaImagem = new Image();
        novaImagem.onload = () => resolve(novaImagem);
        novaImagem.onerror = () => reject(new Error('Falha ao abrir imagem para recorte.'));
        novaImagem.src = fotoProfessorOriginal;
      });

      const canvas = document.createElement('canvas');
      canvas.width = TAMANHO_SAIDA_RECORTE_FOTO;
      canvas.height = TAMANHO_SAIDA_RECORTE_FOTO;

      const contexto = canvas.getContext('2d');
      if (!contexto) {
        setErroFotoProfessor('Não foi possível preparar o recorte da foto.');
        return;
      }

      // Renderiza recorte quadrado com deslocamento, zoom e rotação escolhidos no modal.
      const fatorEscalaPreviewParaSaida = TAMANHO_SAIDA_RECORTE_FOTO / TAMANHO_PREVIEW_RECORTE_FOTO;
      const escalaBaseSaida = Math.max(TAMANHO_SAIDA_RECORTE_FOTO / imagem.width, TAMANHO_SAIDA_RECORTE_FOTO / imagem.height);
      const escalaFinalSaida = escalaBaseSaida * zoomRecorteFotoProfessor;
      const deslocamentoXSaida = deslocamentoXRecorteFotoProfessor * fatorEscalaPreviewParaSaida;
      const deslocamentoYSaida = deslocamentoYRecorteFotoProfessor * fatorEscalaPreviewParaSaida;

      contexto.clearRect(0, 0, TAMANHO_SAIDA_RECORTE_FOTO, TAMANHO_SAIDA_RECORTE_FOTO);
      contexto.save();
      contexto.translate(
        TAMANHO_SAIDA_RECORTE_FOTO / 2 + deslocamentoXSaida,
        TAMANHO_SAIDA_RECORTE_FOTO / 2 + deslocamentoYSaida
      );
      contexto.rotate((rotacaoRecorteFotoProfessor * Math.PI) / 180);
      contexto.drawImage(
        imagem,
        -(imagem.width * escalaFinalSaida) / 2,
        -(imagem.height * escalaFinalSaida) / 2,
        imagem.width * escalaFinalSaida,
        imagem.height * escalaFinalSaida
      );
      contexto.restore();

      const fotoRecortada = canvas.toDataURL('image/webp', 0.92);
      setFormularioProfessor((estadoAtual) => ({ ...estadoAtual, foto: fotoRecortada }));
      setModalRecorteFotoProfessorAberto(false);
      setErroFotoProfessor('');
    } catch (erro) {
      console.error(erro);
      setErroFotoProfessor('Não foi possível aplicar o recorte da imagem.');
    } finally {
      setGerandoFotoProfessorRecortada(false);
    }
  };

  const removerFotoProfessor = () => {
    setFormularioProfessor((estadoAtual) => ({ ...estadoAtual, foto: '' }));
    setFotoProfessorOriginal('');
    setLarguraFotoProfessorOriginal(0);
    setAlturaFotoProfessorOriginal(0);
    setErroFotoProfessor('');
  };

  const limparFormularioProfessor = () => {
    setFormularioProfessor({
      nome: '',
      usuario: '',
      email: '',
      telefone: '',
      foto: '',
      senha: '',
      turmaIds: []
    });
    setFotoProfessorOriginal('');
    setLarguraFotoProfessorOriginal(0);
    setAlturaFotoProfessorOriginal(0);
    setZoomRecorteFotoProfessor(1);
    setDeslocamentoXRecorteFotoProfessor(0);
    setDeslocamentoYRecorteFotoProfessor(0);
    setRotacaoRecorteFotoProfessor(0);
    setModalRecorteFotoProfessorAberto(false);
    setBuscaTurmaProfessor('');
    setErroFotoProfessor('');
    setErroFormularioProfessor('');
  };

  const abrirCadastroProfessor = () => {
    setProfessorEmEdicao(null);
    limparFormularioProfessor();
    setProfessorSubview('add');
  };

  const abrirEdicaoProfessor = (professor: Professor) => {
    setProfessorEmEdicao(professor);
    setFormularioProfessor({
      nome: professor.name || '',
      usuario: professor.username || '',
      email: professor.email || '',
      telefone: formatarTelefoneProfessor(professor.phone || ''),
      foto: professor.avatar || '',
      senha: '',
      turmaIds: professor.roomIds || []
    });
    setBuscaTurmaProfessor('');
    setErroFormularioProfessor('');
    setProfessorSubview('edit');
  };

  const alternarTurmaProfessor = (idTurma: string) => {
    setFormularioProfessor((estadoAtual) => {
      const turmaJaSelecionada = estadoAtual.turmaIds.includes(idTurma);
      return {
        ...estadoAtual,
        turmaIds: turmaJaSelecionada
          ? estadoAtual.turmaIds.filter((idAtual) => idAtual !== idTurma)
          : [...estadoAtual.turmaIds, idTurma]
      };
    });
  };

  const salvarProfessor = async () => {
    if (salvandoProfessor) return;

    const nomeLimpo = formularioProfessor.nome.trim();
    const usuarioLimpo = normalizarUsuario(formularioProfessor.usuario);
    const emailLimpo = formularioProfessor.email.trim().toLowerCase();
    const senhaLimpa = formularioProfessor.senha.trim();

    if (!nomeLimpo || !usuarioLimpo || !emailLimpo) {
      setErroFormularioProfessor('Nome, usuário e email são obrigatórios.');
      return;
    }

    if (!professorEmEdicao && senhaLimpa.length < 6) {
      setErroFormularioProfessor('A senha inicial deve ter ao menos 6 caracteres.');
      return;
    }

    if (professorEmEdicao && senhaLimpa.length > 0 && senhaLimpa.length < 6) {
      setErroFormularioProfessor('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }

    setSalvandoProfessor(true);
    setErroFormularioProfessor('');
    try {
      const resposta = await fetch('/api/admin/upsert-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: professorEmEdicao?.id,
          name: nomeLimpo,
          username: usuarioLimpo,
          email: emailLimpo,
          phone: formularioProfessor.telefone.trim(),
          avatar: formularioProfessor.foto.trim(),
          password: senhaLimpa,
          roomIds: formularioProfessor.turmaIds
        })
      });

      if (!resposta.ok) {
        const dadosErro = await resposta.json().catch(() => null);
        setErroFormularioProfessor(dadosErro?.error || 'Não foi possível salvar o professor.');
        return;
      }

      await fetchData();
      setProfessorSubview('list');
      setProfessorEmEdicao(null);
      limparFormularioProfessor();
    } catch (erro) {
      console.error(erro);
      setErroFormularioProfessor('Erro de conexão ao salvar professor.');
    } finally {
      setSalvandoProfessor(false);
    }
  };

  const excluirProfessor = async (idProfessor: string) => {
    try {
      const resposta = await fetch('/api/admin/delete-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idProfessor })
      });

      if (!resposta.ok) {
        const dadosErro = await resposta.json().catch(() => null);
        alert(dadosErro?.error || 'Não foi possível excluir o professor.');
        return;
      }

      await fetchData();
      if (professorEmEdicao?.id === idProfessor) {
        setProfessorEmEdicao(null);
        limparFormularioProfessor();
        setProfessorSubview('list');
      }
    } catch (erro) {
      console.error(erro);
      alert('Erro de conexão ao excluir professor.');
    }
  };

  const abrirCadastroConquista = () => {
    setConquistaEmEdicao(null);
    setFormularioConquista(criarFormularioConquistaVazio());
    setErroFormularioConquista('');
    setConquistaSubview('add');
  };

  const abrirEdicaoConquista = (conquista: Conquista) => {
    setConquistaEmEdicao(conquista);
    setFormularioConquista({
      id: conquista.id,
      nome: conquista.nome || '',
      descricao: conquista.descricao || '',
      cor: conquista.cor || '#3B82F6',
      icone: conquista.icone || 'Trophy',
      ativa: conquista.ativa !== false,
      requisitos: (conquista.requisitos || []).length
        ? conquista.requisitos.map((requisito) => ({
            id: requisito.id || gerarIdTemporarioConquista(),
            tipo: requisito.tipo,
            valorMinimo: Number(requisito.valorMinimo) || 1
          }))
        : [
            {
              id: gerarIdTemporarioConquista(),
              tipo: 'LICOES_CONCLUIDAS',
              valorMinimo: 1
            }
          ]
    });
    setErroFormularioConquista('');
    setConquistaSubview('edit');
  };

  const adicionarRequisitoConquista = () => {
    setFormularioConquista((estadoAtual) => ({
      ...estadoAtual,
      requisitos: [
        ...estadoAtual.requisitos,
        {
          id: gerarIdTemporarioConquista(),
          tipo: 'LICOES_CONCLUIDAS',
          valorMinimo: 1
        }
      ]
    }));
  };

  const removerRequisitoConquista = (idRequisito: string) => {
    setFormularioConquista((estadoAtual) => {
      if (estadoAtual.requisitos.length <= 1) {
        return estadoAtual;
      }

      return {
        ...estadoAtual,
        requisitos: estadoAtual.requisitos.filter((requisito) => requisito.id !== idRequisito)
      };
    });
  };

  const atualizarRequisitoConquista = (
    idRequisito: string,
    campo: 'tipo' | 'valorMinimo',
    valor: TipoRequisitoConquista | number
  ) => {
    setFormularioConquista((estadoAtual) => ({
      ...estadoAtual,
      requisitos: estadoAtual.requisitos.map((requisito) => {
        if (requisito.id !== idRequisito) return requisito;
        if (campo === 'tipo') {
          return { ...requisito, tipo: valor as TipoRequisitoConquista };
        }
        return { ...requisito, valorMinimo: Math.max(1, Number(valor) || 1) };
      })
    }));
  };

  const salvarConquista = async () => {
    if (salvandoConquista) return;

    const nomeConquista = formularioConquista.nome.trim();
    const descricaoConquista = formularioConquista.descricao.trim();

    if (!nomeConquista || !descricaoConquista) {
      setErroFormularioConquista('Nome e descrição da conquista são obrigatórios.');
      return;
    }

    if (!formularioConquista.requisitos.length) {
      setErroFormularioConquista('Adicione pelo menos um requisito.');
      return;
    }

    setSalvandoConquista(true);
    setErroFormularioConquista('');
    try {
      const resposta = await fetch('/api/admin/upsert-achievement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formularioConquista.id,
          nome: nomeConquista,
          descricao: descricaoConquista,
          cor: formularioConquista.cor,
          icone: formularioConquista.icone,
          ativa: formularioConquista.ativa,
          requisitos: formularioConquista.requisitos.map((requisito) => ({
            tipo: requisito.tipo,
            valorMinimo: Math.max(1, Number(requisito.valorMinimo) || 1)
          }))
        })
      });

      const dadosResposta = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErroFormularioConquista(dadosResposta?.error || 'Não foi possível salvar a conquista.');
        return;
      }

      await fetchData();
      setConquistaSubview('list');
      setConquistaEmEdicao(null);
      setFormularioConquista(criarFormularioConquistaVazio());
    } catch (erro) {
      console.error(erro);
      setErroFormularioConquista('Erro de conexão ao salvar conquista.');
    } finally {
      setSalvandoConquista(false);
    }
  };

  const excluirConquista = async (idConquista: string) => {
    try {
      const resposta = await fetch('/api/admin/delete-achievement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idConquista })
      });

      if (!resposta.ok) {
        const dadosErro = await resposta.json().catch(() => null);
        alert(dadosErro?.error || 'Não foi possível remover a conquista.');
        return;
      }

      await fetchData();
      if (conquistaEmEdicao?.id === idConquista) {
        setConquistaEmEdicao(null);
        setConquistaSubview('list');
      }
    } catch (erro) {
      console.error(erro);
      alert('Erro de conexão ao remover conquista.');
    }
  };

  const turmasFiltradasProfessor = rooms.filter((turma) =>
    turma.name.toLowerCase().includes(buscaTurmaProfessor.toLowerCase())
  );

  const fasesNivelPlaygroundSelecionado = fasesPlaygroundImagem
    .filter((fase) => fase.nivel === nivelPlaygroundSelecionado)
    .sort((a, b) => a.ordem - b.ordem);

  const adicionarFasePlaygroundNoNivel = () => {
    const proximaOrdem =
      fasesPlaygroundImagem
        .filter((fase) => fase.nivel === nivelPlaygroundSelecionado)
        .reduce((maior, fase) => Math.max(maior, fase.ordem), -1) + 1;

    setFasesPlaygroundImagem((estadoAtual) => [
      ...estadoAtual,
      {
        id: `nova-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nivel: nivelPlaygroundSelecionado,
        ordem: proximaOrdem,
        imagem: '',
        traducaoCorreta: '',
        ativo: true
      }
    ]);
  };

  const atualizarCampoFasePlayground = (
    idFase: string,
    campo: keyof FasePlaygroundFormulario,
    valor: string | number | boolean
  ) => {
    setFasesPlaygroundImagem((estadoAtual) =>
      estadoAtual.map((fase) => (fase.id === idFase ? { ...fase, [campo]: valor } : fase))
    );
  };

  const removerFasePlayground = (idFase: string) => {
    setFasesPlaygroundImagem((estadoAtual) => estadoAtual.filter((fase) => fase.id !== idFase));
  };

  const abrirUploadImagemFasePlayground = (idFase: string) => {
    setIdFaseSelecionadaParaUploadImagem(idFase);
    inputArquivoImagemFasePlaygroundRef.current?.click();
  };

  const selecionarArquivoImagemFasePlayground = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo || !idFaseSelecionadaParaUploadImagem) return;

    if (!arquivo.type.startsWith('image/')) {
      setErroPlayground('Selecione apenas arquivos de imagem para as fases.');
      evento.target.value = '';
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      const base64 = String(leitor.result || '');
      if (!base64.startsWith('data:image/')) {
        setErroPlayground('Formato de imagem inválido para fase.');
        return;
      }

      atualizarCampoFasePlayground(idFaseSelecionadaParaUploadImagem, 'imagem', base64);
      setErroPlayground('');
    };
    leitor.onerror = () => setErroPlayground('Erro ao ler arquivo da fase.');
    leitor.readAsDataURL(arquivo);
    evento.target.value = '';
  };

  const salvarPlaygroundImagem = async () => {
    if (salvandoPlayground) return;

    const fasesNormalizadas = fasesPlaygroundImagem
      .map((fase, indice) => ({
        ...fase,
        nivel: Number(fase.nivel) || 1,
        ordem: Number.isFinite(Number(fase.ordem)) ? Number(fase.ordem) : indice,
        imagem: (fase.imagem || '').trim(),
        traducaoCorreta: (fase.traducaoCorreta || '').trim()
      }))
      .sort((a, b) => a.nivel - b.nivel || a.ordem - b.ordem);

    const faseInvalidaSemImagem = fasesNormalizadas.find((fase) => !fase.imagem);
    if (faseInvalidaSemImagem) {
      setSucessoPlayground('');
      setErroPlayground('Todas as fases precisam de imagem.');
      return;
    }

    const faseInvalidaSemTraducao = fasesNormalizadas.find((fase) => !fase.traducaoCorreta);
    if (faseInvalidaSemTraducao) {
      setSucessoPlayground('');
      setErroPlayground('Todas as fases precisam da tradução correta.');
      return;
    }

    setSalvandoPlayground(true);
    setErroPlayground('');
    setSucessoPlayground('');
    try {
      const resposta = await fetch('/api/playground/admin/traduzir-imagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fases: fasesNormalizadas
        })
      });

      if (!resposta.ok) {
        const dadosErro = await resposta.json().catch(() => null);
        setSucessoPlayground('');
        setErroPlayground(dadosErro?.error || 'Não foi possível salvar o jogo.');
        return;
      }

      const dados = await resposta.json();
      const fasesRecebidas = Array.isArray(dados?.jogo?.fasesImagem) ? dados.jogo.fasesImagem : [];
      setFasesPlaygroundImagem(
        fasesRecebidas.map((fase: JogoFaseImagem) => ({
          id: fase.id,
          nivel: Number(fase.nivel) || 1,
          ordem: Number(fase.ordem) || 0,
          imagem: fase.imagem || '',
          traducaoCorreta: fase.traducaoCorreta || '',
          ativo: fase.ativo !== false
        }))
      );
      setJogosPlaygroundDisponiveis((estadoAtual) =>
        estadoAtual.map((jogo) => {
          if (jogo.slug !== 'traduzir-imagem') return jogo;
          return { ...jogo, totalFases: fasesRecebidas.length };
        })
      );
      setJogoPlaygroundSelecionado((estadoAtual) => {
        if (!estadoAtual || estadoAtual.slug !== 'traduzir-imagem') return estadoAtual;
        return { ...estadoAtual, totalFases: fasesRecebidas.length };
      });
      setErroPlayground('');
      setSucessoPlayground('Jogo salvo com sucesso!');
    } catch (erro) {
      console.error(erro);
      setSucessoPlayground('');
      setErroPlayground('Erro de conexão ao salvar jogo.');
    } finally {
      setSalvandoPlayground(false);
    }
  };
  
  const atualizarBuscaTopbarAlunos = (textoBusca: string) => {
    setSearchTerm(textoBusca);
    if (textoBusca.trim().length > 0 && activeTab !== 'users') {
      setActiveTab('users');
    }
  };

  const abrirAbaAlunosComBusca = () => {
    if (activeTab !== 'users') {
      setActiveTab('users');
    }
  };

  const totalAlunos = users.length;
  const totalTurmas = rooms.length;
  const totalProfessores = professores.length;
  const totalAdministradores = admins.length;
  const totalModulos = levels.length;
  const totalLicoesDisponiveis = levels.reduce((acumulado, modulo) => acumulado + modulo.lessons.length, 0);
  const totalExerciciosDisponiveis = levels.reduce((acumulado, modulo) => {
    return acumulado + modulo.lessons.reduce((acumuladoLicoes, licao) => acumuladoLicoes + licao.exercises.length, 0);
  }, 0);
  const totalConquistasAtivas = conquistas.filter((conquista) => conquista.ativa).length;

  const totalXpAlunos = users.reduce((acumulado, aluno) => acumulado + (Number(aluno.points) || 0), 0);
  const mediaXpPorAluno = Math.round(totalXpAlunos / (totalAlunos || 1));
  const mediaOfensivaAlunos = Math.round(
    users.reduce((acumulado, aluno) => acumulado + (Number(aluno.streak) || 0), 0) / (totalAlunos || 1)
  );
  const mediaEnergiaAlunos = Math.round(
    users.reduce((acumulado, aluno) => acumulado + (Number(aluno.energy) || 0), 0) / (totalAlunos || 1)
  );
  const totalSeguidores = users.reduce((acumulado, aluno) => acumulado + (aluno.followers?.length || 0), 0);

  const idsAlunosEmTurmas = new Set(rooms.flatMap((turma) => turma.studentIds));
  const totalAlunosComTurma = users.filter(
    (aluno) => idsAlunosEmTurmas.has(aluno.id) || Boolean(aluno.classRoomId)
  ).length;
  const percentualAlunosComTurma = totalAlunos > 0 ? Math.round((totalAlunosComTurma / totalAlunos) * 100) : 0;
  const totalTurmasSemAlunos = rooms.filter((turma) => turma.studentIds.length === 0).length;

  const instanteMinimoAtividadeRecente = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const totalAlunosAtivos7Dias = users.filter((aluno) => {
    if (!aluno.lastActivityDate) return false;
    const instanteAtividade = new Date(aluno.lastActivityDate).getTime();
    return !Number.isNaN(instanteAtividade) && instanteAtividade >= instanteMinimoAtividadeRecente;
  }).length;

  const totalLicoesConcluidas = users.reduce(
    (acumulado, aluno) => acumulado + (aluno.completedLessons?.length || 0),
    0
  );
  const mediaLicoesConcluidasPorAluno = totalAlunos > 0 ? Number((totalLicoesConcluidas / totalAlunos).toFixed(1)) : 0;
  const totalConclusoesPossiveis = totalLicoesDisponiveis * totalAlunos;
  const percentualConclusaoGeral = totalConclusoesPossiveis > 0
    ? Math.round((totalLicoesConcluidas / totalConclusoesPossiveis) * 100)
    : 0;

  const dadosTopEngajamento = [...users]
    .sort((alunoA, alunoB) => (Number(alunoB.points) || 0) - (Number(alunoA.points) || 0))
    .slice(0, 10)
    .map((aluno) => ({
      nome: aluno.name,
      pontos: Number(aluno.points) || 0
    }));

  const dadosTurmasPorQuantidade = [...rooms]
    .map((turma) => ({
      id: turma.id,
      nome: turma.name,
      totalAlunos: turma.studentIds.length
    }))
    .sort((turmaA, turmaB) => turmaB.totalAlunos - turmaA.totalAlunos || turmaA.nome.localeCompare(turmaB.nome, 'pt-BR'));

  // Calcula progresso por módulo considerando o total potencial de conclusões por turma.
  const dadosProgressoPorModulo = levels.map((modulo) => {
    const idsLicoesModulo = new Set(modulo.lessons.map((licao) => licao.id));
    const totalConclusoesModulo = users.reduce((acumulado, aluno) => {
      return acumulado + (aluno.completedLessons || []).filter((idLicaoConcluida) => idsLicoesModulo.has(idLicaoConcluida)).length;
    }, 0);
    const totalPossivelNoModulo = idsLicoesModulo.size * totalAlunos;
    const percentualConcluido = totalPossivelNoModulo > 0
      ? Math.round((totalConclusoesModulo / totalPossivelNoModulo) * 100)
      : 0;

    return {
      id: modulo.id,
      nome: modulo.title,
      licoes: modulo.lessons.length,
      percentualConcluido
    };
  });

  const rankingAlunos = [...users]
    .sort((alunoA, alunoB) => (Number(alunoB.points) || 0) - (Number(alunoA.points) || 0))
    .slice(0, 5)
    .map((aluno, indice) => ({
      id: aluno.id,
      posicao: indice + 1,
      nome: aluno.name,
      pontos: Number(aluno.points) || 0,
      ofensiva: Number(aluno.streak) || 0,
      licoesConcluidas: aluno.completedLessons?.length || 0
    }));

  const formatarNumeroDashboard = (valor: number) => valor.toLocaleString('pt-BR');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans"
    >
      {/* Sidebar Desktop */}
      <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col p-8 fixed h-full z-40">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center overflow-hidden p-1.5">
            <img src="/images/logo.png" alt="Logotipo do sistema" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2
              className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-500 tracking-tight leading-none pb-1"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              lingoflow
            </h2>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          <SidebarLink icon={LineChart} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarLink icon={Layout} label="Conteúdo" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
          <SidebarLink icon={Trophy} label="Conquistas" active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')} />
          <SidebarLink icon={UserIcon} label="Alunos" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <SidebarLink icon={Presentation} label="Turmas" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
          <SidebarLink
            icon={Gamepad2}
            label="Playground"
            active={activeTab === 'playground'}
            onClick={() => {
              setActiveTab('playground');
              setSubAbaPlayground('lista');
            }}
          />
          <SidebarLink icon={GraduationCap} label="Professores" active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} />
          <SidebarLink icon={Zap} label="Energia" active={activeTab === 'energy'} onClick={() => setActiveTab('energy')} />
          <SidebarLink icon={ShieldCheck} label="Administradores" active={activeTab === 'admins'} onClick={() => setActiveTab('admins')} />
        </nav>
      </aside>

      {/* Topbar Fixa */}
      <div className="fixed top-0 left-0 right-0 z-30 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="lg:pl-80">
          <div className="px-6 lg:px-12 py-4">
            <div className="max-w-6xl mx-auto">
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between shadow-sm">
                <div className="relative w-full xl:max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => atualizarBuscaTopbarAlunos(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        abrirAbaAlunosComBusca();
                      }
                    }}
                    placeholder="Buscar alunos por nome"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 sm:gap-3">
                  <Link
                    href="/app"
                    className="h-11 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center"
                  >
                    Acessar app
                  </Link>

                  <div className="relative" ref={areaSuporteRef}>
                    <button
                      onClick={() => {
                        setSuporteAberto((estadoAtual) => !estadoAtual);
                        setMenuUsuarioAberto(false);
                      }}
                      className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-blue-500 transition-colors flex items-center justify-center"
                      title="Suporte"
                    >
                      <LifeBuoy className="h-5 w-5" />
                    </button>

                    <AnimatePresence>
                      {suporteAberto && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50"
                        >
                          <p className="text-sm font-black text-slate-700 dark:text-slate-200 mb-2">
                            Precisa de ajuda com o Lingoflow?
                          </p>
                          <a
                            href={linkWhatsSuporte}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-black text-green-600 dark:text-green-400 hover:underline"
                          >
                            WhatsApp: (51) 99472-7036
                          </a>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={toggleTheme}
                    className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-blue-500 transition-colors flex items-center justify-center"
                    title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>

                  <div className="relative" ref={areaMenuUsuarioRef}>
                    <button
                      onClick={() => {
                        setMenuUsuarioAberto((estadoAtual) => !estadoAtual);
                        setSuporteAberto(false);
                      }}
                      className="pl-3 pr-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/30 transition-colors flex items-center gap-3"
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">{nomeUsuarioLogado}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-tight mt-1">{cargoUsuarioLogado}</p>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", menuUsuarioAberto && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {menuUsuarioAberto && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-2 shadow-xl z-50"
                        >
                          <button
                            onClick={() => {
                              setActiveTab('profile');
                              setMenuUsuarioAberto(false);
                            }}
                            className="w-full px-4 py-3 rounded-xl text-sm font-black text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                            <UserIcon className="h-4 w-4" />
                            Meu perfil
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 rounded-xl text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2"
                          >
                            <LogOut className="h-4 w-4" />
                            Sair da conta
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-80 px-6 lg:px-12 pt-44 lg:pt-36 pb-6 lg:pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-6 mb-12">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-display font-black text-slate-800 dark:text-slate-100 tracking-tight">{TAB_LABELS[activeTab]}</h1>
              </div>
              {isSaving && (
                <div className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase animate-pulse">
                  <Save className="h-4 w-4" />
                  Salvando...
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <StatCard icon={UserIcon} label="Total Alunos" value={formatarNumeroDashboard(totalAlunos)} color="blue" />
                  <StatCard icon={Presentation} label="Total Turmas" value={formatarNumeroDashboard(totalTurmas)} color="orange" />
                  <StatCard icon={GraduationCap} label="Professores" value={formatarNumeroDashboard(totalProfessores)} color="green" />
                  <StatCard icon={ShieldCheck} label="Administradores" value={formatarNumeroDashboard(totalAdministradores)} color="blue" />
                  <StatCard icon={Star} label="XP Total" value={formatarNumeroDashboard(totalXpAlunos)} color="orange" />
                  <StatCard icon={Flame} label="Média Ofensiva" value={formatarNumeroDashboard(mediaOfensivaAlunos)} color="green" />
                  <StatCard icon={Layers} label="Módulos/Lições" value={`${formatarNumeroDashboard(totalModulos)} / ${formatarNumeroDashboard(totalLicoesDisponiveis)}`} color="blue" />
                  <StatCard icon={CheckCircle2} label="Lições Concluídas" value={formatarNumeroDashboard(totalLicoesConcluidas)} color="orange" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 overflow-hidden shadow-xl">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Top 10 Engajamento</h3>
                    <p className="text-sm font-bold text-slate-400 mb-6">Ranking atualizado com o XP vindo da API.</p>
                    <div className="h-96 w-full">
                      {dadosTopEngajamento.length === 0 ? (
                        <div className="h-full rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-400">
                          Ainda não há alunos para exibir no gráfico.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dadosTopEngajamento}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b20" />
                            <XAxis
                              dataKey="nome"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900 }}
                              tickFormatter={(nomeCompleto) => String(nomeCompleto).split(' ')[0]}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900 }} />
                            <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                            <Bar dataKey="pontos" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={42} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6">Resumo de Atividade</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Alunos ativos (7 dias)</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{formatarNumeroDashboard(totalAlunosAtivos7Dias)}</p>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Cobertura em turmas</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{percentualAlunosComTurma}%</p>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Média de XP/aluno</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{formatarNumeroDashboard(mediaXpPorAluno)}</p>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Média de energia</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{formatarNumeroDashboard(mediaEnergiaAlunos)}</p>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Média lições/aluno</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{mediaLicoesConcluidasPorAluno.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Conquistas ativas</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{formatarNumeroDashboard(totalConquistasAtivas)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">Progresso por Módulo</h3>
                    <p className="text-sm font-bold text-slate-400 mb-6">Percentual de conclusão considerando todos os alunos ativos.</p>
                    <div className="space-y-5">
                      {dadosProgressoPorModulo.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-sm font-bold text-slate-400">
                          Cadastre módulos para visualizar o progresso.
                        </div>
                      ) : (
                        dadosProgressoPorModulo.map((modulo) => (
                          <div key={modulo.id} className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-black text-slate-700 dark:text-slate-100 truncate">{modulo.nome}</p>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{modulo.percentualConcluido}%</p>
                            </div>
                            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${modulo.percentualConcluido}%` }}
                              />
                            </div>
                            <p className="text-xs font-bold text-slate-400">{modulo.licoes} lições cadastradas</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm space-y-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6">Turmas com Mais Alunos</h3>
                      <div className="space-y-3">
                        {dadosTurmasPorQuantidade.length === 0 ? (
                          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-sm font-bold text-slate-400">
                            Ainda não existem turmas cadastradas.
                          </div>
                        ) : (
                          dadosTurmasPorQuantidade.slice(0, 5).map((turma) => (
                            <div key={turma.id} className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                              <p className="text-sm font-black text-slate-700 dark:text-slate-100 truncate pr-4">{turma.nome}</p>
                              <p className="text-sm font-black text-blue-500">{turma.totalAlunos} aluno(s)</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-6">Top 5 Alunos</h3>
                      <div className="space-y-3">
                        {rankingAlunos.length === 0 ? (
                          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-sm font-bold text-slate-400">
                            Sem alunos para exibir ranking.
                          </div>
                        ) : (
                          rankingAlunos.map((aluno) => (
                            <div key={aluno.id} className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-sm font-black text-slate-700 dark:text-slate-100 truncate">
                                  {aluno.posicao}. {aluno.nome}
                                </p>
                                <p className="text-sm font-black text-blue-500">{formatarNumeroDashboard(aluno.pontos)} XP</p>
                              </div>
                              <p className="text-xs font-bold text-slate-400 mt-1">
                                Ofensiva {aluno.ofensiva} dias • {aluno.licoesConcluidas} lições concluídas
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  <StatCard icon={BookOpen} label="Exercícios" value={formatarNumeroDashboard(totalExerciciosDisponiveis)} color="green" />
                  <StatCard icon={Users} label="Seguidores (Total)" value={formatarNumeroDashboard(totalSeguidores)} color="blue" />
                  <StatCard icon={Check} label="Conclusão Geral" value={`${percentualConclusaoGeral}%`} color="orange" />
                  <StatCard icon={AlertTriangle} label="Turmas sem alunos" value={formatarNumeroDashboard(totalTurmasSemAlunos)} color="green" />
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="max-w-3xl">
                  <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 space-y-8 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Settings className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Meu Perfil</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-300">
                          Atualize seus dados de acesso do painel administrativo.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                      <input
                        value={formularioMeuPerfilAdmin.nome}
                        onChange={(evento) =>
                          setFormularioMeuPerfilAdmin((estadoAtual) => ({
                            ...estadoAtual,
                            nome: evento.target.value
                          }))
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                        placeholder="Seu nome"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                      <input
                        type="email"
                        value={formularioMeuPerfilAdmin.email}
                        onChange={(evento) =>
                          setFormularioMeuPerfilAdmin((estadoAtual) => ({
                            ...estadoAtual,
                            email: evento.target.value
                          }))
                        }
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                        placeholder="Seu e-mail"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nova senha</label>
                        <input
                          type="password"
                          value={formularioMeuPerfilAdmin.novaSenha}
                          onChange={(evento) =>
                            setFormularioMeuPerfilAdmin((estadoAtual) => ({
                              ...estadoAtual,
                              novaSenha: evento.target.value
                            }))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                          placeholder="Opcional"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar nova senha</label>
                        <input
                          type="password"
                          value={formularioMeuPerfilAdmin.confirmarNovaSenha}
                          onChange={(evento) =>
                            setFormularioMeuPerfilAdmin((estadoAtual) => ({
                              ...estadoAtual,
                              confirmarNovaSenha: evento.target.value
                            }))
                          }
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                          placeholder="Repita a nova senha"
                        />
                      </div>
                    </div>

                    {erroMeuPerfilAdmin && (
                      <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                        <XCircle className="h-5 w-5" />
                        {erroMeuPerfilAdmin}
                      </div>
                    )}

                    {sucessoMeuPerfilAdmin && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-300 text-sm font-bold">
                        <CheckCircle2 className="h-5 w-5" />
                        {sucessoMeuPerfilAdmin}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        void salvarMeuPerfilAdministrador();
                      }}
                      disabled={salvandoMeuPerfilAdmin}
                      className="w-full md:w-auto bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black py-4 px-8 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                      {salvandoMeuPerfilAdmin && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {salvandoMeuPerfilAdmin ? 'Salvando...' : 'Salvar perfil'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex gap-6 items-start">
                  {/* Level Sidebar */}
                  <div className="w-80 space-y-4 shrink-0">
                    <button 
                      onClick={() => {
                        const newLevel: Level = {
                          id: Date.now().toString(),
                          title: 'Novo Módulo',
                          description: 'Descrição do novo módulo',
                          difficulty: 1,
                          lessons: []
                        };
                        syncContent([...levels, newLevel]);
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      <Plus className="h-6 w-6" />
                      Novo Módulo
                    </button>
                    <div className="space-y-2">
                       {levels.map(level => (
                         <button 
                          key={level.id}
                          onClick={() => {
                            setSelectedLevelId(level.id);
                            setSelectedLessonId(null);
                          }}
                          className={cn(
                            "w-full p-5 rounded-2xl border-2 text-left transition-all group relative overflow-hidden",
                            selectedLevelId === level.id 
                              ? "bg-white dark:bg-slate-800 border-blue-500 shadow-md" 
                              : "bg-slate-50 dark:bg-slate-900 border-transparent hover:bg-white dark:hover:bg-slate-800"
                          )}
                         >
                           <h4 className={cn("font-black text-sm", selectedLevelId === level.id ? "text-blue-500" : "text-slate-700 dark:text-slate-300")}>{level.title}</h4>
                           <span className="text-[10px] font-bold text-slate-400">{level.lessons.length} lições</span>
                           {selectedLevelId === level.id && <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Level Details & Lesson Management */}
                  {selectedLevelId ? (
                    <div className="flex-1 space-y-6">
                      {levels.filter(l => l.id === selectedLevelId).map(level => (
                        <div key={level.id} className="space-y-8 animate-in fade-in slide-in-from-right-4">
                          {/* Edit Level Info */}
                          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                               <div className="space-y-2">
                                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Título do Módulo</label>
                                  <input 
                                    value={level.title}
                                    onChange={(e) => {
                                      const updated = levels.map(l => l.id === level.id ? { ...l, title: e.target.value } : l);
                                      syncContent(updated);
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 font-bold outline-none focus:border-blue-500"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dificuldade</label>
                                  <select 
                                    value={level.difficulty}
                                    onChange={(e) => {
                                      const updated = levels.map(l => l.id === level.id ? { ...l, difficulty: parseInt(e.target.value) } : l);
                                      syncContent(updated);
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 font-bold outline-none focus:border-blue-500"
                                  >
                                    {[1,2,3,4,5].map(v => <option key={v} value={v}>Nível {v}</option>)}
                                  </select>
                               </div>
                            </div>
                            <button 
                              onClick={() => {
                                syncContent(levels.filter(l => l.id !== level.id));
                                setSelectedLevelId(null);
                              }}
                              className="text-red-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir Módulo
                            </button>
                          </div>

                          {/* Lessons Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {level.lessons.map(lesson => (
                               <button 
                                key={lesson.id}
                                onClick={() => setSelectedLessonId(lesson.id)}
                                className={cn(
                                  "p-6 rounded-3xl border-2 text-left flex items-center justify-between transition-all group",
                                  selectedLessonId === lesson.id 
                                    ? "bg-blue-500 border-blue-600 text-white shadow-lg" 
                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200"
                                )}
                               >
                                 <div>
                                    <h5 className="font-black mb-1">{lesson.title}</h5>
                                    <span className={cn("text-[10px] font-bold uppercase", selectedLessonId === lesson.id ? "text-white/60" : "text-slate-400")}>
                                      {lesson.exercises.length} Exercícios
                                    </span>
                                 </div>
                                 <div className={cn("p-2 rounded-xl", selectedLessonId === lesson.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800")}>
                                    <BookOpen className="h-5 w-5" />
                                 </div>
                               </button>
                             ))}
                             <button 
                              onClick={() => {
                                const newLesson: Lesson = {
                                  id: `l-${Date.now()}`,
                                  title: 'Nova Lição',
                                  exercises: []
                                };
                                const updated = levels.map(l => l.id === level.id ? { ...l, lessons: [...l.lessons, newLesson] } : l);
                                syncContent(updated);
                              }}
                              className="p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-slate-400 font-black hover:border-blue-400 hover:text-blue-500 transition-all group"
                             >
                                <Plus className="h-6 w-6" />
                                Adicionar Lição
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 h-96 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-400">
                       <Layout className="h-16 w-16 mb-4 opacity-20" />
                       <span className="font-black uppercase tracking-widest text-xs">Selecione um módulo para começar</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'achievements' && (
              <motion.div key="achievements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {conquistaSubview === 'list' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Conquistas Cadastradas</h3>
                        <p className="text-slate-400 font-bold">Configure metas, requisitos e visual de cada conquista.</p>
                      </div>
                      <button
                        onClick={abrirCadastroConquista}
                        className="bg-blue-500 hover:bg-blue-400 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                      >
                        <Plus className="h-6 w-6" />
                        Nova Conquista
                      </button>
                    </div>

                    {conquistas.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] p-14 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mx-auto mb-5">
                          <Trophy className="h-8 w-8" />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Nenhuma conquista cadastrada</h4>
                        <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">
                          Comece criando conquistas com requisitos múltiplos para liberar aos alunos.
                        </p>
                        <button
                          onClick={abrirCadastroConquista}
                          className="bg-blue-500 hover:bg-blue-400 text-white font-black px-6 py-3 rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-xs"
                        >
                          Criar primeira conquista
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {conquistas.map((conquista) => {
                          const IconeConquista = obterIconeConquistaNoAdmin(conquista.icone);
                          return (
                            <div key={conquista.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                              <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="flex items-center gap-4 min-w-0">
                                  <div
                                    className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${conquista.cor}22`, color: conquista.cor }}
                                  >
                                    <IconeConquista className="h-7 w-7" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate">{conquista.nome}</h4>
                                    <p className="text-sm font-bold text-slate-400">{conquista.descricao}</p>
                                  </div>
                                </div>

                                <span
                                  className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                    conquista.ativa
                                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300"
                                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                  )}
                                >
                                  {conquista.ativa ? 'Ativa' : 'Inativa'}
                                </span>
                              </div>

                              <div className="space-y-2 mb-6">
                                {conquista.requisitos.map((requisito) => (
                                  <div
                                    key={requisito.id}
                                    className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between"
                                  >
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                                      {obterRotuloTipoRequisitoConquista(requisito.tipo)}
                                    </span>
                                    <span className="text-xs font-black text-blue-500">Mínimo {requisito.valorMinimo}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-3">
                                <button
                                  onClick={() => abrirEdicaoConquista(conquista)}
                                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 font-black py-3 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                  <Edit3 className="h-4 w-4" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => setDeleteConquistaId(conquista.id)}
                                  className="flex-1 bg-red-500 hover:bg-red-400 text-white font-black py-3 rounded-xl border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Excluir
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {(conquistaSubview === 'add' || conquistaSubview === 'edit') && (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <button
                      onClick={() => {
                        setConquistaSubview('list');
                        setConquistaEmEdicao(null);
                        setErroFormularioConquista('');
                      }}
                      className="flex items-center gap-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black uppercase text-xs tracking-widest transition-all p-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Voltar para a lista
                    </button>

                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 shadow-sm">
                      <div className="flex items-center gap-4 mb-8">
                        <div
                          className="h-16 w-16 rounded-2xl flex items-center justify-center"
                          style={{
                            backgroundColor: `${formularioConquista.cor}22`,
                            color: formularioConquista.cor
                          }}
                        >
                          {(() => {
                            const IconeAtual = obterIconeConquistaNoAdmin(formularioConquista.icone);
                            return <IconeAtual className="h-8 w-8" />;
                          })()}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                            {conquistaSubview === 'add' ? 'Cadastrar Conquista' : 'Editar Conquista'}
                          </h3>
                          <p className="text-slate-400 font-bold">Defina estilo visual e requisitos de desbloqueio.</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome da conquista</label>
                          <input
                            value={formularioConquista.nome}
                            onChange={(evento) =>
                              setFormularioConquista((estadoAtual) => ({
                                ...estadoAtual,
                                nome: evento.target.value
                              }))
                            }
                            placeholder="Ex: Mestre das Lições"
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                          <textarea
                            value={formularioConquista.descricao}
                            onChange={(evento) =>
                              setFormularioConquista((estadoAtual) => ({
                                ...estadoAtual,
                                descricao: evento.target.value
                              }))
                            }
                            placeholder="Texto exibido ao desbloquear a conquista"
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ícone</label>
                            <div className="w-full rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-3 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-9 w-9 rounded-xl flex items-center justify-center border-2 border-white/80 dark:border-slate-700 shadow-sm"
                                    style={{
                                      backgroundColor: `${formularioConquista.cor}22`,
                                      color: formularioConquista.cor
                                    }}
                                  >
                                    {(() => {
                                      const IconeSelecionado = obterIconeConquistaNoAdmin(formularioConquista.icone);
                                      return <IconeSelecionado className="h-5 w-5" />;
                                    })()}
                                  </div>
                                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                    Selecione o ícone
                                  </p>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {ICONES_CONQUISTA_DISPONIVEIS.length} opções
                                </span>
                              </div>

                              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                                {ICONES_CONQUISTA_DISPONIVEIS.map((icone) => {
                                  const IconeOpcao = obterIconeConquistaNoAdmin(icone);
                                  const estaSelecionado = formularioConquista.icone === icone;
                                  return (
                                    <button
                                      key={icone}
                                      type="button"
                                      onClick={() =>
                                        setFormularioConquista((estadoAtual) => ({
                                          ...estadoAtual,
                                          icone
                                        }))
                                      }
                                      aria-label={`Selecionar ícone ${icone}`}
                                      title={icone}
                                      className={cn(
                                        "h-11 w-11 rounded-xl border-2 flex items-center justify-center transition-all",
                                        estaSelecionado
                                          ? "border-blue-500 bg-white dark:bg-slate-900 scale-105 shadow-md"
                                          : "border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-500 hover:-translate-y-0.5"
                                      )}
                                      style={{
                                        color: estaSelecionado ? formularioConquista.cor : undefined
                                      }}
                                    >
                                      <IconeOpcao className="h-5 w-5" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cor personalizada</label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={formularioConquista.cor}
                                onChange={(evento) =>
                                  setFormularioConquista((estadoAtual) => ({
                                    ...estadoAtual,
                                    cor: evento.target.value
                                  }))
                                }
                                className="h-11 w-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
                              />
                              <input
                                value={formularioConquista.cor}
                                onChange={(evento) =>
                                  setFormularioConquista((estadoAtual) => ({
                                    ...estadoAtual,
                                    cor: evento.target.value.toUpperCase()
                                  }))
                                }
                                placeholder="#3B82F6"
                                className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 px-4 font-black text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-blue-500 uppercase"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cores predefinidas</label>
                          <div className="flex flex-wrap gap-2">
                            {CORES_PREDEFINIDAS_CONQUISTA.map((cor) => {
                              const selecionada = formularioConquista.cor.toUpperCase() === cor.toUpperCase();
                              return (
                                <button
                                  key={cor}
                                  onClick={() =>
                                    setFormularioConquista((estadoAtual) => ({
                                      ...estadoAtual,
                                      cor
                                    }))
                                  }
                                  className={cn(
                                    "h-9 w-9 rounded-full border-2 transition-all",
                                    selecionada
                                      ? "border-slate-900 dark:border-white scale-110"
                                      : "border-white dark:border-slate-700"
                                  )}
                                  style={{ backgroundColor: cor }}
                                  title={cor}
                                />
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 px-4 py-3">
                          <div>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-100">Conquista ativa</p>
                            <p className="text-xs font-bold text-slate-400">Quando desativada, não será desbloqueada por novos alunos.</p>
                          </div>
                          <button
                            onClick={() =>
                              setFormularioConquista((estadoAtual) => ({
                                ...estadoAtual,
                                ativa: !estadoAtual.ativa
                              }))
                            }
                            className={cn(
                              "h-8 w-14 rounded-full p-1 transition-all",
                              formularioConquista.ativa ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                            )}
                          >
                            <div
                              className={cn(
                                "h-6 w-6 rounded-full bg-white transition-all",
                                formularioConquista.ativa ? "translate-x-6" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">Requisitos</h4>
                              <p className="text-xs font-bold text-slate-400">Todos os requisitos precisam ser atendidos para liberar a conquista.</p>
                            </div>
                            <button
                              onClick={adicionarRequisitoConquista}
                              className="bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Requisito
                            </button>
                          </div>

                          <div className="space-y-3">
                            {formularioConquista.requisitos.map((requisito, indice) => (
                              <div
                                key={requisito.id}
                                className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Requisito {indice + 1}</p>
                                  <button
                                    onClick={() => removerRequisitoConquista(requisito.id)}
                                    disabled={formularioConquista.requisitos.length <= 1}
                                    className="text-red-500 disabled:text-slate-300 dark:disabled:text-slate-600 font-black text-xs uppercase tracking-widest flex items-center gap-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Remover
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                    <select
                                      value={requisito.tipo}
                                      onChange={(evento) =>
                                        atualizarRequisitoConquista(
                                          requisito.id,
                                          'tipo',
                                          evento.target.value as TipoRequisitoConquista
                                        )
                                      }
                                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 font-black text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-blue-500"
                                    >
                                      {OPCOES_TIPO_REQUISITO_CONQUISTA.map((opcao) => (
                                        <option key={opcao.tipo} value={opcao.tipo}>
                                          {opcao.titulo}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor mínimo</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={requisito.valorMinimo}
                                      onChange={(evento) =>
                                        atualizarRequisitoConquista(
                                          requisito.id,
                                          'valorMinimo',
                                          Math.max(1, Number(evento.target.value) || 1)
                                        )
                                      }
                                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 font-black text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-blue-500"
                                    />
                                  </div>
                                </div>

                                <p className="text-xs font-bold text-slate-400">
                                  {obterDescricaoTipoRequisitoConquista(requisito.tipo)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {erroFormularioConquista && (
                          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                            <XCircle className="h-5 w-5" />
                            {erroFormularioConquista}
                          </div>
                        )}

                        <div className="flex gap-4 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setConquistaSubview('list');
                              setConquistaEmEdicao(null);
                              setErroFormularioConquista('');
                            }}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 font-black py-4 rounded-2xl transition-all uppercase tracking-widest"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void salvarConquista();
                            }}
                            disabled={salvandoConquista}
                            className="flex-[2] bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                          >
                            {salvandoConquista && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {salvandoConquista
                              ? conquistaSubview === 'add' ? 'Cadastrando...' : 'Salvando...'
                              : conquistaSubview === 'add' ? 'Cadastrar Conquista' : 'Salvar Alterações'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                 {/* Search Bar */}
                 <div className="relative max-w-md">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text"
                      placeholder="Buscar alunos por nome"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl py-4 pl-14 pr-6 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-sm transition-all"
                    />
                 </div>

                 <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">XP Total</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nível</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ofensiva</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Turma</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                          </tr>
                       </thead>
                       <tbody>
                          {users
                            .filter(u => 
                              u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              u.username.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(u => (
                            <tr key={u.id} className="border-b last:border-0 border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
                                     </div>
                                     <div>
                                        <p className="font-black text-slate-800 dark:text-slate-100">{u.name}</p>
                                        <p className="text-xs font-bold text-blue-500">@{u.username}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <span className="font-black text-slate-800 dark:text-slate-100">{u.points}</span>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <span className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-black">NV {u.level}</span>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                     <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                                     <span className="font-black text-slate-800 dark:text-slate-100">{u.streak}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <span className="inline-flex bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-black">
                                    {obterTurmaDoAluno(u.id)?.name || 'Sem turma'}
                                  </span>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button 
                                      onClick={() => abrirRelatorioAluno(u)}
                                      className="text-slate-300 hover:text-emerald-500 transition-colors p-2"
                                      title="Relatório do aluno"
                                    >
                                      <LineChart className="h-5 w-5" />
                                    </button>
                                    <button 
                                      onClick={() => abrirEdicaoAluno(u)}
                                      className="text-slate-300 hover:text-blue-500 transition-colors p-2"
                                      title="Editar aluno"
                                    >
                                      <Edit2 className="h-5 w-5" />
                                    </button>
                                    <button 
                                      onClick={() => setDeleteStudentId(u.id)}
                                      className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                      title="Excluir aluno"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}

            {activeTab === 'rooms' && (
              <motion.div key="rooms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Gerenciamento de Turmas</h3>
                      <p className="text-slate-400 font-bold">Crie turmas e organize seus alunos por grupos.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setNewRoomName('');
                        setNovoNivelTurma(1);
                        setIsCreatingRoom(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-400 text-white font-black px-8 py-4 rounded-3xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="h-6 w-6" />
                      Criar Nova Turma
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {rooms.map(room => (
                      <div key={room.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 flex flex-col group hover:border-blue-200 dark:hover:border-blue-900/40 transition-all shadow-sm">
                        <div className="flex items-start justify-between mb-8">
                           <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                              <Presentation className="h-8 w-8" />
                           </div>
                           <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 setNewRoomName(room.name);
                                 setNovoNivelTurma(Number(room.level) || 1);
                                 setIsEditingRoom(room);
                               }}
                               className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-xl transition-all"
                             >
                               <Edit3 className="h-5 w-5" />
                             </button>
                             <button 
                               onClick={() => {
                                 setDeleteRoomId(room.id);
                               }}
                               className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                             >
                               <Trash2 className="h-5 w-5" />
                             </button>
                           </div>
                        </div>

                        <div className="flex-1">
                           <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">{room.name}</h4>
                            <div className="flex items-center gap-6 mb-8">
                              <div className="flex items-center gap-2 text-slate-400 font-bold">
                                 <UserIcon className="h-4 w-4" />
                                 <span className="text-sm">{room.studentIds.length} Alunos</span>
                              </div>
                              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300 font-black bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg">
                                <Layers className="h-4 w-4" />
                                <span className="text-xs uppercase tracking-widest">Nível {Number(room.level) || 1}</span>
                              </div>
                              <div 
                                className="flex items-center gap-2 text-blue-500 font-black border-l-2 border-slate-100 dark:border-slate-800 pl-6 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg relative cursor-help group/code"
                                onMouseEnter={() => setHoveredRoomCode(room.id)}
                                onMouseLeave={() => setHoveredRoomCode(null)}
                              >
                                 <AnimatePresence>
                                   {hoveredRoomCode === room.id && (
                                     <motion.div 
                                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                       animate={{ opacity: 1, y: 0, scale: 1 }}
                                       exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                       className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl z-50 text-[10px] leading-relaxed font-bold border border-slate-700 pointer-events-none"
                                     >
                                       <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-slate-800 rotate-45 border-r border-b border-slate-700" />
                                       <Sparkles className="h-3 w-3 text-yellow-400 mb-2" />
                                       Peça para os alunos usarem esse código de cadastro em seu registro para serem vinculados em suas turmas automaticamente.
                                     </motion.div>
                                   )}
                                 </AnimatePresence>
                                 <Hash className="h-4 w-4" />
                                 <span className="text-sm tracking-widest">{room.code || '-----'}</span>
                              </div>
                           </div>

                           <div className="flex flex-wrap gap-2 mb-8 h-20 overflow-y-auto pr-2 custom-scrollbar">
                              {room.studentIds.map(sid => {
                                const s = users.find(u => u.id === sid);
                                if (!s) return null;
                                return (
                                  <div key={sid} className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 group/tag">
                                     {s.avatar ? <img src={s.avatar} className="h-4 w-4 rounded-full object-cover" /> : <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><UserIcon className="h-2 w-2 text-slate-400" /></div>}
                                     <span className="text-[10px] font-black uppercase text-slate-500">{s.name}</span>
                                     <button 
                                      onClick={() => {
                                        syncRooms(rooms.map(r => r.id === room.id ? { ...r, studentIds: r.studentIds.filter(id => id !== sid) } : r));
                                      }}
                                      className="text-slate-300 hover:text-red-500"
                                     >
                                        <X className="h-3 w-3" />
                                     </button>
                                  </div>
                                );
                              })}
                           </div>
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              setSelectedStudentsForRoom(room.studentIds);
                              setIsManagingStudents(room.id);
                            }}
                            className="flex-1 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg text-sm"
                          >
                            <UserIcon className="h-4 w-4" />
                            Alunos
                          </button>
                        </div>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'playground' && (
              <motion.div key="playground" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <input
                  ref={inputArquivoImagemFasePlaygroundRef}
                  type="file"
                  accept="image/*"
                  onChange={selecionarArquivoImagemFasePlayground}
                  className="hidden"
                />

                {subAbaPlayground === 'lista' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                            <Gamepad2 className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Playground de Jogos</h3>
                            <p className="text-slate-400 font-bold">Escolha um jogo disponível para gerenciar fases e níveis.</p>
                          </div>
                        </div>
                        <button
                          onClick={buscarDadosPlaygroundAdmin}
                          disabled={carregandoPlayground}
                          className="bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                          {carregandoPlayground && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          Atualizar Jogos
                        </button>
                      </div>
                    </div>

                    {carregandoPlayground ? (
                      <div className="h-40 flex items-center justify-center">
                        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {jogosPlaygroundDisponiveis.length === 0 && (
                          <div className="xl:col-span-2 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center">
                            <p className="text-slate-500 dark:text-slate-400 font-black">Nenhum jogo disponível no Playground no momento.</p>
                          </div>
                        )}

                        {jogosPlaygroundDisponiveis.map((jogo) => (
                          <div key={jogo.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col gap-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                                  <Gamepad2 className="h-7 w-7" />
                                </div>
                                <div>
                                  <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100">{jogo.nome}</h4>
                                  <p className="text-sm font-bold text-slate-400">{jogo.descricao}</p>
                                </div>
                              </div>
                              <span
                                className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                  jogo.ativo
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                )}
                              >
                                {jogo.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                              <span>Fases cadastradas</span>
                              <span className="text-blue-500">{jogo.totalFases}</span>
                            </div>

                            <button
                              onClick={() => abrirGerenciamentoJogoPlayground(jogo)}
                              className="bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20"
                            >
                              Gerenciar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {erroPlayground && (
                      <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                        <XCircle className="h-5 w-5" />
                        {erroPlayground}
                      </div>
                    )}
                  </div>
                )}

                {subAbaPlayground === 'gerenciar' && (
                  <div className="space-y-6">
                    <button
                      onClick={voltarParaListaJogosPlayground}
                      className="inline-flex items-center gap-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black uppercase text-xs tracking-widest transition-all p-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Voltar para jogos
                    </button>

                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                            <Gamepad2 className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Playground de Jogos</h3>
                            <p className="text-slate-400 font-bold">
                              Gerencie o jogo <span className="text-blue-500">{jogoPlaygroundSelecionado?.nome || 'Traduza a Imagem'}</span> e suas fases por nível.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={salvarPlaygroundImagem}
                          disabled={salvandoPlayground}
                          className="bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black px-8 py-4 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                          {salvandoPlayground && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          {salvandoPlayground ? 'Salvando Jogo...' : 'Salvar Jogo'}
                        </button>
                      </div>

                      <div className="space-y-3 mb-8">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nível das fases</label>
                        <div className="flex flex-wrap items-center gap-3">
                          {[1, 2, 3, 4, 5].map((nivel) => {
                            const abaAtiva = nivelPlaygroundSelecionado === nivel;
                            return (
                              <button
                                key={nivel}
                                type="button"
                                onClick={() => setNivelPlaygroundSelecionado(nivel)}
                                className={cn(
                                  "px-4 py-2.5 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all",
                                  abaAtiva
                                    ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
                                )}
                              >
                                Nível {nivel}
                              </button>
                            );
                          })}
                          <button
                            onClick={adicionarFasePlaygroundNoNivel}
                            className="bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-black px-5 py-3 rounded-xl transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Nova Fase
                          </button>
                        </div>
                      </div>

                      {carregandoPlayground ? (
                        <div className="h-40 flex items-center justify-center">
                          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {fasesNivelPlaygroundSelecionado.length === 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center text-slate-400 font-bold">
                              Nenhuma fase cadastrada neste nível. Clique em <span className="text-blue-500">Nova Fase</span>.
                            </div>
                          )}

                          {fasesNivelPlaygroundSelecionado.map((fase, indice) => (
                            <div key={fase.id} className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-5">
                              <div className="flex items-center justify-between gap-4 mb-4">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                  Fase {indice + 1} - Nível {fase.nivel}
                                </p>
                                <button
                                  onClick={() => removerFasePlayground(fase.id)}
                                  className="text-red-500 hover:text-red-400 font-black text-xs uppercase tracking-widest flex items-center gap-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remover
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="h-44 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                                    {fase.imagem ? (
                                      <img src={fase.imagem} alt={`Fase ${indice + 1}`} className="w-full h-full object-cover" />
                                    ) : (
                                      <ImagePlus className="h-8 w-8 text-slate-400" />
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => abrirUploadImagemFasePlayground(fase.id)}
                                    className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-3 rounded-xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                  >
                                    <Upload className="h-4 w-4" />
                                    {fase.imagem ? 'Trocar Imagem' : 'Enviar Imagem'}
                                  </button>
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tradução Correta</label>
                                    <input
                                      value={fase.traducaoCorreta}
                                      onChange={(evento) => atualizarCampoFasePlayground(fase.id, 'traducaoCorreta', evento.target.value)}
                                      placeholder="Digite a tradução correta"
                                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-blue-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {erroPlayground && (
                        <div className="mt-6 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                          <XCircle className="h-5 w-5" />
                          {erroPlayground}
                        </div>
                      )}

                      {sucessoPlayground && (
                        <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-300 text-sm font-bold">
                          <CheckCircle2 className="h-5 w-5" />
                          {sucessoPlayground}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'teachers' && (
              <motion.div key="teachers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {professorSubview === 'list' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Equipe de Professores</h3>
                        <p className="text-slate-400 font-bold">Cadastre e vincule turmas para cada professor.</p>
                      </div>
                      <button
                        onClick={abrirCadastroProfessor}
                        className="bg-blue-500 hover:bg-blue-400 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                      >
                        <Plus className="h-6 w-6" />
                        Novo Professor
                      </button>
                    </div>

                    {professores.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] p-14 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mx-auto mb-5">
                          <GraduationCap className="h-8 w-8" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-black">Nenhum professor cadastrado ainda.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {professores.map((professor) => {
                          const turmasVinculadas = rooms.filter((turma) => (professor.roomIds || []).includes(turma.id));
                          return (
                            <div key={professor.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:border-blue-200 dark:hover:border-blue-900/40 transition-all">
                              <div className="flex items-start justify-between mb-6">
                                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                  {professor.avatar ? (
                                    <img src={professor.avatar} alt={professor.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <GraduationCap className="h-7 w-7 text-blue-500" />
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => abrirEdicaoProfessor(professor)}
                                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-xl transition-all"
                                    title="Editar professor"
                                  >
                                    <Edit3 className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteProfessorId(professor.id)}
                                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                                    title="Excluir professor"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">{professor.name}</h4>
                                <p className="text-xs font-bold text-blue-500">@{professor.username}</p>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-300 truncate">{professor.email}</p>
                                <p className="text-xs font-bold text-slate-400">{professor.phone || 'Telefone não informado'}</p>
                              </div>

                              <div className="mt-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                  Turmas vinculadas ({turmasVinculadas.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {turmasVinculadas.length === 0 && (
                                    <span className="text-xs font-bold text-slate-400">Sem turmas vinculadas.</span>
                                  )}
                                  {turmasVinculadas.map((turma) => (
                                    <span key={turma.id} className="inline-flex bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-[10px] font-black">
                                      {turma.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {(professorSubview === 'add' || professorSubview === 'edit') && (
                  <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <button
                      onClick={() => {
                        setProfessorSubview('list');
                        setProfessorEmEdicao(null);
                        limparFormularioProfessor();
                      }}
                      className="flex items-center gap-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black uppercase text-xs tracking-widest transition-all p-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Voltar para a lista
                    </button>

                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-xl">
                      <div className="flex items-center gap-6 mb-10">
                        <div className="h-20 w-20 bg-blue-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg">
                          <GraduationCap className="h-10 w-10" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            {professorSubview === 'add' ? 'Cadastrar Professor' : 'Editar Professor'}
                          </h3>
                          <p className="text-slate-400 font-bold">Defina os dados de acesso e as turmas vinculadas.</p>
                        </div>
                      </div>

                      <form
                        onSubmit={async (evento) => {
                          evento.preventDefault();
                          await salvarProfessor();
                        }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Foto (Upload)</label>
                            <input
                              ref={inputArquivoFotoProfessorRef}
                              type="file"
                              accept="image/*"
                              onChange={selecionarArquivoFotoProfessor}
                              className="hidden"
                            />
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => inputArquivoFotoProfessorRef.current?.click()}
                                className="bg-blue-500 hover:bg-blue-400 text-white font-black px-5 py-3 rounded-xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                              >
                                <ImagePlus className="h-4 w-4" />
                                Selecionar Foto
                              </button>
                              {formularioProfessor.foto.trim() && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const fotoAtual = formularioProfessor.foto.trim();
                                      if (!fotoAtual.startsWith('data:image/')) {
                                        setErroFotoProfessor('Para recortar, faça upload de uma nova foto.');
                                        return;
                                      }
                                      abrirModalRecorteFotoProfessor(fotoAtual);
                                    }}
                                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 font-black px-5 py-3 rounded-xl transition-all uppercase tracking-widest text-xs"
                                  >
                                    Recortar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={removerFotoProfessor}
                                    className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 font-black px-5 py-3 rounded-xl transition-all uppercase tracking-widest text-xs"
                                  >
                                    Remover
                                  </button>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-bold">
                              Somente upload de imagem. Após selecionar, ajuste recorte e orientação.
                            </p>
                          </div>
                          <div className="h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                            {formularioProfessor.foto.trim() ? (
                              <img
                                src={formularioProfessor.foto.trim()}
                                alt="Prévia da foto do professor"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <GraduationCap className="h-8 w-8 text-slate-400" />
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                            <input
                              value={formularioProfessor.nome}
                              onChange={(evento) => setFormularioProfessor((estadoAtual) => ({ ...estadoAtual, nome: evento.target.value }))}
                              required
                              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
                            <input
                              value={formularioProfessor.usuario}
                              onChange={(evento) => {
                                const usuarioSemCaracteresInvalidos = normalizarUsuario(evento.target.value);
                                setFormularioProfessor((estadoAtual) => ({ ...estadoAtual, usuario: usuarioSemCaracteresInvalidos }));
                              }}
                              placeholder="ex: professor01"
                              required
                              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                            />
                            <p className="text-xs text-slate-400 font-bold">Apenas letras minúsculas e números (sem espaços, hífen, _, ç ou acentos).</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="email"
                                value={formularioProfessor.email}
                                onChange={(evento) => setFormularioProfessor((estadoAtual) => ({ ...estadoAtual, email: evento.target.value }))}
                                required
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-11 pr-5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                value={formularioProfessor.telefone}
                                onChange={(evento) =>
                                  setFormularioProfessor((estadoAtual) => ({
                                    ...estadoAtual,
                                    telefone: formatarTelefoneProfessor(evento.target.value)
                                  }))
                                }
                                inputMode="numeric"
                                maxLength={15}
                                placeholder="(51) 99999-9999"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-11 pr-5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            {professorSubview === 'add' ? 'Senha Inicial' : 'Nova Senha (opcional)'}
                          </label>
                          <input
                            type="password"
                            value={formularioProfessor.senha}
                            onChange={(evento) => setFormularioProfessor((estadoAtual) => ({ ...estadoAtual, senha: evento.target.value }))}
                            placeholder={professorSubview === 'add' ? 'Mínimo 6 caracteres' : 'Deixe em branco para manter a senha atual'}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Vincular Turmas</label>
                          <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4">
                            <div className="relative mb-4">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                value={buscaTurmaProfessor}
                                onChange={(evento) => setBuscaTurmaProfessor(evento.target.value)}
                                placeholder="Buscar turma..."
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="max-h-52 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                              {turmasFiltradasProfessor.length === 0 && (
                                <p className="text-xs font-bold text-slate-400 px-2 py-2">Nenhuma turma encontrada.</p>
                              )}
                              {turmasFiltradasProfessor.map((turma) => {
                                const turmaSelecionada = formularioProfessor.turmaIds.includes(turma.id);
                                return (
                                  <button
                                    key={turma.id}
                                    type="button"
                                    onClick={() => alternarTurmaProfessor(turma.id)}
                                    className={cn(
                                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
                                      turmaSelecionada
                                        ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-300"
                                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:border-blue-200 dark:hover:border-blue-900/40"
                                    )}
                                  >
                                    <span className="font-black text-sm">{turma.name}</span>
                                    <div
                                      className={cn(
                                        "h-5 w-5 rounded-md border-2 flex items-center justify-center",
                                        turmaSelecionada
                                          ? "border-blue-500 bg-blue-500 text-white"
                                          : "border-slate-300 dark:border-slate-600"
                                      )}
                                    >
                                      {turmaSelecionada && <Check className="h-3 w-3" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 font-bold ml-1">
                            {formularioProfessor.turmaIds.length} turma(s) selecionada(s).
                          </p>
                        </div>

                        {erroFotoProfessor && (
                          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                            <XCircle className="h-5 w-5" />
                            {erroFotoProfessor}
                          </div>
                        )}

                        {erroFormularioProfessor && (
                          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                            <XCircle className="h-5 w-5" />
                            {erroFormularioProfessor}
                          </div>
                        )}

                        <div className="flex gap-4 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setProfessorSubview('list');
                              setProfessorEmEdicao(null);
                              limparFormularioProfessor();
                            }}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 font-black py-4 rounded-2xl transition-all uppercase tracking-widest"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={salvandoProfessor}
                            className="flex-[2] bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                          >
                            {salvandoProfessor && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {salvandoProfessor
                              ? professorSubview === 'add' ? 'Cadastrando...' : 'Salvando...'
                              : professorSubview === 'add' ? 'Cadastrar Professor' : 'Salvar Alterações'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'energy' && (
              <motion.div key="energy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                 <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                       <Settings className="h-7 w-7 text-blue-500" />
                       Configurações de Energia
                    </h3>
                    <div className="grid grid-cols-1 gap-8 items-end">
                       <div className="space-y-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">Quantidade Diária Padrão</label>
                          <div className="flex items-center gap-4">
                             <input 
                               type="number"
                               value={data?.settings?.defaultDailyEnergy || 5}
                               onChange={(e) => {
                                 syncSettings({ ...data?.settings, defaultDailyEnergy: parseInt(e.target.value) });
                               }}
                               className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                             />
                             <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                                <Zap className="h-7 w-7" />
                             </div>
                          </div>
                          <p className="text-xs text-slate-400 font-bold ml-1 italic">* Cada lição concluída consumirá 1 ponto de energia.</p>
                       </div>
                    </div>

                    <div className="mt-12 p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border-2 border-blue-100 dark:border-blue-800/20">
                       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                          <h4 className="font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-xs">Bonificação por Turma</h4>
                          <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              placeholder="Filtrar turma por nome..."
                              value={buscaNomeTurmaEnergia}
                              onChange={(evento) => setBuscaNomeTurmaEnergia(evento.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                            />
                          </div>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {turmasFiltradasBonificacaoEnergia.map(room => (
                            <div key={room.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                               <p className="font-black text-slate-800 dark:text-slate-100 mb-4">{room.name}</p>
                               <div className="flex gap-2">
                                  {[10, 20, 30].map(val => (
                                    <button 
                                      key={val}
                                      onClick={() => handleEnergyCombo(room.id, val)}
                                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-400 text-white font-black text-[10px] rounded-lg transition-all"
                                    >
                                      +{val}
                                    </button>
                                  ))}
                               </div>
                            </div>
                          ))}
                       </div>
                       {turmasFiltradasBonificacaoEnergia.length === 0 && (
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4">
                           Nenhuma turma encontrada para este filtro.
                         </p>
                       )}
                    </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                       <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Energia Individual dos Alunos</h3>
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input 
                            placeholder="Buscar aluno..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 pl-12 pr-6 font-bold outline-none focus:border-blue-500"
                          />
                       </div>
                    </div>
                    <table className="w-full">
                       <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                             <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</th>
                             <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Energia Atual</th>
                             <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                          </tr>
                       </thead>
                       <tbody>
                          {users
                            .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(u => (
                            <tr key={u.id} className="border-b last:border-0 border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
                                     </div>
                                     <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{u.name}</p>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <input 
                                    type="number"
                                    value={u.energy || 0}
                                    onChange={(e) => {
                                      const updatedUsers = users.map(user => user.id === u.id ? { ...user, energy: parseInt(e.target.value) } : user);
                                      syncUsers(updatedUsers);
                                    }}
                                    className="w-20 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-lg py-2 text-center font-black text-blue-500"
                                  />
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <div className="flex justify-end gap-2">
                                     <button 
                                      onClick={() => {
                                        const updatedUsers = users.map(user => user.id === u.id ? { ...user, energy: (user.energy || 0) + 10 } : user);
                                        syncUsers(updatedUsers);
                                      }}
                                      className="p-2 bg-green-50 dark:bg-green-900/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all text-[10px] font-black"
                                     >
                                        +10
                                     </button>
                                  </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}

            {activeTab === 'admins' && (
              <motion.div key="admins" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {adminSubview === 'list' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Time de Administradores</h3>
                      <button 
                        onClick={() => {
                          setAdminFormError('');
                          setAdminSubview('add');
                        }}
                        className="bg-blue-500 hover:bg-blue-400 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                      >
                        <Plus className="h-6 w-6" />
                        Novo Administrador
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {admins.map(admin => (
                        <div key={admin.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col group hover:border-blue-200 dark:hover:border-blue-900/40 transition-all shadow-sm">
                          <div className="flex items-start justify-between mb-6">
                            <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-[1.5rem] flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                              <ShieldCheck className="h-8 w-8" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingAdmin(admin);
                                  setAdminSubview('edit');
                                }}
                                className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-xl transition-all"
                              >
                                <Edit3 className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(admin.id)}
                                className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{admin.name}</h4>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate">{admin.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(adminSubview === 'add' || adminSubview === 'edit') && (
                  <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <button 
                      onClick={() => setAdminSubview('list')}
                      className="flex items-center gap-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black uppercase text-xs tracking-widest transition-all p-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Voltar para a lista
                    </button>

                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3.5rem] p-12 shadow-xl">
                      <div className="flex items-center gap-6 mb-12">
                        <div className="h-20 w-20 bg-blue-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg">
                          {adminSubview === 'add' ? <Plus className="h-10 w-10" /> : <Edit3 className="h-10 w-10" />}
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            {adminSubview === 'add' ? 'Cadastrar Administrador' : 'Editar Administrador'}
                          </h3>
                          <p className="text-slate-400 font-bold">Preencha os dados de acesso abaixo.</p>
                        </div>
                      </div>

                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (salvandoFormularioAdmin) return;
                          setAdminFormError('');
                          setSalvandoFormularioAdmin(true);
                          const formData = new FormData(e.currentTarget);
                          const payload = Object.fromEntries(formData);
                          
                          const url = adminSubview === 'add' ? '/api/admin/add' : '/api/admin/update';
                          if (adminSubview === 'edit' && editingAdmin) {
                            (payload as any).id = editingAdmin.id;
                          }

                          try {
                            const res = await fetch(url, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload)
                            });
                            if (res.ok) {
                              fetchData();
                              setAdminSubview('list');
                              setEditingAdmin(null);
                            } else {
                              setAdminFormError('Erro ao realizar operação. Tente novamente.');
                            }
                          } catch (err) {
                            setAdminFormError('Erro de conexão ao servidor.');
                          } finally {
                            setSalvandoFormularioAdmin(false);
                          }
                        }} 
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                           <input 
                            name="name" 
                            defaultValue={editingAdmin?.name || ''} 
                            required 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 px-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all shadow-inner" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Profissional</label>
                           <input 
                            name="email" 
                            type="email" 
                            defaultValue={editingAdmin?.email || ''} 
                            required 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 px-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all shadow-inner" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                             {adminSubview === 'add' ? 'Senha Inicial' : 'Nova Senha (deixe em branco para manter)'}
                           </label>
                           <input 
                            name="password" 
                            type="password" 
                            required={adminSubview === 'add'} 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 px-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all shadow-inner" 
                           />
                        </div>

                        {adminFormError && (
                          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                            <XCircle className="h-5 w-5" />
                            {adminFormError}
                          </div>
                        )}

                        <div className="flex gap-4">
                          <button 
                            type="button" 
                            onClick={() => setAdminSubview('list')}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 font-black py-5 rounded-2xl transition-all uppercase tracking-widest"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            disabled={salvandoFormularioAdmin}
                            className="flex-[2] bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                          >
                            {salvandoFormularioAdmin && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {salvandoFormularioAdmin
                              ? adminSubview === 'add' ? 'Cadastrando...' : 'Salvando...'
                              : adminSubview === 'add' ? 'Finalizar Cadastro' : 'Salvar Alterações'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Students Management Modal */}
      <AnimatePresence>
        {isManagingStudents && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsManagingStudents(null)} 
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    Matricular Alunos: {rooms.find(r => r.id === isManagingStudents)?.name}
                  </h3>
                  <p className="text-slate-400 font-bold text-sm">Selecione os alunos para esta turma</p>
                </div>
                <button 
                  onClick={() => setIsManagingStudents(null)}
                  className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded-2xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por nome ou @username..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                {users
                  .filter(u => 
                    u.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                    u.username.toLowerCase().includes(studentSearch.toLowerCase())
                  )
                  .map(u => {
                    const isSelected = selectedStudentsForRoom.includes(u.id);
                    return (
                      <button 
                        key={u.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedStudentsForRoom(prev => prev.filter(id => id !== u.id));
                          } else {
                            setSelectedStudentsForRoom(prev => [...prev, u.id]);
                          }
                        }}
                        className={cn(
                          "w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group",
                          isSelected 
                            ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/40" 
                            : "bg-white dark:bg-slate-900 border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                            isSelected ? "bg-blue-500 border-blue-500" : "border-slate-200 dark:border-slate-700"
                          )}>
                             {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          {u.avatar ? <img src={u.avatar} className="h-10 w-10 rounded-xl object-cover" /> : <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><UserIcon className="h-5 w-5 text-slate-400" /></div>}
                          <div className="text-left">
                            <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{u.name}</p>
                            <p className="text-xs font-bold text-slate-400">@{u.username}</p>
                          </div>
                        </div>
                        {isSelected && <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full">Selecionado</span>}
                      </button>
                    );
                  })}
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <span className="text-slate-400 font-bold text-sm">
                  {selectedStudentsForRoom.length} alunos selecionados
                </span>
                <div className="flex gap-4">
                   <button 
                    onClick={() => setIsManagingStudents(null)}
                    className="px-8 py-5 rounded-3xl font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                   >
                    Cancelar
                   </button>
                   <button 
                    disabled={salvandoTurmaAlunos}
                    onClick={async () => {
                      if (salvandoTurmaAlunos) return;
                      setSalvandoTurmaAlunos(true);
                      try {
                        await syncRooms(rooms.map(r => r.id === isManagingStudents ? { ...r, studentIds: selectedStudentsForRoom } : r));
                        setIsManagingStudents(null);
                      } finally {
                        setSalvandoTurmaAlunos(false);
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black px-12 py-5 rounded-3xl transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                   >
                    {salvandoTurmaAlunos && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {salvandoTurmaAlunos ? 'Salvando...' : 'Salvar Turma'}
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Room Modal */}
      <AnimatePresence>
        {(isCreatingRoom || isEditingRoom) && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setIsCreatingRoom(false);
                setIsEditingRoom(null);
                setNovoNivelTurma(1);
              }} 
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="text-center mb-8">
                <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <Presentation className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                  {isCreatingRoom ? 'Nova Turma' : 'Editar Turma'}
                </h3>
                <p className="text-slate-400 font-bold text-sm">Escolha um nome e o nível da turma.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Turma</label>
                   <input 
                    type="text"
                    autoFocus
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Ex: 3º Ano A - Manhã"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nível da Turma</label>
                   <select
                    value={novoNivelTurma}
                    onChange={(evento) => setNovoNivelTurma(Number(evento.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                   >
                    {[1, 2, 3, 4, 5].map((nivel) => (
                      <option key={nivel} value={nivel}>
                        Nível {nivel}
                      </option>
                    ))}
                   </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setIsCreatingRoom(false);
                      setIsEditingRoom(null);
                      setNovoNivelTurma(1);
                    }}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl transition-all uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={!newRoomName.trim() || salvandoModalTurma}
                    onClick={async () => {
                      if (salvandoModalTurma) return;
                      if (newRoomName.trim()) {
                        setSalvandoModalTurma(true);
                        try {
                          if (isCreatingRoom) {
                            const newId = `room-${Date.now()}`;
                            const newRoom: Room = {
                              id: newId,
                              name: newRoomName,
                              level: novoNivelTurma,
                              studentIds: [],
                              code: Math.floor(10000 + Math.random() * 90000).toString()
                            };
                            await syncRooms([...rooms, newRoom]);
                            setIsCreatingRoom(false);
                            setNovoNivelTurma(1);
                            setSelectedStudentsForRoom([]);
                            setIsManagingStudents(newId);
                          } else if (isEditingRoom) {
                            await syncRooms(
                              rooms.map((r) =>
                                r.id === isEditingRoom.id ? { ...r, name: newRoomName, level: novoNivelTurma } : r
                              )
                            );
                            setIsEditingRoom(null);
                            setNovoNivelTurma(1);
                          }
                        } finally {
                          setSalvandoModalTurma(false);
                        }
                      }
                    }}
                    className="flex-[2] bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {salvandoModalTurma && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {salvandoModalTurma
                      ? isCreatingRoom ? 'Criando...' : 'Salvando...'
                      : isCreatingRoom ? 'Criar e Continuar' : 'Salvar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Turma Modal */}
      <AnimatePresence>
        {deleteRoomId && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteRoomId(null)} className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl overflow-hidden">
              <div className="text-center">
                <div className="h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                   <AlertTriangle className="h-14 w-14 text-red-500 shrink-0" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Excluir Turma?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                  Esta ação é irreversível. Todos os vínculos de alunos nesta turma serão removidos.
                </p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => {
                      syncRooms(rooms.filter(r => r.id !== deleteRoomId));
                      setDeleteRoomId(null);
                    }}
                    className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-5 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg"
                  >
                    Sim, Excluir Turma
                  </button>
                  <button 
                    onClick={() => setDeleteRoomId(null)}
                    className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all uppercase tracking-widest"
                  >
                    Não, Manter
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exercise Editor Modal */}
        <AnimatePresence>
          {selectedLessonId && selectedLevelId && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[90]">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setSelectedLessonId(null)} 
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
              >
                {data?.levels.find(l => l.id === selectedLevelId)?.lessons.find(less => less.id === selectedLessonId) && (
                  <>
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                          Exercícios: {data.levels.find(l => l.id === selectedLevelId)?.lessons.find(less => less.id === selectedLessonId)?.title}
                        </h3>
                        <p className="text-slate-400 font-bold text-sm">Gerencie o conteúdo desta lição</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            const newEx: Exercise = {
                              id: `e-${Date.now()}`,
                              type: 'translate',
                              question: '',
                              answer: '',
                              options: ['', '', '', ''],
                              xp: 10
                            };
                            const updated = data.levels.map(l => {
                              if (l.id === selectedLevelId) {
                                return {
                                  ...l,
                                  lessons: l.lessons.map(less => less.id === selectedLessonId ? { ...less, exercises: [...less.exercises, newEx] } : less)
                                };
                              }
                              return l;
                            });
                            syncContent(updated);
                          }}
                          className="bg-green-500 hover:bg-green-400 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                        >
                          <Plus className="h-5 w-5" />
                          Novo Exercício
                        </button>
                        <button 
                          onClick={() => setSelectedLessonId(null)}
                          className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded-2xl transition-all"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                      {data.levels.find(l => l.id === selectedLevelId)?.lessons.find(less => less.id === selectedLessonId)?.exercises.map((ex, exIdx) => (
                        <div key={ex.id} className="bg-slate-50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                          <div className="flex justify-between items-start mb-6">
                             <div className="flex gap-4">
                                <div className="h-12 w-12 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center font-black text-slate-800 dark:text-slate-100 shadow-sm">
                                   {exIdx + 1}
                                </div>
                                <select 
                                 value={ex.type}
                                 onChange={(e) => {
                                   const updated = data.levels.map(l => ({
                                     ...l,
                                     lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                       ...less,
                                       exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, type: e.target.value as any } : exe)
                                     } : less)
                                   }));
                                   syncContent(updated);
                                 }}
                                 className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 font-black text-xs uppercase tracking-widest text-blue-500 outline-none focus:border-blue-500 shadow-sm"
                                >
                                   <option value="translate">Tradução</option>
                                   <option value="select">Seleção</option>
                                   <option value="listen">Audição</option>
                                    <option value="match">Pares</option>
                                    <option value="reorder">Ordenação</option>
                                </select>
                             </div>
                             <button 
                               onClick={() => {
                                 const updated = data.levels.map(l => ({
                                   ...l,
                                   lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                     ...less,
                                     exercises: less.exercises.filter(exe => exe.id !== ex.id)
                                   } : less)
                                 }));
                                 syncContent(updated);
                               }}
                               className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-slate-300 hover:text-red-500 hover:border-red-100 dark:hover:border-red-900/20 transition-all"
                             >
                               <Trash2 className="h-5 w-5" />
                             </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-6">
                                <div>
                                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Pergunta / Frase</label>
                                   <input 
                                    value={ex.question}
                                    onChange={(e) => {
                                      const updated = data.levels.map(l => ({
                                        ...l,
                                        lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                          ...less,
                                          exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, question: e.target.value } : exe)
                                        } : less)
                                      }));
                                      syncContent(updated);
                                    }}
                                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                                   />
                                </div>
                                <div>
                                   <label className="text-xs font-black text-green-500 uppercase tracking-widest ml-1 block mb-2">Resposta Correta</label>
                                   <input 
                                    value={ex.answer}
                                    onChange={(e) => {
                                      const updated = data.levels.map(l => ({
                                        ...l,
                                        lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                          ...less,
                                          exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, answer: e.target.value } : exe)
                                        } : less)
                                      }));
                                      syncContent(updated);
                                    }}
                                    className="w-full bg-green-50 dark:bg-green-900/10 border-2 border-green-100 dark:border-green-800/20 rounded-2xl py-4 px-6 font-bold text-green-600 dark:text-green-400 outline-none focus:border-green-500 shadow-inner"
                                   />
                                </div>
                                 <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-800/20">
                                   <label className="text-xs font-black text-blue-500 uppercase tracking-widest shrink-0">XP:</label>
                                   <input 
                                     type="number"
                                     value={ex.xp}
                                     onChange={(e) => {
                                       const updated = data.levels.map(l => ({
                                         ...l,
                                         lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                           ...less,
                                           exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, xp: parseInt(e.target.value) } : exe)
                                         } : less)
                                       }));
                                       syncContent(updated);
                                     }}
                                     className="w-24 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-center font-black text-blue-600 dark:text-blue-400"
                                   />
                                </div>
                             </div>

                             <div className="space-y-4">
                                {ex.type === 'match' ? (
                                  <>
                                    <div className="flex items-center justify-between ml-1">
                                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Pares de Palavras</label>
                                      <button 
                                        onClick={() => {
                                          const newPairs = [...(ex.pairs || []), { left: '', right: '' }];
                                          const updated = data.levels.map(l => ({
                                            ...l,
                                            lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                              ...less,
                                              exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, pairs: newPairs } : exe)
                                            } : less)
                                          }));
                                          syncContent(updated);
                                        }}
                                        className="text-xs font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-1"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Novo Par
                                      </button>
                                    </div>
                                    <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900/50">
                                      {(ex.pairs || []).map((pair, pIdx) => (
                                        <div key={pIdx} className="flex gap-2 items-center">
                                          <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input 
                                              value={pair.left}
                                              onChange={(e) => {
                                                const newPairs = [...(ex.pairs || [])];
                                                newPairs[pIdx] = { ...newPairs[pIdx], left: e.target.value };
                                                const updated = data.levels.map(l => ({
                                                  ...l,
                                                  lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                                    ...less,
                                                    exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, pairs: newPairs } : exe)
                                                  } : less)
                                                }));
                                                syncContent(updated);
                                              }}
                                              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-all font-sans"
                                              placeholder="Português"
                                            />
                                            <input 
                                              value={pair.right}
                                              onChange={(e) => {
                                                const newPairs = [...(ex.pairs || [])];
                                                newPairs[pIdx] = { ...newPairs[pIdx], right: e.target.value };
                                                const updated = data.levels.map(l => ({
                                                  ...l,
                                                  lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                                    ...less,
                                                    exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, pairs: newPairs } : exe)
                                                  } : less)
                                                }));
                                                syncContent(updated);
                                              }}
                                              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-all font-sans"
                                              placeholder="Inglês"
                                            />
                                          </div>
                                          <button 
                                            onClick={() => {
                                              const newPairs = (ex.pairs || []).filter((_, i) => i !== pIdx);
                                              const updated = data.levels.map(l => ({
                                                ...l,
                                                lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                                  ...less,
                                                  exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, pairs: newPairs } : exe)
                                                } : less)
                                              }));
                                              syncContent(updated);
                                            }}
                                            className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ))}
                                      {(!ex.pairs || ex.pairs.length === 0) && (
                                        <div className="py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest italic">Nenhum par adicionado</div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">Opções Adicionais</label>
                                    <div className="grid gap-3">
                                      {ex.options?.map((opt, optIdx) => (
                                        <div key={optIdx} className="relative group">
                                          <input 
                                            value={opt}
                                            onChange={(e) => {
                                              const newOpts = [...(ex.options || [])];
                                              newOpts[optIdx] = e.target.value;
                                              const updated = data.levels.map(l => ({
                                                ...l,
                                                lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                                  ...less,
                                                  exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, options: newOpts } : exe)
                                                } : less)
                                              }));
                                              syncContent(updated);
                                            }}
                                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-4 px-6 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all font-sans"
                                            placeholder={`Opção ${optIdx + 1}`}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                      <button 
                        onClick={() => setSelectedLessonId(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-black px-10 py-5 rounded-3xl transition-all uppercase tracking-widest"
                      >
                        Concluído
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Student Edit Modal */}
        <AnimatePresence>
          {modalRelatorioAlunoAberto && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[110]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={fecharRelatorioAluno}
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                      <LineChart className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                        Relatório do Aluno
                      </h3>
                      <p className="text-slate-400 font-bold text-sm">
                        {dadosRelatorioAluno?.aluno?.nome ? `${dadosRelatorioAluno.aluno.nome} (@${dadosRelatorioAluno.aluno.usuario})` : 'Carregando dados do aluno...'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={fecharRelatorioAluno}
                    className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-2xl transition-all"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-8 max-h-[75vh] overflow-y-auto space-y-6">
                  {carregandoRelatorioAluno && (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Carregando relatório...</p>
                    </div>
                  )}

                  {!carregandoRelatorioAluno && erroRelatorioAluno && (
                    <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-2xl p-4 text-red-500 text-sm font-bold flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {erroRelatorioAluno}
                    </div>
                  )}

                  {!carregandoRelatorioAluno && !erroRelatorioAluno && dadosRelatorioAluno && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-4">
                          <p className="text-[10px] uppercase tracking-widest font-black text-emerald-500">Total Acertos</p>
                          <p className="text-3xl font-black text-emerald-600 mt-1">{dadosRelatorioAluno.resumo.totalAcertos}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-2xl p-4">
                          <p className="text-[10px] uppercase tracking-widest font-black text-red-500">Total Erros</p>
                          <p className="text-3xl font-black text-red-600 mt-1">{dadosRelatorioAluno.resumo.totalErros}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/20 rounded-2xl p-4">
                          <p className="text-[10px] uppercase tracking-widest font-black text-blue-500">Respostas</p>
                          <p className="text-3xl font-black text-blue-600 mt-1">{dadosRelatorioAluno.resumo.totalRespostas}</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-100 dark:border-yellow-900/20 rounded-2xl p-4">
                          <p className="text-[10px] uppercase tracking-widest font-black text-yellow-500">Aproveitamento</p>
                          <p className="text-3xl font-black text-yellow-600 mt-1">{dadosRelatorioAluno.resumo.porcentagemTotal.toFixed(2)}%</p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-700 dark:text-slate-100 uppercase tracking-widest">
                            Histórico de jogos e atividades
                          </h4>
                          <span className="text-xs font-black text-slate-400">
                            {dadosRelatorioAluno.resumo.totalRegistros} registro(s)
                          </span>
                        </div>

                        {dadosRelatorioAluno.historico.length === 0 ? (
                          <div className="px-6 py-12 text-center">
                            <p className="text-sm font-bold text-slate-400">
                              Sem histórico ainda. Os resultados passam a aparecer após as próximas atividades/jogos.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origem</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jogo/Atividade</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acertos</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Erros</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">% Acerto</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dadosRelatorioAluno.historico.map((registro) => (
                                  <tr key={registro.id} className="border-b last:border-0 border-slate-50 dark:border-slate-800">
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-300">
                                      {formatarHorarioResultadoRelatorio(registro.horario)}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-200">
                                        {formatarOrigemResultadoRelatorio(registro.origem)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-black text-slate-700 dark:text-slate-100">
                                      {registro.jogo || 'Sem nome'}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-black text-emerald-600">
                                      {registro.acertos}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm font-black text-red-500">
                                      {registro.erros}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-black text-blue-500">
                                      {Number(registro.porcentagemAcerto || 0).toFixed(2)}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {alunoEmEdicao && formularioAluno && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={fecharEdicaoAluno}
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Edit2 className="h-7 w-7 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Editar Conta do Aluno</h3>
                      <p className="text-slate-400 font-bold text-sm">{alunoEmEdicao.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={fecharEdicaoAluno}
                    className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 rounded-2xl transition-all"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                      <input
                        type="text"
                        value={formularioAluno.nome}
                        onChange={(e) => setFormularioAluno((estadoAtual) => estadoAtual ? { ...estadoAtual, nome: e.target.value } : estadoAtual)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
                      <input
                        type="text"
                        value={formularioAluno.usuario}
                        onChange={(e) => setFormularioAluno((estadoAtual) => estadoAtual ? { ...estadoAtual, usuario: normalizarUsuario(e.target.value) } : estadoAtual)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Turma</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSeletorTurmaAberto((estadoAtual) => !estadoAtual)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner flex items-center justify-between"
                      >
                        <span>{turmaSelecionadaNoFormulario?.name || 'Sem turma vinculada'}</span>
                        <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                      </button>

                      <AnimatePresence>
                        {seletorTurmaAberto && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            className="absolute mt-2 z-30 w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-3 space-y-2"
                          >
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                value={buscaTurma}
                                onChange={(e) => setBuscaTurma(e.target.value)}
                                placeholder="Buscar turma..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="max-h-56 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setFormularioAluno((estadoAtual) => estadoAtual ? { ...estadoAtual, turmaId: '' } : estadoAtual);
                                  setSeletorTurmaAberto(false);
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-3 rounded-xl text-sm font-black transition-colors",
                                  !formularioAluno.turmaId
                                    ? "bg-blue-500 text-white"
                                    : "text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                              >
                                Sem turma
                              </button>

                              {turmasFiltradas.map((turma) => (
                                <button
                                  key={turma.id}
                                  type="button"
                                  onClick={() => {
                                    setFormularioAluno((estadoAtual) => estadoAtual ? { ...estadoAtual, turmaId: turma.id } : estadoAtual);
                                    setSeletorTurmaAberto(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 rounded-xl text-sm font-black transition-colors",
                                    formularioAluno.turmaId === turma.id
                                      ? "bg-blue-500 text-white"
                                      : "text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  )}
                                >
                                  {turma.name}
                                </button>
                              ))}

                              {turmasFiltradas.length === 0 && (
                                <div className="px-4 py-6 text-center text-xs font-black uppercase text-slate-400">
                                  Nenhuma turma encontrada
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nova senha (opcional)</label>
                    <input
                      type="password"
                      value={formularioAluno.novaSenha}
                      onChange={(e) => setFormularioAluno((estadoAtual) => estadoAtual ? { ...estadoAtual, novaSenha: e.target.value } : estadoAtual)}
                      placeholder="Deixe em branco para manter a senha atual"
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                    />
                    <p className="text-[10px] text-slate-400 font-bold ml-1">Se informada, precisa ter no mínimo 6 caracteres.</p>
                  </div>

                  {erroEdicaoAluno && (
                    <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      {erroEdicaoAluno}
                    </div>
                  )}
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end gap-4">
                  <button
                    onClick={fecharEdicaoAluno}
                    className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={salvarEdicaoAluno}
                    disabled={salvandoAluno}
                    className="bg-blue-500 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black px-10 py-4 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {salvandoAluno && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {salvandoAluno ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Student Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteStudentId && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteStudentId(null)} className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl overflow-hidden">
                <div className="text-center">
                  <div className="h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                     <AlertTriangle className="h-14 w-14 text-red-500 shrink-0" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Excluir Aluno?</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                    Esta ação é irreversível. O aluno perderá todo o progresso e dados permanentemente.
                  </p>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => {
                        syncUsers(users.filter(usr => usr.id !== deleteStudentId));
                        setDeleteStudentId(null);
                      }}
                      className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-5 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-red-500/20"
                    >
                      Sim, Excluir Aluno
                    </button>
                    <button 
                      onClick={() => setDeleteStudentId(null)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all uppercase tracking-widest"
                    >
                      Não, Manter Aluno
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Teacher Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteProfessorId && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteProfessorId(null)} className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl overflow-hidden">
                <div className="text-center">
                  <div className="h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                     <AlertTriangle className="h-14 w-14 text-red-500 shrink-0" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Excluir Professor?</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                    Esta ação remove o professor do sistema e desvincula suas turmas automaticamente.
                  </p>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={async () => {
                        await excluirProfessor(deleteProfessorId);
                        setDeleteProfessorId(null);
                      }}
                      className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-5 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-red-500/20"
                    >
                      Sim, Excluir Professor
                    </button>
                    <button 
                      onClick={() => setDeleteProfessorId(null)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all uppercase tracking-widest"
                    >
                      Não, Manter Professor
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Achievement Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConquistaId && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConquistaId(null)} className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl overflow-hidden">
                <div className="text-center">
                  <div className="h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <AlertTriangle className="h-14 w-14 text-red-500 shrink-0" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Excluir Conquista?</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                    Esta ação remove a conquista e os desbloqueios já registrados para os alunos.
                  </p>

                  <div className="space-y-4">
                    <button
                      onClick={async () => {
                        await excluirConquista(deleteConquistaId);
                        setDeleteConquistaId(null);
                      }}
                      className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-5 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-red-500/20"
                    >
                      Sim, Excluir Conquista
                    </button>
                    <button
                      onClick={() => setDeleteConquistaId(null)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all uppercase tracking-widest"
                    >
                      Não, Manter Conquista
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Professor Photo Crop Modal */}
        <AnimatePresence>
          {modalRecorteFotoProfessorAberto && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[120]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setModalRecorteFotoProfessorAberto(false)}
                className="absolute inset-0 bg-slate-900/70 dark:bg-black/85 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Recortar e Orientar Foto</h3>
                    <p className="text-slate-400 font-bold text-sm">Ajuste o enquadramento antes de salvar.</p>
                  </div>
                  <button
                    onClick={() => setModalRecorteFotoProfessorAberto(false)}
                    className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="mx-auto rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 overflow-hidden relative" style={{ width: TAMANHO_PREVIEW_RECORTE_FOTO, height: TAMANHO_PREVIEW_RECORTE_FOTO }}>
                    {fotoProfessorOriginal ? (
                      <img
                        src={fotoProfessorOriginal}
                        alt="Prévia do recorte da foto do professor"
                        className="absolute left-1/2 top-1/2 select-none pointer-events-none"
                        style={{
                          width: `${Math.max(larguraPreviewFotoProfessor, 1)}px`,
                          height: `${Math.max(alturaPreviewFotoProfessor, 1)}px`,
                          transform: `translate(calc(-50% + ${deslocamentoXRecorteFotoProfessor}px), calc(-50% + ${deslocamentoYRecorteFotoProfessor}px)) rotate(${rotacaoRecorteFotoProfessor}deg)`,
                          transformOrigin: 'center center'
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <GraduationCap className="h-10 w-10 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Zoom</label>
                      <input
                        type="range"
                        min={1}
                        max={2.8}
                        step={0.01}
                        value={zoomRecorteFotoProfessor}
                        onChange={(evento) => setZoomRecorteFotoProfessor(Number(evento.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Orientação</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRotacaoRecorteFotoProfessor((valorAtual) => valorAtual - 90)}
                          className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Girar
                        </button>
                        <button
                          type="button"
                          onClick={() => setRotacaoRecorteFotoProfessor((valorAtual) => valorAtual + 90)}
                          className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                          <RotateCw className="h-4 w-4" />
                          Girar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Posição Horizontal</label>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={deslocamentoXRecorteFotoProfessor}
                        onChange={(evento) => setDeslocamentoXRecorteFotoProfessor(Number(evento.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Posição Vertical</label>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={deslocamentoYRecorteFotoProfessor}
                        onChange={(evento) => setDeslocamentoYRecorteFotoProfessor(Number(evento.target.value))}
                        className="w-full accent-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end gap-4">
                  <button
                    onClick={() => setModalRecorteFotoProfessorAberto(false)}
                    className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={aplicarRecorteFotoProfessor}
                    disabled={gerandoFotoProfessorRecortada}
                    className="bg-blue-500 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black px-8 py-4 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {gerandoFotoProfessorRecortada && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {gerandoFotoProfessorRecortada ? 'Aplicando...' : 'Aplicar Foto'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmId && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl overflow-hidden">
                <div className="text-center">
                  <div className="h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                     <AlertTriangle className="h-14 w-14 text-red-500 shrink-0" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Remover Admin?</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                    Esta ação é irreversível. O administrador perderá todo o acesso ao painel instantaneamente.
                  </p>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={async () => {
                        await fetch('/api/admin/delete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: deleteConfirmId })
                        });
                        fetchData();
                        setDeleteConfirmId(null);
                      }}
                      className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-5 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-red-500/20"
                    >
                      Sim, Confirmar
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(null)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all uppercase tracking-widest"
                    >
                      Não, Manter
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all group",
        active 
          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")} />
      {label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number | string, color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
    green: "text-green-500 bg-green-50 dark:bg-green-900/20"
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center group cursor-default">
      <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", colorMap[color])}>
        <Icon className="h-8 w-8" />
      </div>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-4xl font-display font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
    </div>
  );
}

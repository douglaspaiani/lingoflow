export interface Exercise {
  id: string;
  type: 'translate' | 'select' | 'listen' | 'speak' | 'match' | 'reorder';
  question: string;
  answer: string;
  options?: string[];
  pairs?: { left: string; right: string }[];
  xp: number;
}

export interface Lesson {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface Level {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  lessons: Lesson[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  role?: 'ALUNO' | 'ADMIN' | string;
  avatar?: string;
  coverPhoto?: string;
  theme?: string;
  classRoomId?: string | null;
  points: number;
  streak: number;
  level: number;
  xp: number;
  energy: number;
  completedLessons: string[];
  following: string[]; // List of user IDs being followed
  followers: string[]; // List of user IDs following this user
  conquistasDesbloqueadas?: ConquistaDesbloqueada[];
  resumoRecompensasBauTrilha?: ResumoRecompensasBauTrilha;
  lastActivityDate?: string; // ISO date
}

export type TipoRecompensaBauTrilha =
  | 'XP_DOBRO_5_MIN'
  | 'XP_DOBRO_10_MIN'
  | 'XP_DOBRO_20_MIN'
  | 'ENERGIA_5'
  | 'ENERGIA_10';

export type CategoriaRecompensaBauTrilha = 'XP_DOBRO' | 'ENERGIA';

export interface RecompensaBauTrilha {
  id: string;
  numeroBau: number;
  tipo: TipoRecompensaBauTrilha;
  categoria: CategoriaRecompensaBauTrilha;
  valor: number;
  duracaoMinutos: number | null;
  expiraEm: string | null;
  criadoEm: string;
  titulo: string;
  descricao: string;
  cor: string;
  icone: string;
}

export interface ResumoRecompensasBauTrilha {
  licoesConcluidas: number;
  totalBausLiberados: number;
  bausAbertos: number[];
  bausDisponiveis: number[];
  proximoBauNumero: number;
  licoesParaProximoBau: number;
  xpDobroAtivo: boolean;
  xpDobroExpiraEm: string | null;
  xpDobroSegundosRestantes: number;
}

export type TipoRequisitoConquista =
  | 'PONTOS_TOTAIS'
  | 'XP_TOTAL'
  | 'NIVEL_ATUAL'
  | 'OFENSIVA_DIAS'
  | 'LICOES_CONCLUIDAS'
  | 'SEGUINDO_TOTAL'
  | 'SEGUIDORES_TOTAL'
  | 'ACERTOS_TOTAIS'
  | 'RESPOSTAS_TOTAIS'
  | 'JOGOS_CONCLUIDOS';

export interface RequisitoConquista {
  id: string;
  tipo: TipoRequisitoConquista;
  valorMinimo: number;
  ordem: number;
}

export interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  ativa: boolean;
  requisitos: RequisitoConquista[];
}

export interface ConquistaDesbloqueada {
  conquistaId: string;
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  desbloqueadaEm: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  role?: string;
}

export interface Professor {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  roomIds: string[];
  role?: string;
}

export interface JogoFaseImagem {
  id: string;
  nivel: number;
  ordem: number;
  imagem: string;
  traducaoCorreta: string;
  ativo?: boolean;
}

export interface JogoPerguntaBattleMode {
  id: string;
  nivel: number;
  ordem: number;
  pergunta: string;
  opcoes: string[];
  respostaCorreta: string;
  ativo?: boolean;
}

export interface ConfiguracaoBattleMode {
  tipoResposta: string;
  duracaoSegundos: number;
}

export interface JogoPlayground {
  id: string;
  slug: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  fasesImagem: JogoFaseImagem[];
  fasesBattleMode?: JogoPerguntaBattleMode[];
  configuracaoBattleMode?: ConfiguracaoBattleMode | null;
}

export interface SessaoJogoTempoReal {
  id: string;
  jogoId: string;
  turmaId: string;
  professorId: string;
  faseAtualId?: string | null;
  nivelTurma: number;
  status: 'EM_ANDAMENTO' | 'ENCERRADO' | string;
  iniciadaEm: string;
  encerradaEm?: string | null;
}

export interface PlacarJogadorJogo {
  alunoId: string;
  nome: string;
  avatar?: string;
  acertos: number;
  pontos: number;
}

export interface Room {
  id: string;
  name: string;
  level: number;
  studentIds: string[]; // List of user IDs in the room
  code: string; // 5-digit numeric registration code
}

export interface GlobalSettings {
  defaultDailyEnergy: number;
}

export interface AppData {
  users: User[];
  conquistas: Conquista[];
  levels: Level[];
  admins: AdminUser[];
  teachers?: Professor[];
  playgroundGames?: JogoPlayground[];
  rooms: Room[];
  settings: GlobalSettings;
}

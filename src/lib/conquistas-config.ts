export const TIPOS_REQUISITO_CONQUISTA = [
  'PONTOS_TOTAIS',
  'XP_TOTAL',
  'NIVEL_ATUAL',
  'OFENSIVA_DIAS',
  'LICOES_CONCLUIDAS',
  'SEGUINDO_TOTAL',
  'SEGUIDORES_TOTAL',
  'ACERTOS_TOTAIS',
  'RESPOSTAS_TOTAIS',
  'JOGOS_CONCLUIDOS'
] as const;

export type TipoRequisitoConquista = (typeof TIPOS_REQUISITO_CONQUISTA)[number];

export type OpcaoTipoRequisitoConquista = {
  tipo: TipoRequisitoConquista;
  titulo: string;
  descricao: string;
};

export const OPCOES_TIPO_REQUISITO_CONQUISTA: OpcaoTipoRequisitoConquista[] = [
  {
    tipo: 'PONTOS_TOTAIS',
    titulo: 'Pontos totais',
    descricao: 'Desbloqueia quando o aluno atingir o total mínimo de pontos.'
  },
  {
    tipo: 'XP_TOTAL',
    titulo: 'XP total',
    descricao: 'Desbloqueia quando o XP acumulado atingir o valor mínimo.'
  },
  {
    tipo: 'NIVEL_ATUAL',
    titulo: 'Nível atual',
    descricao: 'Desbloqueia quando o aluno atingir o nível configurado.'
  },
  {
    tipo: 'OFENSIVA_DIAS',
    titulo: 'Ofensiva em dias',
    descricao: 'Desbloqueia quando a ofensiva atingir a quantidade mínima de dias.'
  },
  {
    tipo: 'LICOES_CONCLUIDAS',
    titulo: 'Lições concluídas',
    descricao: 'Desbloqueia quando atingir o total mínimo de lições concluídas.'
  },
  {
    tipo: 'SEGUINDO_TOTAL',
    titulo: 'Perfis seguindo',
    descricao: 'Desbloqueia quando o aluno seguir a quantidade mínima de perfis.'
  },
  {
    tipo: 'SEGUIDORES_TOTAL',
    titulo: 'Seguidores',
    descricao: 'Desbloqueia quando o aluno atingir o total mínimo de seguidores.'
  },
  {
    tipo: 'ACERTOS_TOTAIS',
    titulo: 'Acertos totais',
    descricao: 'Desbloqueia quando atingir o total mínimo de acertos registrados.'
  },
  {
    tipo: 'RESPOSTAS_TOTAIS',
    titulo: 'Respostas totais',
    descricao: 'Desbloqueia quando atingir o total mínimo de respostas (acertos + erros).'
  },
  {
    tipo: 'JOGOS_CONCLUIDOS',
    titulo: 'Jogos/atividades concluídos',
    descricao: 'Desbloqueia quando atingir o total mínimo de registros em jogos/atividades.'
  }
];

export const CORES_PREDEFINIDAS_CONQUISTA = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#14B8A6',
  '#EC4899',
  '#6366F1',
  '#0EA5E9',
  '#84CC16'
];

export const ICONES_CONQUISTA_DISPONIVEIS = [
  'Trophy',
  'Star',
  'Flame',
  'Award',
  'Crown',
  'Medal',
  'Target',
  'Rocket',
  'Zap',
  'Sparkles',
  'ShieldCheck',
  'BookOpen',
  'Users',
  'Gem',
  'Heart'
];

export function tipoRequisitoConquistaEhValido(tipo: unknown): tipo is TipoRequisitoConquista {
  return typeof tipo === 'string' && TIPOS_REQUISITO_CONQUISTA.includes(tipo as TipoRequisitoConquista);
}

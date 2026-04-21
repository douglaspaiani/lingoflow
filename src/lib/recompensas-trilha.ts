import {
  CategoriaRecompensaBauTrilha,
  RecompensaBauTrilha,
  ResumoRecompensasBauTrilha,
  TipoRecompensaBauTrilha
} from '@/types';

export const QUANTIDADE_LICOES_POR_BAU_TRILHA = 10;
const MULTIPLICADOR_XP_DOBRO = 2;

export type RegistroRecompensaBauTrilhaPersistido = {
  id: string;
  numeroBau: number;
  tipo: string;
  valor: number;
  duracaoMinutos: number | null;
  expiraEm: Date | null;
  criadoEm: Date;
};

export type ConfiguracaoRecompensaBauTrilha = {
  tipo: TipoRecompensaBauTrilha;
  categoria: CategoriaRecompensaBauTrilha;
  titulo: string;
  descricao: string;
  cor: string;
  icone: string;
  valor: number;
  duracaoMinutos: number | null;
};

export const CONFIGURACOES_RECOMPENSA_BAU_TRILHA: Record<
  TipoRecompensaBauTrilha,
  ConfiguracaoRecompensaBauTrilha
> = {
  XP_DOBRO_5_MIN: {
    tipo: 'XP_DOBRO_5_MIN',
    categoria: 'XP_DOBRO',
    titulo: 'XP em dobro por 5 minutos',
    descricao: 'Você ganhou XP em dobro durante os próximos 5 minutos.',
    cor: '#10B981',
    icone: 'Clock3',
    valor: MULTIPLICADOR_XP_DOBRO,
    duracaoMinutos: 5
  },
  XP_DOBRO_10_MIN: {
    tipo: 'XP_DOBRO_10_MIN',
    categoria: 'XP_DOBRO',
    titulo: 'XP em dobro por 10 minutos',
    descricao: 'Você ganhou XP em dobro durante os próximos 10 minutos.',
    cor: '#059669',
    icone: 'Sparkles',
    valor: MULTIPLICADOR_XP_DOBRO,
    duracaoMinutos: 10
  },
  XP_DOBRO_20_MIN: {
    tipo: 'XP_DOBRO_20_MIN',
    categoria: 'XP_DOBRO',
    titulo: 'XP em dobro por 20 minutos',
    descricao: 'Você ganhou XP em dobro durante os próximos 20 minutos.',
    cor: '#047857',
    icone: 'Rocket',
    valor: MULTIPLICADOR_XP_DOBRO,
    duracaoMinutos: 20
  },
  ENERGIA_5: {
    tipo: 'ENERGIA_5',
    categoria: 'ENERGIA',
    titulo: '+5 de energia',
    descricao: 'Você recebeu +5 de energia para continuar estudando hoje.',
    cor: '#F59E0B',
    icone: 'BatteryCharging',
    valor: 5,
    duracaoMinutos: null
  },
  ENERGIA_10: {
    tipo: 'ENERGIA_10',
    categoria: 'ENERGIA',
    titulo: '+10 de energia',
    descricao: 'Você recebeu +10 de energia para continuar estudando hoje.',
    cor: '#D97706',
    icone: 'Zap',
    valor: 10,
    duracaoMinutos: null
  }
};

const TIPOS_RECOMPENSA_PARA_SORTEIO: TipoRecompensaBauTrilha[] = [
  'XP_DOBRO_5_MIN',
  'XP_DOBRO_10_MIN',
  'XP_DOBRO_20_MIN',
  'ENERGIA_5',
  'ENERGIA_10'
];

const TIPO_RECOMPENSA_PADRAO: TipoRecompensaBauTrilha = 'XP_DOBRO_10_MIN';

function numeroInteiroPositivo(valor: unknown) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  return Math.floor(numero);
}

function normalizarTipoRecompensaBauTrilha(valor: unknown): TipoRecompensaBauTrilha | null {
  if (typeof valor !== 'string') return null;

  if (valor in CONFIGURACOES_RECOMPENSA_BAU_TRILHA) {
    return valor as TipoRecompensaBauTrilha;
  }

  return null;
}

function ordenarListaNumerosSemDuplicidade(listaNumeros: number[]) {
  const conjuntoNumeros = new Set(
    listaNumeros
      .map((numero) => numeroInteiroPositivo(numero))
      .filter((numero) => numero > 0)
  );

  return Array.from(conjuntoNumeros).sort((numeroA, numeroB) => numeroA - numeroB);
}

export function obterConfiguracaoRecompensaBauTrilha(tipoRecebido: unknown) {
  const tipoNormalizado = normalizarTipoRecompensaBauTrilha(tipoRecebido) || TIPO_RECOMPENSA_PADRAO;
  return CONFIGURACOES_RECOMPENSA_BAU_TRILHA[tipoNormalizado];
}

export function sortearTipoRecompensaBauTrilha() {
  const indiceSorteado = Math.floor(Math.random() * TIPOS_RECOMPENSA_PARA_SORTEIO.length);
  return TIPOS_RECOMPENSA_PARA_SORTEIO[indiceSorteado] || TIPO_RECOMPENSA_PADRAO;
}

export function recompensaBauEhXpDobro(tipoRecebido: unknown) {
  const configuracao = obterConfiguracaoRecompensaBauTrilha(tipoRecebido);
  return configuracao.categoria === 'XP_DOBRO';
}

export function obterEstadoXpDobroAtivo(
  recompensas: RegistroRecompensaBauTrilhaPersistido[],
  instanteReferencia = new Date()
) {
  let dataExpiracaoMaisDistante: Date | null = null;

  for (const recompensa of recompensas) {
    if (!recompensaBauEhXpDobro(recompensa.tipo)) continue;
    if (!recompensa.expiraEm) continue;
    if (recompensa.expiraEm <= instanteReferencia) continue;

    if (!dataExpiracaoMaisDistante || recompensa.expiraEm > dataExpiracaoMaisDistante) {
      dataExpiracaoMaisDistante = recompensa.expiraEm;
    }
  }

  if (!dataExpiracaoMaisDistante) {
    return {
      xpDobroAtivo: false,
      xpDobroExpiraEm: null,
      xpDobroSegundosRestantes: 0
    };
  }

  const segundosRestantes = Math.max(
    0,
    Math.floor((dataExpiracaoMaisDistante.getTime() - instanteReferencia.getTime()) / 1000)
  );

  return {
    xpDobroAtivo: segundosRestantes > 0,
    xpDobroExpiraEm: dataExpiracaoMaisDistante.toISOString(),
    xpDobroSegundosRestantes: segundosRestantes
  };
}

export function obterMultiplicadorXpPorRecompensasAtivas(
  recompensas: RegistroRecompensaBauTrilhaPersistido[],
  instanteReferencia = new Date()
) {
  const estadoXpDobro = obterEstadoXpDobroAtivo(recompensas, instanteReferencia);
  return estadoXpDobro.xpDobroAtivo ? MULTIPLICADOR_XP_DOBRO : 1;
}

export function calcularResumoRecompensasBauTrilha(parametros: {
  totalLicoesConcluidas: number;
  recompensas: RegistroRecompensaBauTrilhaPersistido[];
  instanteReferencia?: Date;
}): ResumoRecompensasBauTrilha {
  const instanteReferencia = parametros.instanteReferencia || new Date();
  const licoesConcluidas = numeroInteiroPositivo(parametros.totalLicoesConcluidas);
  const totalBausLiberados = Math.floor(licoesConcluidas / QUANTIDADE_LICOES_POR_BAU_TRILHA);
  const bausAbertos = ordenarListaNumerosSemDuplicidade(
    parametros.recompensas.map((recompensa) => recompensa.numeroBau)
  );
  const conjuntoBausAbertos = new Set(bausAbertos);
  const bausDisponiveis: number[] = [];

  // Monta a fila de baús disponíveis a partir dos marcos já liberados e ainda não resgatados.
  for (let numeroBau = 1; numeroBau <= totalBausLiberados; numeroBau += 1) {
    if (!conjuntoBausAbertos.has(numeroBau)) {
      bausDisponiveis.push(numeroBau);
    }
  }

  const progressoNoBlocoAtual = licoesConcluidas % QUANTIDADE_LICOES_POR_BAU_TRILHA;
  const licoesParaProximoBau =
    progressoNoBlocoAtual === 0
      ? QUANTIDADE_LICOES_POR_BAU_TRILHA
      : QUANTIDADE_LICOES_POR_BAU_TRILHA - progressoNoBlocoAtual;

  const estadoXpDobro = obterEstadoXpDobroAtivo(parametros.recompensas, instanteReferencia);

  return {
    licoesConcluidas,
    totalBausLiberados,
    bausAbertos,
    bausDisponiveis,
    proximoBauNumero: totalBausLiberados + 1,
    licoesParaProximoBau,
    xpDobroAtivo: estadoXpDobro.xpDobroAtivo,
    xpDobroExpiraEm: estadoXpDobro.xpDobroExpiraEm,
    xpDobroSegundosRestantes: estadoXpDobro.xpDobroSegundosRestantes
  };
}

export function montarRecompensaBauTrilhaFormatada(
  recompensa: RegistroRecompensaBauTrilhaPersistido
): RecompensaBauTrilha {
  const configuracaoRecompensa = obterConfiguracaoRecompensaBauTrilha(recompensa.tipo);

  return {
    id: recompensa.id,
    numeroBau: numeroInteiroPositivo(recompensa.numeroBau),
    tipo: configuracaoRecompensa.tipo,
    categoria: configuracaoRecompensa.categoria,
    valor: numeroInteiroPositivo(recompensa.valor),
    duracaoMinutos: recompensa.duracaoMinutos ?? null,
    expiraEm: recompensa.expiraEm ? recompensa.expiraEm.toISOString() : null,
    criadoEm: recompensa.criadoEm.toISOString(),
    titulo: configuracaoRecompensa.titulo,
    descricao: configuracaoRecompensa.descricao,
    cor: configuracaoRecompensa.cor,
    icone: configuracaoRecompensa.icone
  };
}

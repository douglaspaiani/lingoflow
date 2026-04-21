import { prisma } from '@/lib/prisma';

export const LIMITE_MAXIMO_FASES_SESSAO = 10;
export const SLUG_JOGO_TRADUZIR_IMAGEM = 'traduzir-imagem';
export const SLUG_JOGO_BATTLE_MODE_V1 = 'battle-mode-v1';
export const NOME_JOGO_BATTLE_MODE_V1 = 'Battle Mode v1 - Jogo de perguntas e respostas';
export const NOME_JOGO_TRADUZIR_IMAGEM = 'Traduza a Imagem';
export const TIPO_RESPOSTA_PADRAO_BATTLE_MODE = 'Frase correta negativa';
export const DURACAO_PADRAO_BATTLE_MODE_SEGUNDOS = 120;

type ConfiguracaoBattleMode = {
  tipoResposta: string;
  duracaoSegundos: number;
};

type DadosPerguntaBattleMode = {
  pergunta: string;
  opcoes: string[];
  tipoResposta: string;
  respostaCorreta: string;
};

export function normalizarTextoComparacao(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
}

export function calcularNivelTurmaPorAlunos(alunos: Array<{ level: number }>) {
  if (alunos.length === 0) return 1;

  const somaNiveis = alunos.reduce((acumulador, aluno) => acumulador + (Number(aluno.level) || 1), 0);
  const media = somaNiveis / alunos.length;
  const nivelArredondado = Math.round(media);

  return Math.min(5, Math.max(1, nivelArredondado));
}

export function normalizarDuracaoBattleModeEmSegundos(valor: number) {
  const duracaoNormalizada = Number.isFinite(valor) ? Math.round(valor) : DURACAO_PADRAO_BATTLE_MODE_SEGUNDOS;
  return Math.min(60 * 60, Math.max(30, duracaoNormalizada));
}

export function converterDuracaoBattleModeParaSegundos(duracaoTexto: string) {
  const valorLimpo = (duracaoTexto || '').trim();
  if (!valorLimpo) return DURACAO_PADRAO_BATTLE_MODE_SEGUNDOS;

  if (/^\d+$/.test(valorLimpo)) {
    return normalizarDuracaoBattleModeEmSegundos(Number(valorLimpo));
  }

  const [minutosTexto, segundosTexto] = valorLimpo.split(':');
  const minutos = Number(minutosTexto);
  const segundos = Number(segundosTexto);
  if (!Number.isFinite(minutos) || !Number.isFinite(segundos)) {
    return DURACAO_PADRAO_BATTLE_MODE_SEGUNDOS;
  }

  const totalSegundos = (minutos * 60) + segundos;
  return normalizarDuracaoBattleModeEmSegundos(totalSegundos);
}

export function formatarDuracaoBattleMode(segundos: number) {
  const totalSegundos = normalizarDuracaoBattleModeEmSegundos(segundos);
  const minutosFormatados = Math.floor(totalSegundos / 60).toString().padStart(2, '0');
  const segundosFormatados = (totalSegundos % 60).toString().padStart(2, '0');
  return `${minutosFormatados}:${segundosFormatados}`;
}

export function lerConfiguracaoBattleMode(descricaoJogo: string | null | undefined): ConfiguracaoBattleMode {
  const configuracaoPadrao: ConfiguracaoBattleMode = {
    tipoResposta: TIPO_RESPOSTA_PADRAO_BATTLE_MODE,
    duracaoSegundos: DURACAO_PADRAO_BATTLE_MODE_SEGUNDOS
  };

  if (!descricaoJogo || typeof descricaoJogo !== 'string') return configuracaoPadrao;

  try {
    const objetoDescricao = JSON.parse(descricaoJogo);
    const tipoResposta =
      typeof objetoDescricao?.tipoResposta === 'string' && objetoDescricao.tipoResposta.trim().length > 0
        ? objetoDescricao.tipoResposta.trim()
        : configuracaoPadrao.tipoResposta;
    const duracaoSegundos = normalizarDuracaoBattleModeEmSegundos(Number(objetoDescricao?.duracaoSegundos));
    return { tipoResposta, duracaoSegundos };
  } catch {
    return configuracaoPadrao;
  }
}

export function serializarConfiguracaoBattleMode(configuracao: Partial<ConfiguracaoBattleMode>) {
  return JSON.stringify({
    tipoResposta:
      typeof configuracao?.tipoResposta === 'string' && configuracao.tipoResposta.trim().length > 0
        ? configuracao.tipoResposta.trim()
        : TIPO_RESPOSTA_PADRAO_BATTLE_MODE,
    duracaoSegundos: normalizarDuracaoBattleModeEmSegundos(Number(configuracao?.duracaoSegundos))
  });
}

export function serializarPerguntaBattleMode(dados: {
  pergunta: string;
  opcoes: string[];
  tipoResposta?: string;
}) {
  return JSON.stringify({
    pergunta: (dados.pergunta || '').trim(),
    opcoes: Array.isArray(dados.opcoes) ? dados.opcoes.map((opcao) => (opcao || '').trim()) : [],
    tipoResposta:
      typeof dados.tipoResposta === 'string' && dados.tipoResposta.trim().length > 0
        ? dados.tipoResposta.trim()
        : TIPO_RESPOSTA_PADRAO_BATTLE_MODE
  });
}

export function lerPerguntaBattleMode(
  fase: { imagem: string; traducaoCorreta: string },
  tipoRespostaPadrao = TIPO_RESPOSTA_PADRAO_BATTLE_MODE
): DadosPerguntaBattleMode {
  const fallback: DadosPerguntaBattleMode = {
    pergunta: '',
    opcoes: [],
    tipoResposta: tipoRespostaPadrao,
    respostaCorreta: (fase.traducaoCorreta || '').trim()
  };

  const imagemBruta = (fase.imagem || '').trim();
  if (!imagemBruta) return fallback;

  try {
    const objeto = JSON.parse(imagemBruta);
    const pergunta = typeof objeto?.pergunta === 'string' ? objeto.pergunta.trim() : '';
    const opcoes = Array.isArray(objeto?.opcoes)
      ? objeto.opcoes
          .map((opcao) => (typeof opcao === 'string' ? opcao.trim() : ''))
          .filter((opcao) => opcao.length > 0)
      : [];
    const tipoResposta =
      typeof objeto?.tipoResposta === 'string' && objeto.tipoResposta.trim().length > 0
        ? objeto.tipoResposta.trim()
        : tipoRespostaPadrao;

    return {
      pergunta,
      opcoes,
      tipoResposta,
      respostaCorreta: (fase.traducaoCorreta || '').trim()
    };
  } catch {
    return fallback;
  }
}

export function calcularCronometroSessaoBattleMode(
  iniciadaEm: string | Date,
  descricaoJogo: string | null | undefined
) {
  const configuracao = lerConfiguracaoBattleMode(descricaoJogo);
  const instanteInicio = new Date(iniciadaEm).getTime();
  const instanteFim = instanteInicio + (configuracao.duracaoSegundos * 1000);
  const segundosRestantes = Math.max(0, Math.ceil((instanteFim - Date.now()) / 1000));

  return {
    tipoResposta: configuracao.tipoResposta,
    duracaoSegundos: configuracao.duracaoSegundos,
    segundosRestantes,
    encerraEm: new Date(instanteFim).toISOString(),
    tempoEsgotado: segundosRestantes <= 0
  };
}

export function aplicarLimitePadraoDeFasesSessao(slugJogo: string, fasesOrdenadas: Array<{ id: string }>) {
  if (slugJogo === SLUG_JOGO_BATTLE_MODE_V1) {
    return fasesOrdenadas;
  }
  return fasesOrdenadas.slice(0, LIMITE_MAXIMO_FASES_SESSAO);
}

export async function escolherFaseAleatoriaPorNivel(
  idJogo: string,
  nivelTurma: number,
  idFaseAtual?: string | null
) {
  const fases = await prisma.playgroundFaseImagem.findMany({
    where: {
      jogoId: idJogo,
      ativo: true
    },
    orderBy: [{ nivel: 'asc' }, { ordem: 'asc' }]
  });

  if (fases.length === 0) return null;

  const selecionarFaseAleatoria = (lista: typeof fases) => {
    if (lista.length === 0) return null;
    const indice = Math.floor(Math.random() * lista.length);
    return lista[indice];
  };

  const fasesNivelExato = fases.filter((fase) => fase.nivel === nivelTurma && fase.id !== idFaseAtual);
  if (fasesNivelExato.length > 0) {
    return selecionarFaseAleatoria(fasesNivelExato);
  }

  const niveisDisponiveis = [...new Set(fases.map((fase) => fase.nivel))].sort(
    (a, b) => Math.abs(a - nivelTurma) - Math.abs(b - nivelTurma)
  );
  const nivelMaisProximo = niveisDisponiveis[0];
  const fasesNivelMaisProximo = fases.filter((fase) => fase.nivel === nivelMaisProximo && fase.id !== idFaseAtual);

  if (fasesNivelMaisProximo.length > 0) {
    return selecionarFaseAleatoria(fasesNivelMaisProximo);
  }

  const fasesSemFiltro = fases.filter((fase) => fase.id !== idFaseAtual);
  return selecionarFaseAleatoria(fasesSemFiltro.length > 0 ? fasesSemFiltro : fases);
}

export async function listarFasesOrdenadasSessaoJogo(idJogo: string, nivelTurma: number) {
  const fases = await prisma.playgroundFaseImagem.findMany({
    where: {
      jogoId: idJogo,
      ativo: true
    },
    orderBy: [{ nivel: 'asc' }, { ordem: 'asc' }, { createdAt: 'asc' }]
  });

  if (fases.length === 0) return [];

  const fasesNivelExato = fases.filter((fase) => fase.nivel === nivelTurma);
  if (fasesNivelExato.length > 0) {
    return fasesNivelExato;
  }

  const niveisDisponiveis = [...new Set(fases.map((fase) => fase.nivel))].sort(
    (a, b) => Math.abs(a - nivelTurma) - Math.abs(b - nivelTurma)
  );
  const nivelMaisProximo = niveisDisponiveis[0];
  return fases.filter((fase) => fase.nivel === nivelMaisProximo);
}

export async function obterPlacarSessaoJogo(idSessao: string) {
  const respostas = await prisma.playgroundRespostaJogo.findMany({
    where: { sessaoId: idSessao },
    include: {
      aluno: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  const mapaPlacar = new Map<
    string,
    { alunoId: string; nome: string; avatar: string; acertos: number; pontos: number }
  >();

  for (const resposta of respostas) {
    const registroAtual = mapaPlacar.get(resposta.alunoId) || {
      alunoId: resposta.aluno.id,
      nome: resposta.aluno.name,
      avatar: resposta.aluno.avatar || '',
      acertos: 0,
      pontos: 0
    };

    registroAtual.pontos += resposta.pontos || 0;
    if (resposta.correta) {
      registroAtual.acertos += 1;
    }

    mapaPlacar.set(resposta.alunoId, registroAtual);
  }

  return [...mapaPlacar.values()].sort((a, b) => b.pontos - a.pontos || b.acertos - a.acertos);
}

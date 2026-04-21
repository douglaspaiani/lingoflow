import { prisma } from '@/lib/prisma';

export const LIMITE_MAXIMO_FASES_SESSAO = 10;

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

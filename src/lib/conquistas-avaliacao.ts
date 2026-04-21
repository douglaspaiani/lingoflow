import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TipoRequisitoConquista } from '@/lib/conquistas-config';

export type ConquistaDesbloqueadaDTO = {
  conquistaId: string;
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  desbloqueadaEm: string;
};

type MetricasConquistaAluno = {
  pontosTotais: number;
  xpTotal: number;
  nivelAtual: number;
  ofensivaDias: number;
  licoesConcluidas: number;
  seguindoTotal: number;
  seguidoresTotal: number;
  acertosTotais: number;
  respostasTotais: number;
  jogosConcluidos: number;
};

function requisitoConquistaAtendido(
  tipo: TipoRequisitoConquista,
  valorMinimo: number,
  metricas: MetricasConquistaAluno
) {
  switch (tipo) {
    case 'PONTOS_TOTAIS':
      return metricas.pontosTotais >= valorMinimo;
    case 'XP_TOTAL':
      return metricas.xpTotal >= valorMinimo;
    case 'NIVEL_ATUAL':
      return metricas.nivelAtual >= valorMinimo;
    case 'OFENSIVA_DIAS':
      return metricas.ofensivaDias >= valorMinimo;
    case 'LICOES_CONCLUIDAS':
      return metricas.licoesConcluidas >= valorMinimo;
    case 'SEGUINDO_TOTAL':
      return metricas.seguindoTotal >= valorMinimo;
    case 'SEGUIDORES_TOTAL':
      return metricas.seguidoresTotal >= valorMinimo;
    case 'ACERTOS_TOTAIS':
      return metricas.acertosTotais >= valorMinimo;
    case 'RESPOSTAS_TOTAIS':
      return metricas.respostasTotais >= valorMinimo;
    case 'JOGOS_CONCLUIDOS':
      return metricas.jogosConcluidos >= valorMinimo;
    default:
      return false;
  }
}

function erroDuplicidadePrisma(erro: unknown) {
  return erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002';
}

function normalizarInteiroPositivo(valor: number) {
  if (!Number.isFinite(valor)) return 0;
  return Math.max(0, Math.floor(valor));
}

export async function listarConquistasDesbloqueadasDoAluno(alunoId: string): Promise<ConquistaDesbloqueadaDTO[]> {
  const registros = await prisma.conquistaAluno.findMany({
    where: { alunoId },
    include: {
      conquista: {
        select: {
          id: true,
          nome: true,
          descricao: true,
          cor: true,
          icone: true
        }
      }
    },
    orderBy: { desbloqueadaEm: 'desc' }
  });

  return registros.map((registro) => ({
    conquistaId: registro.conquista.id,
    nome: registro.conquista.nome,
    descricao: registro.conquista.descricao,
    cor: registro.conquista.cor,
    icone: registro.conquista.icone,
    desbloqueadaEm: registro.desbloqueadaEm.toISOString()
  }));
}

export async function avaliarConquistasParaAluno(alunoId: string): Promise<ConquistaDesbloqueadaDTO[]> {
  const aluno = await prisma.user.findUnique({
    where: { id: alunoId },
    select: {
      id: true,
      role: true,
      points: true,
      xp: true,
      level: true,
      streak: true,
      _count: {
        select: {
          completedLessons: true,
          following: true,
          followers: true
        }
      }
    }
  });

  if (!aluno || (aluno.role || '').toUpperCase() !== 'ALUNO') {
    return [];
  }

  const agregadosResultado = await prisma.resultadoJogoAluno.aggregate({
    where: { alunoId: aluno.id },
    _sum: {
      acertos: true,
      erros: true
    },
    _count: {
      id: true
    }
  });

  const metricasAluno: MetricasConquistaAluno = {
    pontosTotais: normalizarInteiroPositivo(aluno.points),
    xpTotal: normalizarInteiroPositivo(aluno.xp),
    nivelAtual: normalizarInteiroPositivo(aluno.level),
    ofensivaDias: normalizarInteiroPositivo(aluno.streak),
    licoesConcluidas: normalizarInteiroPositivo(aluno._count.completedLessons),
    seguindoTotal: normalizarInteiroPositivo(aluno._count.following),
    seguidoresTotal: normalizarInteiroPositivo(aluno._count.followers),
    acertosTotais: normalizarInteiroPositivo(agregadosResultado._sum.acertos || 0),
    respostasTotais: normalizarInteiroPositivo(
      (agregadosResultado._sum.acertos || 0) + (agregadosResultado._sum.erros || 0)
    ),
    jogosConcluidos: normalizarInteiroPositivo(agregadosResultado._count.id || 0)
  };

  const [conquistasAtivas, conquistasJaDesbloqueadas] = await Promise.all([
    prisma.conquista.findMany({
      where: { ativa: true },
      include: {
        requisitos: {
          orderBy: { ordem: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.conquistaAluno.findMany({
      where: { alunoId: aluno.id },
      select: { conquistaId: true }
    })
  ]);

  const idsJaDesbloqueadas = new Set(conquistasJaDesbloqueadas.map((registro) => registro.conquistaId));

  const conquistasAptas = conquistasAtivas.filter((conquista) => {
    if (idsJaDesbloqueadas.has(conquista.id)) return false;
    if (!conquista.requisitos.length) return false;

    return conquista.requisitos.every((requisito) => {
      return requisitoConquistaAtendido(
        requisito.tipo as TipoRequisitoConquista,
        normalizarInteiroPositivo(requisito.valorMinimo),
        metricasAluno
      );
    });
  });

  if (!conquistasAptas.length) {
    return [];
  }

  // Criação individual para suportar concorrência sem falhar toda a operação em caso de disputa.
  const conquistasDesbloqueadasAgora = await prisma.$transaction(async (transacao) => {
    const desbloqueiosCriados: ConquistaDesbloqueadaDTO[] = [];

    for (const conquista of conquistasAptas) {
      try {
        const desbloqueio = await transacao.conquistaAluno.create({
          data: {
            conquistaId: conquista.id,
            alunoId: aluno.id
          }
        });

        desbloqueiosCriados.push({
          conquistaId: conquista.id,
          nome: conquista.nome,
          descricao: conquista.descricao,
          cor: conquista.cor,
          icone: conquista.icone,
          desbloqueadaEm: desbloqueio.desbloqueadaEm.toISOString()
        });
      } catch (erro) {
        if (erroDuplicidadePrisma(erro)) {
          continue;
        }
        throw erro;
      }
    }

    return desbloqueiosCriados;
  });

  return conquistasDesbloqueadasAgora;
}

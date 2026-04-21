import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import {
  SLUG_JOGO_BATTLE_MODE_V1,
  aplicarLimitePadraoDeFasesSessao,
  calcularCronometroSessaoBattleMode,
  lerPerguntaBattleMode,
  listarFasesOrdenadasSessaoJogo,
  obterPlacarSessaoJogo
} from '@/lib/playground-jogos';
import { enviarEventoSessaoPlayground } from '@/lib/playground-websocket';
import { garantirServidorWebsocketPlayground } from '@/lib/playground-websocket';

export const runtime = 'nodejs';

export async function GET(_: Request, contexto: { params: Promise<{ sessaoId: string }> }) {
  try {
    const usuario = await exigirUsuarioAutenticado();
    const { sessaoId } = await contexto.params;

    if (!sessaoId) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 400 });
    }

    garantirServidorWebsocketPlayground();

    const sessaoBase = await prisma.playgroundSessaoJogo.findUnique({
      where: { id: sessaoId },
      include: {
        jogo: true,
        turma: {
          select: {
            id: true,
            name: true,
            code: true,
            students: {
              where: { role: 'ALUNO' },
              select: {
                id: true,
                name: true,
                avatar: true
              },
              orderBy: { name: 'asc' }
            }
          }
        },
        faseAtual: true,
        professor: {
          select: { id: true, name: true }
        }
      }
    });

    if (!sessaoBase) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }

    let sessao = sessaoBase;

    const podeVisualizar =
      usuario.role === 'ADMIN' ||
      (usuario.role === 'PROFESSOR' && sessao.professorId === usuario.id) ||
      (usuario.role === 'ALUNO' && usuario.classRoomId === sessao.turmaId);

    if (!podeVisualizar) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const sessaoEhBattleMode = sessao.jogo.slug === SLUG_JOGO_BATTLE_MODE_V1;
    let cronometroBattleMode =
      sessaoEhBattleMode
        ? calcularCronometroSessaoBattleMode(sessao.iniciadaEm, sessao.jogo.descricao)
        : null;

    if (
      sessaoEhBattleMode &&
      sessao.status === 'EM_ANDAMENTO' &&
      cronometroBattleMode?.tempoEsgotado
    ) {
      const atualizacaoSessao = await prisma.playgroundSessaoJogo.updateMany({
        where: {
          id: sessao.id,
          status: 'EM_ANDAMENTO'
        },
        data: {
          status: 'ENCERRADO',
          encerradaEm: new Date()
        }
      });

      if (atualizacaoSessao.count > 0) {
        const placarTempoEsgotado = await obterPlacarSessaoJogo(sessao.id);
        enviarEventoSessaoPlayground(sessao.id, 'sessao_encerrada', {
          sessaoId: sessao.id,
          placar: placarTempoEsgotado,
          top3: placarTempoEsgotado.slice(0, 3),
          motivoEncerramento: 'TEMPO_ESGOTADO'
        });
      }

      const sessaoAtualizada = await prisma.playgroundSessaoJogo.findUnique({
        where: { id: sessao.id },
        include: {
          jogo: true,
          turma: {
            select: {
              id: true,
              name: true,
              code: true,
              students: {
                where: { role: 'ALUNO' },
                select: {
                  id: true,
                  name: true,
                  avatar: true
                },
                orderBy: { name: 'asc' }
              }
            }
          },
          faseAtual: true,
          professor: {
            select: { id: true, name: true }
          }
        }
      });

      if (sessaoAtualizada) {
        sessao = sessaoAtualizada;
      }

      cronometroBattleMode = calcularCronometroSessaoBattleMode(sessao.iniciadaEm, sessao.jogo.descricao);
    }

    const placar = await obterPlacarSessaoJogo(sessao.id);

    const exibirTraducaoCorreta = usuario.role === 'PROFESSOR' || usuario.role === 'ADMIN';
    let respostaAlunoFaseAtual = null as null | {
      id: string;
      correta: boolean;
      pontos: number;
      resposta: string;
    };
    let faseAtualParaResposta = sessao.faseAtual;
    let progressoBattleModeAluno:
      | null
      | {
          totalPerguntas: number;
          perguntasRespondidas: number;
          perguntasRestantes: number;
        } = null;

    if (usuario.role === 'ALUNO' && sessaoEhBattleMode) {
      const fasesOrdenadasSessao = await listarFasesOrdenadasSessaoJogo(sessao.jogoId, sessao.nivelTurma);
      const fasesDisponiveisSessao = aplicarLimitePadraoDeFasesSessao(sessao.jogo.slug, fasesOrdenadasSessao);
      const respostasAlunoNaSessao = await prisma.playgroundRespostaJogo.findMany({
        where: {
          sessaoId: sessao.id,
          alunoId: usuario.id
        },
        select: {
          faseId: true
        }
      });

      const idsFasesRespondidas = new Set(respostasAlunoNaSessao.map((resposta) => resposta.faseId));
      const proximaFaseNaoRespondida = fasesDisponiveisSessao.find(
        (faseSessao) => !idsFasesRespondidas.has(faseSessao.id)
      ) || null;
      faseAtualParaResposta = proximaFaseNaoRespondida;
      progressoBattleModeAluno = {
        totalPerguntas: fasesDisponiveisSessao.length,
        perguntasRespondidas: idsFasesRespondidas.size,
        perguntasRestantes: Math.max(0, fasesDisponiveisSessao.length - idsFasesRespondidas.size)
      };
    } else if (usuario.role === 'ALUNO' && sessao.faseAtualId) {
      respostaAlunoFaseAtual = await prisma.playgroundRespostaJogo.findFirst({
        where: {
          sessaoId: sessao.id,
          faseId: sessao.faseAtualId,
          alunoId: usuario.id
        },
        select: {
          id: true,
          correta: true,
          pontos: true,
          resposta: true
        }
      });
    }

    const faseAtualResposta =
      faseAtualParaResposta
        ? (
            sessaoEhBattleMode
              ? (() => {
                  const dadosPergunta = lerPerguntaBattleMode(
                    faseAtualParaResposta,
                    cronometroBattleMode?.tipoResposta
                  );
                  return {
                    id: faseAtualParaResposta.id,
                    nivel: faseAtualParaResposta.nivel,
                    ordem: faseAtualParaResposta.ordem,
                    pergunta: dadosPergunta.pergunta,
                    opcoes: dadosPergunta.opcoes,
                    tipoResposta: dadosPergunta.tipoResposta,
                    respostaCorreta: exibirTraducaoCorreta ? dadosPergunta.respostaCorreta : undefined
                  };
                })()
              : {
                  id: faseAtualParaResposta.id,
                  nivel: faseAtualParaResposta.nivel,
                  ordem: faseAtualParaResposta.ordem,
                  imagem: faseAtualParaResposta.imagem,
                  traducaoCorreta: exibirTraducaoCorreta ? faseAtualParaResposta.traducaoCorreta : undefined
                }
          )
        : null;

    return NextResponse.json({
      sessao: {
        id: sessao.id,
        status: sessao.status,
        nivelTurma: sessao.nivelTurma,
        iniciadaEm: sessao.iniciadaEm,
        encerradaEm: sessao.encerradaEm,
        turma: sessao.turma,
        professor: sessao.professor,
        jogo: {
          id: sessao.jogo.id,
          slug: sessao.jogo.slug,
          nome: sessao.jogo.nome
        },
        cronometro: cronometroBattleMode,
        faseAtual: faseAtualResposta
      },
      placar,
      respostaAlunoFaseAtual,
      progressoBattleModeAluno
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao obter sessão do jogo:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

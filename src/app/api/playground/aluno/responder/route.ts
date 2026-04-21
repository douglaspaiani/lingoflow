import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import {
  SLUG_JOGO_BATTLE_MODE_V1,
  aplicarLimitePadraoDeFasesSessao,
  calcularCronometroSessaoBattleMode,
  lerPerguntaBattleMode,
  listarFasesOrdenadasSessaoJogo,
  normalizarTextoComparacao,
  obterPlacarSessaoJogo
} from '@/lib/playground-jogos';
import { enviarEventoSessaoPlayground, garantirServidorWebsocketPlayground } from '@/lib/playground-websocket';
import { avaliarConquistasParaAluno } from '@/lib/conquistas-avaliacao';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const usuario = await exigirUsuarioAutenticado();
    if (usuario.role !== 'ALUNO') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const corpo = await req.json();
    const idSessao = typeof corpo?.sessaoId === 'string' ? corpo.sessaoId : '';
    const idFaseInformada = typeof corpo?.faseId === 'string' ? corpo.faseId : '';
    const respostaBruta = typeof corpo?.resposta === 'string' ? corpo.resposta : '';
    const resposta = respostaBruta.trim();

    if (!idSessao || !resposta) {
      return NextResponse.json({ error: 'Sessão e resposta são obrigatórias' }, { status: 400 });
    }

    garantirServidorWebsocketPlayground();

    const sessao = await prisma.playgroundSessaoJogo.findUnique({
      where: { id: idSessao },
      include: {
        faseAtual: true,
        jogo: {
          select: {
            id: true,
            slug: true,
            nome: true,
            descricao: true
          }
        }
      }
    });

    if (!sessao) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }

    if (sessao.status !== 'EM_ANDAMENTO') {
      return NextResponse.json({ error: 'A sessão já foi encerrada' }, { status: 400 });
    }

    if (!usuario.classRoomId || usuario.classRoomId !== sessao.turmaId) {
      return NextResponse.json({ error: 'Você não pertence à turma desta sessão' }, { status: 403 });
    }

    const sessaoEhBattleMode = sessao.jogo.slug === SLUG_JOGO_BATTLE_MODE_V1;
    if (sessaoEhBattleMode) {
      const cronometroBattleMode = calcularCronometroSessaoBattleMode(sessao.iniciadaEm, sessao.jogo.descricao);
      if (cronometroBattleMode.tempoEsgotado) {
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
          const placarSessaoEncerrada = await obterPlacarSessaoJogo(idSessao);
          enviarEventoSessaoPlayground(idSessao, 'sessao_encerrada', {
            sessaoId: idSessao,
            placar: placarSessaoEncerrada,
            top3: placarSessaoEncerrada.slice(0, 3),
            motivoEncerramento: 'TEMPO_ESGOTADO'
          });
        }

        return NextResponse.json(
          { error: 'Tempo da sessão esgotado. Aguarde o resultado final do pódio.' },
          { status: 400 }
        );
      }
    }

    let faseDaResposta = sessao.faseAtual;
    let fasesDisponiveisSessaoBattleMode: Array<{ id: string; nivel: number; ordem: number; imagem: string; traducaoCorreta: string }> = [];

    if (sessaoEhBattleMode) {
      if (!idFaseInformada) {
        return NextResponse.json({ error: 'Pergunta inválida para resposta.' }, { status: 400 });
      }

      const fasesOrdenadasSessao = await listarFasesOrdenadasSessaoJogo(sessao.jogoId, sessao.nivelTurma);
      fasesDisponiveisSessaoBattleMode = aplicarLimitePadraoDeFasesSessao(
        sessao.jogo.slug,
        fasesOrdenadasSessao
      );

      const faseValidaNaSessao = fasesDisponiveisSessaoBattleMode.find((fase) => fase.id === idFaseInformada);
      if (!faseValidaNaSessao) {
        return NextResponse.json({ error: 'Pergunta não pertence a esta sessão.' }, { status: 400 });
      }

      faseDaResposta = faseValidaNaSessao;
    }

    if (!faseDaResposta) {
      return NextResponse.json({ error: 'A sessão não possui fase ativa' }, { status: 400 });
    }

    const respostaExistente = await prisma.playgroundRespostaJogo.findFirst({
      where: {
        sessaoId: idSessao,
        faseId: faseDaResposta.id,
        alunoId: usuario.id
      }
    });

    if (respostaExistente) {
      return NextResponse.json({ error: 'Você já respondeu esta fase' }, { status: 400 });
    }

    if (sessaoEhBattleMode) {
      const dadosPergunta = lerPerguntaBattleMode(faseDaResposta);
      if (dadosPergunta.opcoes.length > 0 && !dadosPergunta.opcoes.includes(resposta)) {
        return NextResponse.json({ error: 'A resposta enviada não é uma opção válida.' }, { status: 400 });
      }
    }

    const respostaNormalizada = normalizarTextoComparacao(resposta);
    const traducaoCorretaNormalizada = normalizarTextoComparacao(faseDaResposta.traducaoCorreta);
    const acertou = respostaNormalizada === traducaoCorretaNormalizada;
    const pontos = acertou ? 10 : 0;

    const respostaCriada = await prisma.playgroundRespostaJogo.create({
      data: {
        sessaoId: idSessao,
        faseId: faseDaResposta.id,
        alunoId: usuario.id,
        resposta,
        correta: acertou,
        pontos
      }
    });

    try {
      // O log de resultado não pode bloquear a resposta da fase para o aluno.
      await prisma.resultadoJogoAluno.create({
        data: {
          alunoId: usuario.id,
          origem: 'JOGO_EXTRA',
          jogo: sessao.jogo?.nome || 'Jogo extra',
          acertos: acertou ? 1 : 0,
          erros: acertou ? 0 : 1,
          percentualAcerto: acertou ? 100 : 0,
          sessaoJogoId: idSessao
        }
      });
    } catch (erroRegistroResultadoJogo) {
      console.error('Falha ao registrar resultado de jogo extra:', erroRegistroResultadoJogo);
    }

    const placar = await obterPlacarSessaoJogo(idSessao);
    const novasConquistasDesbloqueadas = await avaliarConquistasParaAluno(usuario.id);
    let proximaPerguntaBattleMode: null | {
      id: string;
      nivel: number;
      ordem: number;
      pergunta: string;
      opcoes: string[];
      tipoResposta: string;
    } = null;
    let progressoBattleModeAluno: null | {
      totalPerguntas: number;
      perguntasRespondidas: number;
      perguntasRestantes: number;
    } = null;

    if (sessaoEhBattleMode) {
      const respostasAlunoNaSessao = await prisma.playgroundRespostaJogo.findMany({
        where: {
          sessaoId: idSessao,
          alunoId: usuario.id
        },
        select: {
          faseId: true
        }
      });
      const idsFasesRespondidas = new Set(respostasAlunoNaSessao.map((respostaAluno) => respostaAluno.faseId));
      const proximaFase = fasesDisponiveisSessaoBattleMode.find(
        (faseSessao) => !idsFasesRespondidas.has(faseSessao.id)
      ) || null;

      if (proximaFase) {
        const dadosProximaPergunta = lerPerguntaBattleMode(proximaFase);
        proximaPerguntaBattleMode = {
          id: proximaFase.id,
          nivel: proximaFase.nivel,
          ordem: proximaFase.ordem,
          pergunta: dadosProximaPergunta.pergunta,
          opcoes: dadosProximaPergunta.opcoes,
          tipoResposta: dadosProximaPergunta.tipoResposta
        };
      }

      progressoBattleModeAluno = {
        totalPerguntas: fasesDisponiveisSessaoBattleMode.length,
        perguntasRespondidas: idsFasesRespondidas.size,
        perguntasRestantes: Math.max(0, fasesDisponiveisSessaoBattleMode.length - idsFasesRespondidas.size)
      };
    }

    enviarEventoSessaoPlayground(idSessao, 'resposta_registrada', {
      sessaoId: idSessao,
      faseId: faseDaResposta.id,
      alunoId: usuario.id,
      nomeAluno: usuario.name,
      acertou,
      pontos,
      placar,
      jogoSlug: sessao.jogo.slug,
      progressoBattleModeAluno
    });

    return NextResponse.json({
      success: true,
      resposta: {
        id: respostaCriada.id,
        correta: respostaCriada.correta,
        pontos: respostaCriada.pontos
      },
      placar,
      proximaPerguntaBattleMode,
      progressoBattleModeAluno,
      novasConquistasDesbloqueadas
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao enviar resposta do jogo:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

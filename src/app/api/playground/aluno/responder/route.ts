import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { normalizarTextoComparacao, obterPlacarSessaoJogo } from '@/lib/playground-jogos';
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
            nome: true
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

    if (!sessao.faseAtual) {
      return NextResponse.json({ error: 'A sessão não possui fase ativa' }, { status: 400 });
    }

    if (!usuario.classRoomId || usuario.classRoomId !== sessao.turmaId) {
      return NextResponse.json({ error: 'Você não pertence à turma desta sessão' }, { status: 403 });
    }

    const respostaExistente = await prisma.playgroundRespostaJogo.findFirst({
      where: {
        sessaoId: idSessao,
        faseId: sessao.faseAtual.id,
        alunoId: usuario.id
      }
    });

    if (respostaExistente) {
      return NextResponse.json({ error: 'Você já respondeu esta fase' }, { status: 400 });
    }

    const respostaNormalizada = normalizarTextoComparacao(resposta);
    const traducaoCorretaNormalizada = normalizarTextoComparacao(sessao.faseAtual.traducaoCorreta);
    const acertou = respostaNormalizada === traducaoCorretaNormalizada;
    const pontos = acertou ? 10 : 0;

    const respostaCriada = await prisma.playgroundRespostaJogo.create({
      data: {
        sessaoId: idSessao,
        faseId: sessao.faseAtual.id,
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

    enviarEventoSessaoPlayground(idSessao, 'resposta_registrada', {
      sessaoId: idSessao,
      faseId: sessao.faseAtual.id,
      alunoId: usuario.id,
      nomeAluno: usuario.name,
      acertou,
      pontos,
      placar
    });

    return NextResponse.json({
      success: true,
      resposta: {
        id: respostaCriada.id,
        correta: respostaCriada.correta,
        pontos: respostaCriada.pontos
      },
      placar,
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

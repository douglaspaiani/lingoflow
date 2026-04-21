import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import {
  LIMITE_MAXIMO_FASES_SESSAO,
  listarFasesOrdenadasSessaoJogo,
  obterPlacarSessaoJogo
} from '@/lib/playground-jogos';
import { enviarEventoSessaoPlayground, garantirServidorWebsocketPlayground } from '@/lib/playground-websocket';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const usuario = await exigirUsuarioAutenticado();
    if (usuario.role !== 'PROFESSOR') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const corpo = await req.json();
    const idSessao = typeof corpo?.sessaoId === 'string' ? corpo.sessaoId : '';
    if (!idSessao) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 400 });
    }

    garantirServidorWebsocketPlayground();

    const sessao = await prisma.playgroundSessaoJogo.findFirst({
      where: {
        id: idSessao,
        professorId: usuario.id
      }
    });

    if (!sessao) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }

    if (sessao.status !== 'EM_ANDAMENTO') {
      return NextResponse.json({ error: 'A sessão já foi encerrada' }, { status: 400 });
    }

    const encerrarSessaoAutomaticamente = async (motivoEncerramento: string) => {
      const sessaoEncerrada = await prisma.playgroundSessaoJogo.update({
        where: { id: idSessao },
        data: {
          status: 'ENCERRADO',
          encerradaEm: new Date()
        }
      });

      const placarSessaoEncerrada = await obterPlacarSessaoJogo(idSessao);
      const top3Podio = placarSessaoEncerrada.slice(0, 3);

      enviarEventoSessaoPlayground(idSessao, 'sessao_encerrada', {
        sessaoId: idSessao,
        placar: placarSessaoEncerrada,
        top3: top3Podio,
        motivoEncerramento
      });

      return NextResponse.json({
        success: true,
        encerrada: true,
        motivoEncerramento,
        sessao: sessaoEncerrada,
        placar: placarSessaoEncerrada,
        top3: top3Podio
      });
    };

    const fasesOrdenadasSessao = await listarFasesOrdenadasSessaoJogo(sessao.jogoId, sessao.nivelTurma);
    const fasesDisponiveisSessao = fasesOrdenadasSessao.slice(0, LIMITE_MAXIMO_FASES_SESSAO);

    if (fasesDisponiveisSessao.length === 0) {
      return await encerrarSessaoAutomaticamente('SEM_FASES_DISPONIVEIS');
    }

    const indiceFaseAtual = fasesDisponiveisSessao.findIndex((fase) => fase.id === sessao.faseAtualId);
    const proximaFase = indiceFaseAtual >= 0 ? fasesDisponiveisSessao[indiceFaseAtual + 1] : fasesDisponiveisSessao[0];

    if (!proximaFase) {
      return await encerrarSessaoAutomaticamente('LIMITE_OU_FIM_DAS_FASES');
    }

    const sessaoAtualizada = await prisma.playgroundSessaoJogo.update({
      where: { id: idSessao },
      data: { faseAtualId: proximaFase.id },
      include: {
        faseAtual: true
      }
    });

    const placar = await obterPlacarSessaoJogo(idSessao);

    enviarEventoSessaoPlayground(idSessao, 'fase_avancada', {
      sessaoId: idSessao,
      faseAtual: sessaoAtualizada.faseAtual
        ? {
            id: sessaoAtualizada.faseAtual.id,
            nivel: sessaoAtualizada.faseAtual.nivel,
            ordem: sessaoAtualizada.faseAtual.ordem,
            imagem: sessaoAtualizada.faseAtual.imagem
          }
        : null,
      placar
    });

    return NextResponse.json({
      success: true,
      faseAtual: sessaoAtualizada.faseAtual,
      placar
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao avançar fase do jogo:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

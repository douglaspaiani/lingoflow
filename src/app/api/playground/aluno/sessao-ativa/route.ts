import { NextResponse } from 'next/server';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { prisma } from '@/lib/prisma';
import {
  SLUG_JOGO_BATTLE_MODE_V1,
  calcularCronometroSessaoBattleMode,
  obterPlacarSessaoJogo
} from '@/lib/playground-jogos';
import { enviarEventoSessaoPlayground, garantirServidorWebsocketPlayground } from '@/lib/playground-websocket';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const usuario = await exigirUsuarioAutenticado();
    if (usuario.role !== 'ALUNO') {
      return NextResponse.json({ sessaoAtiva: null });
    }

    garantirServidorWebsocketPlayground();

    if (!usuario.classRoomId) {
      return NextResponse.json({ sessaoAtiva: null });
    }

    const sessaoAtiva = await prisma.playgroundSessaoJogo.findFirst({
      where: {
        turmaId: usuario.classRoomId,
        status: 'EM_ANDAMENTO'
      },
      include: {
        jogo: {
          select: { slug: true, nome: true, descricao: true }
        },
        faseAtual: {
          select: { id: true, imagem: true, nivel: true, ordem: true }
        }
      },
      orderBy: { iniciadaEm: 'desc' }
    });

    if (!sessaoAtiva) {
      return NextResponse.json({ sessaoAtiva: null });
    }

    const sessaoEhBattleMode = sessaoAtiva.jogo.slug === SLUG_JOGO_BATTLE_MODE_V1;
    const cronometroBattleMode =
      sessaoEhBattleMode
        ? calcularCronometroSessaoBattleMode(sessaoAtiva.iniciadaEm, (sessaoAtiva as any).jogo?.descricao)
        : null;

    if (sessaoEhBattleMode && cronometroBattleMode?.tempoEsgotado) {
      const atualizacaoSessao = await prisma.playgroundSessaoJogo.updateMany({
        where: {
          id: sessaoAtiva.id,
          status: 'EM_ANDAMENTO'
        },
        data: {
          status: 'ENCERRADO',
          encerradaEm: new Date()
        }
      });

      if (atualizacaoSessao.count > 0) {
        const placarSessaoEncerrada = await obterPlacarSessaoJogo(sessaoAtiva.id);
        enviarEventoSessaoPlayground(sessaoAtiva.id, 'sessao_encerrada', {
          sessaoId: sessaoAtiva.id,
          placar: placarSessaoEncerrada,
          top3: placarSessaoEncerrada.slice(0, 3),
          motivoEncerramento: 'TEMPO_ESGOTADO'
        });
      }

      return NextResponse.json({ sessaoAtiva: null });
    }

    return NextResponse.json({
      sessaoAtiva: {
        id: sessaoAtiva.id,
        turmaId: sessaoAtiva.turmaId,
        jogo: sessaoAtiva.jogo,
        cronometro: cronometroBattleMode,
        faseAtual: sessaoAtiva.faseAtual,
        iniciadaEm: sessaoAtiva.iniciadaEm
      }
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao buscar sessão ativa do aluno:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

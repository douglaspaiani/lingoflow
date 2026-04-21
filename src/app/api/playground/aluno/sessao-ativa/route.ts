import { NextResponse } from 'next/server';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { garantirServidorWebsocketPlayground } from '@/lib/playground-websocket';
import { prisma } from '@/lib/prisma';

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
          select: { slug: true, nome: true }
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

    return NextResponse.json({
      sessaoAtiva: {
        id: sessaoAtiva.id,
        turmaId: sessaoAtiva.turmaId,
        jogo: sessaoAtiva.jogo,
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

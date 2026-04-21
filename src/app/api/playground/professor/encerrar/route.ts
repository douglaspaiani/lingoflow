import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { obterPlacarSessaoJogo } from '@/lib/playground-jogos';
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

    const sessaoEncerrada = await prisma.playgroundSessaoJogo.update({
      where: { id: idSessao },
      data: {
        status: 'ENCERRADO',
        encerradaEm: new Date()
      }
    });

    const placar = await obterPlacarSessaoJogo(idSessao);
    const vencedor = placar[0] || null;

    enviarEventoSessaoPlayground(idSessao, 'sessao_encerrada', {
      sessaoId: idSessao,
      placar,
      vencedor
    });

    return NextResponse.json({
      success: true,
      sessao: sessaoEncerrada,
      placar,
      vencedor
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao encerrar sessão de jogo:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

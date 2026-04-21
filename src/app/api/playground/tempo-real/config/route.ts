import { NextResponse } from 'next/server';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { obterPortaServidorWebsocketPlayground } from '@/lib/playground-websocket';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await exigirUsuarioAutenticado();
    const porta = obterPortaServidorWebsocketPlayground();
    return NextResponse.json({ porta });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao obter configuração websocket:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

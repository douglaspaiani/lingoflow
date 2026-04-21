import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { obterPlacarSessaoJogo } from '@/lib/playground-jogos';
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

    const sessao = await prisma.playgroundSessaoJogo.findUnique({
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

    if (!sessao) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    }

    const podeVisualizar =
      usuario.role === 'ADMIN' ||
      (usuario.role === 'PROFESSOR' && sessao.professorId === usuario.id) ||
      (usuario.role === 'ALUNO' && usuario.classRoomId === sessao.turmaId);

    if (!podeVisualizar) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const placar = await obterPlacarSessaoJogo(sessao.id);
    const respostaAlunoFaseAtual =
      usuario.role === 'ALUNO' && sessao.faseAtualId
        ? await prisma.playgroundRespostaJogo.findFirst({
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
          })
        : null;

    const exibirTraducaoCorreta = usuario.role === 'PROFESSOR' || usuario.role === 'ADMIN';

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
        faseAtual: sessao.faseAtual
          ? {
              id: sessao.faseAtual.id,
              nivel: sessao.faseAtual.nivel,
              ordem: sessao.faseAtual.ordem,
              imagem: sessao.faseAtual.imagem,
              traducaoCorreta: exibirTraducaoCorreta ? sessao.faseAtual.traducaoCorreta : undefined
            }
          : null
      },
      placar,
      respostaAlunoFaseAtual
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao obter sessão do jogo:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

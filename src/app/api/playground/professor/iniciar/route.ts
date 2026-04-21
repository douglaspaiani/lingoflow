import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import {
  calcularNivelTurmaPorAlunos,
  LIMITE_MAXIMO_FASES_SESSAO,
  listarFasesOrdenadasSessaoJogo
} from '@/lib/playground-jogos';
import { enviarEventoSessaoPlayground, garantirServidorWebsocketPlayground } from '@/lib/playground-websocket';

export const runtime = 'nodejs';

const SLUG_JOGO_PADRAO = 'traduzir-imagem';

export async function POST(req: Request) {
  try {
    const usuario = await exigirUsuarioAutenticado();
    if (usuario.role !== 'PROFESSOR') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const corpo = await req.json();
    const idTurma = typeof corpo?.turmaId === 'string' ? corpo.turmaId : '';
    const slugJogo = typeof corpo?.jogoSlug === 'string' ? corpo.jogoSlug : SLUG_JOGO_PADRAO;

    if (!idTurma) {
      return NextResponse.json({ error: 'Selecione uma turma' }, { status: 400 });
    }

    garantirServidorWebsocketPlayground();

    const turma = await prisma.classRoom.findFirst({
      where: {
        id: idTurma,
        adminId: usuario.id
      },
      select: {
        id: true,
        students: {
          where: { role: 'ALUNO' },
          select: { id: true, level: true }
        }
      }
    });

    if (!turma) {
      return NextResponse.json({ error: 'Turma não encontrada para este professor' }, { status: 404 });
    }

    const jogo = await prisma.playgroundJogo.findUnique({
      where: { slug: slugJogo }
    });

    if (!jogo || !jogo.ativo) {
      return NextResponse.json({ error: 'Jogo indisponível' }, { status: 404 });
    }

    // Evita dependência de coluna antiga/ausente da tabela ClassRoom.
    const nivelTurma = calcularNivelTurmaPorAlunos(turma.students);
    const fasesOrdenadasSessao = await listarFasesOrdenadasSessaoJogo(jogo.id, nivelTurma);
    const fasesLimiteSessao = fasesOrdenadasSessao.slice(0, LIMITE_MAXIMO_FASES_SESSAO);
    const faseInicial = fasesLimiteSessao[0] || null;

    if (!faseInicial) {
      return NextResponse.json({ error: 'Não há fases cadastradas para iniciar o jogo.' }, { status: 400 });
    }

    await prisma.playgroundSessaoJogo.updateMany({
      where: {
        turmaId: turma.id,
        status: 'EM_ANDAMENTO'
      },
      data: {
        status: 'ENCERRADO',
        encerradaEm: new Date()
      }
    });

    const sessao = await prisma.playgroundSessaoJogo.create({
      data: {
        jogoId: jogo.id,
        turmaId: turma.id,
        professorId: usuario.id,
        faseAtualId: faseInicial.id,
        nivelTurma,
        status: 'EM_ANDAMENTO'
      },
      include: {
        faseAtual: true
      }
    });

    enviarEventoSessaoPlayground(sessao.id, 'sessao_iniciada', {
      sessaoId: sessao.id,
      turmaId: turma.id,
      jogoSlug: jogo.slug,
      nivelTurma: sessao.nivelTurma,
      faseAtual: sessao.faseAtual
        ? {
            id: sessao.faseAtual.id,
            nivel: sessao.faseAtual.nivel,
            ordem: sessao.faseAtual.ordem,
            imagem: sessao.faseAtual.imagem
          }
        : null
    });

    return NextResponse.json({
      success: true,
      sessao: {
        id: sessao.id,
        jogoId: sessao.jogoId,
        turmaId: sessao.turmaId,
        professorId: sessao.professorId,
        faseAtualId: sessao.faseAtualId,
        nivelTurma: sessao.nivelTurma,
        status: sessao.status,
        iniciadaEm: sessao.iniciadaEm,
        faseAtual: sessao.faseAtual
      }
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao iniciar sessão de jogo:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

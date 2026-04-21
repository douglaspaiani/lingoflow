import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { calcularNivelTurmaPorAlunos } from '@/lib/playground-jogos';
import { garantirServidorWebsocketPlayground } from '@/lib/playground-websocket';

export const runtime = 'nodejs';

const SLUG_JOGO_TRADUZIR_IMAGEM = 'traduzir-imagem';

export async function GET() {
  try {
    const usuario = await exigirUsuarioAutenticado();
    if (usuario.role !== 'PROFESSOR') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    garantirServidorWebsocketPlayground();

    const turmas = await prisma.classRoom.findMany({
      where: { adminId: usuario.id },
      select: {
        id: true,
        name: true,
        code: true,
        students: {
          where: { role: 'ALUNO' },
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            level: true,
            streak: true,
            xp: true,
            points: true,
            energy: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const jogo = await prisma.playgroundJogo.findUnique({
      where: { slug: SLUG_JOGO_TRADUZIR_IMAGEM },
      include: {
        fasesImagem: {
          where: { ativo: true },
          select: { id: true, nivel: true }
        }
      }
    });

    const sessoesAtivas = await prisma.playgroundSessaoJogo.findMany({
      where: {
        professorId: usuario.id,
        status: 'EM_ANDAMENTO'
      },
      select: {
        id: true,
        turmaId: true,
        jogoId: true,
        faseAtualId: true,
        nivelTurma: true,
        iniciadaEm: true
      },
      orderBy: { iniciadaEm: 'desc' }
    });

    return NextResponse.json({
      appUrl: process.env.APP_URL || '',
      professor: {
        id: usuario.id,
        name: usuario.name,
        username: usuario.username,
        avatar: usuario.avatar || ''
      },
      turmas: turmas.map((turma) => ({
        id: turma.id,
        name: turma.name,
        code: turma.code,
        // Evita dependência de coluna antiga/ausente da tabela ClassRoom
        nivelTurma: calcularNivelTurmaPorAlunos(turma.students),
        alunos: turma.students
      })),
      jogos: jogo
        ? [
            {
              id: jogo.id,
              slug: jogo.slug,
              nome: jogo.nome,
              descricao: jogo.descricao || '',
              totalFases: jogo.fasesImagem.length,
              niveisDisponiveis: [...new Set(jogo.fasesImagem.map((fase) => fase.nivel))].sort((a, b) => a - b)
            }
          ]
        : [],
      sessoesAtivas
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao carregar painel do professor:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';

export const runtime = 'nodejs';

export async function GET(_: Request, contexto: { params: Promise<{ alunoId: string }> }) {
  try {
    const usuario = await exigirUsuarioAutenticado();
    if ((usuario.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { alunoId } = await contexto.params;
    if (!alunoId) {
      return NextResponse.json({ error: 'Aluno inválido' }, { status: 400 });
    }

    const aluno = await prisma.user.findFirst({
      where: {
        id: alunoId,
        role: 'ALUNO'
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true
      }
    });

    if (!aluno) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
    }

    const historicoResultados = await prisma.resultadoJogoAluno.findMany({
      where: { alunoId },
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        origem: true,
        jogo: true,
        acertos: true,
        erros: true,
        percentualAcerto: true,
        lessonId: true,
        sessaoJogoId: true,
        criadoEm: true
      }
    });

    const totalAcertos = historicoResultados.reduce((acumulador, item) => acumulador + (Number(item.acertos) || 0), 0);
    const totalErros = historicoResultados.reduce((acumulador, item) => acumulador + (Number(item.erros) || 0), 0);
    const totalRespostas = totalAcertos + totalErros;
    const porcentagemTotal = totalRespostas > 0 ? Number(((totalAcertos / totalRespostas) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      aluno: {
        id: aluno.id,
        nome: aluno.name,
        usuario: aluno.username,
        avatar: aluno.avatar || ''
      },
      resumo: {
        totalAcertos,
        totalErros,
        totalRespostas,
        porcentagemTotal,
        totalRegistros: historicoResultados.length
      },
      historico: historicoResultados.map((item) => ({
        id: item.id,
        origem: item.origem,
        jogo: item.jogo,
        acertos: item.acertos,
        erros: item.erros,
        porcentagemAcerto: Number(item.percentualAcerto || 0),
        lessonId: item.lessonId,
        sessaoJogoId: item.sessaoJogoId,
        horario: item.criadoEm
      }))
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    console.error('Erro ao buscar relatório do aluno:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

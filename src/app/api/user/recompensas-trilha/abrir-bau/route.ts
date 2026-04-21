import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import {
  QUANTIDADE_LICOES_POR_BAU_TRILHA,
  calcularResumoRecompensasBauTrilha,
  montarRecompensaBauTrilhaFormatada,
  obterConfiguracaoRecompensaBauTrilha,
  sortearTipoRecompensaBauTrilha
} from '@/lib/recompensas-trilha';

class ErroRegraRecompensaTrilha extends Error {
  status: number;

  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

function extrairNumeroBauSolicitado(corpoRequisicao: unknown) {
  if (!corpoRequisicao || typeof corpoRequisicao !== 'object') {
    return null;
  }

  const numeroBauRecebido = (corpoRequisicao as { numeroBau?: unknown }).numeroBau;
  if (typeof numeroBauRecebido !== 'number' || !Number.isFinite(numeroBauRecebido)) {
    return null;
  }

  return Math.floor(numeroBauRecebido);
}

function buscarPrimeiroBauDisponivel(totalBausLiberados: number, conjuntoBausJaAbertos: Set<number>) {
  for (let numeroBau = 1; numeroBau <= totalBausLiberados; numeroBau += 1) {
    if (!conjuntoBausJaAbertos.has(numeroBau)) {
      return numeroBau;
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const usuarioLogado = await exigirUsuarioAutenticado();
    if ((usuarioLogado.role || '').toUpperCase() !== 'ALUNO') {
      return NextResponse.json(
        { error: 'Somente alunos podem abrir os baús da trilha.' },
        { status: 403 }
      );
    }

    const corpoRequisicao = await req.json().catch(() => null);
    const numeroBauSolicitado = extrairNumeroBauSolicitado(corpoRequisicao);

    const resultadoResgate = await prisma.$transaction(async (transacao) => {
      const [totalLicoesConcluidas, recompensasJaResgatadas] = await Promise.all([
        transacao.userLesson.count({
          where: { userId: usuarioLogado.id }
        }),
        transacao.recompensaBauTrilhaAluno.findMany({
          where: { alunoId: usuarioLogado.id },
          orderBy: { criadoEm: 'asc' },
          select: {
            id: true,
            numeroBau: true,
            tipo: true,
            valor: true,
            duracaoMinutos: true,
            expiraEm: true,
            criadoEm: true
          }
        })
      ]);

      const totalBausLiberados = Math.floor(totalLicoesConcluidas / QUANTIDADE_LICOES_POR_BAU_TRILHA);
      if (totalBausLiberados <= 0) {
        throw new ErroRegraRecompensaTrilha(
          'Conclua 10 lições para liberar o primeiro baú da trilha.',
          400
        );
      }

      const conjuntoBausJaAbertos = new Set(recompensasJaResgatadas.map((item) => item.numeroBau));
      const numeroBauAlvo =
        numeroBauSolicitado && numeroBauSolicitado > 0
          ? numeroBauSolicitado
          : buscarPrimeiroBauDisponivel(totalBausLiberados, conjuntoBausJaAbertos);

      if (!numeroBauAlvo) {
        throw new ErroRegraRecompensaTrilha(
          'Todos os baús liberados já foram abertos. Continue avançando na trilha para ganhar novos!',
          409
        );
      }

      if (numeroBauAlvo > totalBausLiberados) {
        throw new ErroRegraRecompensaTrilha(
          `Esse baú ainda não foi liberado. Conclua ${numeroBauAlvo * QUANTIDADE_LICOES_POR_BAU_TRILHA} lições para abrir.`,
          400
        );
      }

      if (conjuntoBausJaAbertos.has(numeroBauAlvo)) {
        throw new ErroRegraRecompensaTrilha('Este baú já foi aberto.', 409);
      }

      const tipoRecompensaSorteada = sortearTipoRecompensaBauTrilha();
      const configuracaoRecompensa = obterConfiguracaoRecompensaBauTrilha(tipoRecompensaSorteada);
      const agora = new Date();
      const expiraEmRecompensa =
        configuracaoRecompensa.categoria === 'XP_DOBRO' && configuracaoRecompensa.duracaoMinutos
          ? new Date(agora.getTime() + configuracaoRecompensa.duracaoMinutos * 60_000)
          : null;

      const recompensaCriada = await transacao.recompensaBauTrilhaAluno.create({
        data: {
          alunoId: usuarioLogado.id,
          numeroBau: numeroBauAlvo,
          tipo: configuracaoRecompensa.tipo,
          valor: configuracaoRecompensa.valor,
          duracaoMinutos: configuracaoRecompensa.duracaoMinutos,
          expiraEm: expiraEmRecompensa
        },
        select: {
          id: true,
          numeroBau: true,
          tipo: true,
          valor: true,
          duracaoMinutos: true,
          expiraEm: true,
          criadoEm: true
        }
      });

      if (configuracaoRecompensa.categoria === 'ENERGIA' && configuracaoRecompensa.valor > 0) {
        await transacao.user.update({
          where: { id: usuarioLogado.id },
          data: {
            energy: { increment: configuracaoRecompensa.valor }
          }
        });
      }

      const resumoRecompensasBauTrilha = calcularResumoRecompensasBauTrilha({
        totalLicoesConcluidas,
        recompensas: [...recompensasJaResgatadas, recompensaCriada]
      });

      return {
        recompensa: montarRecompensaBauTrilhaFormatada(recompensaCriada),
        resumoRecompensasBauTrilha
      };
    });

    return NextResponse.json({
      success: true,
      recompensa: resultadoResgate.recompensa,
      resumoRecompensasBauTrilha: resultadoResgate.resumoRecompensasBauTrilha
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }

    if (erro instanceof ErroRegraRecompensaTrilha) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }

    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Este baú já foi aberto por esta conta.' },
        { status: 409 }
      );
    }

    console.error('Erro ao abrir baú da trilha:', erro);
    return NextResponse.json(
      { error: 'Erro ao abrir baú da trilha.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { avaliarConquistasParaAluno } from '@/lib/conquistas-avaliacao';
import {
  calcularResumoRecompensasBauTrilha,
  obterMultiplicadorXpPorRecompensasAtivas
} from '@/lib/recompensas-trilha';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

function converterNumeroSeguro(valor: unknown, padrao = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function erroRelacionamentoOpcionalDeUsuarioIndisponivel(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : '';
  return (
    mensagem.includes('Unknown field `conquistasDesbloqueadas`') ||
    mensagem.includes('Unknown field `recompensasBauTrilha`')
  );
}

async function buscarUsuarioAtualizadoComFallback(idUsuario: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: idUsuario },
      include: {
        completedLessons: true,
        following: true,
        followers: true,
        recompensasBauTrilha: {
          select: {
            id: true,
            numeroBau: true,
            tipo: true,
            valor: true,
            duracaoMinutos: true,
            expiraEm: true,
            criadoEm: true
          },
          orderBy: {
            criadoEm: 'asc'
          }
        },
        conquistasDesbloqueadas: {
          include: {
            conquista: {
              select: {
                id: true,
                nome: true,
                descricao: true,
                cor: true,
                icone: true
              }
            }
          },
          orderBy: {
            desbloqueadaEm: 'desc'
          }
        }
      }
    });
  } catch (erro) {
    if (!erroRelacionamentoOpcionalDeUsuarioIndisponivel(erro)) {
      throw erro;
    }

    // Fallback de compatibilidade para client Prisma antigo em memória.
    return prisma.user.findUnique({
      where: { id: idUsuario },
      include: {
        completedLessons: true,
        following: true,
        followers: true
      }
    });
  }
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = payload.id as string;

    const corpoRequisicao = await req.json();
    const xpToAdd = converterNumeroSeguro(corpoRequisicao?.xpToAdd, 0);
    const lessonId = typeof corpoRequisicao?.lessonId === 'string' ? corpoRequisicao.lessonId : '';
    const acertos = Math.max(0, converterNumeroSeguro(corpoRequisicao?.acertos, 0));
    const erros = Math.max(0, converterNumeroSeguro(corpoRequisicao?.erros, 0));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const cargoUsuarioNormalizado = (user.role || '').toUpperCase();
    const energiaIlimitada = cargoUsuarioNormalizado === 'ADMIN' || cargoUsuarioNormalizado === 'PROFESSOR';

    if (!energiaIlimitada && user.energy <= 0) {
      return NextResponse.json({ error: 'Sem energia suficiente para completar lição' }, { status: 403 });
    }

    const recompensasXpAtivas = await prisma.recompensaBauTrilhaAluno.findMany({
      where: {
        alunoId: userId,
        expiraEm: {
          gt: new Date()
        },
        tipo: {
          in: ['XP_DOBRO_5_MIN', 'XP_DOBRO_10_MIN', 'XP_DOBRO_20_MIN']
        }
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

    const multiplicadorXp =
      cargoUsuarioNormalizado === 'ALUNO'
        ? obterMultiplicadorXpPorRecompensasAtivas(recompensasXpAtivas)
        : 1;
    const xpAAdicionarAjustado = Math.max(0, Math.floor(xpToAdd * multiplicadorXp));

    // Update User
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(energiaIlimitada ? {} : { energy: { decrement: 1 } }),
        points: { increment: xpAAdicionarAjustado },
        xp: { increment: xpAAdicionarAjustado },
      },
    });

    if (lessonId) {
      try {
        // Registra a lição concluída sem interromper o progresso em caso de falha pontual.
        await prisma.userLesson.upsert({
          where: {
            userId_lessonId: {
              userId,
              lessonId
            }
          },
          update: {},
          create: {
            userId,
            lessonId
          }
        });
      } catch (erroRegistroLicao) {
        console.error('Falha ao registrar conclusão da lição:', erroRegistroLicao);
      }

      if ((user.role || '').toUpperCase() === 'ALUNO') {
        try {
          const licao = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { title: true }
          });

          const totalRespostas = acertos + erros;
          const percentualAcerto = totalRespostas > 0 ? Number(((acertos / totalRespostas) * 100).toFixed(2)) : 0;

          await prisma.resultadoJogoAluno.create({
            data: {
              alunoId: userId,
              origem: 'APP_PRINCIPAL',
              jogo: licao?.title?.trim() || 'Atividade principal',
              acertos,
              erros,
              percentualAcerto,
              lessonId
            }
          });
        } catch (erroRegistroResultado) {
          console.error('Falha ao registrar resultado da atividade principal:', erroRegistroResultado);
        }
      }
    }

    let novasConquistasDesbloqueadas: any[] = [];
    try {
      novasConquistasDesbloqueadas = await avaliarConquistasParaAluno(userId);
    } catch (erroAvaliacaoConquista) {
      console.error('Falha ao avaliar conquistas no update-progress:', erroAvaliacaoConquista);
      novasConquistasDesbloqueadas = [];
    }

    const usuarioAtualizadoCompleto = await buscarUsuarioAtualizadoComFallback(userId);

    if (!usuarioAtualizadoCompleto) {
      return NextResponse.json({ error: 'Usuário não encontrado após atualização' }, { status: 404 });
    }

    const resumoRecompensasBauTrilha = calcularResumoRecompensasBauTrilha({
      totalLicoesConcluidas: usuarioAtualizadoCompleto.completedLessons.length,
      recompensas: Array.isArray((usuarioAtualizadoCompleto as any).recompensasBauTrilha)
        ? (usuarioAtualizadoCompleto as any).recompensasBauTrilha
        : []
    });

    const formattedUser = {
      role: usuarioAtualizadoCompleto.role,
      id: usuarioAtualizadoCompleto.id,
      name: usuarioAtualizadoCompleto.name,
      username: usuarioAtualizadoCompleto.username,
      avatar: usuarioAtualizadoCompleto.avatar || '',
      coverPhoto: usuarioAtualizadoCompleto.coverPhoto || '',
      classRoomId: usuarioAtualizadoCompleto.classRoomId,
      points: usuarioAtualizadoCompleto.points,
      streak: usuarioAtualizadoCompleto.streak,
      level: usuarioAtualizadoCompleto.level,
      xp: usuarioAtualizadoCompleto.xp,
      energy: usuarioAtualizadoCompleto.energy,
      completedLessons: usuarioAtualizadoCompleto.completedLessons.map(cl => cl.lessonId) || [],
      following: usuarioAtualizadoCompleto.following.map(f => f.followingId) || [],
      followers: usuarioAtualizadoCompleto.followers.map(f => f.followerId) || [],
      resumoRecompensasBauTrilha,
      conquistasDesbloqueadas: (Array.isArray((usuarioAtualizadoCompleto as any).conquistasDesbloqueadas)
        ? (usuarioAtualizadoCompleto as any).conquistasDesbloqueadas
        : []
      ).map((registro: any) => ({
        conquistaId: registro.conquista.id,
        nome: registro.conquista.nome,
        descricao: registro.conquista.descricao,
        cor: registro.conquista.cor,
        icone: registro.conquista.icone,
        desbloqueadaEm: registro.desbloqueadaEm.toISOString()
      }))
    };

    if (lessonId && !formattedUser.completedLessons.includes(lessonId)) {
      formattedUser.completedLessons.push(lessonId);
    }

    return NextResponse.json({
      user: formattedUser,
      novasConquistasDesbloqueadas,
      xpRecebidoBase: xpToAdd,
      multiplicadorXpAplicado: multiplicadorXp,
      xpRecebidoFinal: xpAAdicionarAjustado
    });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

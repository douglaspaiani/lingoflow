import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { avaliarConquistasParaAluno } from '@/lib/conquistas-avaliacao';
import { calcularResumoRecompensasBauTrilha } from '@/lib/recompensas-trilha';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

function erroRelacionamentoOpcionalDeUsuarioIndisponivel(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : '';
  return (
    mensagem.includes('Unknown field `conquistasDesbloqueadas`') ||
    mensagem.includes('Unknown field `recompensasBauTrilha`')
  );
}

async function buscarUsuarioParaSessao(idUsuario: string) {
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

export async function GET() {
  try {
    const token = (await cookies()).get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    if (!payload.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const idUsuario = payload.id as string;
    let novasConquistasDesbloqueadas: any[] = [];
    try {
      novasConquistasDesbloqueadas = await avaliarConquistasParaAluno(idUsuario);
    } catch (erroAvaliacaoConquista) {
      console.error('Falha ao avaliar conquistas no /api/auth/me:', erroAvaliacaoConquista);
      novasConquistasDesbloqueadas = [];
    }

    const user = await buscarUsuarioParaSessao(payload.id as string);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const resumoRecompensasBauTrilha = calcularResumoRecompensasBauTrilha({
      totalLicoesConcluidas: user.completedLessons.length,
      recompensas: Array.isArray((user as any).recompensasBauTrilha) ? (user as any).recompensasBauTrilha : []
    });

    const formattedUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      avatar: user.avatar || '',
      coverPhoto: user.coverPhoto || '',
      classRoomId: user.classRoomId,
      points: user.points,
      streak: user.streak,
      level: user.level,
      xp: user.xp,
      energy: user.energy,
      completedLessons: user.completedLessons.map(cl => cl.lessonId),
      following: user.following.map(f => f.followingId),
      followers: user.followers.map(f => f.followerId),
      resumoRecompensasBauTrilha,
      conquistasDesbloqueadas: (Array.isArray((user as any).conquistasDesbloqueadas)
        ? (user as any).conquistasDesbloqueadas
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

    return NextResponse.json({ user: formattedUser, novasConquistasDesbloqueadas });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
}

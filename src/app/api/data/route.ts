import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calcularNivelTurmaPorAlunos } from '@/lib/playground-jogos';

function erroRelacionamentoConquistaIndisponivelNoUsuario(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : '';
  return mensagem.includes('Unknown field `conquistasDesbloqueadas`');
}

async function listarAlunosParaPainel() {
  try {
    return await prisma.user.findMany({
      where: { role: 'ALUNO' },
      include: {
        completedLessons: true,
        following: true,
        followers: true,
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
    if (!erroRelacionamentoConquistaIndisponivelNoUsuario(erro)) {
      throw erro;
    }

    // Fallback de compatibilidade para client Prisma antigo em memória.
    return prisma.user.findMany({
      where: { role: 'ALUNO' },
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
    const users = await listarAlunosParaPainel();

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar || '',
      coverPhoto: u.coverPhoto || '',
      classRoomId: u.classRoomId,
      points: u.points,
      streak: u.streak,
      level: u.level,
      xp: u.xp,
      energy: u.energy,
      completedLessons: u.completedLessons.map(cl => cl.lessonId),
      following: u.following.map(f => f.followingId),
      followers: u.followers.map(f => f.followerId),
      conquistasDesbloqueadas: (Array.isArray((u as any).conquistasDesbloqueadas)
        ? (u as any).conquistasDesbloqueadas
        : []
      ).map((registro: any) => ({
        conquistaId: registro.conquista.id,
        nome: registro.conquista.nome,
        descricao: registro.conquista.descricao,
        cor: registro.conquista.cor,
        icone: registro.conquista.icone,
        desbloqueadaEm: registro.desbloqueadaEm.toISOString()
      }))
    }));

    const conquistas = await prisma.conquista.findMany({
      include: {
        requisitos: {
          orderBy: { ordem: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const conquistasFormatadas = conquistas.map((conquista) => ({
      id: conquista.id,
      nome: conquista.nome,
      descricao: conquista.descricao,
      cor: conquista.cor,
      icone: conquista.icone,
      ativa: conquista.ativa,
      requisitos: conquista.requisitos.map((requisito) => ({
        id: requisito.id,
        tipo: requisito.tipo,
        valorMinimo: requisito.valorMinimo,
        ordem: requisito.ordem
      }))
    }));

    const levels = await prisma.level.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        lessons: {
          orderBy: { createdAt: 'asc' },
          include: {
            exercises: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });

    const formattedLevels = levels.map(l => ({
      id: l.id,
      title: l.title,
      description: l.description,
      difficulty: l.difficulty,
      lessons: l.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        exercises: lesson.exercises.map(ex => ({
          id: ex.id,
          type: ex.type,
          question: ex.question,
          answer: ex.answer,
          options: ex.options ? JSON.parse(ex.options) : [],
          pairs: ex.pairs ? JSON.parse(ex.pairs) : undefined,
          xp: ex.xp
        }))
      }))
    }));

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true }
    });

    const professores = await prisma.user.findMany({
      where: { role: 'PROFESSOR' },
      include: {
        createdClasses: {
          select: { id: true }
        }
      }
    });

    const rooms = await prisma.classRoom.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        students: {
          select: {
            id: true,
            level: true
          }
        }
      }
    });

    const formattedRooms = rooms.map(r => ({
      id: r.id,
      name: r.name,
      level: calcularNivelTurmaPorAlunos(r.students),
      code: r.code,
      studentIds: r.students.map(s => s.id)
    }));

    return NextResponse.json({
      users: formattedUsers,
      conquistas: conquistasFormatadas,
      levels: formattedLevels,
      admins,
      teachers: professores.map((professor) => ({
        id: professor.id,
        name: professor.name,
        username: professor.username,
        email: professor.email,
        phone: professor.phone || '',
        avatar: professor.avatar || '',
        roomIds: professor.createdClasses.map((turma) => turma.id),
        role: professor.role
      })),
      rooms: formattedRooms,
      settings: { defaultDailyEnergy: 5 }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}

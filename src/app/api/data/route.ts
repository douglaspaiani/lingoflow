import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        completedLessons: true,
        following: true,
        followers: true,
      }
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar || '',
      coverPhoto: u.coverPhoto || '',
      points: u.points,
      streak: u.streak,
      level: u.level,
      xp: u.xp,
      energy: u.energy,
      completedLessons: u.completedLessons.map(cl => cl.lessonId),
      following: u.following.map(f => f.followingId),
      followers: u.followers.map(f => f.followerId),
    }));

    const levels = await prisma.level.findMany({
      include: {
        lessons: {
          include: {
            exercises: true
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
      select: { id: true, email: true, name: true }
    });

    const rooms = await prisma.classRoom.findMany({
      include: { students: true }
    });

    const formattedRooms = rooms.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      studentIds: r.students.map(s => s.id)
    }));

    return NextResponse.json({
      users: formattedUsers,
      levels: formattedLevels,
      admins,
      rooms: formattedRooms,
      settings: { defaultDailyEnergy: 5 }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}

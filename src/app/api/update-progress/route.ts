import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = payload.id as string;

    const { xpToAdd, lessonId } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.energy <= 0) return NextResponse.json({ error: 'Sem energia suficiente para completar lição' }, { status: 403 });

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        energy: { decrement: 1 },
        points: { increment: xpToAdd },
        xp: { increment: xpToAdd },
      },
      include: {
        completedLessons: true,
        following: true,
        followers: true,
      }
    });

    if (lessonId) {
      // Create UserLesson relation if not exists
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
    }

    const formattedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      avatar: updatedUser.avatar || '',
      coverPhoto: updatedUser.coverPhoto || '',
      points: updatedUser.points,
      streak: updatedUser.streak,
      level: updatedUser.level,
      xp: updatedUser.xp,
      energy: updatedUser.energy,
      completedLessons: updatedUser.completedLessons.map(cl => cl.lessonId) || [],
      following: updatedUser.following.map(f => f.followingId) || [],
      followers: updatedUser.followers.map(f => f.followerId) || [],
    };

    if (lessonId && !formattedUser.completedLessons.includes(lessonId)) {
      formattedUser.completedLessons.push(lessonId);
    }

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

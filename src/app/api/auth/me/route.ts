import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

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

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      include: {
        completedLessons: true,
        following: true,
        followers: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const formattedUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar || '',
      coverPhoto: user.coverPhoto || '',
      points: user.points,
      streak: user.streak,
      level: user.level,
      xp: user.xp,
      energy: user.energy,
      completedLessons: user.completedLessons.map(cl => cl.lessonId),
      following: user.following.map(f => f.followingId),
      followers: user.followers.map(f => f.followerId),
    };

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
}

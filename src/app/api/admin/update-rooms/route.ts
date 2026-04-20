import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

    const { rooms } = await req.json();

    // Iterate through provided rooms and upsert
    for (const room of rooms) {
      await prisma.classRoom.upsert({
        where: { id: room.id },
        update: {
          name: room.name,
          code: room.code,
        },
        create: {
          id: room.id,
          name: room.name,
          code: room.code,
          adminId: payload.id as string
        }
      });
      
      // Update students
      for (const studentId of room.studentIds || []) {
        await prisma.user.update({
          where: { id: studentId },
          data: { classRoomId: room.id }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update rooms error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

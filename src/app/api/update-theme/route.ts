import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    const { theme } = await req.json();
    if (theme !== 'light' && theme !== 'dark') {
      return NextResponse.json({ error: 'Tema inválido' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: payload.id as string },
      data: { theme }
    });

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    console.error('Update theme error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

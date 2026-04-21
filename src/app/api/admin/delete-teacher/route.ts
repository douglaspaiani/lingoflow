import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';

const CHAVE_JWT = process.env.JWT_SECRET || 'super-secret-jwt-key';

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(CHAVE_JWT));
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const corpo = await req.json();
    const idProfessor = typeof corpo?.id === 'string' ? corpo.id : '';
    if (!idProfessor) {
      return NextResponse.json({ error: 'ID do professor é obrigatório' }, { status: 400 });
    }

    const professor = await prisma.user.findUnique({
      where: { id: idProfessor },
      select: { id: true, role: true }
    });

    if (!professor || professor.role !== 'PROFESSOR') {
      return NextResponse.json({ error: 'Professor não encontrado' }, { status: 404 });
    }

    const idAdminLogado = payload.id as string;

    // Antes de excluir o professor, devolvemos as turmas dele para o admin que executou a ação.
    await prisma.$transaction(async (tx) => {
      await tx.classRoom.updateMany({
        where: { adminId: idProfessor },
        data: { adminId: idAdminLogado }
      });

      await tx.user.delete({
        where: { id: idProfessor }
      });
    });

    return NextResponse.json({ success: true });
  } catch (erro) {
    console.error('Erro ao excluir professor:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

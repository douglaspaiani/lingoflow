import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const CHAVE_JWT = process.env.JWT_SECRET || 'super-secret-jwt-key';

function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

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
    const idAdmin = String(payload.id || '');
    const nome = typeof corpo?.name === 'string' ? corpo.name.trim() : '';
    const email = normalizarEmail(typeof corpo?.email === 'string' ? corpo.email : '');
    const senha = typeof corpo?.password === 'string' ? corpo.password.trim() : '';

    if (!idAdmin) {
      return NextResponse.json({ error: 'Administrador inválido' }, { status: 400 });
    }

    if (!nome || !email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 });
    }

    if (senha.length > 0 && senha.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter ao menos 6 caracteres' }, { status: 400 });
    }

    const adminAtual = await prisma.user.findUnique({
      where: { id: idAdmin },
      select: { id: true, role: true }
    });

    if (!adminAtual || adminAtual.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 });
    }

    const emailEmUso = await prisma.user.findFirst({
      where: {
        email,
        id: { not: idAdmin }
      },
      select: { id: true }
    });

    if (emailEmUso) {
      return NextResponse.json({ error: 'E-mail já está em uso' }, { status: 400 });
    }

    const dadosAtualizacao: {
      name: string;
      email: string;
      password?: string;
    } = {
      name: nome,
      email
    };

    // A senha só é alterada quando informada no formulário.
    if (senha.length > 0) {
      dadosAtualizacao.password = await bcrypt.hash(senha, 10);
    }

    const adminAtualizado = await prisma.user.update({
      where: { id: idAdmin },
      data: dadosAtualizacao,
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      admin: adminAtualizado
    });
  } catch (erro) {
    console.error('Erro ao atualizar perfil do administrador:', erro);
    return NextResponse.json({ error: 'Erro interno ao atualizar perfil' }, { status: 500 });
  }
}

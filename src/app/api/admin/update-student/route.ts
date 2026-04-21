import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const CHAVE_JWT = process.env.JWT_SECRET || 'super-secret-jwt-key';

function normalizarUsuario(usuario: string) {
  return usuario
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
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
    const idAluno = typeof corpo?.id === 'string' ? corpo.id : '';
    const nome = typeof corpo?.name === 'string' ? corpo.name.trim() : '';
    const usuarioNormalizado = normalizarUsuario(typeof corpo?.username === 'string' ? corpo.username : '');
    const novaSenha = typeof corpo?.password === 'string' ? corpo.password.trim() : '';
    const idTurma = typeof corpo?.classRoomId === 'string' && corpo.classRoomId.length > 0 ? corpo.classRoomId : null;

    if (!idAluno || !nome || !usuarioNormalizado) {
      return NextResponse.json({ error: 'Campos obrigatórios inválidos' }, { status: 400 });
    }

    const aluno = await prisma.user.findUnique({
      where: { id: idAluno },
      select: { id: true, role: true }
    });

    if (!aluno || aluno.role !== 'ALUNO') {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
    }

    const usuarioExistente = await prisma.user.findFirst({
      where: {
        username: usuarioNormalizado,
        id: { not: idAluno }
      },
      select: { id: true }
    });

    if (usuarioExistente) {
      return NextResponse.json({ error: 'Username já está em uso' }, { status: 400 });
    }

    if (idTurma) {
      const turmaExiste = await prisma.classRoom.findUnique({
        where: { id: idTurma },
        select: { id: true }
      });

      if (!turmaExiste) {
        return NextResponse.json({ error: 'Turma selecionada não existe' }, { status: 400 });
      }
    }

    const dadosAtualizacao: {
      name: string;
      username: string;
      classRoomId: string | null;
      password?: string;
    } = {
      name: nome,
      username: usuarioNormalizado,
      classRoomId: idTurma
    };

    // A senha é opcional: só atualiza quando o admin realmente informar uma nova.
    if (novaSenha) {
      if (novaSenha.length < 6) {
        return NextResponse.json({ error: 'A nova senha precisa ter ao menos 6 caracteres' }, { status: 400 });
      }
      dadosAtualizacao.password = await bcrypt.hash(novaSenha, 10);
    }

    await prisma.user.update({
      where: { id: idAluno },
      data: dadosAtualizacao
    });

    return NextResponse.json({ success: true });
  } catch (erro) {
    console.error('Erro ao editar aluno:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

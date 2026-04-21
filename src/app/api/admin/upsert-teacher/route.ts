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
    const idProfessor = typeof corpo?.id === 'string' && corpo.id.length > 0 ? corpo.id : null;
    const nome = typeof corpo?.name === 'string' ? corpo.name.trim() : '';
    const usuarioNormalizado = normalizarUsuario(typeof corpo?.username === 'string' ? corpo.username : '');
    const emailNormalizado = normalizarEmail(typeof corpo?.email === 'string' ? corpo.email : '');
    const telefone = typeof corpo?.phone === 'string' ? corpo.phone.trim() : '';
    const foto = typeof corpo?.avatar === 'string' ? corpo.avatar.trim() : '';
    const senha = typeof corpo?.password === 'string' ? corpo.password.trim() : '';
    const idsTurmas = Array.isArray(corpo?.roomIds)
      ? corpo.roomIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];
    const idsTurmasUnicas: string[] = [...new Set<string>(idsTurmas)];

    if (!nome || !usuarioNormalizado || !emailNormalizado) {
      return NextResponse.json({ error: 'Nome, usuário e email são obrigatórios' }, { status: 400 });
    }

    if (foto && !foto.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Envie a foto usando upload com recorte.' }, { status: 400 });
    }

    if (!idProfessor && senha.length < 6) {
      return NextResponse.json({ error: 'A senha inicial deve ter ao menos 6 caracteres' }, { status: 400 });
    }

    if (idProfessor && senha.length > 0 && senha.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter ao menos 6 caracteres' }, { status: 400 });
    }

    const usuarioExistente = await prisma.user.findFirst({
      where: {
        username: usuarioNormalizado,
        ...(idProfessor ? { id: { not: idProfessor } } : {})
      },
      select: { id: true }
    });

    if (usuarioExistente) {
      return NextResponse.json({ error: 'Usuário já está em uso' }, { status: 400 });
    }

    const emailExistente = await prisma.user.findFirst({
      where: {
        email: emailNormalizado,
        ...(idProfessor ? { id: { not: idProfessor } } : {})
      },
      select: { id: true }
    });

    if (emailExistente) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 400 });
    }

    if (idsTurmasUnicas.length > 0) {
      const turmasValidas = await prisma.classRoom.findMany({
        where: { id: { in: idsTurmasUnicas } },
        select: { id: true }
      });

      if (turmasValidas.length !== idsTurmasUnicas.length) {
        return NextResponse.json({ error: 'Uma ou mais turmas selecionadas não existem' }, { status: 400 });
      }
    }

    if (idProfessor) {
      const professorAtual = await prisma.user.findUnique({
        where: { id: idProfessor },
        select: { id: true, role: true }
      });

      if (!professorAtual || professorAtual.role !== 'PROFESSOR') {
        return NextResponse.json({ error: 'Professor não encontrado' }, { status: 404 });
      }
    }

    const idAdminLogado = payload.id as string;

    // A atualização das turmas precisa ser atômica com o cadastro/edição do professor.
    const resultado = await prisma.$transaction(async (tx) => {
      const dadosBase = {
        name: nome,
        username: usuarioNormalizado,
        email: emailNormalizado,
        role: 'PROFESSOR',
        avatar: foto || null,
        phone: telefone || null,
      };

      let professorId = idProfessor;

      if (!idProfessor) {
        const senhaHash = await bcrypt.hash(senha, 10);
        const professorCriado = await tx.user.create({
          data: {
            ...dadosBase,
            password: senhaHash,
            points: 0,
            streak: 0,
            level: 1,
            xp: 0,
            energy: 5,
            classRoomId: null
          },
          select: { id: true }
        });
        professorId = professorCriado.id;
      } else {
        await tx.user.update({
          where: { id: idProfessor },
          data: {
            ...dadosBase,
            ...(senha.length > 0 ? { password: await bcrypt.hash(senha, 10) } : {})
          }
        });
      }

      const turmasAtuaisDoProfessor = await tx.classRoom.findMany({
        where: { adminId: professorId! },
        select: { id: true }
      });

      const idsTurmasAtuais = turmasAtuaisDoProfessor.map((turma) => turma.id);
      const idsTurmasParaDesvincular = idsTurmasAtuais.filter((idTurma) => !idsTurmasUnicas.includes(idTurma));

      if (idsTurmasParaDesvincular.length > 0) {
        await tx.classRoom.updateMany({
          where: { id: { in: idsTurmasParaDesvincular } },
          data: { adminId: idAdminLogado }
        });
      }

      if (idsTurmasUnicas.length > 0) {
        await tx.classRoom.updateMany({
          where: { id: { in: idsTurmasUnicas } },
          data: { adminId: professorId! }
        });
      }

      return { id: professorId! };
    });

    return NextResponse.json({ success: true, teacherId: resultado.id });
  } catch (erro) {
    console.error('Erro ao salvar professor:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

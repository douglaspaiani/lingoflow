import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';

const CHAVE_JWT = process.env.JWT_SECRET || 'super-secret-jwt-key';

function converterNumeroSeguro(valor: unknown, padrao = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
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
    const usuariosRecebidos = Array.isArray(corpo?.users) ? corpo.users : null;

    if (!usuariosRecebidos) {
      return NextResponse.json({ error: 'Lista de usuários inválida' }, { status: 400 });
    }

    // A tela de admin envia sempre a lista inteira de alunos.
    // Se algum ID antigo não vier no payload, tratamos como exclusão.
    const idsRecebidos = usuariosRecebidos
      .map((usuario: any) => usuario?.id)
      .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);

    const alunosAtuais = await prisma.user.findMany({
      where: { role: 'ALUNO' },
      select: { id: true }
    });

    const idsParaExcluir = alunosAtuais
      .map((aluno) => aluno.id)
      .filter((id) => !idsRecebidos.includes(id));

    if (idsParaExcluir.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: { in: idsParaExcluir },
          role: 'ALUNO'
        }
      });
    }

    for (const usuarioRecebido of usuariosRecebidos) {
      const idUsuario = typeof usuarioRecebido?.id === 'string' ? usuarioRecebido.id : null;
      if (!idUsuario) continue;

      const usuarioAtual = await prisma.user.findUnique({
        where: { id: idUsuario },
        select: { role: true }
      });

      if (!usuarioAtual || usuarioAtual.role !== 'ALUNO') continue;

      await prisma.user.update({
        where: { id: idUsuario },
        data: {
          name: String(usuarioRecebido.name || ''),
          username: String(usuarioRecebido.username || ''),
          avatar: usuarioRecebido.avatar ? String(usuarioRecebido.avatar) : null,
          coverPhoto: usuarioRecebido.coverPhoto ? String(usuarioRecebido.coverPhoto) : null,
          classRoomId: usuarioRecebido.classRoomId ? String(usuarioRecebido.classRoomId) : null,
          points: converterNumeroSeguro(usuarioRecebido.points, 0),
          streak: converterNumeroSeguro(usuarioRecebido.streak, 0),
          level: converterNumeroSeguro(usuarioRecebido.level, 1),
          xp: converterNumeroSeguro(usuarioRecebido.xp, 0),
          energy: converterNumeroSeguro(usuarioRecebido.energy, 0),
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (erro) {
    console.error('Erro ao atualizar usuários:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

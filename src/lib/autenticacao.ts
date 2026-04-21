import * as jose from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const CHAVE_JWT = process.env.JWT_SECRET || 'super-secret-jwt-key';

export class ErroSessao extends Error {
  status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

export async function exigirUsuarioAutenticado() {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    throw new ErroSessao('Não autenticado', 401);
  }

  const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(CHAVE_JWT));
  const idUsuario = typeof payload.id === 'string' ? payload.id : '';
  if (!idUsuario) {
    throw new ErroSessao('Token inválido', 401);
  }

  const usuario = await prisma.user.findUnique({
    where: { id: idUsuario },
    select: {
      id: true,
      role: true,
      name: true,
      username: true,
      email: true,
      classRoomId: true,
      avatar: true
    }
  });

  if (!usuario) {
    throw new ErroSessao('Usuário não encontrado', 404);
  }

  return usuario;
}

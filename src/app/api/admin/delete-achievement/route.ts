import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { prisma } from '@/lib/prisma';

const CHAVE_JWT = process.env.JWT_SECRET || 'super-secret-jwt-key';

function normalizarTexto(valor: unknown) {
  return typeof valor === 'string' ? valor.trim() : '';
}

async function validarAdministradorLogado() {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return { ok: false as const, status: 401, error: 'Não autenticado' };
  }

  const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(CHAVE_JWT));
  if ((payload.role || '') !== 'ADMIN') {
    return { ok: false as const, status: 403, error: 'Acesso negado' };
  }

  return { ok: true as const };
}

export async function POST(req: Request) {
  try {
    const validacaoAdministrador = await validarAdministradorLogado();
    if (!validacaoAdministrador.ok) {
      return NextResponse.json(
        { error: validacaoAdministrador.error },
        { status: validacaoAdministrador.status }
      );
    }

    const corpo = await req.json().catch(() => null);
    const idConquista = normalizarTexto(corpo?.id);
    if (!idConquista) {
      return NextResponse.json({ error: 'ID da conquista inválido.' }, { status: 400 });
    }

    const conquistaExistente = await prisma.conquista.findUnique({
      where: { id: idConquista },
      select: { id: true }
    });

    if (!conquistaExistente) {
      return NextResponse.json({ error: 'Conquista não encontrada.' }, { status: 404 });
    }

    await prisma.conquista.delete({
      where: { id: idConquista }
    });

    return NextResponse.json({ success: true });
  } catch (erro) {
    console.error('Erro ao remover conquista:', erro);
    return NextResponse.json({ error: 'Erro interno ao remover conquista.' }, { status: 500 });
  }
}

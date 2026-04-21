import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { prisma } from '@/lib/prisma';
import { tipoRequisitoConquistaEhValido } from '@/lib/conquistas-config';

const CHAVE_JWT = process.env.JWT_SECRET || 'super-secret-jwt-key';

function normalizarTexto(valor: unknown) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarNumeroInteiroPositivo(valor: unknown, padrao = 1) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return padrao;
  return Math.max(1, Math.floor(numero));
}

function normalizarCorHexadecimal(valor: unknown) {
  const cor = normalizarTexto(valor);
  const regexCorHexadecimal = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!regexCorHexadecimal.test(cor)) {
    return '#3B82F6';
  }
  return cor.toUpperCase();
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
    const nomeConquista = normalizarTexto(corpo?.nome);
    const descricaoConquista = normalizarTexto(corpo?.descricao);
    const corConquista = normalizarCorHexadecimal(corpo?.cor);
    const iconeConquista = normalizarTexto(corpo?.icone) || 'Trophy';
    const conquistaAtiva = typeof corpo?.ativa === 'boolean' ? corpo.ativa : true;

    const requisitosRecebidos = Array.isArray(corpo?.requisitos) ? corpo.requisitos : [];

    if (!nomeConquista || !descricaoConquista) {
      return NextResponse.json(
        { error: 'Nome e descrição da conquista são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!requisitosRecebidos.length) {
      return NextResponse.json(
        { error: 'Adicione pelo menos um requisito para a conquista.' },
        { status: 400 }
      );
    }

    const requisitosNormalizados = requisitosRecebidos.map((requisito, indice) => {
      const tipoRequisito = requisito?.tipo;
      return {
        tipo: tipoRequisito,
        valorMinimo: normalizarNumeroInteiroPositivo(requisito?.valorMinimo, 1),
        ordem: indice
      };
    });

    const requisitoInvalido = requisitosNormalizados.find(
      (requisito) => !tipoRequisitoConquistaEhValido(requisito.tipo)
    );

    if (requisitoInvalido) {
      return NextResponse.json(
        { error: 'Um ou mais requisitos da conquista são inválidos.' },
        { status: 400 }
      );
    }

    const conquistaSalva = await prisma.$transaction(async (transacao) => {
      if (idConquista) {
        const conquistaExistente = await transacao.conquista.findUnique({
          where: { id: idConquista },
          select: { id: true }
        });

        if (!conquistaExistente) {
          throw new Error('CONQUISTA_NAO_ENCONTRADA');
        }

        await transacao.conquista.update({
          where: { id: idConquista },
          data: {
            nome: nomeConquista,
            descricao: descricaoConquista,
            cor: corConquista,
            icone: iconeConquista,
            ativa: conquistaAtiva
          }
        });

        await transacao.conquistaRequisito.deleteMany({
          where: { conquistaId: idConquista }
        });

        await transacao.conquistaRequisito.createMany({
          data: requisitosNormalizados.map((requisito) => ({
            conquistaId: idConquista,
            tipo: requisito.tipo,
            valorMinimo: requisito.valorMinimo,
            ordem: requisito.ordem
          }))
        });

        return transacao.conquista.findUnique({
          where: { id: idConquista },
          include: {
            requisitos: {
              orderBy: { ordem: 'asc' }
            }
          }
        });
      }

      return transacao.conquista.create({
        data: {
          nome: nomeConquista,
          descricao: descricaoConquista,
          cor: corConquista,
          icone: iconeConquista,
          ativa: conquistaAtiva,
          requisitos: {
            create: requisitosNormalizados.map((requisito) => ({
              tipo: requisito.tipo,
              valorMinimo: requisito.valorMinimo,
              ordem: requisito.ordem
            }))
          }
        },
        include: {
          requisitos: {
            orderBy: { ordem: 'asc' }
          }
        }
      });
    });

    if (!conquistaSalva) {
      return NextResponse.json({ error: 'Não foi possível salvar a conquista.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      conquista: {
        id: conquistaSalva.id,
        nome: conquistaSalva.nome,
        descricao: conquistaSalva.descricao,
        cor: conquistaSalva.cor,
        icone: conquistaSalva.icone,
        ativa: conquistaSalva.ativa,
        requisitos: conquistaSalva.requisitos.map((requisito) => ({
          id: requisito.id,
          tipo: requisito.tipo,
          valorMinimo: requisito.valorMinimo,
          ordem: requisito.ordem
        }))
      }
    });
  } catch (erro) {
    if (erro instanceof Error && erro.message === 'CONQUISTA_NAO_ENCONTRADA') {
      return NextResponse.json({ error: 'Conquista não encontrada.' }, { status: 404 });
    }

    console.error('Erro ao salvar conquista:', erro);
    return NextResponse.json({ error: 'Erro interno ao salvar conquista.' }, { status: 500 });
  }
}

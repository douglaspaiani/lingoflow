import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { cookies } from 'next/headers';

const CHAVE_JWT = process.env.JWT_SECRET || 'super-secret-jwt-key';

type ExercicioRecebido = {
  id: string;
  type: string;
  question: string;
  answer: string;
  options?: string[];
  pairs?: { left: string; right: string }[];
  xp?: number;
};

type LicaoRecebida = {
  id: string;
  title: string;
  exercises?: ExercicioRecebido[];
};

type NivelRecebido = {
  id: string;
  title: string;
  description?: string;
  difficulty?: number;
  lessons?: LicaoRecebida[];
};

function numeroSeguro(valor: unknown, padrao: number) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function normalizarLista<T>(valor: T[] | undefined | null) {
  return Array.isArray(valor) ? valor : [];
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
    const niveisRecebidos = normalizarLista<NivelRecebido>(corpo?.levels);

    await prisma.$transaction(async (tx) => {
      const niveisExistentes = await tx.level.findMany({
        select: {
          id: true,
          lessons: {
            select: {
              id: true,
              exercises: {
                select: { id: true }
              }
            }
          }
        }
      });

      const idsNiveisRecebidos = niveisRecebidos.map((nivel) => nivel.id);
      const idsNiveisParaRemover = niveisExistentes
        .map((nivel) => nivel.id)
        .filter((idNivel) => !idsNiveisRecebidos.includes(idNivel));

      const idsLicoesParaRemover: string[] = [];
      const idsExerciciosParaRemover: string[] = [];

      for (const nivelExistente of niveisExistentes) {
        if (idsNiveisParaRemover.includes(nivelExistente.id)) {
          idsLicoesParaRemover.push(...nivelExistente.lessons.map((licao) => licao.id));
          continue;
        }

        const nivelRecebido = niveisRecebidos.find((nivel) => nivel.id === nivelExistente.id);
        const licoesRecebidasDoNivel = normalizarLista<LicaoRecebida>(nivelRecebido?.lessons);
        const idsLicoesRecebidas = licoesRecebidasDoNivel.map((licao) => licao.id);

        for (const licaoExistente of nivelExistente.lessons) {
          if (!idsLicoesRecebidas.includes(licaoExistente.id)) {
            idsLicoesParaRemover.push(licaoExistente.id);
            continue;
          }

          const licaoRecebida = licoesRecebidasDoNivel.find((licao) => licao.id === licaoExistente.id);
          const exerciciosRecebidosDaLicao = normalizarLista<ExercicioRecebido>(licaoRecebida?.exercises);
          const idsExerciciosRecebidos = exerciciosRecebidosDaLicao.map((exercicio) => exercicio.id);
          const idsExerciciosRemovidosDaLicao = licaoExistente.exercises
            .map((exercicio) => exercicio.id)
            .filter((idExercicio) => !idsExerciciosRecebidos.includes(idExercicio));

          idsExerciciosParaRemover.push(...idsExerciciosRemovidosDaLicao);
        }
      }

      if (idsExerciciosParaRemover.length > 0) {
        await tx.exercise.deleteMany({
          where: {
            id: { in: idsExerciciosParaRemover }
          }
        });
      }

      if (idsLicoesParaRemover.length > 0) {
        // Remoção em cascata manual para respeitar os relacionamentos no schema.
        await tx.userLesson.deleteMany({
          where: {
            lessonId: { in: idsLicoesParaRemover }
          }
        });

        await tx.exercise.deleteMany({
          where: {
            lessonId: { in: idsLicoesParaRemover }
          }
        });

        await tx.lesson.deleteMany({
          where: {
            id: { in: idsLicoesParaRemover }
          }
        });
      }

      if (idsNiveisParaRemover.length > 0) {
        await tx.level.deleteMany({
          where: {
            id: { in: idsNiveisParaRemover }
          }
        });
      }

      for (const nivel of niveisRecebidos) {
        await tx.level.upsert({
          where: { id: nivel.id },
          update: {
            title: String(nivel.title || ''),
            description: String(nivel.description || ''),
            difficulty: numeroSeguro(nivel.difficulty, 1)
          },
          create: {
            id: nivel.id,
            title: String(nivel.title || ''),
            description: String(nivel.description || ''),
            difficulty: numeroSeguro(nivel.difficulty, 1)
          }
        });

        const licoesDoNivel = normalizarLista<LicaoRecebida>(nivel.lessons);
        for (const licao of licoesDoNivel) {
          await tx.lesson.upsert({
            where: { id: licao.id },
            update: {
              title: String(licao.title || ''),
              levelId: nivel.id
            },
            create: {
              id: licao.id,
              title: String(licao.title || ''),
              levelId: nivel.id
            }
          });

          const exerciciosDaLicao = normalizarLista<ExercicioRecebido>(licao.exercises);
          for (const exercicio of exerciciosDaLicao) {
            const opcoes = normalizarLista<string>(exercicio.options).map((opcao) => String(opcao));
            const pares = normalizarLista<{ left: string; right: string }>(exercicio.pairs).map((par) => ({
              left: String(par.left || ''),
              right: String(par.right || '')
            }));

            await tx.exercise.upsert({
              where: { id: exercicio.id },
              update: {
                lessonId: licao.id,
                type: String(exercicio.type || 'translate'),
                question: String(exercicio.question || ''),
                answer: String(exercicio.answer || ''),
                options: JSON.stringify(opcoes),
                pairs: pares.length > 0 ? JSON.stringify(pares) : null,
                xp: numeroSeguro(exercicio.xp, 10)
              },
              create: {
                id: exercicio.id,
                lessonId: licao.id,
                type: String(exercicio.type || 'translate'),
                question: String(exercicio.question || ''),
                answer: String(exercicio.answer || ''),
                options: JSON.stringify(opcoes),
                pairs: pares.length > 0 ? JSON.stringify(pares) : null,
                xp: numeroSeguro(exercicio.xp, 10)
              }
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (erro) {
    console.error('Erro ao atualizar conteúdo:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

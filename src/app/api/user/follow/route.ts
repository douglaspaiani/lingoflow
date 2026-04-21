import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { avaliarConquistasParaAluno } from '@/lib/conquistas-avaliacao';

function extrairIdAlvo(corpo: unknown) {
  if (!corpo || typeof corpo !== 'object') {
    return '';
  }

  const idAlvo = (corpo as { targetId?: unknown }).targetId;
  return typeof idAlvo === 'string' ? idAlvo.trim() : '';
}

export async function POST(req: Request) {
  try {
    const usuarioLogado = await exigirUsuarioAutenticado();
    if (usuarioLogado.role !== 'ALUNO') {
      return NextResponse.json(
        { error: 'Somente alunos podem seguir perfis.' },
        { status: 403 }
      );
    }

    const corpo = await req.json().catch(() => null);
    const idUsuarioAlvo = extrairIdAlvo(corpo);

    if (!idUsuarioAlvo) {
      return NextResponse.json({ error: 'Perfil alvo inválido.' }, { status: 400 });
    }

    if (idUsuarioAlvo === usuarioLogado.id) {
      return NextResponse.json({ error: 'Não é possível seguir a si mesmo.' }, { status: 400 });
    }

    const usuarioAlvo = await prisma.user.findUnique({
      where: { id: idUsuarioAlvo },
      select: { id: true, role: true }
    });

    if (!usuarioAlvo || usuarioAlvo.role !== 'ALUNO') {
      return NextResponse.json({ error: 'Perfil alvo não encontrado.' }, { status: 404 });
    }

    // Verifica se a relação já existe para alternar entre seguir e deixar de seguir.
    const amizadeAtual = await prisma.friendship.findUnique({
      where: {
        followerId_followingId: {
          followerId: usuarioLogado.id,
          followingId: idUsuarioAlvo
        }
      },
      select: { id: true }
    });

    if (amizadeAtual) {
      await prisma.friendship.delete({
        where: {
          followerId_followingId: {
            followerId: usuarioLogado.id,
            followingId: idUsuarioAlvo
          }
        }
      });

      return NextResponse.json({ success: true, seguindo: false });
    }

    await prisma.friendship.create({
      data: {
        followerId: usuarioLogado.id,
        followingId: idUsuarioAlvo
      }
    });

    const novasConquistasDesbloqueadas = await avaliarConquistasParaAluno(usuarioLogado.id);
    // Também avaliamos o perfil alvo para regras baseadas em seguidores.
    await avaliarConquistasParaAluno(idUsuarioAlvo);

    return NextResponse.json({
      success: true,
      seguindo: true,
      novasConquistasDesbloqueadas
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }

    console.error('Erro ao alternar amizade:', erro);
    return NextResponse.json({ error: 'Erro ao atualizar amizade.' }, { status: 500 });
  }
}

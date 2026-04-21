import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { garantirServidorWebsocketPlayground } from '@/lib/playground-websocket';

export const runtime = 'nodejs';

const SLUG_JOGO_TRADUZIR_IMAGEM = 'traduzir-imagem';
const NOME_JOGO_TRADUZIR_IMAGEM = 'Traduza a Imagem';
const ERRO_CLIENTE_PRISMA_PLAYGROUND = 'CLIENTE_PRISMA_PLAYGROUND_INDISPONIVEL';

function obterPrismaPlayground() {
  const prismaComPlayground = prisma as typeof prisma & {
    playgroundJogo?: typeof prisma.playgroundJogo;
    playgroundFaseImagem?: typeof prisma.playgroundFaseImagem;
  };

  if (!prismaComPlayground.playgroundJogo || !prismaComPlayground.playgroundFaseImagem) {
    throw new Error(ERRO_CLIENTE_PRISMA_PLAYGROUND);
  }

  return prismaComPlayground;
}

async function obterOuCriarJogoTraduzaImagem() {
  const prismaPlayground = obterPrismaPlayground();
  const jogoExistente = await prismaPlayground.playgroundJogo.findUnique({
    where: { slug: SLUG_JOGO_TRADUZIR_IMAGEM }
  });

  if (jogoExistente) return jogoExistente;

  return prismaPlayground.playgroundJogo.create({
    data: {
      slug: SLUG_JOGO_TRADUZIR_IMAGEM,
      nome: NOME_JOGO_TRADUZIR_IMAGEM,
      descricao: 'Jogo de tradução com imagens por fase e nível.',
      ativo: true
    }
  });
}

function tratarErroPlayground(erro: unknown) {
  if (erro instanceof ErroSessao) {
    return NextResponse.json({ error: erro.message }, { status: erro.status });
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2021') {
    return NextResponse.json(
      { error: 'Banco desatualizado para Playground. Atualize as tabelas do jogo e tente novamente.' },
      { status: 500 }
    );
  }

  if (erro instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { error: 'Não foi possível conectar ao banco de dados do Playground.' },
      { status: 500 }
    );
  }

  if (erro instanceof Error && erro.message === ERRO_CLIENTE_PRISMA_PLAYGROUND) {
    return NextResponse.json(
      { error: 'Cliente Prisma desatualizado para Playground. Reinicie o servidor e tente novamente.' },
      { status: 500 }
    );
  }

  return null;
}

export async function GET() {
  try {
    const prismaPlayground = obterPrismaPlayground();
    const usuario = await exigirUsuarioAutenticado();
    if (usuario.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    garantirServidorWebsocketPlayground();

    const jogo = await obterOuCriarJogoTraduzaImagem();
    const fases = await prismaPlayground.playgroundFaseImagem.findMany({
      where: { jogoId: jogo.id },
      orderBy: [{ nivel: 'asc' }, { ordem: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({
      jogo: {
        ...jogo,
        fasesImagem: fases
      }
    });
  } catch (erro) {
    const respostaErro = tratarErroPlayground(erro);
    if (respostaErro) return respostaErro;
    console.error('Erro ao buscar fases do jogo de imagens:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const prismaPlayground = obterPrismaPlayground();
    const usuario = await exigirUsuarioAutenticado();
    if (usuario.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const corpo = await req.json();
    const fasesRecebidas = Array.isArray(corpo?.fases) ? corpo.fases : null;
    if (!fasesRecebidas) {
      return NextResponse.json({ error: 'Lista de fases inválida' }, { status: 400 });
    }

    const jogo = await obterOuCriarJogoTraduzaImagem();
    const fasesAtuais = await prismaPlayground.playgroundFaseImagem.findMany({
      where: { jogoId: jogo.id },
      select: { id: true }
    });

    const idsValidosAtuais = new Set(fasesAtuais.map((fase) => fase.id));
    const idsRecebidos = fasesRecebidas
      .map((fase: any) => (typeof fase?.id === 'string' ? fase.id : ''))
      .filter((id: string) => id.length > 0 && idsValidosAtuais.has(id));

    const idsParaRemover = fasesAtuais
      .map((fase) => fase.id)
      .filter((id) => !idsRecebidos.includes(id));

    if (idsParaRemover.length > 0) {
      await prismaPlayground.playgroundFaseImagem.deleteMany({
        where: { id: { in: idsParaRemover } }
      });
    }

    for (let indice = 0; indice < fasesRecebidas.length; indice += 1) {
      const fase = fasesRecebidas[indice];
      const idFase = typeof fase?.id === 'string' && idsValidosAtuais.has(fase.id) ? fase.id : null;
      const nivel = Number(fase?.nivel);
      const ordem = Number(fase?.ordem);
      const imagem = typeof fase?.imagem === 'string' ? fase.imagem.trim() : '';
      const traducaoCorreta = typeof fase?.traducaoCorreta === 'string' ? fase.traducaoCorreta.trim() : '';

      if (!Number.isFinite(nivel) || nivel < 1 || nivel > 20) {
        return NextResponse.json({ error: `Nível inválido na fase ${indice + 1}` }, { status: 400 });
      }

      if (!imagem) {
        return NextResponse.json({ error: `Imagem obrigatória na fase ${indice + 1}` }, { status: 400 });
      }

      if (!traducaoCorreta) {
        return NextResponse.json({ error: `Tradução obrigatória na fase ${indice + 1}` }, { status: 400 });
      }

      if (!imagem.startsWith('data:image/') && !imagem.startsWith('http://') && !imagem.startsWith('https://')) {
        return NextResponse.json({ error: `Formato de imagem inválido na fase ${indice + 1}` }, { status: 400 });
      }

      const dadosFase = {
        jogoId: jogo.id,
        nivel,
        ordem: Number.isFinite(ordem) ? ordem : indice,
        imagem,
        traducaoCorreta,
        ativo: true
      };

      if (idFase) {
        await prismaPlayground.playgroundFaseImagem.update({
          where: { id: idFase },
          data: dadosFase
        });
      } else {
        await prismaPlayground.playgroundFaseImagem.create({
          data: dadosFase
        });
      }
    }

    const fasesAtualizadas = await prismaPlayground.playgroundFaseImagem.findMany({
      where: { jogoId: jogo.id },
      orderBy: [{ nivel: 'asc' }, { ordem: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({
      success: true,
      jogo: {
        ...jogo,
        fasesImagem: fasesAtualizadas
      }
    });
  } catch (erro) {
    const respostaErro = tratarErroPlayground(erro);
    if (respostaErro) return respostaErro;
    console.error('Erro ao salvar fases do jogo de imagens:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

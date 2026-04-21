import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import { garantirServidorWebsocketPlayground } from '@/lib/playground-websocket';
import {
  DURACAO_PADRAO_BATTLE_MODE_SEGUNDOS,
  NOME_JOGO_BATTLE_MODE_V1,
  SLUG_JOGO_BATTLE_MODE_V1,
  TIPO_RESPOSTA_PADRAO_BATTLE_MODE,
  lerConfiguracaoBattleMode,
  lerPerguntaBattleMode,
  normalizarDuracaoBattleModeEmSegundos,
  serializarConfiguracaoBattleMode,
  serializarPerguntaBattleMode
} from '@/lib/playground-jogos';

export const runtime = 'nodejs';

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

async function obterOuCriarJogoBattleMode() {
  const prismaPlayground = obterPrismaPlayground();
  const jogoExistente = await prismaPlayground.playgroundJogo.findUnique({
    where: { slug: SLUG_JOGO_BATTLE_MODE_V1 }
  });

  if (jogoExistente) return jogoExistente;

  return prismaPlayground.playgroundJogo.create({
    data: {
      slug: SLUG_JOGO_BATTLE_MODE_V1,
      nome: NOME_JOGO_BATTLE_MODE_V1,
      descricao: serializarConfiguracaoBattleMode({
        tipoResposta: TIPO_RESPOSTA_PADRAO_BATTLE_MODE,
        duracaoSegundos: DURACAO_PADRAO_BATTLE_MODE_SEGUNDOS
      }),
      ativo: true
    }
  });
}

function tratarErroBattleMode(erro: unknown) {
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

function normalizarListaOpcoes(opcoes: unknown) {
  if (!Array.isArray(opcoes)) return [];
  return opcoes
    .map((opcao) => (typeof opcao === 'string' ? opcao.trim() : ''))
    .filter((opcao) => opcao.length > 0);
}

export async function GET() {
  try {
    const prismaPlayground = obterPrismaPlayground();
    const usuario = await exigirUsuarioAutenticado();
    if (usuario.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    garantirServidorWebsocketPlayground();

    const jogo = await obterOuCriarJogoBattleMode();
    const fases = await prismaPlayground.playgroundFaseImagem.findMany({
      where: { jogoId: jogo.id },
      orderBy: [{ nivel: 'asc' }, { ordem: 'asc' }, { createdAt: 'asc' }]
    });
    const configuracao = lerConfiguracaoBattleMode(jogo.descricao);

    return NextResponse.json({
      jogo: {
        id: jogo.id,
        slug: jogo.slug,
        nome: jogo.nome,
        ativo: jogo.ativo,
        descricao: jogo.descricao || '',
        configuracaoBattleMode: configuracao,
        fasesBattleMode: fases.map((fase) => {
          const dadosPergunta = lerPerguntaBattleMode(fase, configuracao.tipoResposta);
          return {
            id: fase.id,
            nivel: fase.nivel,
            ordem: fase.ordem,
            pergunta: dadosPergunta.pergunta,
            opcoes: dadosPergunta.opcoes,
            respostaCorreta: dadosPergunta.respostaCorreta,
            ativo: fase.ativo
          };
        })
      }
    });
  } catch (erro) {
    const respostaErro = tratarErroBattleMode(erro);
    if (respostaErro) return respostaErro;
    console.error('Erro ao buscar fases do Battle Mode v1:', erro);
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
    const tipoResposta = typeof corpo?.tipoResposta === 'string' ? corpo.tipoResposta.trim() : '';
    const duracaoSegundosRecebida = Number(corpo?.duracaoSegundos);
    const duracaoSegundos = normalizarDuracaoBattleModeEmSegundos(duracaoSegundosRecebida);
    const perguntasRecebidas = Array.isArray(corpo?.perguntas) ? corpo.perguntas : null;

    if (!perguntasRecebidas) {
      return NextResponse.json({ error: 'Lista de perguntas inválida' }, { status: 400 });
    }

    const jogo = await obterOuCriarJogoBattleMode();
    await prismaPlayground.playgroundJogo.update({
      where: { id: jogo.id },
      data: {
        descricao: serializarConfiguracaoBattleMode({
          tipoResposta: tipoResposta || TIPO_RESPOSTA_PADRAO_BATTLE_MODE,
          duracaoSegundos
        }),
        ativo: true
      }
    });

    const fasesAtuais = await prismaPlayground.playgroundFaseImagem.findMany({
      where: { jogoId: jogo.id },
      select: { id: true }
    });

    const idsFasesAtuais = new Set(fasesAtuais.map((fase) => fase.id));
    const idsRecebidos = perguntasRecebidas
      .map((pergunta: any) => (typeof pergunta?.id === 'string' ? pergunta.id : ''))
      .filter((id: string) => id.length > 0 && idsFasesAtuais.has(id));
    const idsParaRemover = fasesAtuais
      .map((fase) => fase.id)
      .filter((id) => !idsRecebidos.includes(id));

    if (idsParaRemover.length > 0) {
      await prismaPlayground.playgroundFaseImagem.deleteMany({
        where: { id: { in: idsParaRemover } }
      });
    }

    for (let indicePergunta = 0; indicePergunta < perguntasRecebidas.length; indicePergunta += 1) {
      const perguntaAtual = perguntasRecebidas[indicePergunta];
      const idPergunta =
        typeof perguntaAtual?.id === 'string' && idsFasesAtuais.has(perguntaAtual.id)
          ? perguntaAtual.id
          : null;
      const nivelPergunta = Number(perguntaAtual?.nivel);
      const ordemPergunta = Number(perguntaAtual?.ordem);
      const enunciadoPergunta =
        typeof perguntaAtual?.pergunta === 'string' ? perguntaAtual.pergunta.trim() : '';
      const opcoesPergunta = normalizarListaOpcoes(perguntaAtual?.opcoes);
      const respostaCorreta =
        typeof perguntaAtual?.respostaCorreta === 'string'
          ? perguntaAtual.respostaCorreta.trim()
          : '';

      if (!Number.isFinite(nivelPergunta) || nivelPergunta < 1 || nivelPergunta > 20) {
        return NextResponse.json({ error: `Nível inválido na pergunta ${indicePergunta + 1}` }, { status: 400 });
      }

      if (!enunciadoPergunta) {
        return NextResponse.json({ error: `Pergunta obrigatória no item ${indicePergunta + 1}` }, { status: 400 });
      }

      if (opcoesPergunta.length < 2) {
        return NextResponse.json(
          { error: `Inclua pelo menos 2 opções na pergunta ${indicePergunta + 1}` },
          { status: 400 }
        );
      }

      if (!respostaCorreta || !opcoesPergunta.includes(respostaCorreta)) {
        return NextResponse.json(
          { error: `A resposta correta deve ser uma opção válida na pergunta ${indicePergunta + 1}` },
          { status: 400 }
        );
      }

      const dadosFasePergunta = {
        jogoId: jogo.id,
        nivel: nivelPergunta,
        ordem: Number.isFinite(ordemPergunta) ? ordemPergunta : indicePergunta,
        imagem: serializarPerguntaBattleMode({
          pergunta: enunciadoPergunta,
          opcoes: opcoesPergunta,
          tipoResposta
        }),
        traducaoCorreta: respostaCorreta,
        ativo: true
      };

      if (idPergunta) {
        await prismaPlayground.playgroundFaseImagem.update({
          where: { id: idPergunta },
          data: dadosFasePergunta
        });
      } else {
        await prismaPlayground.playgroundFaseImagem.create({
          data: dadosFasePergunta
        });
      }
    }

    const jogoAtualizado = await prismaPlayground.playgroundJogo.findUnique({
      where: { id: jogo.id }
    });
    const configuracaoAtualizada = lerConfiguracaoBattleMode(jogoAtualizado?.descricao || null);
    const fasesAtualizadas = await prismaPlayground.playgroundFaseImagem.findMany({
      where: { jogoId: jogo.id },
      orderBy: [{ nivel: 'asc' }, { ordem: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({
      success: true,
      jogo: {
        id: jogo.id,
        slug: SLUG_JOGO_BATTLE_MODE_V1,
        nome: NOME_JOGO_BATTLE_MODE_V1,
        ativo: true,
        descricao: jogoAtualizado?.descricao || '',
        configuracaoBattleMode: configuracaoAtualizada,
        fasesBattleMode: fasesAtualizadas.map((fase) => {
          const dadosPergunta = lerPerguntaBattleMode(fase, configuracaoAtualizada.tipoResposta);
          return {
            id: fase.id,
            nivel: fase.nivel,
            ordem: fase.ordem,
            pergunta: dadosPergunta.pergunta,
            opcoes: dadosPergunta.opcoes,
            respostaCorreta: dadosPergunta.respostaCorreta,
            ativo: fase.ativo
          };
        })
      }
    });
  } catch (erro) {
    const respostaErro = tratarErroBattleMode(erro);
    if (respostaErro) return respostaErro;
    console.error('Erro ao salvar Battle Mode v1:', erro);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

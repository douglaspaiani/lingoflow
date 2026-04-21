import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import {
  instalarModulosImportacaoConteudo,
  normalizarModulosImportacaoConteudo
} from '@/lib/importacao-conteudos';
import {
  listarIdsConteudoPacote,
  obterPacoteInstalacaoConteudosIngles,
  obterResumoPacoteConteudo
} from '@/lib/repositorio-pacote-conteudos';

type ExercicioConteudoRepositorio = {
  id: string;
  pergunta: string;
  respostaCorreta: string;
};

type LicaoConteudoRepositorio = {
  id: string;
  titulo: string;
  perguntas: ExercicioConteudoRepositorio[];
};

type ModuloConteudoRepositorio = {
  id: string;
  titulo: string;
  descricao: string;
  dificuldade: number;
  licoes: LicaoConteudoRepositorio[];
};

function validarAdministrador(cargoUsuario: string | null | undefined) {
  return String(cargoUsuario || '').toUpperCase() === 'ADMIN';
}

function montarConteudoPacoteParaVisualizacao(): ModuloConteudoRepositorio[] {
  const pacote = obterPacoteInstalacaoConteudosIngles();
  return pacote.modulos.map((modulo) => ({
    id: modulo.id,
    titulo: modulo.title,
    descricao: modulo.description,
    dificuldade: modulo.difficulty,
    licoes: modulo.lessons.map((licao) => ({
      id: licao.id,
      titulo: licao.title,
      perguntas: licao.exercises.map((exercicio) => ({
        id: exercicio.id,
        pergunta: exercicio.question,
        respostaCorreta: exercicio.answer
      }))
    }))
  }));
}

async function buscarStatusPacoteConteudos() {
  const pacote = obterPacoteInstalacaoConteudosIngles();
  const resumo = obterResumoPacoteConteudo(pacote);
  const { idsModulos, idsLicoes, idsExercicios } = listarIdsConteudoPacote(pacote);

  const [modulosInstalados, licoesInstaladas, exerciciosInstalados] = await Promise.all([
    prisma.level.count({ where: { id: { in: idsModulos } } }),
    prisma.lesson.count({ where: { id: { in: idsLicoes } } }),
    prisma.exercise.count({ where: { id: { in: idsExercicios } } })
  ]);

  const totalItens = resumo.totalModulos + resumo.totalLicoes + resumo.totalExercicios;
  const totalItensInstalados = modulosInstalados + licoesInstaladas + exerciciosInstalados;

  const percentualInstalacao = totalItens > 0
    ? Math.min(100, Math.round((totalItensInstalados / totalItens) * 100))
    : 0;

  const estaAtualizado =
    modulosInstalados >= resumo.totalModulos &&
    licoesInstaladas >= resumo.totalLicoes &&
    exerciciosInstalados >= resumo.totalExercicios;

  return {
    pacote: {
      slug: pacote.slug,
      nome: pacote.nome,
      descricao: pacote.descricao,
      versaoMaisRecente: pacote.versaoMaisRecente,
      totalModulos: resumo.totalModulos,
      totalLicoes: resumo.totalLicoes,
      totalExercicios: resumo.totalExercicios
    },
    instalacao: {
      modulosInstalados,
      licoesInstaladas,
      exerciciosInstalados,
      percentualInstalacao,
      possuiInstalacao: totalItensInstalados > 0,
      estaAtualizado
    }
  };
}

export async function GET(req: Request) {
  try {
    const usuarioAutenticado = await exigirUsuarioAutenticado();
    if (!validarAdministrador(usuarioAutenticado.role)) {
      return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
    }

    const urlRequisicao = new URL(req.url);
    const incluirConteudo =
      urlRequisicao.searchParams.get('incluirConteudo') === '1' ||
      urlRequisicao.searchParams.get('incluirConteudo') === 'true';

    const statusPacote = await buscarStatusPacoteConteudos();
    if (!incluirConteudo) {
      return NextResponse.json(statusPacote);
    }

    return NextResponse.json({
      ...statusPacote,
      conteudo: {
        modulos: montarConteudoPacoteParaVisualizacao()
      }
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }

    console.error('Erro ao buscar status do pacote de conteúdos:', erro);
    return NextResponse.json({ error: 'Erro interno ao consultar o pacote.' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const usuarioAutenticado = await exigirUsuarioAutenticado();
    if (!validarAdministrador(usuarioAutenticado.role)) {
      return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
    }

    const pacote = obterPacoteInstalacaoConteudosIngles();
    const modulosNormalizados = normalizarModulosImportacaoConteudo({ modulos: pacote.modulos });
    if (modulosNormalizados.length === 0) {
      return NextResponse.json(
        { error: 'Pacote oficial sem módulos válidos para instalação.' },
        { status: 400 }
      );
    }
    const resumoImportacao = await instalarModulosImportacaoConteudo(modulosNormalizados);

    const statusAtualizado = await buscarStatusPacoteConteudos();

    return NextResponse.json({
      success: true,
      mensagem: resumoImportacao.modulosNovosInstalados +
          resumoImportacao.licoesNovasInstaladas +
          resumoImportacao.exerciciosNovosInstalados > 0
        ? 'Pacote instalado com sucesso usando o fluxo de importacao JSON.'
        : 'Pacote já estava atualizado. Nenhum item novo foi instalado.',
      resumo: resumoImportacao,
      status: statusAtualizado.instalacao,
      pacote: statusAtualizado.pacote
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }

    console.error('Erro ao instalar pacote de conteúdos:', erro);
    return NextResponse.json({ error: 'Erro interno ao instalar o pacote.' }, { status: 500 });
  }
}

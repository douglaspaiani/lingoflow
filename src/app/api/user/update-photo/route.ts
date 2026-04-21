import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';

const LIMITE_CARACTERES_BASE64 = 4_500_000;

type TipoFotoPerfil = 'avatar' | 'coverPhoto';

type DadosAtualizacaoFoto = {
  tipoFoto: TipoFotoPerfil;
  urlFoto: string;
  idUsuarioInformado: string;
};

function extrairDadosAtualizacaoFoto(corpo: unknown): DadosAtualizacaoFoto | null {
  if (!corpo || typeof corpo !== 'object') {
    return null;
  }

  const tipoFotoBruto = (corpo as { type?: unknown }).type;
  const urlFotoBruta = (corpo as { url?: unknown }).url;
  const idUsuarioBruto = (corpo as { userId?: unknown }).userId;

  const tipoFoto = tipoFotoBruto === 'avatar' || tipoFotoBruto === 'coverPhoto'
    ? tipoFotoBruto
    : null;

  if (!tipoFoto) {
    return null;
  }

  return {
    tipoFoto,
    urlFoto: typeof urlFotoBruta === 'string' ? urlFotoBruta.trim() : '',
    idUsuarioInformado: typeof idUsuarioBruto === 'string' ? idUsuarioBruto.trim() : ''
  };
}

function validarDataUrlImagem(urlFoto: string) {
  const padraoDataUrl = /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i;
  return padraoDataUrl.test(urlFoto);
}

function campoDoBancoPorTipoFoto(tipoFoto: TipoFotoPerfil) {
  return tipoFoto === 'avatar' ? 'avatar' : 'coverPhoto';
}

export async function POST(req: Request) {
  try {
    const usuarioAutenticado = await exigirUsuarioAutenticado();
    if (usuarioAutenticado.role !== 'ALUNO') {
      return NextResponse.json(
        { error: 'Somente alunos podem atualizar a foto do perfil.' },
        { status: 403 }
      );
    }

    const corpo = await req.json().catch(() => null);
    const dadosAtualizacao = extrairDadosAtualizacaoFoto(corpo);

    if (!dadosAtualizacao) {
      return NextResponse.json({ error: 'Dados de atualização inválidos.' }, { status: 400 });
    }

    const { tipoFoto, urlFoto, idUsuarioInformado } = dadosAtualizacao;

    if (idUsuarioInformado && idUsuarioInformado !== usuarioAutenticado.id) {
      return NextResponse.json({ error: 'Não autorizado para atualizar este usuário.' }, { status: 403 });
    }

    if (!urlFoto) {
      return NextResponse.json({ error: 'A imagem enviada está vazia.' }, { status: 400 });
    }

    if (!validarDataUrlImagem(urlFoto)) {
      return NextResponse.json(
        { error: 'Envie a imagem no formato base64 válido.' },
        { status: 400 }
      );
    }

    if (urlFoto.length > LIMITE_CARACTERES_BASE64) {
      return NextResponse.json(
        { error: 'Imagem muito grande. Ajuste o recorte ou use uma foto menor.' },
        { status: 413 }
      );
    }

    const campoBanco = campoDoBancoPorTipoFoto(tipoFoto);

    await prisma.user.update({
      where: { id: usuarioAutenticado.id },
      data: {
        [campoBanco]: urlFoto
      }
    });

    return NextResponse.json({
      success: true,
      type: tipoFoto,
      url: urlFoto
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }

    console.error('Erro ao atualizar foto do perfil:', erro);
    return NextResponse.json({ error: 'Erro interno ao atualizar a foto.' }, { status: 500 });
  }
}

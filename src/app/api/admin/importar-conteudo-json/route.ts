import { NextResponse } from 'next/server';
import { ErroSessao, exigirUsuarioAutenticado } from '@/lib/autenticacao';
import {
  instalarModulosImportacaoConteudo,
  normalizarModulosImportacaoConteudo
} from '@/lib/importacao-conteudos';

function validarAdministrador(cargoUsuario: string | null | undefined) {
  return String(cargoUsuario || '').toUpperCase() === 'ADMIN';
}

export async function POST(req: Request) {
  try {
    const usuarioAutenticado = await exigirUsuarioAutenticado();
    if (!validarAdministrador(usuarioAutenticado.role)) {
      return NextResponse.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
    }

    const corpo = await req.json().catch(() => null);
    const modulosImportacao = normalizarModulosImportacaoConteudo(corpo);

    if (modulosImportacao.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum modulo valido foi encontrado para importacao.' },
        { status: 400 }
      );
    }

    const resumoImportacao = await instalarModulosImportacaoConteudo(modulosImportacao);

    return NextResponse.json({
      success: true,
      mensagem:
        resumoImportacao.modulosNovosInstalados +
          resumoImportacao.licoesNovasInstaladas +
          resumoImportacao.exerciciosNovosInstalados >
        0
          ? `Importacao concluida. ${resumoImportacao.licoesNovasInstaladas} licoes novas adicionadas e ${resumoImportacao.licoesRepetidasIgnoradas} licoes repetidas ignoradas.`
          : `Importacao concluida. Nenhuma licao nova foi adicionada. ${resumoImportacao.licoesRepetidasIgnoradas} licoes repetidas foram ignoradas.`,
      resumo: resumoImportacao
    });
  } catch (erro) {
    if (erro instanceof ErroSessao) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }

    console.error('Erro ao importar conteudos via JSON:', erro);
    return NextResponse.json({ error: 'Erro interno ao importar conteudos.' }, { status: 500 });
  }
}

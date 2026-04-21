import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ModuloNormalizadoImportacaoConteudo,
  normalizarModulosImportacaoConteudo
} from '@/lib/importacao-conteudos';

export type TipoExercicioPacote = 'translate' | 'select' | 'match' | 'reorder' | 'listen' | 'speak';

export type ParCorrespondenciaPacote = {
  left: string;
  right: string;
};

export type ExercicioPacoteConteudo = {
  id: string;
  type: TipoExercicioPacote;
  question: string;
  answer: string;
  options: string[];
  pairs?: ParCorrespondenciaPacote[];
  xp: number;
};

export type LicaoPacoteConteudo = {
  id: string;
  title: string;
  exercises: ExercicioPacoteConteudo[];
};

export type ModuloPacoteConteudo = {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  lessons: LicaoPacoteConteudo[];
};

export type PacoteConteudoIngles = {
  slug: string;
  nome: string;
  descricao: string;
  versaoMaisRecente: string;
  modulos: ModuloPacoteConteudo[];
};

export type ResumoPacoteConteudo = {
  totalModulos: number;
  totalLicoes: number;
  totalExercicios: number;
};

type PacoteConteudoBruto = {
  slug?: unknown;
  nome?: unknown;
  descricao?: unknown;
  versaoMaisRecente?: unknown;
  modulos?: unknown;
};

const SLUG_PACOTE_CONTEUDO_INGLES = 'pacote-instalacao-conteudos-ingles';
const PREFIXO_ID_PACOTE_INGLES = 'repo-pacote-ingles';
const NOME_PACOTE_INGLES = 'Pacote de Instalacao de Conteudos';
const DESCRICAO_PACOTE_INGLES =
  'Pacote incremental de modulos e licoes de ingles para instalacao em lote, sem sobrescrever conteudos existentes.';
const VERSAO_PADRAO_PACOTE = '2026.04.21-v1';
const CAMINHO_ARQUIVO_PACOTE_INGLES = join(
  process.cwd(),
  'public',
  'modelos',
  'pacote-instalacao-conteudos-ingles-2026.04.21-v1.json'
);

let cachePacoteConteudoIngles: PacoteConteudoIngles | null = null;

function textoSeguroPacoteConteudo(valor: unknown, padrao = '') {
  if (typeof valor !== 'string') return padrao;
  const texto = valor.trim();
  return texto.length > 0 ? texto : padrao;
}

function normalizarTextoSemAcento(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

function normalizarModuloPacoteConteudo(modulo: ModuloNormalizadoImportacaoConteudo): ModuloPacoteConteudo {
  return {
    id: modulo.id,
    title: modulo.title,
    description: modulo.description,
    difficulty: modulo.difficulty,
    lessons: modulo.lessons.map((licao) => ({
      id: licao.id,
      title: licao.title,
      exercises: licao.exercises.map((exercicio) => ({
        id: exercicio.id,
        type: exercicio.type as TipoExercicioPacote,
        question: exercicio.question,
        answer: exercicio.answer,
        options: exercicio.options,
        pairs: exercicio.pairs,
        xp: exercicio.xp
      }))
    }))
  };
}

function carregarPacoteConteudoBruto(): PacoteConteudoBruto {
  const conteudoArquivo = readFileSync(CAMINHO_ARQUIVO_PACOTE_INGLES, 'utf-8');
  return JSON.parse(conteudoArquivo) as PacoteConteudoBruto;
}

export function obterPacoteInstalacaoConteudosIngles(): PacoteConteudoIngles {
  if (cachePacoteConteudoIngles) {
    return cachePacoteConteudoIngles;
  }

  const pacoteBruto = carregarPacoteConteudoBruto();
  const modulosNormalizados = normalizarModulosImportacaoConteudo({ modulos: pacoteBruto.modulos });

  if (modulosNormalizados.length === 0) {
    throw new Error('Pacote oficial sem modulos validos para instalacao.');
  }

  cachePacoteConteudoIngles = {
    slug: textoSeguroPacoteConteudo(pacoteBruto.slug, SLUG_PACOTE_CONTEUDO_INGLES),
    nome: textoSeguroPacoteConteudo(pacoteBruto.nome, NOME_PACOTE_INGLES),
    descricao: textoSeguroPacoteConteudo(pacoteBruto.descricao, DESCRICAO_PACOTE_INGLES),
    versaoMaisRecente: textoSeguroPacoteConteudo(pacoteBruto.versaoMaisRecente, VERSAO_PADRAO_PACOTE),
    modulos: modulosNormalizados.map(normalizarModuloPacoteConteudo)
  };

  return cachePacoteConteudoIngles;
}

export function obterResumoPacoteConteudo(pacote: PacoteConteudoIngles): ResumoPacoteConteudo {
  const totalModulos = pacote.modulos.length;
  const totalLicoes = pacote.modulos.reduce((acumulado, modulo) => acumulado + modulo.lessons.length, 0);
  const totalExercicios = pacote.modulos.reduce((acumuladoModulos, modulo) => {
    return acumuladoModulos + modulo.lessons.reduce((acumuladoLicoes, licao) => acumuladoLicoes + licao.exercises.length, 0);
  }, 0);

  return {
    totalModulos,
    totalLicoes,
    totalExercicios
  };
}

export function listarIdsConteudoPacote(pacote: PacoteConteudoIngles) {
  const idsModulos = pacote.modulos.map((modulo) => modulo.id);
  const idsLicoes = pacote.modulos.flatMap((modulo) => modulo.lessons.map((licao) => licao.id));
  const idsExercicios = pacote.modulos.flatMap((modulo) =>
    modulo.lessons.flatMap((licao) => licao.exercises.map((exercicio) => exercicio.id))
  );

  return {
    idsModulos,
    idsLicoes,
    idsExercicios
  };
}

export function obterPrefixoIdPacoteConteudosIngles() {
  return PREFIXO_ID_PACOTE_INGLES;
}

export function gerarIdentificadorPacoteLegivel(modulo: number, licao: number) {
  return `${normalizarTextoSemAcento(NOME_PACOTE_INGLES)}-${String(modulo).padStart(2, '0')}-${String(licao).padStart(2, '0')}`;
}

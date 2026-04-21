import { prisma } from '@/lib/prisma';

export type ParImportacaoConteudo = {
  left: string;
  right: string;
};

export type ExercicioNormalizadoImportacaoConteudo = {
  id: string;
  type: string;
  question: string;
  answer: string;
  options: string[];
  pairs: ParImportacaoConteudo[];
  xp: number;
};

export type LicaoNormalizadaImportacaoConteudo = {
  id: string;
  title: string;
  exercises: ExercicioNormalizadoImportacaoConteudo[];
};

export type ModuloNormalizadoImportacaoConteudo = {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  lessons: LicaoNormalizadaImportacaoConteudo[];
};

export type ResumoImportacaoConteudo = {
  totalModulos: number;
  totalLicoes: number;
  totalExercicios: number;
  modulosNovosInstalados: number;
  licoesNovasInstaladas: number;
  exerciciosNovosInstalados: number;
  modulosJaExistentes: number;
  licoesJaExistentes: number;
  exerciciosJaExistentes: number;
  licoesRepetidasIgnoradas: number;
  exerciciosRepetidosIgnorados: number;
};

type ParImportacaoConteudoBruto = {
  left?: unknown;
  right?: unknown;
};

type ExercicioImportacaoConteudoBruto = {
  id?: unknown;
  type?: unknown;
  question?: unknown;
  answer?: unknown;
  options?: unknown;
  pairs?: unknown;
  xp?: unknown;
};

type LicaoImportacaoConteudoBruto = {
  id?: unknown;
  title?: unknown;
  exercises?: unknown;
};

type ModuloImportacaoConteudoBruto = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  difficulty?: unknown;
  lessons?: unknown;
};

function textoSeguroImportacaoConteudo(valor: unknown, padrao = '') {
  if (typeof valor !== 'string') return padrao;
  const texto = valor.trim();
  return texto.length > 0 ? texto : padrao;
}

function numeroSeguroImportacaoConteudo(valor: unknown, padrao: number) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return padrao;
  return numero;
}

function listaSeguraImportacaoConteudo<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : [];
}

function normalizarExercicioImportacaoConteudo(
  exercicioRecebido: ExercicioImportacaoConteudoBruto,
  indiceExercicio: number,
  idLicao: string
): ExercicioNormalizadoImportacaoConteudo | null {
  const idExercicio = textoSeguroImportacaoConteudo(exercicioRecebido.id, `${idLicao}-ex-${indiceExercicio + 1}`);
  const pergunta = textoSeguroImportacaoConteudo(exercicioRecebido.question);

  const paresNormalizados = listaSeguraImportacaoConteudo<ParImportacaoConteudoBruto>(exercicioRecebido.pairs)
    .map((par) => ({
      left: textoSeguroImportacaoConteudo(par?.left),
      right: textoSeguroImportacaoConteudo(par?.right)
    }))
    .filter((par) => par.left.length > 0 && par.right.length > 0);

  const respostaPadraoPares = paresNormalizados.map((par) => `${par.left}=${par.right}`).join('; ');
  const resposta = textoSeguroImportacaoConteudo(exercicioRecebido.answer, respostaPadraoPares);

  if (!idExercicio || !pergunta || !resposta) {
    return null;
  }

  const tiposPermitidos = new Set(['translate', 'select', 'listen', 'speak', 'match', 'reorder']);
  const tipoRecebido = textoSeguroImportacaoConteudo(exercicioRecebido.type, 'translate').toLowerCase();
  const tipo = tiposPermitidos.has(tipoRecebido) ? tipoRecebido : 'translate';
  const opcoesNormalizadas = listaSeguraImportacaoConteudo<unknown>(exercicioRecebido.options)
    .map((opcao) => String(opcao ?? '').trim())
    .filter((opcao) => opcao.length > 0);

  return {
    id: idExercicio,
    type: tipo,
    question: pergunta,
    answer: resposta,
    options: opcoesNormalizadas,
    pairs: paresNormalizados,
    xp: Math.max(1, Math.round(numeroSeguroImportacaoConteudo(exercicioRecebido.xp, 10)))
  };
}

function normalizarLicaoImportacaoConteudo(
  licaoRecebida: LicaoImportacaoConteudoBruto,
  indiceLicao: number,
  idModulo: string
): LicaoNormalizadaImportacaoConteudo | null {
  const idLicao = textoSeguroImportacaoConteudo(licaoRecebida.id, `${idModulo}-lic-${indiceLicao + 1}`);
  const tituloLicao = textoSeguroImportacaoConteudo(licaoRecebida.title, `Licao ${indiceLicao + 1}`);

  if (!idLicao || !tituloLicao) {
    return null;
  }

  const exerciciosNormalizados = listaSeguraImportacaoConteudo<ExercicioImportacaoConteudoBruto>(licaoRecebida.exercises)
    .map((exercicio, indiceExercicio) => normalizarExercicioImportacaoConteudo(exercicio, indiceExercicio, idLicao))
    .filter((exercicio): exercicio is ExercicioNormalizadoImportacaoConteudo => exercicio !== null);

  if (exerciciosNormalizados.length === 0) {
    return null;
  }

  return {
    id: idLicao,
    title: tituloLicao,
    exercises: exerciciosNormalizados
  };
}

function normalizarModuloImportacaoConteudo(
  moduloRecebido: ModuloImportacaoConteudoBruto,
  indiceModulo: number
): ModuloNormalizadoImportacaoConteudo | null {
  const idModulo = textoSeguroImportacaoConteudo(moduloRecebido.id, `import-mod-${indiceModulo + 1}`);
  const tituloModulo = textoSeguroImportacaoConteudo(moduloRecebido.title, `Modulo ${indiceModulo + 1}`);

  if (!idModulo || !tituloModulo) {
    return null;
  }

  const licoesNormalizadas = listaSeguraImportacaoConteudo<LicaoImportacaoConteudoBruto>(moduloRecebido.lessons)
    .map((licao, indiceLicao) => normalizarLicaoImportacaoConteudo(licao, indiceLicao, idModulo))
    .filter((licao): licao is LicaoNormalizadaImportacaoConteudo => licao !== null);

  if (licoesNormalizadas.length === 0) {
    return null;
  }

  return {
    id: idModulo,
    title: tituloModulo,
    description: textoSeguroImportacaoConteudo(moduloRecebido.description, `Conteudo importado para ${tituloModulo}`),
    difficulty: Math.max(1, Math.round(numeroSeguroImportacaoConteudo(moduloRecebido.difficulty, 1))),
    lessons: licoesNormalizadas
  };
}

export function normalizarModulosImportacaoConteudo(conteudoBruto: unknown): ModuloNormalizadoImportacaoConteudo[] {
  const conteudoObjeto = (conteudoBruto && typeof conteudoBruto === 'object') ? conteudoBruto as Record<string, unknown> : null;

  const modulosBrutos = Array.isArray(conteudoBruto)
    ? conteudoBruto
    : listaSeguraImportacaoConteudo<ModuloImportacaoConteudoBruto>(conteudoObjeto?.modulos ?? conteudoObjeto?.levels);

  return modulosBrutos
    .map((modulo, indiceModulo) => normalizarModuloImportacaoConteudo(modulo as ModuloImportacaoConteudoBruto, indiceModulo))
    .filter((modulo): modulo is ModuloNormalizadoImportacaoConteudo => modulo !== null);
}

export async function instalarModulosImportacaoConteudo(
  modulosImportacao: ModuloNormalizadoImportacaoConteudo[]
): Promise<ResumoImportacaoConteudo> {
  const idsModulosUnicosImportacao = Array.from(new Set(modulosImportacao.map((modulo) => modulo.id)));

  const registrosLicoesImportacao = modulosImportacao.flatMap((modulo) =>
    modulo.lessons.map((licao) => ({
      ...licao,
      idModulo: modulo.id,
      tituloModulo: modulo.title,
      descricaoModulo: modulo.description,
      dificuldadeModulo: modulo.difficulty
    }))
  );

  // Deduplica licoes no proprio payload para evitar colisao dentro do mesmo lote.
  const idsLicoesVistasNoJson = new Set<string>();
  let licoesRepetidasNoJson = 0;
  const licoesUnicasImportacao = registrosLicoesImportacao.filter((licao) => {
    if (idsLicoesVistasNoJson.has(licao.id)) {
      licoesRepetidasNoJson += 1;
      return false;
    }
    idsLicoesVistasNoJson.add(licao.id);
    return true;
  });

  const idsLicoesUnicasImportacao = licoesUnicasImportacao.map((licao) => licao.id);
  const licoesExistentesBanco = idsLicoesUnicasImportacao.length > 0
    ? await prisma.lesson.findMany({
        where: { id: { in: idsLicoesUnicasImportacao } },
        select: { id: true }
      })
    : [];
  const idsLicoesExistentesBanco = new Set(licoesExistentesBanco.map((licao) => licao.id));

  const licoesNovasParaCriar = licoesUnicasImportacao.filter((licao) => !idsLicoesExistentesBanco.has(licao.id));
  const licoesRepetidasBanco = licoesUnicasImportacao.length - licoesNovasParaCriar.length;
  const licoesRepetidasIgnoradas = licoesRepetidasNoJson + licoesRepetidasBanco;

  const mapaModulosNecessarios = new Map<
    string,
    { id: string; title: string; description: string; difficulty: number }
  >();
  for (const licao of licoesNovasParaCriar) {
    if (mapaModulosNecessarios.has(licao.idModulo)) continue;
    mapaModulosNecessarios.set(licao.idModulo, {
      id: licao.idModulo,
      title: licao.tituloModulo,
      description: licao.descricaoModulo,
      difficulty: licao.dificuldadeModulo
    });
  }

  const idsModulosNecessarios = Array.from(mapaModulosNecessarios.keys());
  const modulosExistentesBanco = idsModulosNecessarios.length > 0
    ? await prisma.level.findMany({
        where: { id: { in: idsModulosNecessarios } },
        select: { id: true }
      })
    : [];
  const idsModulosExistentesBanco = new Set(modulosExistentesBanco.map((modulo) => modulo.id));

  const modulosNovosParaCriar = idsModulosNecessarios
    .filter((idModulo) => !idsModulosExistentesBanco.has(idModulo))
    .map((idModulo) => mapaModulosNecessarios.get(idModulo))
    .filter((modulo): modulo is { id: string; title: string; description: string; difficulty: number } => Boolean(modulo));

  const registrosExerciciosImportacao = licoesNovasParaCriar.flatMap((licao) =>
    licao.exercises.map((exercicio) => ({
      ...exercicio,
      idLicao: licao.id
    }))
  );

  // Deduplica exercicios no payload e ignora o que ja existe no banco, mantendo apenas novos.
  const idsExerciciosVistosNoJson = new Set<string>();
  let exerciciosRepetidosNoJson = 0;
  const exerciciosUnicosImportacao = registrosExerciciosImportacao.filter((exercicio) => {
    if (idsExerciciosVistosNoJson.has(exercicio.id)) {
      exerciciosRepetidosNoJson += 1;
      return false;
    }
    idsExerciciosVistosNoJson.add(exercicio.id);
    return true;
  });

  const idsExerciciosUnicosImportacao = exerciciosUnicosImportacao.map((exercicio) => exercicio.id);
  const exerciciosExistentesBanco = idsExerciciosUnicosImportacao.length > 0
    ? await prisma.exercise.findMany({
        where: { id: { in: idsExerciciosUnicosImportacao } },
        select: { id: true }
      })
    : [];
  const idsExerciciosExistentesBanco = new Set(exerciciosExistentesBanco.map((exercicio) => exercicio.id));

  const exerciciosNovosParaCriar = exerciciosUnicosImportacao.filter(
    (exercicio) => !idsExerciciosExistentesBanco.has(exercicio.id)
  );
  const exerciciosRepetidosBanco = exerciciosUnicosImportacao.length - exerciciosNovosParaCriar.length;
  const exerciciosRepetidosIgnorados = exerciciosRepetidosNoJson + exerciciosRepetidosBanco;

  const resultadoCriacao = await prisma.$transaction(async (tx) => {
    let modulosCriados = 0;
    let licoesCriadas = 0;
    let exerciciosCriados = 0;

    if (modulosNovosParaCriar.length > 0) {
      const resultadoModulos = await tx.level.createMany({
        data: modulosNovosParaCriar,
        skipDuplicates: true
      });
      modulosCriados = resultadoModulos.count;
    }

    if (licoesNovasParaCriar.length > 0) {
      const resultadoLicoes = await tx.lesson.createMany({
        data: licoesNovasParaCriar.map((licao) => ({
          id: licao.id,
          title: licao.title,
          levelId: licao.idModulo
        })),
        skipDuplicates: true
      });
      licoesCriadas = resultadoLicoes.count;
    }

    if (exerciciosNovosParaCriar.length > 0) {
      const resultadoExercicios = await tx.exercise.createMany({
        data: exerciciosNovosParaCriar.map((exercicio) => ({
          id: exercicio.id,
          lessonId: exercicio.idLicao,
          type: exercicio.type,
          question: exercicio.question,
          answer: exercicio.answer,
          options: JSON.stringify(exercicio.options),
          pairs: exercicio.pairs.length > 0 ? JSON.stringify(exercicio.pairs) : null,
          xp: exercicio.xp
        })),
        skipDuplicates: true
      });
      exerciciosCriados = resultadoExercicios.count;
    }

    return {
      modulosCriados,
      licoesCriadas,
      exerciciosCriados
    };
  });

  const totalModulos = idsModulosUnicosImportacao.length;
  const totalLicoes = licoesUnicasImportacao.length;
  const totalExercicios = exerciciosUnicosImportacao.length;

  const modulosNovosInstalados = resultadoCriacao.modulosCriados;
  const licoesNovasInstaladas = resultadoCriacao.licoesCriadas;
  const exerciciosNovosInstalados = resultadoCriacao.exerciciosCriados;

  return {
    totalModulos,
    totalLicoes,
    totalExercicios,
    modulosNovosInstalados,
    licoesNovasInstaladas,
    exerciciosNovosInstalados,
    modulosJaExistentes: Math.max(0, totalModulos - modulosNovosInstalados),
    licoesJaExistentes: licoesRepetidasBanco,
    exerciciosJaExistentes: exerciciosRepetidosBanco,
    licoesRepetidasIgnoradas,
    exerciciosRepetidosIgnorados
  };
}

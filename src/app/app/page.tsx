"use client";
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Check,
  Star,
  Lock,
  BookOpen,
  Flame,
  Zap,
  Gamepad2,
  Gift,
  Sparkles,
  Clock3,
  Rocket,
  BatteryCharging
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecompensaBauTrilha } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { QUANTIDADE_LICOES_POR_BAU_TRILHA } from '@/lib/recompensas-trilha';

export default function Inicio() {
  const { data, currentUser, refreshData } = useUser();
  const [toast, setToast] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [sessaoAtivaJogoAluno, setSessaoAtivaJogoAluno] = useState<{
    id: string;
    jogo?: { slug?: string; nome?: string };
    iniciadaEm?: string;
  } | null>(null);
  const [numeroBauAbrindo, setNumeroBauAbrindo] = useState<number | null>(null);
  const [modalPremioAberto, setModalPremioAberto] = useState(false);
  const [premioBauRecebido, setPremioBauRecebido] = useState<RecompensaBauTrilha | null>(null);
  const router = useRouter();

  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakValue, setStreakValue] = useState<number>(0);

  useEffect(() => {
    if (sessionStorage.getItem('showStreakAnimation') === 'true') {
      const val = sessionStorage.getItem('newStreakValue');
      if (val) setStreakValue(parseInt(val));
      setShowStreakModal(true);
      sessionStorage.removeItem('showStreakAnimation');
      sessionStorage.removeItem('newStreakValue');
    }
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!currentUser) return;
    const roleUsuarioNormalizado = (currentUser.role || '').toUpperCase();

    if (roleUsuarioNormalizado !== 'ALUNO') {
      setSessaoAtivaJogoAluno(null);
      return;
    }

    let cancelado = false;
    const buscarSessaoAtivaJogoAluno = async () => {
      try {
        const resposta = await fetch('/api/playground/aluno/sessao-ativa', { cache: 'no-store' });
        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok) return;
        if (cancelado) return;
        setSessaoAtivaJogoAluno(dados?.sessaoAtiva || null);
      } catch (erro) {
        if (!cancelado) {
          setSessaoAtivaJogoAluno(null);
        }
      }
    };

    buscarSessaoAtivaJogoAluno();
    const intervaloSessaoAtivaJogoAluno = setInterval(buscarSessaoAtivaJogoAluno, 10000);

    return () => {
      cancelado = true;
      clearInterval(intervaloSessaoAtivaJogoAluno);
    };
  }, [currentUser?.id, currentUser?.role]);

  const roleUsuarioAtual = (currentUser?.role || '').toUpperCase();
  const usuarioPodeAcessarApp =
    roleUsuarioAtual === 'ALUNO' || roleUsuarioAtual === 'ADMIN' || roleUsuarioAtual === 'PROFESSOR';
  const usuarioTemEnergiaIlimitada = roleUsuarioAtual === 'ADMIN' || roleUsuarioAtual === 'PROFESSOR';

  useEffect(() => {
    if (!data) return;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (!usuarioPodeAcessarApp) {
      router.replace('/login');
    }
  }, [data, currentUser, roleUsuarioAtual, router, usuarioPodeAcessarApp]);

  const totalLicoesConcluidasUsuario = currentUser?.completedLessons?.length || 0;
  const totalBausLiberadosEstimado = Math.floor(
    totalLicoesConcluidasUsuario / QUANTIDADE_LICOES_POR_BAU_TRILHA
  );
  const bausAbertosResumo = currentUser?.resumoRecompensasBauTrilha?.bausAbertos || [];
  const bausDisponiveisResumo =
    currentUser?.resumoRecompensasBauTrilha?.bausDisponiveis ||
    Array.from({ length: totalBausLiberadosEstimado }, (_, indice) => indice + 1).filter(
      (numeroBau) => !bausAbertosResumo.includes(numeroBau)
    );

  const conjuntoBausAbertos = useMemo(
    () => new Set(bausAbertosResumo),
    [bausAbertosResumo]
  );
  const conjuntoBausDisponiveis = useMemo(
    () => new Set(bausDisponiveisResumo),
    [bausDisponiveisResumo]
  );

  const mapaIconesPremioBau = {
    Gift,
    Sparkles,
    Clock3,
    Rocket,
    BatteryCharging,
    Zap
  };

  const IconePremioBau =
    (premioBauRecebido?.icone &&
      mapaIconesPremioBau[premioBauRecebido.icone as keyof typeof mapaIconesPremioBau]) ||
    Gift;

  const dispararFogosPremioBau = () => {
    confetti({
      particleCount: 180,
      spread: 95,
      startVelocity: 45,
      origin: { y: 0.62 }
    });

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { x: 0.18, y: 0.75 }
    });

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { x: 0.82, y: 0.75 }
    });
  };

  const abrirBauDaTrilha = async (numeroBau: number) => {
    if (numeroBauAbrindo) return;

    try {
      setNumeroBauAbrindo(numeroBau);
      const resposta = await fetch('/api/user/recompensas-trilha/abrir-bau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroBau })
      });

      const corpoResposta = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setToast(corpoResposta?.error || 'Não foi possível abrir este baú agora.');
        return;
      }

      if (corpoResposta?.recompensa) {
        setPremioBauRecebido(corpoResposta.recompensa as RecompensaBauTrilha);
        setModalPremioAberto(true);
        dispararFogosPremioBau();
      }

      await refreshData();
    } catch (erro) {
      console.error('Falha ao abrir baú da trilha:', erro);
      setToast('Não foi possível abrir este baú agora.');
    } finally {
      setNumeroBauAbrindo(null);
    }
  };

  if (!data || !currentUser || !usuarioPodeAcessarApp) return (
    <div className="flex flex-col items-center justify-center pt-40 gap-4">
      <div className="h-16 w-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      <span className="font-black text-green-500 uppercase tracking-widest animate-pulse">Carregando Mapa...</span>
    </div>
  );

  const niveisDisponiveis = Array.isArray(data.levels) ? data.levels : [];
  const aulasConcluidasAluno = new Set(currentUser.completedLessons || []);
  let lessonCounter = 0;
  const allLessons = niveisDisponiveis.flatMap((l, lIdx) =>
    l.lessons.map((lesson, lessonIdx) => ({
      ...lesson,
      levelIndex: lIdx,
      lessonIndex: lessonIdx,
      curve: Math.sin(lessonIdx * 1.5 + lIdx) * 90
    }))
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-8 relative" 
      onClick={() => setSelectedLessonId(null)}
    >
      <AnimatePresence>
        <motion.div className="space-y-24">
          {roleUsuarioAtual === 'ALUNO' && sessaoAtivaJogoAluno && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-blue-500/10 border-2 border-blue-400/30 rounded-[2rem] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                  <Gamepad2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-black text-blue-500">Jogo ao vivo</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {sessaoAtivaJogoAluno?.jogo?.nome || 'Novo jogo'} em andamento. Entre agora para jogar com sua turma.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/jogo/sessao/${sessaoAtivaJogoAluno.id}`)}
                className="bg-blue-500 hover:bg-blue-400 text-white font-black px-5 py-3 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs"
              >
                Entrar no jogo
              </button>
            </motion.div>
          )}
          {roleUsuarioAtual === 'ALUNO' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-[2rem] border-2 border-amber-300/50 bg-amber-100/60 dark:bg-amber-900/20 p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
                <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-black">Baús da trilha</p>
                  <p className="text-sm font-black">
                    A cada {QUANTIDADE_LICOES_POR_BAU_TRILHA} lições, um novo baú é liberado.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-700/90 dark:text-amber-200/90">
                <span>Lições concluídas: {totalLicoesConcluidasUsuario}</span>
                <span>Baús prontos: {bausDisponiveisResumo.length}</span>
              </div>
            </motion.div>
          )}
          {niveisDisponiveis.map((level, index) => {
            // Calculate start and end lesson counters for this level to draw local SVG path
            const startIdx = level.id === '1' ? 0 : niveisDisponiveis.slice(0, index).flatMap(l => l.lessons).length;
            const totalLicoesModulo = level.lessons.length;
            const totalLicoesConcluidasModulo = level.lessons.filter((lesson) => aulasConcluidasAluno.has(lesson.id)).length;
            const percentualProgressoModulo = totalLicoesModulo > 0
              ? Math.round((totalLicoesConcluidasModulo / totalLicoesModulo) * 100)
              : 0;
            
            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col items-center gap-16 mb-24 relative"
              >
              {/* Header do Módulo */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "w-full rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group",
                  index % 2 === 0 ? "bg-green-500" : "bg-blue-500"
                )}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <BookOpen className="h-32 w-32 -rotate-12" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-black uppercase tracking-wide">Módulo {index + 1}</h2>
                    <p className="text-lg font-bold opacity-90">{level.title}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-black uppercase tracking-widest text-white/80">
                  <span>Progresso do módulo</span>
                  <span>{percentualProgressoModulo}%</span>
                </div>
                <div className="mt-6 w-full h-4 bg-black/10 rounded-full overflow-hidden">
                  <motion.div
                     initial={{ width: 0 }}
                     whileInView={{ width: `${percentualProgressoModulo}%` }}
                     viewport={{ once: true, margin: "-80px" }}
                     transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
                     className={cn(
                       "h-full rounded-full progress-shine relative",
                       index % 2 === 0 ? "bg-green-300" : "bg-blue-300"
                     )}
                  >
                    {percentualProgressoModulo > 0 && (
                      <motion.span
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.9)]"
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      />
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* Path and Lessons */}
              <div className="flex flex-col items-center gap-12 w-full max-w-xs relative py-10 px-4">
                {/* SVG Connector Path */}
                <svg 
                  className="absolute inset-0 w-full h-full -z-10"
                  style={{ overflow: 'visible', pointerEvents: 'none' }}
                  viewBox={`0 0 320 ${level.lessons.length * 144 + 80}`}
                >
                  <motion.path
                    d={level.lessons.reduce((acc, _, i) => {
                      const x = 160 + (Math.sin(i * 1.5 + index) * 90);
                      const y = 88 + (i * 144);
                      
                      if (i === 0) return `M ${x} ${y}`;
                      
                      // Previous point for Bezier curve
                      const prevX = 160 + (Math.sin((i - 1) * 1.5 + index) * 90);
                      const prevY = 88 + ((i - 1) * 144);
                      
                      // Control points for smooth curves
                      const cpY1 = prevY + (y - prevY) / 2;
                      const cpY2 = prevY + (y - prevY) / 2;
                      
                      return `${acc} C ${prevX} ${cpY1}, ${x} ${cpY2}, ${x} ${y}`;
                    }, "")}
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="0 24"
                    strokeLinecap="round"
                    strokeWidth="12"
                    className="text-slate-200 dark:text-slate-800"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                </svg>

                {level.lessons.map((lesson, lessonIndex) => {
                  const isCompleted = currentUser.completedLessons?.includes(lesson.id) ?? false;
                  const currentGlobalIdx = allLessons.findIndex(al => al.id === lesson.id);
                  const prevLessonId = currentGlobalIdx > 0 ? allLessons[currentGlobalIdx - 1]?.id : null;
                  const isLocked = currentGlobalIdx > 0 && !isCompleted && !currentUser.completedLessons?.includes(prevLessonId || '');
                  const curve = Math.sin(lessonIndex * 1.5 + index) * 90;

                  const numeroGlobalLicao = startIdx + lessonIndex + 1;
                  const licaoTemBau = numeroGlobalLicao % QUANTIDADE_LICOES_POR_BAU_TRILHA === 0;
                  const numeroBau = Math.floor(numeroGlobalLicao / QUANTIDADE_LICOES_POR_BAU_TRILHA);
                  const bauJaAberto = licaoTemBau && conjuntoBausAbertos.has(numeroBau);
                  const bauDisponivel = licaoTemBau && conjuntoBausDisponiveis.has(numeroBau);
                  const bauBloqueado = licaoTemBau && !bauJaAberto && !bauDisponivel;
                  const bauCarregando = licaoTemBau && numeroBauAbrindo === numeroBau;
                  const licoesRestantesParaBau = Math.max(
                    0,
                    (numeroBau * QUANTIDADE_LICOES_POR_BAU_TRILHA) - totalLicoesConcluidasUsuario
                  );

                  return (
                    <Fragment key={lesson.id}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: lessonIndex * 0.1 }}
                        className="relative z-10"
                        style={{ x: curve }}
                      >
                        <AnimatePresence>
                          {selectedLessonId === lesson.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              className={cn(
                                "absolute bottom-full left-1/2 -translate-x-1/2 mb-6 z-[100] w-[280px] rounded-[1.5rem] p-5 shadow-2xl flex flex-col gap-3",
                                index % 2 === 0 ? "bg-emerald-500" : "bg-sky-500"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="text-left px-1">
                                <h3 className="text-lg font-black text-white leading-tight mb-1">{lesson.title}</h3>
                                <p className="text-xs font-bold text-white/90">
                                  {isCompleted
                                    ? "A dúvida é o princípio da sabedoria. Pratique!"
                                    : "Continue sua jornada de aprendizado!"}
                                </p>
                              </div>

                              <div className="flex flex-col gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    if (!usuarioTemEnergiaIlimitada && currentUser.energy <= 0) {
                                      setToast("Cuidado! Você está sem energia. Aguarde ou peça bônus ao seu tutor!");
                                    } else if (!lesson.exercises || lesson.exercises.length === 0) {
                                      setToast("Essa lição ainda não possui exercícios cadastrados.");
                                    } else {
                                      router.push(`/licao/${lesson.id}`);
                                    }
                                  }}
                                  className="w-full bg-white text-emerald-600 dark:text-emerald-500 font-black py-4 rounded-xl border-b-4 border-slate-200 hover:bg-slate-50 transition-all active:translate-y-1 active:border-b-0 uppercase tracking-widest text-xs"
                                >
                                  {isCompleted ? "REVISAR +15 XP" : "COMEÇAR +10 XP"}
                                </button>
                              </div>

                              <div className={cn(
                                "absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px]",
                                index % 2 === 0 ? "border-t-emerald-500" : "border-t-sky-500"
                              )} />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLocked) {
                              setToast("Stop! Você não pode pular lições, never!");
                            } else {
                              setSelectedLessonId(lesson.id);
                            }
                          }}
                          className={cn(
                            "relative h-24 w-24 rounded-full flex items-center justify-center transition-all btn-duo",
                            isLocked
                              ? "bg-slate-100 dark:bg-slate-400 border-b-[8px] border-slate-200 dark:border-slate-500 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                              : isCompleted
                                ? "bg-yellow-400 border-b-[8px] border-yellow-600 text-white hover:bg-yellow-300"
                                : cn(
                                    "text-white shadow-lg animate-float",
                                    index % 2 === 0 ? "btn-duo-green" : "btn-duo-blue"
                                  )
                          )}
                        >
                          {isLocked ? (
                            <Lock className="h-10 w-10" />
                          ) : isCompleted ? (
                            <Check className="h-12 w-12 stroke-[4]" />
                          ) : (
                            <Star className="h-12 w-12 fill-white stroke-[3]" />
                          )}
                        </button>
                      </motion.div>

                      {licaoTemBau && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: lessonIndex * 0.12 + 0.1 }}
                          className="relative z-10 mt-2 flex flex-col items-center"
                          style={{ x: curve * -0.55 }}
                        >
                          <button
                            onClick={(eventoClique) => {
                              eventoClique.stopPropagation();
                              if (bauCarregando) return;

                              if (bauJaAberto) {
                                setToast(`O baú #${numeroBau} já foi aberto.`);
                                return;
                              }

                              if (bauBloqueado) {
                                setToast(`Faltam ${licoesRestantesParaBau} lições para liberar o baú #${numeroBau}.`);
                                return;
                              }

                              void abrirBauDaTrilha(numeroBau);
                            }}
                            className={cn(
                              "h-16 w-16 rounded-2xl border-b-[6px] transition-all flex items-center justify-center",
                              bauJaAberto
                                ? "bg-emerald-500 border-emerald-700 text-white"
                                : bauBloqueado
                                  ? "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-300"
                                  : "bg-amber-500 border-amber-700 text-white animate-pulse",
                              bauCarregando && "opacity-70 cursor-wait"
                            )}
                          >
                            {bauCarregando ? (
                              <Sparkles className="h-7 w-7 animate-spin" />
                            ) : bauJaAberto ? (
                              <Check className="h-8 w-8" />
                            ) : bauBloqueado ? (
                              <Lock className="h-7 w-7" />
                            ) : (
                              <Gift className="h-8 w-8" />
                            )}
                          </button>
                          <p className="mt-2 text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 text-center">
                            Baú {numeroBau}
                          </p>
                          <p className="text-[9px] uppercase tracking-wider font-black text-slate-400 dark:text-slate-500 text-center max-w-[94px]">
                            {bauCarregando
                              ? 'Abrindo...'
                              : bauJaAberto
                                ? 'Recompensa resgatada'
                                : bauDisponivel
                                  ? 'Toque para abrir'
                                  : `${licoesRestantesParaBau} lições restantes`}
                          </p>
                        </motion.div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {modalPremioAberto && premioBauRecebido && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[145] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.84, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="w-full max-w-xl rounded-[2.5rem] border-2 bg-white dark:bg-slate-900 p-8 md:p-10 shadow-2xl"
              style={{ borderColor: `${premioBauRecebido.cor}88` }}
            >
              <div className="flex items-center justify-center gap-2 mb-6" style={{ color: premioBauRecebido.cor }}>
                <Sparkles className="h-5 w-5" />
                <p className="text-xs md:text-sm font-black uppercase tracking-[0.2em]">Baú aberto</p>
                <Sparkles className="h-5 w-5" />
              </div>

              <div className="flex items-center justify-center mb-6">
                <div
                  className="h-24 w-24 md:h-28 md:w-28 rounded-[2rem] flex items-center justify-center shadow-xl"
                  style={{ backgroundColor: `${premioBauRecebido.cor}22`, color: premioBauRecebido.cor }}
                >
                  <IconePremioBau className="h-12 w-12 md:h-14 md:w-14" />
                </div>
              </div>

              <h2 className="text-center text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-3">
                {premioBauRecebido.titulo}
              </h2>
              <p className="text-center text-slate-500 dark:text-slate-300 font-bold leading-relaxed">
                {premioBauRecebido.descricao}
              </p>

              <button
                onClick={() => {
                  setModalPremioAberto(false);
                  setPremioBauRecebido(null);
                }}
                className="w-full mt-8 text-white font-black uppercase tracking-widest py-4 rounded-2xl border-b-8 active:border-b-0 active:translate-y-2 transition-all"
                style={{
                  backgroundColor: premioBauRecebido.cor,
                  borderBottomColor: `${premioBauRecebido.cor}CC`
                }}
              >
                Coletar prêmio
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Animation Modal */}
      <AnimatePresence>
        {showStreakModal && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[120]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 dark:bg-black/90 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative inline-block mb-6">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative z-10"
                  >
                    <div className="bg-orange-500 p-8 rounded-full shadow-[0_10px_0_0_#c2410c] flex items-center justify-center">
                      <Flame className="h-24 w-24 text-white fill-white" />
                    </div>
                  </motion.div>
                  
                  {/* Decorative particles */}
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-orange-500/30 blur-3xl rounded-full -z-10"
                  />
                </div>

                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl font-black text-orange-600 mb-2"
                >
                  {streakValue}
                </motion.h2>
                
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-tighter">
                  Dias de Ofensiva!
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                  Você manteve o ritmo! Continue aprendendo todos os dias para não perder sua chama.
                </p>
                
                <button 
                  onClick={() => setShowStreakModal(false)}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-5 rounded-2xl border-b-8 border-orange-700 active:border-b-0 active:translate-y-2 transition-all text-xl uppercase tracking-widest"
                >
                  Incrível!
                </button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
          >
            <div className="bg-red-500 text-white font-black px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-b-4 border-red-700">
               <div className="bg-white/20 p-2 rounded-xl">
                 <Zap className="h-5 w-5" />
               </div>
               <span className="text-sm">{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

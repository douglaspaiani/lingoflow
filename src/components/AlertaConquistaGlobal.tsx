"use client";

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Star,
  Flame,
  Award,
  Crown,
  Medal,
  Target,
  Rocket,
  Zap,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Users,
  Gem,
  Heart
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const mapaIconesConquista = {
  Trophy,
  Star,
  Flame,
  Award,
  Crown,
  Medal,
  Target,
  Rocket,
  Zap,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Users,
  Gem,
  Heart
};

function normalizarCorHexadecimal(cor: string) {
  const regexHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!regexHex.test(cor)) return '#3B82F6';
  return cor;
}

export function AlertaConquistaGlobal() {
  const { conquistaEmDestaque, dispensarConquistaEmDestaque } = useUser();

  useEffect(() => {
    if (!conquistaEmDestaque) return;

    const dispararFogos = () => {
      confetti({
        particleCount: 160,
        spread: 90,
        startVelocity: 42,
        origin: { y: 0.65 }
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.2, y: 0.75 }
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.8, y: 0.75 }
      });
    };

    dispararFogos();
    const temporizadorAutoFechamento = window.setTimeout(() => {
      dispensarConquistaEmDestaque();
    }, 5200);

    return () => {
      window.clearTimeout(temporizadorAutoFechamento);
    };
  }, [conquistaEmDestaque, dispensarConquistaEmDestaque]);

  const ComponenteIcone =
    (conquistaEmDestaque?.icone &&
      mapaIconesConquista[conquistaEmDestaque.icone as keyof typeof mapaIconesConquista]) ||
    Trophy;
  const corConquista = normalizarCorHexadecimal(conquistaEmDestaque?.cor || '#3B82F6');

  return (
    <AnimatePresence>
      {conquistaEmDestaque && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 18 }}
            className="w-full max-w-xl rounded-[2.5rem] border-2 bg-white dark:bg-slate-900 p-8 md:p-10 shadow-2xl"
            style={{ borderColor: `${corConquista}88` }}
          >
            <div className="flex items-center justify-center gap-2 mb-6" style={{ color: corConquista }}>
              <Sparkles className="h-5 w-5" />
              <p className="text-xs md:text-sm font-black uppercase tracking-[0.2em]">Conquista desbloqueada</p>
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="flex items-center justify-center mb-6">
              <div
                className="h-24 w-24 md:h-28 md:w-28 rounded-[2rem] flex items-center justify-center shadow-xl"
                style={{ backgroundColor: `${corConquista}22`, color: corConquista }}
              >
                <ComponenteIcone className="h-12 w-12 md:h-14 md:w-14" />
              </div>
            </div>

            <h2 className="text-center text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-3">
              {conquistaEmDestaque.nome}
            </h2>
            <p className="text-center text-slate-500 dark:text-slate-300 font-bold leading-relaxed">
              {conquistaEmDestaque.descricao}
            </p>

            <button
              onClick={dispensarConquistaEmDestaque}
              className="w-full mt-8 text-white font-black uppercase tracking-widest py-4 rounded-2xl border-b-8 active:border-b-0 active:translate-y-2 transition-all"
              style={{
                backgroundColor: corConquista,
                borderBottomColor: `${corConquista}CC`
              }}
            >
              Continuar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

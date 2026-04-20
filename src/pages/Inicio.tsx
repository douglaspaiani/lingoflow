import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Lock, BookOpen, Flame, Battery } from 'lucide-react';
import { cn } from '../lib/utils';
import { AppData, Level, User } from '../types';
import { useUser } from '../contexts/UserContext';

export default function Inicio() {
  const { data, currentUser } = useUser();
  const [toast, setToast] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const navigate = useNavigate();

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

  if (!data || !currentUser) return (
    <div className="flex flex-col items-center justify-center pt-40 gap-4">
      <div className="h-16 w-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      <span className="font-black text-green-500 uppercase tracking-widest animate-pulse">Carregando Mapa...</span>
    </div>
  );

  let lessonCounter = 0;
  const allLessons = data.levels.flatMap((l, lIdx) => 
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
          {data.levels.map((level, index) => {
            // Calculate start and end lesson counters for this level to draw local SVG path
            const startIdx = level.id === '1' ? 0 : data.levels.slice(0, index).flatMap(l => l.lessons).length;
            
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
                <div className="mt-6 w-full h-4 bg-black/10 rounded-full overflow-hidden">
                  <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: '30%' }}
                     className={cn("h-full rounded-full progress-shine", index % 2 === 0 ? "bg-green-300" : "bg-blue-300")} 
                  />
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
                  
                  return (
                    <motion.div
                      key={lesson.id}
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
                                  if (currentUser.energy <= 0) {
                                    setToast("Cuidado! Você está sem energia. Aguarde ou peça bônus ao seu tutor!");
                                  } else {
                                    navigate(`/licao/${lesson.id}`);
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
                  );
                })}
              </div>
            </motion.div>
          );
        })}
        </motion.div>
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
                 <Battery className="h-5 w-5" />
               </div>
               <span className="text-sm">{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

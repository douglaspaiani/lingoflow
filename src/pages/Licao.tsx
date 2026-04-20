import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { AppData, Lesson, Exercise } from '../types';
import { useUser } from '../contexts/UserContext';

export default function Licao() {
  const { updateProgress } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then((data: AppData) => {
        const found = data.levels.flatMap(l => l.lessons).find(l => l.id === id);
        if (found) {
          setLesson(found);
          setSessionExercises(found.exercises);
        }
      });
  }, [id]);

  if (!lesson || sessionExercises.length === 0) return null;

  const currentExercise = sessionExercises[currentIndex];
  // Progress is based on the current position relative to the total session length
  const progress = (currentIndex / sessionExercises.length) * 100;

  const handleExitLesson = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    navigate('/');
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    const correct = selectedOption === currentExercise.answer;
    setIsCorrect(correct);
    setIsAnswered(true);
    
    if (correct) {
      // Play sound? (skipped for now)
    }
  };

  const handleNext = async () => {
    if (!isCorrect) {
      // Se errou, adiciona o exercício atual ao final da lista
      setSessionExercises(prev => [...prev, { ...currentExercise, id: `${currentExercise.id}-retry-${Date.now()}` }]);
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      return;
    }

    // Se acertou, verifica se há mais exercícios
    if (currentIndex + 1 < sessionExercises.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Calculate total XP from exercises
      const totalXp = sessionExercises.reduce((acc, ex) => acc + (ex.xp || 10), 0);
      
      try {
        await updateProgress(totalXp, id);
        setFinished(true);
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 }
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro ao salvar progresso');
        navigate('/');
      }
    }
  };

  if (finished) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 z-50">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-yellow-400 p-8 rounded-full mb-8 shadow-xl"
        >
          <CheckCircle2 className="h-24 w-24 text-white" />
        </motion.div>
        <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 mb-2 text-center">Lição Completa!</h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-bold mb-12">+{sessionExercises.reduce((acc, ex) => acc + (ex.xp || 10), 0)} XP Total</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
          <div className="bg-orange-100 dark:bg-orange-900/20 p-4 rounded-2xl border-2 border-orange-200 dark:border-orange-900/40 text-center">
            <span className="block text-2xl font-black text-orange-600">5</span>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Dias</span>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-2xl border-2 border-blue-200 dark:border-blue-900/40 text-center">
            <span className="block text-2xl font-black text-blue-600">1265</span>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">XP Total</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="w-full max-w-sm bg-green-500 hover:bg-green-400 text-white font-black py-4 rounded-2xl border-b-8 border-green-700 active:border-b-0 active:translate-y-2 transition-all text-xl uppercase tracking-widest"
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white dark:bg-slate-950 flex flex-col z-50 transition-colors duration-300"
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-4 max-w-4xl mx-auto w-full">
        <button onClick={handleExitLesson} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
          <X className="h-8 w-8" />
        </button>
        <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-12 relative">
        {/* Large animation overlay (X or Check) */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-[60]"
            >
              {isCorrect ? (
                <div className="bg-green-500/20 backdrop-blur-sm rounded-full p-12 animate-pulse">
                  <CheckCircle2 className="h-48 w-48 text-green-500 drop-shadow-2xl" strokeWidth={4} />
                </div>
              ) : (
                <div className="bg-red-500/20 backdrop-blur-sm rounded-full p-12 animate-pulse">
                  <X className="h-48 w-48 text-red-500 drop-shadow-2xl" strokeWidth={4} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-8 leading-tight">
            {currentExercise.type === 'match' ? 'Combine os pares' : 
             currentExercise.type === 'reorder' ? 'Traduza esta frase' :
             currentExercise.type === 'translate' ? 'Traduza esta frase' : 'Selecione a opção correta'}
          </h2>

          {currentExercise.type === 'match' ? (
            <MatchGame 
              pairs={currentExercise.pairs || []} 
              onComplete={() => {
                setIsCorrect(true);
                setIsAnswered(true);
                setSelectedOption('completed'); // Dummy selection to enable continue
              }}
              isAnswered={isAnswered}
            />
          ) : currentExercise.type === 'reorder' ? (
            <ReorderGame 
              answer={currentExercise.answer}
              options={currentExercise.options || []}
              onAnswer={(assembled) => {
                setSelectedOption(assembled);
              }}
              isAnswered={isAnswered}
              isCorrect={isCorrect}
            />
          ) : (
            <>
              <div className="flex items-start gap-4 mb-12">
                <motion.div 
                  animate={isAnswered ? (isCorrect ? { scale: [1, 1.2, 1] } : { x: [0, -10, 10, -10, 10, 0] }) : {}}
                  className="h-24 w-24 bg-green-100 dark:bg-green-900/20 rounded-[2rem] border-2 border-green-200 dark:border-green-800 flex items-center justify-center p-3 shadow-lg relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent" />
                  <img src="https://picsum.photos/seed/owl/200" className="rounded-xl relative z-10" alt="Owl Mascot" referrerPolicy="no-referrer" />
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-8 relative shadow-xl"
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[10px] border-r-slate-100 dark:border-r-slate-800" />
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Volume2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Ouvir Áudio</span>
                  </div>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 underline decoration-4 decoration-slate-100 dark:decoration-slate-800 underline-offset-8">
                    {currentExercise.question}
                  </p>
                </motion.div>
              </div>

              <div className="grid gap-4">
                <AnimatePresence>
                {currentExercise.options?.map((option, i) => (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => !isAnswered && setSelectedOption(option)}
                    className={cn(
                      "w-full p-6 rounded-2xl border-2 text-left font-black transition-all text-xl btn-duo",
                      selectedOption === option 
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-[6px] border-b-blue-500 -translate-y-1" 
                        : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b-[6px] border-b-slate-200 dark:border-b-slate-800",
                      isAnswered && isCorrect && option === currentExercise.answer && "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-b-green-500",
                      isAnswered && !isCorrect && selectedOption === option && "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b-red-500 animate-shake"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">{i + 1}</span>
                      {option}
                    </div>
                  </motion.button>
                ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer / Results */}
      <div className={cn(
        "p-6 transition-colors duration-300 border-t",
        isAnswered 
          ? (isCorrect ? "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-900/40" : "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900/40") 
          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
      )}>
        <div className="max-w-xl mx-auto flex items-center justify-center">
          <button
            onClick={isAnswered ? handleNext : handleCheck}
            disabled={!selectedOption && !isAnswered}
            className={cn(
              "w-full sm:w-80 py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all",
              !isAnswered 
                ? (selectedOption ? "bg-green-500 text-white shadow-[0_4px_0_0_#15803d]" : "bg-gray-200 text-gray-400 cursor-not-allowed")
                : (isCorrect ? "bg-green-500 text-white shadow-[0_4px_0_0_#15803d]" : "bg-red-500 text-white shadow-[0_4px_0_0_#b91c1c]")
            )}
          >
            {isAnswered ? 'Continuar' : 'Verificar'}
          </button>
        </div>
      </div>

      {/* Exit Dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitDialog(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="text-center">
                <div className="h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <AlertCircle className="h-14 w-14 text-red-500 shrink-0" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Abandonar Lição?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">
                  Todo o progresso nesta atividade será perdido. Tem certeza que deseja sair?
                </p>
                
                <div className="space-y-3">
                  <button 
                    onClick={handleConfirmExit}
                    className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest"
                  >
                    Sair
                  </button>
                  <button 
                    onClick={() => setShowExitDialog(false)}
                    className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-500 dark:text-blue-400 font-black py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all uppercase tracking-widest"
                  >
                    Ficar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReorderGame({ answer, options, onAnswer, isAnswered, isCorrect }: { 
  answer: string; 
  options: string[]; 
  onAnswer: (assembled: string) => void;
  isAnswered: boolean;
  isCorrect: boolean;
}) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [poolWords, setPoolWords] = useState<string[]>([]);

  useEffect(() => {
    // Initial pool includes correct answer words + additional options
    const answerWords = answer.split(' ');
    // Combine and shuffle
    const combined = [...answerWords, ...options].sort(() => Math.random() - 0.5);
    setPoolWords(combined);
    setSelectedWords([]);
  }, [answer, options]);

  const toggleWord = (word: string, fromPool: boolean, index: number) => {
    if (isAnswered) return;

    if (fromPool) {
      const newSelected = [...selectedWords, word];
      setSelectedWords(newSelected);
      setPoolWords(prev => prev.filter((_, i) => i !== index));
      onAnswer(newSelected.join(' '));
    } else {
      const newSelected = selectedWords.filter((_, i) => i !== index);
      setSelectedWords(newSelected);
      setPoolWords(prev => [...prev, word]);
      onAnswer(newSelected.join(' '));
    }
  };

  return (
    <div className="space-y-12 py-8">
      {/* Selected Area */}
      <div className="min-h-[120px] border-y-2 border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 items-center p-4">
        {selectedWords.map((word, i) => (
          <motion.button
            key={`${word}-${i}`}
            layoutId={`word-${word}-${i}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => toggleWord(word, false, i)}
            className={cn(
              "px-4 py-2 rounded-xl border-2 font-bold text-lg shadow-sm transition-all",
              isAnswered && !isCorrect ? "bg-red-50 text-red-600 border-red-200" :
              isAnswered && isCorrect ? "bg-green-50 text-green-600 border-green-200" :
              "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 border-b-4"
            )}
          >
            {word}
          </motion.button>
        ))}
      </div>

      {/* Pool Area */}
      <div className="flex flex-wrap gap-3 justify-center">
        {poolWords.map((word, i) => (
          <motion.button
            key={`${word}-${i}`}
            layoutId={`pool-${word}-${i}`}
            onClick={() => toggleWord(word, true, i)}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-lg border-b-4 hover:bg-slate-50 transition-all active:border-b-0 active:translate-y-1"
          >
            {word}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function MatchGame({ pairs, onComplete, isAnswered }: { pairs: { left: string; right: string }[]; onComplete: () => void; isAnswered: boolean }) {
  const [leftItems, setLeftItems] = useState<{ id: string; text: string }[]>([]);
  const [rightItems, setRightItems] = useState<{ id: string; text: string }[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [errorIds, setErrorIds] = useState<{left: string, right: string} | null>(null);

  useEffect(() => {
    const left = pairs.map((p, i) => ({ id: `p-${i}`, text: p.left }));
    const right = pairs.map((p, i) => ({ id: `p-${i}`, text: p.right }));
    setLeftItems([...left].sort(() => Math.random() - 0.5));
    setRightItems([...right].sort(() => Math.random() - 0.5));
  }, [pairs]);

  useEffect(() => {
    if (selectedLeft && selectedRight) {
      if (selectedLeft === selectedRight) {
        setMatchedIds(prev => [...prev, selectedLeft]);
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        const currentLeft = selectedLeft;
        const currentRight = selectedRight;
        setErrorIds({ left: currentLeft, right: currentRight });
        setTimeout(() => {
          setErrorIds(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 800);
      }
    }
  }, [selectedLeft, selectedRight]);

  useEffect(() => {
    if (matchedIds.length === pairs.length && pairs.length > 0) {
      onComplete();
    }
  }, [matchedIds, pairs, onComplete]);

  return (
    <div className="grid grid-cols-2 gap-8 mt-12 pb-20">
      <div className="space-y-4">
        {leftItems.map((item) => {
          const isMatched = matchedIds.includes(item.id);
          const isSelected = selectedLeft === item.id;
          const isError = errorIds?.left === item.id;
          
          return (
            <motion.button
              key={item.id}
              initial={false}
              animate={isMatched ? { opacity: 0.3, scale: 0.95 } : { opacity: 1, scale: 1 }}
              disabled={isMatched || isAnswered || errorIds !== null}
              onClick={() => setSelectedLeft(item.id)}
              className={cn(
                "w-full p-6 rounded-2xl border-2 font-black transition-all text-lg btn-duo min-h-[80px] flex items-center justify-center",
                isMatched ? "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-slate-300 dark:text-slate-700 pointer-events-none" : 
                isSelected ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-[6px] border-b-blue-500 -translate-y-1" :
                isError ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b-red-500 animate-shake" :
                "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b-[6px] border-b-slate-200 dark:border-b-slate-800"
              )}
            >
              {item.text}
            </motion.button>
          );
        })}
      </div>
      <div className="space-y-4">
        {rightItems.map((item) => {
          const isMatched = matchedIds.includes(item.id);
          const isSelected = selectedRight === item.id;
          const isError = errorIds?.right === item.id;

          return (
            <motion.button
              key={item.id}
              initial={false}
              animate={isMatched ? { opacity: 0.3, scale: 0.95 } : { opacity: 1, scale: 1 }}
              disabled={isMatched || isAnswered || errorIds !== null}
              onClick={() => setSelectedRight(item.id)}
              className={cn(
                "w-full p-6 rounded-2xl border-2 font-black transition-all text-lg btn-duo min-h-[80px] flex items-center justify-center",
                isMatched ? "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-slate-300 dark:text-slate-700 pointer-events-none" : 
                isSelected ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-[6px] border-b-blue-500 -translate-y-1" :
                isError ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b-red-500 animate-shake" :
                "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b-[6px] border-b-slate-200 dark:border-b-slate-800"
              )}
            >
              {item.text}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

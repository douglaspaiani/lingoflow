"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Trophy, Flame, Star, Zap, Users, BarChart3, GraduationCap, CheckCircle2, Check, Server, ShieldCheck, HeartHandshake, Database, RefreshCw, History, Globe, Cpu, Smartphone, ChevronLeft, ChevronRight, Lock } from 'lucide-react';


export default function Escolas() {
  const [ciclo, setCiclo] = useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal');
  const [activeScreen, setActiveScreen] = useState(0);

  const screensData = [
    {
      title: "Trilhas de Aprendizado",
      desc: "Um caminho visual e claro de onde o aluno está e para onde deve ir. Estruturado em fases para dar a sensação de progresso constante."
    },
    {
      title: "Exercícios Dinâmicos",
      desc: "Múltipla escolha, preenchimento, áudio e escrita. Atividades curtas que mantêm o cérebro engajado sem causar fadiga."
    },
    {
      title: "Ligas e Rankings",
      desc: "Sistema de ligas (Bronze, Prata, Ouro) onde os alunos sobem ou descem dependendo do esforço na semana."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % screensData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [screensData.length]);

  const nextScreen = () => setActiveScreen((prev) => (prev + 1) % screensData.length);
  const prevScreen = () => setActiveScreen((prev) => (prev - 1 + screensData.length) % screensData.length);

  const renderMockupScreen = (index: number) => {
    switch(index) {
      case 0:
        return (
          <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-4 pt-8">
            <div className="flex justify-between items-center mb-6">
              <div className="font-black text-slate-800 dark:text-white">Unidade 4</div>
              <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                <Flame className="w-4 h-4 fill-current" /> 12
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative">
               <div className="absolute top-10 bottom-10 w-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
               <div className="w-16 h-16 bg-green-500 rounded-full border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center z-10 shadow-lg">
                 <Star className="w-8 h-8 text-white fill-white" />
               </div>
               <div className="w-16 h-16 bg-blue-500 rounded-full border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center z-10 opacity-50">
                 <Lock className="w-6 h-6 text-white" />
               </div>
               <div className="w-16 h-16 bg-purple-500 rounded-full border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center z-10 opacity-50">
                 <Lock className="w-6 h-6 text-white" />
               </div>
            </div>
            <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
               <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
               <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
               <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col h-full bg-white dark:bg-slate-900 p-4 pt-8">
             <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full mb-8">
               <div className="w-2/3 h-full bg-green-500 rounded-full" />
             </div>
             <h4 className="font-black text-xl text-slate-800 dark:text-white mb-6">Traduza a frase</h4>
             <div className="flex gap-3 mb-8">
               <div className="w-12 h-12 shrink-0 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center">
                 <Users className="w-6 h-6 text-blue-500" />
               </div>
               <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none flex-1 font-medium text-slate-700 dark:text-slate-300 text-sm">
                 The cat is black.
               </div>
             </div>
             <div className="flex-1 border-t-2 border-b-2 border-slate-100 dark:border-slate-800 py-4 flex flex-wrap gap-2 content-start">
               {['O', 'gato', 'cachorro', 'é', 'preto', 'branco'].map((w, i) => (
                 <div key={i} className="px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-400 text-sm">
                   {w}
                 </div>
               ))}
             </div>
             <div className="mt-4">
               <button className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-lg shadow-[0_4px_0_0_#15803d]">Verificar</button>
             </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-4 pt-8">
             <div className="text-center mb-6">
               <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 text-yellow-500 rounded-full mb-2">
                 <Trophy className="w-6 h-6 fill-current" />
               </div>
               <h4 className="font-black text-lg text-slate-800 dark:text-white">Liga Ouro</h4>
             </div>
             <div className="flex-1 space-y-3">
               {[
                 { pos: 1, name: "Maria S.", xp: 450, color: "text-yellow-500" },
                 { pos: 2, name: "Você", xp: 420, color: "text-slate-400", bg: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" },
                 { pos: 3, name: "João P.", xp: 380, color: "text-amber-700" },
                 { pos: 4, name: "Ana B.", xp: 210, color: "text-slate-500" },
               ].map((u, i) => (
                 <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl ${u.bg || 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'}`}>
                   <div className={`w-6 text-center font-bold ${u.color}`}>{u.pos}</div>
                   <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                   <div className="flex-1 font-bold text-slate-800 dark:text-white truncate">{u.name}</div>
                   <div className="font-black text-slate-500 text-sm whitespace-nowrap">{u.xp} XP</div>
                 </div>
               ))}
             </div>
          </div>
        );
      default: return null;
    }
  };

  const getDesconto = () => {
    switch(ciclo) {
      case 'trimestral': return 0.9;
      case 'semestral': return 0.85;
      case 'anual': return 0.8;
      default: return 1;
    }
  };

  const multiplicador = getDesconto();

  const planos = [
    {
      nome: 'Básico',
      alunos: 'Até 100 alunos',
      precoBase: 149.90,
      destaque: false,
      recursos: [
        'Mecânicas de Gamificação',
        'Dashboard Simples',
        'Suporte por Email',
        'App Padrão'
      ]
    },
    {
      nome: 'Pro',
      alunos: 'Até 500 alunos',
      precoBase: 249.90,
      destaque: true,
      recursos: [
        'Tudo do Básico',
        'Dashboard Avançado',
        'Criação de Trilhas Customizadas',
        'Suporte Prioritário',
        'Identidade Visual Básica'
      ]
    },
    {
      nome: 'Elite',
      alunos: 'Alunos Ilimitados',
      precoBase: 399.90,
      destaque: false,
      recursos: [
        'Tudo do Pro',
        'IA Integrada',
        'White-label Completo',
        'Gerente de Conta Dedicado',
        'API de Integração'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-500/30">
      <Helmet>
        <title>LingoFlow para Escolas - Gamificação no Ensino de Idiomas</title>
        <meta name="description" content="Transforme alunos em viciados em aprender com a plataforma white-label LingoFlow. Aumente a retenção e o engajamento na sua escola de idiomas usando gamificação comprovada." />
        <meta property="og:title" content="LingoFlow para Escolas" />
        <meta property="og:description" content="Transforme alunos em viciados em aprender. Gamificação avançada para sua escola de idiomas." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <nav className="fixed top-0 left-0 right-0 h-20 z-50 transition-all duration-300 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="LingoFlow Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
            <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-500 tracking-tight pb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
              lingoflow
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-300">
            <a href="#beneficios" className="hover:text-blue-500 transition-colors">Benefícios</a>
            <a href="#gamificacao" className="hover:text-orange-500 transition-colors">Gamificação</a>
            <a href="#professores" className="hover:text-green-500 transition-colors">Para Professores</a>
            <a href="#telas" className="hover:text-indigo-500 transition-colors">Telas</a>
            <a href="#planos" className="hover:text-purple-500 transition-colors">Preços</a>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-bold transition-all shadow-[0_4px_0_0_#1d4ed8] hover:shadow-[0_2px_0_0_#1d4ed8] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none">
            Falar com Consultor
          </button>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/20 dark:bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-sm mb-6 border border-blue-200 dark:border-blue-800/50">
              <Sparkles className="w-4 h-4" />
              <span>O futuro do ensino de idiomas</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6">
              Transforme alunos em <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">viciados em aprender.</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
              Leve a metodologia da sua escola de idiomas para uma plataforma com gamificação avançada. Aumente a retenção, o engajamento e os resultados dos seus alunos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-[0_6px_0_0_#1e3a8a] hover:shadow-[0_4px_0_0_#1e3a8a] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none group">
                Agendar Demonstração
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 px-8 py-4 rounded-2xl font-black text-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95">
                Ver Funcionalidades
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-[2.5rem] border-8 border-white dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden aspect-[4/3] flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-950" />
               
               <div className="relative w-full h-full p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <img src="/images/logo.png" alt="LingoFlow Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
                      <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-500 tracking-tight pb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                        lingoflow
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 text-orange-500 font-black"><Flame className="w-5 h-5 fill-current" /> 12</div>
                      <div className="flex items-center gap-1 text-blue-500 font-black"><Star className="w-5 h-5 fill-current" /> 450</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 w-full bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-700">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${i === 1 ? 'bg-blue-100 text-blue-500' : i === 2 ? 'bg-purple-100 text-purple-500' : 'bg-green-100 text-green-500'}`}>
                            <Zap className="w-6 h-6" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </div>

            <motion.div 
              animate={{ y: [-10, 10, -10] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3"
            >
              <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-xl">
                <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ofensiva</div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">12 Dias</div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [10, -10, 10] }} 
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3"
            >
              <div className="bg-yellow-100 dark:bg-yellow-500/20 p-2 rounded-xl">
                <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ranking</div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">1º Lugar</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="gamificacao" className="py-24 bg-white dark:bg-slate-900 px-6 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              A neurociência do <span className="text-orange-500">engajamento</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
              Não é apenas um jogo. Utilizamos mecânicas comprovadas de gamificação para criar hábitos de estudo diários que seus alunos não vão querer quebrar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Flame,
                color: "text-orange-500",
                bg: "bg-orange-100 dark:bg-orange-500/20",
                title: "Ofensivas Diárias (Streaks)",
                desc: "O medo de perder a ofensiva (FOMO) faz com que os alunos retornem todos os dias, criando um hábito de estudo consistente."
              },
              {
                icon: Trophy,
                color: "text-yellow-500",
                bg: "bg-yellow-100 dark:bg-yellow-500/20",
                title: "Rankings Semanais",
                desc: "Ligas competitivas onde os alunos competem entre si. A competição saudável aumenta drasticamente o tempo gasto no app."
              },
              {
                icon: Star,
                color: "text-blue-500",
                bg: "bg-blue-100 dark:bg-blue-500/20",
                title: "Recompensas Imediatas",
                desc: "XP, baús de tesouro e conquistas desbloqueáveis que liberam dopamina a cada acerto, tornando o aprendizado viciante."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all"
              >
                <div className={`w-16 h-16 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="w-8 h-8 fill-current" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 grid grid-cols-2 gap-4">
             <motion.div 
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="space-y-4 translate-y-8"
             >
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-4xl font-black text-blue-500 mb-2">+85%</div>
                  <div className="text-sm font-bold text-slate-600 dark:text-slate-400">Retenção de alunos</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-3xl shadow-lg text-white">
                  <Users className="w-8 h-8 mb-4 opacity-80" />
                  <div className="text-2xl font-black mb-1">Comunidade</div>
                  <div className="text-sm font-medium opacity-90">Alunos adicionam amigos e competem juntos</div>
                </motion.div>
             </motion.div>
             <motion.div 
               initial={{ opacity: 0, x: 30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="space-y-4"
             >
                <motion.div whileHover={{ scale: 1.05 }} className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-3xl shadow-lg text-white">
                  <GraduationCap className="w-8 h-8 mb-4 opacity-80" />
                  <div className="text-2xl font-black mb-1">White-label</div>
                  <div className="text-sm font-medium opacity-90">Personalize com a identidade da sua escola</div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-4xl font-black text-orange-500 mb-2">3x</div>
                  <div className="text-sm font-bold text-slate-600 dark:text-slate-400">Mais tarefas concluídas</div>
                </motion.div>
             </motion.div>
          </div>

          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              Feito para escalar o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">negócio.</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 font-medium leading-relaxed">
              Diferencie sua escola da concorrência oferecendo uma experiência tecnológica de ponta que os alunos amam.
            </p>
            <ul className="space-y-4">
              {[
                "Reduza a taxa de desistência (churn) nos primeiros meses",
                "Automatize a correção de exercícios de fixação",
                "Ofereça um diferencial de vendas para captação de novos alunos",
                "Aumente o tempo de contato do aluno com o idioma fora da sala"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-lg text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="professores" className="py-24 bg-slate-900 text-white px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-blue-400 font-bold text-sm mb-6">
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard Exclusivo</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Superpoderes para seus professores
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto font-medium">
            Seus professores terão acesso a um painel completo para acompanhar o desempenho de cada turma em tempo real.
          </p>
          
          <div className="bg-slate-800 rounded-[2rem] p-8 md:p-12 border border-slate-700 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />
             <div className="grid md:grid-cols-3 gap-8 text-left">
               <div>
                 <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                   <Users className="w-6 h-6" />
                 </div>
                 <h4 className="text-xl font-black mb-2">Visão da Turma</h4>
                 <p className="text-slate-400 font-medium">Identifique rapidamente quais alunos estão ficando para trás e precisam de ajuda extra.</p>
               </div>
               <div>
                 <div className="bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center text-purple-400 mb-4">
                   <Zap className="w-6 h-6" />
                 </div>
                 <h4 className="text-xl font-black mb-2">Criação de Trilhas</h4>
                 <p className="text-slate-400 font-medium">Professores podem criar lições customizadas alinhadas com o material didático da semana.</p>
               </div>
               <div>
                 <div className="bg-green-500/20 w-12 h-12 rounded-xl flex items-center justify-center text-green-400 mb-4">
                   <BarChart3 className="w-6 h-6" />
                 </div>
                 <h4 className="text-xl font-black mb-2">Relatórios Detalhados</h4>
                 <p className="text-slate-400 font-medium">Métricas de acertos por tipo de habilidade (gramática, vocabulário, escuta).</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      <section id="telas" className="py-24 bg-white dark:bg-slate-900 px-6 border-y border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm mb-6">
            <Smartphone className="w-4 h-4" />
            <span>App na Prática</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
            Uma experiência <span className="text-indigo-500">viciante</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-16 max-w-3xl mx-auto font-medium">
            Desenvolvido para parecer e funcionar como os apps favoritos dos seus alunos.
          </p>

          <div className="relative max-w-sm mx-auto">
            {/* iPhone Frame */}
            <div className="relative mx-auto border-slate-900 dark:border-slate-800 bg-slate-900 border-[14px] rounded-[3rem] h-[600px] w-[300px] shadow-2xl">
              <div className="absolute top-0 inset-x-0 z-20">
                <div className="w-32 h-[24px] bg-slate-900 rounded-b-[1rem] mx-auto"></div>
              </div>
              
              {/* Screen Content */}
              <div className="relative bg-white dark:bg-slate-950 w-full h-full rounded-[2rem] overflow-hidden flex flex-col">
                 <AnimatePresence mode="wait">
                    <motion.div
                      key={activeScreen}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full absolute inset-0"
                    >
                      {renderMockupScreen(activeScreen)}
                    </motion.div>
                 </AnimatePresence>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button onClick={prevScreen} className="absolute top-1/2 -left-4 md:-left-20 -translate-y-1/2 bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white hover:scale-110 hover:-translate-x-1 transition-all z-10">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextScreen} className="absolute top-1/2 -right-4 md:-right-20 -translate-y-1/2 bg-white dark:bg-slate-800 p-4 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white hover:scale-110 hover:translate-x-1 transition-all z-10">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          <div className="mt-16 max-w-lg mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  {screensData[activeScreen].title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {screensData[activeScreen].desc}
                </p>
              </motion.div>
            </AnimatePresence>
            
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {screensData.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveScreen(i)}
                  className={`h-3 rounded-full transition-all duration-300 ${activeScreen === i ? 'bg-indigo-500 w-8' : 'bg-slate-300 dark:bg-slate-700 w-3'}`}
                  aria-label={`Ir para tela ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="planos" className="py-24 bg-slate-50 dark:bg-slate-950 px-6 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Investimento</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              Planos que crescem com você
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium mb-8">
              Todos os planos possuem uma taxa única de implementação de <span className="font-bold text-slate-900 dark:text-white">R$ 990</span>.
            </p>

            <div className="inline-flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl">
              {(['mensal', 'trimestral', 'semestral', 'anual'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCiclo(c)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${
                    ciclo === c 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {c}
                  {c === 'anual' && <span className="ml-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">-20%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
            {planos.map((plano, i) => {
              const precoFinal = plano.precoBase * multiplicador;
              const precoFormatado = precoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const economia = ((plano.precoBase - precoFinal) * (ciclo === 'anual' ? 12 : ciclo === 'semestral' ? 6 : 3)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ y: -10, scale: plano.destaque ? 1.05 : 1.02 }}
                  className={`relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border ${
                    plano.destaque 
                      ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105 z-10' 
                      : 'border-slate-200 dark:border-slate-800 shadow-lg'
                  }`}
                >
                  {plano.destaque && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-black tracking-wider uppercase">
                      Mais Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{plano.nome}</h3>
                  <div className="text-sm font-bold text-blue-500 mb-6 bg-blue-50 dark:bg-blue-500/10 inline-block px-3 py-1 rounded-full">
                    {plano.alunos}
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-slate-500">R$</span>
                      <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{precoFormatado}</span>
                      <span className="text-slate-500 font-medium mb-1">/mês</span>
                    </div>
                    {ciclo !== 'mensal' && (
                      <div className="text-sm text-green-500 font-bold mt-2">
                        Economia de R$ {economia} no período
                      </div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plano.recursos.map((recurso, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 shrink-0 mt-0.5 ${recurso === 'IA Integrada' ? 'text-purple-500' : 'text-blue-500'}`} />
                        <span className={`text-slate-700 dark:text-slate-300 font-medium ${recurso === 'IA Integrada' ? 'font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500' : ''}`}>
                          {recurso}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
                    plano.destaque
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_0_0_#1d4ed8] active:translate-y-[4px] active:shadow-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}>
                    Assinar {plano.nome}
                  </button>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-20 max-w-5xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-black text-center text-slate-900 dark:text-white mb-10">
              O que está incluso em todos os planos?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Server, title: 'Servidor Dedicado AWS', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/20' },
                { icon: ShieldCheck, title: 'Certificado SSL', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20' },
                { icon: HeartHandshake, title: 'Suporte Humanizado', color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-500/20' },
                { icon: Database, title: 'Storage AWS S3', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
                { icon: RefreshCw, title: 'Atualização Constante', color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/20' },
                { icon: History, title: 'Backups Semanais', color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-500/20' },
                { icon: Globe, title: 'Domínio Personalizado', color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-500/20' },
                { icon: Cpu, title: 'Alta Qualidade', color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-500/20' }
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${item.bg} ${item.color}`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 dark:opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
            Pronto para modernizar sua escola?
          </h2>
          <p className="text-2xl text-slate-600 dark:text-slate-400 mb-12 font-medium">
            Junte-se a dezenas de escolas inovadoras que já estão usando o LingoFlow.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-[0_6px_0_0_#1d4ed8] hover:shadow-[0_4px_0_0_#1d4ed8] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none">
               Solicitar Orçamento
             </button>
             <Link href="/app" className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 px-10 py-5 rounded-2xl font-black text-xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95">
               Testar o App
             </Link>
          </div>
        </div>
      </section>

      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="LingoFlow Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Fredoka', sans-serif" }}>lingoflow</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            © {new Date().getFullYear()} LingoFlow para Escolas. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

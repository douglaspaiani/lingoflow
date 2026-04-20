import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Flame } from 'lucide-react';
import { AppData, User } from '../types';
import { cn } from '../lib/utils';

export default function Ranking() {
  const [globalUsers, setGlobalUsers] = useState<User[]>([]);
  const [turmaUsers, setTurmaUsers] = useState<User[]>([]);
  const [weekUsers, setWeekUsers] = useState<User[]>([]);
  const [friendsUsers, setFriendsUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'semana' | 'turma' | 'global' | 'amigos'>('semana');

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then((data: AppData) => {
        const sortedGlobal = [...data.users].sort((a, b) => b.points - a.points);
        setGlobalUsers(sortedGlobal);

        // Mock Week Ranking
        const sortedWeek = [...data.users].sort((a, b) => (b.points / 2) - (a.points / 3));
        setWeekUsers(sortedWeek);

        // Mock Turma Ranking
        const currentUser = data.users.find(u => u.id === '1');
        if (currentUser) {
          const others = data.users.filter(u => u.id !== '1').sort(() => 0.5 - Math.random());
          setTurmaUsers([currentUser, ...others].sort((a, b) => b.points - a.points));
          
          // Friends Ranking: Current user + users they follow
          const followingList = data.users.filter(u => currentUser.following.includes(u.id));
          setFriendsUsers([currentUser, ...followingList].sort((a, b) => b.points - a.points));
        }
      });
  }, []);

  const users = activeTab === 'global' ? globalUsers : activeTab === 'turma' ? turmaUsers : activeTab === 'amigos' ? friendsUsers : weekUsers;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="py-6"
    >
      <div className="flex flex-col items-center mb-6 px-4 text-center">
        <motion.div 
           initial={{ rotate: -20, scale: 0 }}
           animate={{ rotate: -6, scale: 1 }}
           className="h-24 w-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-3xl flex items-center justify-center shadow-[0_8px_0_0_#ca8a04] mb-6"
        >
          <Trophy className="h-12 w-12 text-white drop-shadow-md" />
        </motion.div>
        <h1 className="text-3xl font-display font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {activeTab === 'global' ? 'Divisão Diamante' : activeTab === 'turma' ? 'Sua Turma' : 'Ranking Semana'}
        </h1>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-1">
          {activeTab === 'global' ? 'Os melhores do mundo' : activeTab === 'turma' ? 'Compromisso local' : 'Desempenho dos últimos 7 dias'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-3xl mb-1 max-w-md mx-auto shadow-inner overflow-x-auto no-scrollbar border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('semana')}
          className={cn(
            "flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
            activeTab === 'semana' ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-400"
          )}
        >
          Semana
        </button>
        <button
          onClick={() => setActiveTab('turma')}
          className={cn(
            "flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
            activeTab === 'turma' ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-400"
          )}
        >
          Sua Turma
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={cn(
            "flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
            activeTab === 'global' ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-400"
          )}
        >
          Global
        </button>
        <button
          onClick={() => setActiveTab('amigos')}
          className={cn(
            "flex-1 py-3 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
            activeTab === 'amigos' ? "bg-white dark:bg-slate-700 text-blue-500 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-400"
          )}
        >
          Amigos
        </button>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 mb-2 px-4 h-[240px] pt-6 overflow-visible">
        {/* 2nd Place */}
        {users[1] && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: '100%', opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex-1 flex flex-col items-center justify-end max-w-[100px]"
          >
            <Link to={`/perfil/${users[1].id}`} className="flex flex-col items-center w-full">
              <div className="h-14 w-14 rounded-2xl border-4 border-slate-200 dark:border-slate-800 overflow-hidden mb-2 shrink-0 shadow-lg">
                <img 
                  src={users[1].avatar || `https://picsum.photos/seed/user${users[1].id}/100`} 
                  alt="2nd" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-full bg-white dark:bg-slate-800 rounded-t-2xl flex flex-col items-center justify-center p-3 border-b-4 border-slate-200 dark:border-slate-700 h-24 relative group">
                 <Medal className="h-6 w-6 text-slate-400 mb-1" />
                 <span className="font-black text-slate-700 dark:text-slate-300 text-[10px] truncate w-full text-center">{users[1].name}</span>
                 <span className="text-[10px] font-bold text-blue-500">{users[1].points} XP</span>
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-3 py-0.5 rounded-full text-[10px] font-black">2º</div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* 1st Place */}
        {users[0] && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: '100%', opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col items-center justify-end max-w-[120px]"
          >
             <Link to={`/perfil/${users[0].id}`} className="flex flex-col items-center w-full">
               <motion.div 
                 animate={{ y: [0, -8, 0] }}
                 transition={{ repeat: Infinity, duration: 3 }}
                 className="h-16 w-16 rounded-3xl border-4 border-yellow-400 overflow-hidden mb-2 shadow-xl bg-white dark:bg-slate-800 shrink-0 z-10"
               >
                  <img 
                    src={users[0].avatar || `https://picsum.photos/seed/user${users[0].id}/100`} 
                    alt="1st" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
               </motion.div>
               <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 rounded-t-3xl flex flex-col items-center justify-center p-4 border-b-8 border-yellow-200 dark:border-yellow-900/40 h-36 relative group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400/20 progress-shine" />
                  <Trophy className="h-8 w-8 text-yellow-500 mb-1 drop-shadow-sm" />
                  <span className="font-black text-slate-800 dark:text-slate-200 text-xs truncate w-full text-center">{users[0].name}</span>
                  <span className="text-xs font-black text-yellow-600 dark:text-yellow-400">{users[0].points} XP</span>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-white px-4 py-1 rounded-full text-xs font-black shadow-lg">1º</div>
               </div>
             </Link>
          </motion.div>
        )}

        {/* 3rd Place */}
        {users[2] && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: '100%', opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex-1 flex flex-col items-center justify-end max-w-[100px]"
          >
            <Link to={`/perfil/${users[2].id}`} className="flex flex-col items-center w-full">
              <div className="h-12 w-12 rounded-2xl border-4 border-amber-600/30 dark:border-amber-900/30 overflow-hidden mb-2 shrink-0 shadow-sm">
                <img 
                  src={users[2].avatar || `https://picsum.photos/seed/user${users[2].id}/100`} 
                  alt="3rd" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-full bg-white dark:bg-slate-800 rounded-t-2xl flex flex-col items-center justify-center p-3 border-b-4 border-slate-100 dark:border-slate-700 h-20 relative group shadow-sm">
                 <Medal className="h-6 w-6 text-amber-600/50 mb-1" />
                 <span className="font-black text-slate-700 dark:text-slate-300 text-[10px] truncate w-full text-center">{users[2].name}</span>
                 <span className="text-[10px] font-bold text-blue-500">{users[2].points} XP</span>
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-0.5 rounded-full text-[10px] font-black">3º</div>
              </div>
            </Link>
          </motion.div>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 pb-24">
        {users.length > 3 ? (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl transition-colors duration-300">
            {users.slice(3).map((user, index) => (
              <Link 
                key={user.id} 
                to={`/perfil/${user.id}`}
                className={cn(
                  "flex items-center gap-4 p-5 border-b last:border-0 transition-colors border-slate-100 dark:border-slate-800 group",
                  user.id === '1' ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="w-8 flex justify-center">
                  <span className="text-base font-black text-slate-300 dark:text-slate-600">{index + 4}º</span>
                </div>
                
                <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shrink-0 group-hover:scale-105 transition-transform">
                  <img 
                    src={user.avatar || `https://picsum.photos/seed/user${user.id}/100`} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-800 dark:text-slate-200 truncate flex items-center gap-2">
                    {user.name} 
                    {user.id === '1' && (
                      <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">VOCÊ</span>
                    )}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="block text-base font-black text-blue-500">{user.points} XP</span>
                </div>
              </Link>
            ))}
          </div>
        ) : activeTab === 'amigos' && users.length === 1 ? (
          <div className="text-center py-20 px-8 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2">Sozinho no topo?</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-8">Siga seus amigos para ver como eles estão se saindo e disputar o ranking!</p>
            <Link 
              to="/amigos" 
              className="inline-block bg-blue-500 hover:bg-blue-400 text-white font-black py-4 px-8 rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-sm"
            >
              Encontrar Amigos
            </Link>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

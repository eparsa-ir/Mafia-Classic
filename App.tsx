import React, { useState, useEffect, useCallback } from 'react';
import { Player, Role, GamePhase, MafiaRoles, NightActions, NightResult, CitizenRoles } from './types';
import PlayerStatus from './components/PlayerStatus';
import Log from './components/Log';
import { MoonIcon, SunIcon, BanIcon, RefreshIcon, TimeIcon, GavelIcon, WhatsAppIcon, TelegramIcon, QuestionMarkCircleIcon } from './components/icons';

const getRoleDistribution = (count: number): Role[] => {
    const roles: Role[] = [];
    const mafiaCount = Math.floor(count / 3);

    if (mafiaCount > 0) {
        roles.push(Role.GODFATHER);
        for (let i = 0; i < mafiaCount - 1; i++) {
            roles.push(Role.SIMPLE_MAFIA);
        }
    }

    if (count >= 5) {
        roles.push(Role.DOCTOR);
        roles.push(Role.DETECTIVE);
    }
    
    const citizenCount = count - roles.length;
    for (let i = 0; i < citizenCount; i++) {
        roles.push(Role.CITIZEN);
    }

    return roles;
};


interface GameState {
    players: Player[];
    day: number;
    logLength: number;
    gamePhase: GamePhase;
}

const Footer = () => (
  <footer className="text-center text-xs text-gray-500 py-2 flex flex-col items-center justify-center gap-2">
      <span>Design with AI by <a href="https://eparsa.ir" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">eParsa.ir</a></span>
      <div className="flex items-center gap-4">
          <a href="https://api.whatsapp.com/send?phone=989393783832" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-gray-400 hover:text-green-500 transition-colors">
              <WhatsAppIcon className="h-5 w-5" />
          </a>
          <a href="https://t.me/spiderboy" target="_blank" rel="noopener noreferrer" title="Telegram" className="text-gray-400 hover:text-blue-500 transition-colors">
              <TelegramIcon className="h-5 w-5" />
          </a>
      </div>
  </footer>
);

const PlayerSetup: React.FC<{ onStart: (names: string[], playerCount: number) => void }> = ({ onStart }) => {
  const [playerCount, setPlayerCount] = useState(8);
  const [names, setNames] = useState<string[]>(Array(8).fill(''));
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    setNames(Array(playerCount).fill(''));
  }, [playerCount]);

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...names];
    newNames[index] = name;
    setNames(newNames);
  };

  const handleStart = () => {
    const formattedNames = names.map((name, index) => {
        const trimmedName = name.trim();
        return trimmedName === '' ? `بازیکن شماره ${index + 1}` : `${index + 1}. ${trimmedName}`;
    });
    
    if (new Set(formattedNames).size !== playerCount) {
      alert('نام‌های تکراری مجاز نیست. لطفاً نام‌های منحصربه‌فرد وارد کنید یا فیلدهای خالی را برای نام‌های پیش‌فرض بگذارید.');
      return;
    }
    onStart(formattedNames, playerCount);
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-900">
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-gray-800 p-8 rounded-lg shadow-2xl relative">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="absolute top-6 left-6 text-gray-400 hover:text-red-500 transition-colors"
              title="راهنمای بازی"
            >
              <QuestionMarkCircleIcon className="h-7 w-7" />
            </button>
            <h1 className="text-3xl font-bold text-center mb-6 text-red-500">مافیا کلاسیک</h1>
            <div className="flex justify-center items-center gap-4 mb-8">
              <label htmlFor="player-count" className="text-gray-300">تعداد بازیکنان:</label>
              <select
                id="player-count"
                value={playerCount}
                onChange={(e) => setPlayerCount(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {[...Array(8)].map((_, i) => (
                  <option key={i + 5} value={i + 5}>{i + 5}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8 max-h-64 overflow-y-auto pr-2">
              {names.map((name, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`بازیکن ${index + 1}`}
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              ))}
            </div>
            <button
              onClick={handleStart}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition-colors"
            >
              شروع بازی
            </button>
          </div>
        </main>
        <Footer />
      </div>
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
    </>
  );
};

const RoleRevealPhase: React.FC<{ 
    players: Player[], 
    onStartFirstDay: () => void, 
    viewedPlayers: Set<string>,
    setViewedPlayers: React.Dispatch<React.SetStateAction<Set<string>>>
}> = ({ players, onStartFirstDay, viewedPlayers, setViewedPlayers }) => {
    const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null);

    const handleReveal = (player: Player) => {
        if (viewedPlayers.has(player.name)) return;
        setRevealedPlayer(player);
        setViewedPlayers(prev => new Set(prev).add(player.name));
    };
    
    return (
        <div className="p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">نمایش نقش‌ها</h2>
            <p className="text-gray-400 mb-6">هر بازیکن روی اسم خود کلیک کند تا نقش خود را ببیند. (فقط یکبار)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {players.map(p => (
                    <button 
                        key={p.id} 
                        onClick={() => handleReveal(p)} 
                        disabled={viewedPlayers.has(p.name)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {revealedPlayer && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setRevealedPlayer(null)}>
                    <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-2">{revealedPlayer.name}</h3>
                        <p className={`text-4xl font-bold my-4 ${MafiaRoles.includes(revealedPlayer.role) ? 'text-red-500' : 'text-blue-400'}`}>
                            {revealedPlayer.role}
                        </p>
                        {MafiaRoles.includes(revealedPlayer.role) && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-gray-400">هم‌تیمی‌های شما:</h4>
                                {players.filter(p => MafiaRoles.includes(p.role) && p.name !== revealedPlayer.name).length > 0 ? (
                                    <ul className="space-y-1 mt-2">
                                        {players.filter(p => MafiaRoles.includes(p.role) && p.name !== revealedPlayer.name).map(teammate => (
                                            <li key={teammate.id} className="text-lg text-red-300">
                                                <span>{teammate.name} ({teammate.role})</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                     <p className="text-lg text-red-300">شما تنها مافیای باقی‌مانده هستید.</p>
                                )}
                            </div>
                        )}
                        <button onClick={() => setRevealedPlayer(null)} className="mt-6 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded">
                            بستن
                        </button>
                    </div>
                </div>
            )}
            
            <div className="w-full max-w-md mx-auto mt-4">
              <button onClick={onStartFirstDay} className="w-full bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 rounded">
                  شروع روز اول
              </button>
            </div>
        </div>
    );
};

const EndGameReport: React.FC<{ log: string[], onReset: () => void }> = ({ log, onReset }) => {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const finalLogMessage = log.find(l => l.includes("پیروز شد")) || "نتیجه نهایی ثبت نشد.";

    const formatLogForReport = (logMessages: string[]): string => {
        const header = `گزارش نهایی بازی مافیا کلاسیک\n============================\n`;
        const winner = logMessages.find(l => l.includes("پیروز شد"))?.replace(/<[^>]*>/g, '') || "نتیجه نهایی ثبت نشد.";
        const body = logMessages.map(msg => msg.replace(/<[^>]*>/g, '')).join('\n');
        return `${header}\n${winner}\n\n--- جزئیات وقایع ---\n${body}`;
    };

    const handleCopyReport = () => {
        const reportText = formatLogForReport(log);
        navigator.clipboard.writeText(reportText).then(() => {
            alert('گزارش بازی در کلیپ‌بورد کپی شد!');
        }).catch(err => {
            console.error('Failed to copy report: ', err);
            alert('خطا در کپی کردن گزارش.');
        });
    };
    
    return (
      <>
        <div className="text-center p-8 bg-gray-800 rounded-lg">
            <h2 className="text-3xl font-bold text-green-400 mb-4">بازی تمام شد!</h2>
            <p className="text-xl mb-6" dangerouslySetInnerHTML={{ __html: finalLogMessage }} />
             <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button onClick={onReset} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
                    <RefreshIcon className="h-4 w-4" />
                    شروع بازی جدید
                </button>
                <button onClick={() => setIsReportModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
                    مشاهده گزارش بازی
                </button>
                <button onClick={handleCopyReport} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors">
                    کپی گزارش بازی
                </button>
            </div>
        </div>

        {isReportModalOpen && (
            <div className="fixed inset-0 bg-gray-900 z-50 p-4" onClick={() => setIsReportModalOpen(false)}>
                <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                        <h3 className="text-2xl font-bold text-gray-200">گزارش کامل بازی</h3>
                        <button onClick={() => setIsReportModalOpen(false)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                            بستن
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4">
                        <div className="space-y-2 text-sm">
                            {log.map((msg, index) => (
                                <p key={index} className="text-gray-300 border-b border-gray-700 pb-1 last:border-b-0" dangerouslySetInnerHTML={{ __html: msg }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </>
    );
};

const loadInitialState = () => {
    try {
        const savedStateJSON = localStorage.getItem('mafiaGameState');
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            if (savedState.players && savedState.gamePhase && typeof savedState.day === 'number') {
                return { ...savedState, history: savedState.history || [] };
            }
        }
    } catch (error) {
        console.error("Could not load game state from localStorage", error);
        localStorage.removeItem('mafiaGameState');
    }
    return {
        players: [],
        gamePhase: GamePhase.SETUP,
        day: 0,
        log: [],
        history: [],
    };
};

const App: React.FC = () => {
  const [initialState] = useState(loadInitialState);

  const [players, setPlayers] = useState<Player[]>(initialState.players);
  const [gamePhase, setGamePhase] = useState<GamePhase>(initialState.gamePhase);
  const [day, setDay] = useState(initialState.day);
  const [log, setLog] = useState<string[]>(initialState.log);
  const [history, setHistory] = useState<GameState[]>(initialState.history);
  
  const [showRoles, setShowRoles] = useState(false);
  const [viewedPlayers, setViewedPlayers] = useState<Set<string>>(new Set());
  
  const [nightActions, setNightActions] = useState<NightActions>({ mafiaShot: null, doctorSave: null, detectiveInquiry: null });
  const [nightResult, setNightResult] = useState<NightResult | null>(null);

  const [isKickModalOpen, setIsKickModalOpen] = useState(false);
  const [playerToKick, setPlayerToKick] = useState<string | null>(null);
  const [isTimeTravelModalOpen, setIsTimeTravelModalOpen] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  const [nominationVotes, setNominationVotes] = useState<Record<string, number>>({});
  const [playersOnTrial, setPlayersOnTrial] = useState<string[]>([]);
  const [finalVotes, setFinalVotes] = useState<Record<string, number>>({});
  const [tiebreakerCandidates, setTiebreakerCandidates] = useState<string[]>([]);
  const [nomineesToSelectInTiebreaker, setNomineesToSelectInTiebreaker] = useState(0);

  const livingPlayers = players.filter(p => p.isAlive);
  const livingMafia = players.filter(p => p.isAlive && MafiaRoles.includes(p.role));
  const livingCitizens = players.filter(p => p.isAlive && !MafiaRoles.includes(p.role));
  
  const addLog = useCallback((message: string) => {
    setLog(prev => [...prev, message]);
  }, []);

  const checkWinCondition = useCallback(() => {
    if(gamePhase === GamePhase.END) return true;

    const mafiaCount = livingMafia.length;
    const citizenCount = livingCitizens.length;

    if (mafiaCount === 0) {
      addLog("<strong class='text-blue-400'>شهروندان پیروز شدند!</strong> تمام مافیاها حذف شدند.");
      setGamePhase(GamePhase.END);
      return true;
    }
    if (mafiaCount >= citizenCount) {
      addLog("<strong class='text-red-400'>مافیا پیروز شد!</strong> تعداد مافیا و شهروندان برابر شد.");
      setGamePhase(GamePhase.END);
      return true;
    }
    return false;
  }, [livingMafia.length, livingCitizens.length, addLog, gamePhase]);

  useEffect(() => {
    if (gamePhase !== GamePhase.SETUP && gamePhase !== GamePhase.ROLE_REVEAL && gamePhase !== GamePhase.END) {
        checkWinCondition();
    }
  }, [players, gamePhase, checkWinCondition]);

  useEffect(() => {
    if (gamePhase !== GamePhase.SETUP) {
        const stateToSave = { players, gamePhase, day, log, history };
        localStorage.setItem('mafiaGameState', JSON.stringify(stateToSave));
    } else {
        localStorage.removeItem('mafiaGameState');
    }
  }, [players, gamePhase, day, log, history]);

  const handleResetGame = () => {
    localStorage.removeItem('mafiaGameState');
    setPlayers([]);
    setGamePhase(GamePhase.SETUP);
    setDay(0);
    setLog([]);
    setHistory([]);
    setNightActions({ mafiaShot: null, doctorSave: null, detectiveInquiry: null });
    setNightResult(null);
    setIsKickModalOpen(false);
    setPlayerToKick(null);
    setIsTimeTravelModalOpen(false);
    setSelectedHistoryIndex(null);
    setShowRoles(false);
    setViewedPlayers(new Set());
    setIsResetModalOpen(false);
    setNominationVotes({});
    setPlayersOnTrial([]);
    setFinalVotes({});
    setTiebreakerCandidates([]);
    setNomineesToSelectInTiebreaker(0);
  };

  const handleGameStart = (names: string[], playerCount: number) => {
    const roles = getRoleDistribution(playerCount).sort(() => Math.random() - 0.5);
    
    const initialPlayers: Player[] = names.map((name, index) => ({
      id: index,
      name,
      role: roles[index],
      isAlive: true,
      inquiredByDetectiveCount: 0,
    }));

    setPlayers(initialPlayers);
    setGamePhase(GamePhase.ROLE_REVEAL);
    setDay(0);
    setLog(['بازی شروع شد. بازیکنان نقش‌ها را مشاهده می‌کنند.']);
    setHistory([]);
    setShowRoles(false);
    setViewedPlayers(new Set());
  };
  
  const getPhaseName = (phase: GamePhase) => {
    if (phase.startsWith('NIGHT')) return 'شب';
    if (phase.startsWith('DAY')) return 'روز';
    return '';
  }

  const handleRevertToState = (index: number | null) => {
    if (index === null) return;
    
    const stateToRestore = history[index];
    const newHistory = history.slice(0, index);

    setPlayers(stateToRestore.players);
    setGamePhase(stateToRestore.gamePhase);
    setDay(stateToRestore.day);
    setLog(prev => prev.slice(0, stateToRestore.logLength));
    setHistory(newHistory);
    
    setNightActions({ mafiaShot: null, doctorSave: null, detectiveInquiry: null });
    setNightResult(null);
    setNominationVotes({});
    setPlayersOnTrial([]);
    setFinalVotes({});
    setTiebreakerCandidates([]);
    setNomineesToSelectInTiebreaker(0);
    
    setIsTimeTravelModalOpen(false);
    setSelectedHistoryIndex(null);
    addLog(`<strong class="text-yellow-400">بازگشت به گذشته:</strong> بازی به شروع ${getPhaseName(stateToRestore.gamePhase)} ${stateToRestore.day} بازگردانده شد.`);
  };

  const handleStartFirstDay = () => {
    const snapshot: GameState = {
        players: JSON.parse(JSON.stringify(players)),
        day: 1,
        gamePhase: GamePhase.DAY_VOTE_NOMINATION,
        logLength: log.length,
    };
    setHistory([snapshot]);
    setDay(1);
    setGamePhase(GamePhase.DAY_VOTE_NOMINATION);
    addLog(`روز 1 آغاز شد.`);
    addLog(`رای‌گیری برای اتهام آغاز شد.`);
  };

  const handleNightEnd = (actions: NightActions) => {
    let currentPlayers = JSON.parse(JSON.stringify(players)) as Player[];
    const nightLog: string[] = [];
    let eliminated: { player: Player; reason: string }[] = [];
    
    const getPlayer = (name: string) => currentPlayers.find(p => p.name === name);
    const getOriginalPlayer = (name: string) => players.find(p => p.name === name)!;

    // 1. Mafia action
    if (actions.mafiaShot) {
        const target = getPlayer(actions.mafiaShot);
        nightLog.push(`مافیا به <strong class='text-red-400'>${actions.mafiaShot}</strong> شلیک کرد.`);
        if (target && target.isAlive) {
            if (target.name === actions.doctorSave) {
                nightLog.push(`<strong class='text-green-400'>${target.name}</strong> توسط دکتر نجات یافت.`);
            } else {
                target.isAlive = false;
                eliminated.push({ player: getOriginalPlayer(target.name), reason: 'شلیک مافیا' });
            }
        }
    }
    
    // 2. Doctor save log
    if (actions.doctorSave) {
        nightLog.push(`دکتر <strong class='text-green-400'>${actions.doctorSave}</strong> را نجات داد.`);
    }

    // 3. Detective inquiry
    let detectiveResult: NightResult['detectiveResult'] | undefined;
    if (actions.detectiveInquiry) {
        const target = getOriginalPlayer(actions.detectiveInquiry);
        const targetInState = getPlayer(actions.detectiveInquiry);

        if (target && targetInState) {
            let isMafia = false;
            if (target.role === Role.SIMPLE_MAFIA) {
                isMafia = true;
            } else if (target.role === Role.GODFATHER) {
                if (target.inquiredByDetectiveCount >= 1) {
                    isMafia = true;
                } else {
                    isMafia = false;
                }
                targetInState.inquiredByDetectiveCount += 1;
            }
            
            detectiveResult = { target: target.name, isMafia: isMafia };
            nightLog.push(`کارآگاه <strong class='text-blue-300'>${target.name}</strong> را استعلام کرد.`);
        }
    }
    
    const livingMafiaNow = currentPlayers.filter(p => p.isAlive && MafiaRoles.includes(p.role));
    const livingCitizensNow = currentPlayers.filter(p => p.isAlive && !MafiaRoles.includes(p.role));
    const citizensVsMafiaDiff = livingCitizensNow.length - livingMafiaNow.length;
    const isEmergency = citizensVsMafiaDiff > 0 && citizensVsMafiaDiff <= 2;

    const finalResult: NightResult = { eliminated, log: nightLog, detectiveResult, isEmergency };
    setNightResult(finalResult);
    setPlayers(currentPlayers);
    setGamePhase(GamePhase.DAY_DISCUSSION);

    const newLog = [...log, ...nightLog];
    newLog.push(`<strong>پایان شب ${day}.</strong>`);
    setLog(newLog);
  }

  const handleStartDay = () => {
    if (checkWinCondition()) return;

    const snapshot: GameState = {
        players: JSON.parse(JSON.stringify(players)),
        day: day,
        gamePhase: GamePhase.DAY_VOTE_NOMINATION,
        logLength: log.length,
    };
    setHistory(prev => [...prev, snapshot]);

    setGamePhase(GamePhase.DAY_VOTE_NOMINATION);
    addLog(`روز ${day} - رای‌گیری برای اتهام آغاز شد.`);
    setNominationVotes({});
    setPlayersOnTrial([]);
    setFinalVotes({});
    setNightResult(null);
    setNightActions({ mafiaShot: null, doctorSave: null, detectiveInquiry: null });
  };
  
  const handleEndNominations = () => {
    const voteCounts = Object.entries(nominationVotes)
        .map(([name, count]) => ({ name, count: count as number }))
        .filter(v => v.count > 0)
        .sort((a, b) => b.count - a.count);

    if (voteCounts.length < 2) {
        const trialists = voteCounts.map(vc => vc.name);
        if (trialists.length > 0) {
            setPlayersOnTrial(trialists);
            addLog(`بازیکن در معرض اتهام: <strong class="text-yellow-300">${trialists[0]}</strong>. دفاعیه آغاز می‌شود.`);
            setGamePhase(GamePhase.DAY_TRIAL);
        } else {
            addLog("هیچ بازیکنی رای کافی برای دفاعیه را کسب نکرد.");
            handleEndDay(false);
        }
        return;
    }

    const topVoteCount = voteCounts[0].count;
    const topVotedPlayers = voteCounts.filter(p => p.count === topVoteCount).map(p => p.name);

    if (topVotedPlayers.length === 1) {
        const firstNominee = topVotedPlayers[0];
        const secondVoteCount = voteCounts[1].count;
        const secondVotedPlayers = voteCounts.filter(p => p.count === secondVoteCount).map(p => p.name);
        
        if (secondVotedPlayers.length === 1) {
            setPlayersOnTrial([firstNominee, secondVotedPlayers[0]]);
            addLog(`بازیکنان در معرض اتهام: <strong class="text-yellow-300">${firstNominee}</strong> و <strong class="text-yellow-300">${secondVotedPlayers[0]}</strong>. دفاعیه آغاز می‌شود.`);
            setGamePhase(GamePhase.DAY_TRIAL);
        } else {
            addLog(`<strong class="text-yellow-300">${firstNominee}</strong> با بیشترین رای وارد دفاعیه شد.`);
            addLog(`رای‌گیری مجدد (PK) بین ${secondVotedPlayers.map(p => `<strong class="text-yellow-300">${p}</strong>`).join(', ')} برای انتخاب نفر دوم برگزار می‌شود.`);
            setPlayersOnTrial([firstNominee]);
            setTiebreakerCandidates(secondVotedPlayers);
            setNomineesToSelectInTiebreaker(1);
            setGamePhase(GamePhase.DAY_VOTE_TIEBREAKER);
        }
    } else if (topVotedPlayers.length === 2) {
        setPlayersOnTrial(topVotedPlayers);
        addLog(`بازیکنان در معرض اتهام: ${topVotedPlayers.map(t => `<strong class="text-yellow-300">${t}</strong>`).join(' و ')}. دفاعیه آغاز می‌شود.`);
        setGamePhase(GamePhase.DAY_TRIAL);
    } else {
        addLog(`رای‌گیری مجدد (PK) بین ${topVotedPlayers.map(p => `<strong class="text-yellow-300">${p}</strong>`).join(', ')} برای انتخاب دو نفر برای دفاعیه برگزار می‌شود.`);
        setTiebreakerCandidates(topVotedPlayers);
        setNomineesToSelectInTiebreaker(2);
        setGamePhase(GamePhase.DAY_VOTE_TIEBREAKER);
    }
  };

  const handleTiebreakerVote = () => {
    const voteCounts = Object.entries(nominationVotes)
        .filter(([name, _]) => tiebreakerCandidates.includes(name))
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count);

    let newNominees: string[] = [];

    if(voteCounts.length > 0) {
        const winners = voteCounts.slice(0, nomineesToSelectInTiebreaker);
        
        if (voteCounts.length > nomineesToSelectInTiebreaker) {
            const lastWinnerVote = winners[winners.length - 1].count;
            const potentialLoserVote = voteCounts[nomineesToSelectInTiebreaker].count;
            if (lastWinnerVote > 0 && lastWinnerVote === potentialLoserVote) {
                 addLog("رای‌گیری مجدد به دلیل تساوی آرا در مرز انتخاب، بی‌نتیجه ماند. کسی به دفاعیه اضافه نشد.");
            } else {
                newNominees = winners.map(w => w.name);
            }
        } else {
             newNominees = winners.map(w => w.name);
        }
    }
    
    const finalTrialists = [...playersOnTrial, ...newNominees];

    if (finalTrialists.length === 0) {
        addLog("هیچ بازیکنی برای دفاعیه انتخاب نشد.");
        handleEndDay(false);
    } else {
        setPlayersOnTrial(finalTrialists);
        addLog(`بازیکنان در معرض اتهام: ${finalTrialists.map(t => `<strong class="text-yellow-300">${t}</strong>`).join(', ')}. دفاعیه آغاز می‌شود.`);
        setGamePhase(GamePhase.DAY_TRIAL);
    }
    
    setTiebreakerCandidates([]);
    setNomineesToSelectInTiebreaker(0);
    setNominationVotes({});
};

  const handleTrialEnd = () => {
    setGamePhase(GamePhase.DAY_VOTE_FINAL);
    addLog("دفاعیه به پایان رسید. رای‌گیری نهایی آغاز می‌شود.");
  };

  const handleFinalVote = () => {
    let eliminatedPlayer: string | null = null;
    let wasEliminated = false;

    const voteCounts = Object.entries(finalVotes)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count);

    if (day === 1) {
        const candidatesForElimination = voteCounts.filter(p => p.count >= 4);
        if (candidatesForElimination.length === 1) {
            eliminatedPlayer = candidatesForElimination[0].name;
        } else if (candidatesForElimination.length > 1) {
            addLog(`چندین بازیکن حد نصاب خروج را کسب کردند اما به دلیل عدم اجماع، کسی حذف نشد.`);
        } else {
            addLog(`هیچ بازیکنی 4 رای برای حذف شدن کسب نکرد.`);
        }
    } else {
        if (voteCounts.length === 0 || (playersOnTrial.length > 1 && voteCounts.length > 1 && voteCounts[0].count > 0 && voteCounts[0].count === voteCounts[1].count)) {
            addLog("در رای‌گیری نهایی، به دلیل تساوی آرا کسی حذف نشد.");
        } else if (voteCounts.length > 0) {
            eliminatedPlayer = voteCounts[0].name;
        } else {
            addLog("در رای‌گیری نهایی، هیچ رایی ثبت نشد و کسی حذف نشد.");
        }
    }

    let currentPlayers = [...players];
    if (eliminatedPlayer) {
        wasEliminated = true;
        currentPlayers = players.map(p => p.name === eliminatedPlayer ? {...p, isAlive: false} : p)
        setPlayers(currentPlayers);
        addLog(`<strong class='text-yellow-400'>${eliminatedPlayer}</strong> با رای‌گیری در روز از بازی حذف شد.`);
    }

    handleEndDay(wasEliminated, currentPlayers);
  };
  
  const handleEndDay = (wasPlayerEliminated: boolean, currentPlayers: Player[] = players) => {
    if (checkWinCondition()) return;

    if (!wasPlayerEliminated) {
        addLog(`<strong>پایان روز ${day}.</strong> بازیکنی در رای‌گیری حذف نشد.`);
    }

    const snapshot: GameState = {
        players: JSON.parse(JSON.stringify(currentPlayers)),
        day: day + 1,
        gamePhase: GamePhase.NIGHT,
        logLength: log.length,
    };
    setHistory(prev => [...prev, snapshot]);
    
    setNominationVotes({});
    setPlayersOnTrial([]);
    setFinalVotes({});
    setDay(day + 1);
    setGamePhase(GamePhase.NIGHT);
    addLog(`شب ${day + 1} آغاز می‌شود.`);
  };

  const handleDisciplinaryKick = (playerName: string) => {
    const playerToKickObj = players.find(p => p.name === playerName);
    if (!playerToKickObj || !playerToKickObj.isAlive) return;

    setPlayers(players.map(p => 
        p.name === playerName 
        ? { ...p, isAlive: false } 
        : p
    ));
    const roleClass = MafiaRoles.includes(playerToKickObj.role) ? 'text-red-400' : 'text-blue-400';
    addLog(`<strong class='text-orange-500'>اخراج انضباطی!</strong> ${playerName} (نقش: <strong class='${roleClass}'>${playerToKickObj.role}</strong>) از بازی حذف شد.`);
    setIsKickModalOpen(false);
    setPlayerToKick(null);
  };
  
  const handleToggleShowRoles = () => {
    const newShowRoles = !showRoles;
    if (newShowRoles) {
        setViewedPlayers(new Set(players.map(p => p.name)));
    }
    setShowRoles(newShowRoles);
  };

  const renderPhase = () => {
    switch (gamePhase) {
      case GamePhase.ROLE_REVEAL:
        return <RoleRevealPhase players={players} onStartFirstDay={handleStartFirstDay} viewedPlayers={viewedPlayers} setViewedPlayers={setViewedPlayers} />;
      case GamePhase.NIGHT:
        return <NightPhase livingPlayers={livingPlayers} players={players} onSubmit={handleNightEnd} />;
      case GamePhase.DAY_DISCUSSION:
        return <DayDiscussionPhase nightResult={nightResult} onStartDay={handleStartDay} />;
      case GamePhase.DAY_VOTE_NOMINATION:
        return <DayNominationPhase
                    day={day}
                    onEndNominations={handleEndNominations}
                    onEndDay={() => handleEndDay(false)}
                    livingPlayers={livingPlayers}
                    nominationVotes={nominationVotes}
                    setNominationVotes={setNominationVotes}
                    />;
      case GamePhase.DAY_VOTE_TIEBREAKER:
          return <DayTiebreakerPhase
                    day={day}
                    onEndTiebreaker={handleTiebreakerVote}
                    candidates={tiebreakerCandidates}
                    nominationVotes={nominationVotes}
                    setNominationVotes={setNominationVotes}
                    nomineesToSelect={nomineesToSelectInTiebreaker}
                    livingPlayers={livingPlayers}
                    />;
      case GamePhase.DAY_TRIAL:
        return <DayTrialPhase playersOnTrial={livingPlayers.filter(p => playersOnTrial.includes(p.name))} onTrialEnd={handleTrialEnd} />
      case GamePhase.DAY_VOTE_FINAL:
        return <DayFinalVotePhase 
                  day={day}
                  playersOnTrial={livingPlayers.filter(p => playersOnTrial.includes(p.name))}
                  livingPlayersCount={livingPlayers.length}
                  finalVotes={finalVotes}
                  setFinalVotes={setFinalVotes}
                  onEndFinalVote={handleFinalVote}
                />
      case GamePhase.END:
        return <EndGameReport log={log} onReset={handleResetGame} />;
      default:
        return null;
    }
  };
  
  if (gamePhase === GamePhase.SETUP) {
    return <PlayerSetup onStart={handleGameStart} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <div className="flex-grow p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-grow flex flex-col gap-4">
          <header className="bg-gray-800 p-4 rounded-lg shadow-lg flex justify-between items-center">
            <h1 className="text-2xl font-bold text-red-500">مافیا کلاسیک</h1>
            <div className="flex items-center gap-4 text-xl font-semibold">
                {gamePhase.startsWith('NIGHT') ? <MoonIcon className="text-blue-300"/> : <SunIcon className="text-yellow-300" />}
                <span>{gamePhase.startsWith('NIGHT') ? `شب ${day}` : `روز ${day}`}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                 <button 
                  onClick={() => setIsTimeTravelModalOpen(true)}
                  title="بازگشت به گذشته"
                  disabled={history.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  <TimeIcon className="h-4 w-4"/>
                  بازگشت
                </button>
                <button 
                  onClick={() => setIsKickModalOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center gap-2"
                >
                  <BanIcon className="h-4 w-4"/>
                  اخراج
                </button>
                <button 
                  onClick={() => setIsResetModalOpen(true)}
                  title="شروع بازی جدید"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center gap-2"
                >
                  <RefreshIcon className="h-4 w-4"/>
                  شروع مجدد
                </button>
            </div>
          </header>
          <main className="flex-grow bg-gray-800/50 p-4 rounded-lg">
            {renderPhase()}
          </main>
          <Log messages={log} />
        </div>
        <PlayerStatus 
            players={players} 
            showRoles={showRoles}
            gamePhase={gamePhase}
            onToggleShowRoles={handleToggleShowRoles}
            viewedPlayersCount={viewedPlayers.size}
            totalPlayersCount={players.length}
        />

        {isKickModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-sm w-full">
                  <h3 className="text-2xl font-bold mb-4 text-orange-400">اخراج انضباطی</h3>
                  <p className="text-gray-400 mb-6">کدام بازیکن را می‌خواهید از بازی حذف کنید؟ این عمل غیرقابل بازگشت است.</p>
                  
                  <select
                      value={playerToKick || ''}
                      onChange={(e) => setPlayerToKick(e.target.value)}
                      className="w-full bg-gray-700 p-2 rounded mb-6"
                  >
                      <option value="" disabled>یک بازیکن را انتخاب کنید</option>
                      {livingPlayers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  
                  <div className="flex gap-4">
                      <button
                          onClick={() => {
                              setIsKickModalOpen(false);
                              setPlayerToKick(null);
                          }}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded transition-colors"
                      >
                          انصراف
                      </button>
                      <button
                          onClick={() => {
                              if (playerToKick) {
                                  handleDisciplinaryKick(playerToKick);
                              }
                          }}
                          disabled={!playerToKick}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                          تایید اخراج
                      </button>
                  </div>
              </div>
          </div>
        )}
        
        {isTimeTravelModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-md w-full">
                  <h3 className="text-2xl font-bold mb-4 text-purple-400">بازگشت به گذشته</h3>
                  <p className="text-gray-400 mb-6">به کدام نقطه از بازی می‌خواهید برگردید؟</p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                      {history.map((snapshot, index) => (
                           <label key={index} className="flex items-center w-full text-right bg-gray-700 hover:bg-purple-800 p-3 rounded transition-colors cursor-pointer">
                              <input
                                  type="radio"
                                  name="history-point"
                                  className="ml-4"
                                  checked={selectedHistoryIndex === index}
                                  onChange={() => setSelectedHistoryIndex(index)}
                              />
                              بازگشت به شروع <strong className="text-yellow-300 mr-1">{getPhaseName(snapshot.gamePhase)} {snapshot.day}</strong>
                          </label>
                      ))}
                  </div>
                   <div className="flex gap-4 mt-6">
                       <button
                          onClick={() => {
                              setIsTimeTravelModalOpen(false)
                              setSelectedHistoryIndex(null)
                          }}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded transition-colors"
                      >
                          انصراف
                      </button>
                       <button
                          onClick={() => handleRevertToState(selectedHistoryIndex)}
                          disabled={selectedHistoryIndex === null}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                          تایید بازگشت
                      </button>
                  </div>
              </div>
          </div>
        )}

        {isResetModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-sm w-full">
                  <h3 className="text-2xl font-bold mb-4 text-red-400">شروع مجدد بازی</h3>
                  <p className="text-gray-400 mb-6">آیا مطمئن هستید که می‌خواهید بازی فعلی را پاک کرده و یک بازی جدید شروع کنید؟ این عمل غیرقابل بازگشت است.</p>
                  <div className="flex gap-4">
                      <button
                          onClick={() => setIsResetModalOpen(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded transition-colors"
                      >
                          انصراف
                      </button>
                      <button
                          onClick={handleResetGame}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors"
                      >
                          تایید و شروع مجدد
                      </button>
                  </div>
              </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

const NightPhase: React.FC<{
    livingPlayers: Player[];
    players: Player[];
    onSubmit: (actions: NightActions) => void;
}> = ({ livingPlayers, players, onSubmit }) => {
    const [actions, setActions] = useState<NightActions>({ mafiaShot: null, doctorSave: null, detectiveInquiry: null });
    const [detectiveResult, setDetectiveResult] = useState<string | null>(null);

    const doctor = players.find(p => p.role === Role.DOCTOR && p.isAlive);

    const handleActionChange = <K extends keyof NightActions>(actionType: K, value: NightActions[K]) => {
        setActions(prev => ({ ...prev, [actionType]: value }));

        if (actionType === 'detectiveInquiry') {
            if (value) {
                const target = players.find(p => p.name === value);
                if (target) {
                    let isMafia = false;
                    if (target.role === Role.SIMPLE_MAFIA) {
                        isMafia = true;
                    } else if (target.role === Role.GODFATHER) {
                        if (target.inquiredByDetectiveCount >= 1) {
                            isMafia = true;
                        }
                    }
                    setDetectiveResult(`استعلام ${target.name} ${isMafia ? 'مثبت است' : 'منفی است'}`);
                }
            } else {
                setDetectiveResult(null);
            }
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-6 text-center">اقدامات شب</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {/* Mafia Action */}
                <div className="bg-red-900/40 border border-red-800 p-3 rounded-lg">
                    <label className="font-bold text-lg mb-2 text-gray-200 block">اقدام مافیا</label>
                    <select
                        value={actions.mafiaShot || ''}
                        onChange={(e) => handleActionChange('mafiaShot', e.target.value || null)}
                        className="w-full bg-gray-600 p-2 rounded text-sm mt-1"
                    >
                        <option value="">انتخاب هدف شلیک</option>
                        {livingPlayers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </div>

                {/* Doctor Action */}
                {doctor && (
                    <div className="bg-green-900/40 border border-green-800 p-3 rounded-lg">
                        <label className="font-bold text-lg mb-2 text-gray-200 block">اقدام دکتر</label>
                        <select
                            value={actions.doctorSave || ''}
                            onChange={(e) => handleActionChange('doctorSave', e.target.value || null)}
                            className="w-full bg-gray-600 p-2 rounded text-sm mt-1"
                        >
                            <option value="">انتخاب هدف نجات</option>
                            {livingPlayers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                )}
                
                {/* Detective Action */}
                {players.some(p => p.role === Role.DETECTIVE && p.isAlive) && (
                    <div className="bg-blue-900/40 border border-blue-800 p-3 rounded-lg">
                        <label className="font-bold text-lg mb-2 text-gray-200 block">استعلام کارآگاه</label>
                        <select
                            value={actions.detectiveInquiry || ''}
                            onChange={(e) => handleActionChange('detectiveInquiry', e.target.value || null)}
                            className="w-full bg-gray-600 p-2 rounded text-sm mt-1"
                        >
                            <option value="">انتخاب هدف استعلام</option>
                            {livingPlayers.filter(p => p.role !== Role.DETECTIVE).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        {detectiveResult && <p className="text-center mt-2 p-2 bg-gray-800 rounded font-semibold">{detectiveResult}</p>}
                    </div>
                )}
            </div>
            <button onClick={() => onSubmit(actions)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded mt-6">
                پایان شب و اعلام نتایج
            </button>
        </div>
    );
};

const DayDiscussionPhase: React.FC<{
    nightResult: NightResult | null;
    onStartDay: () => void;
}> = ({ nightResult, onStartDay }) => {
    if (!nightResult) {
        return <div className="p-4 text-center">در حال پردازش نتایج شب...</div>;
    }
    const eliminatedCount = nightResult.eliminated.length;

    return (
        <div className="p-4 text-center">
            <h2 className="text-xl font-bold mb-4">نتایج شب گذشته</h2>
            <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
                {nightResult.isEmergency && (
                    <p className="text-lg font-bold text-yellow-400 animate-pulse">
                        !!! وضعیت اضطراری !!!
                    </p>
                )}
                {eliminatedCount > 0 ? (
                    <div>
                        <p className="text-lg mb-2">
                            کشته‌های شب: <strong className="text-red-400">{eliminatedCount} نفر</strong>
                        </p>
                        <ul className="space-y-1">
                            {nightResult.eliminated.map(({ player }) => (
                                <li key={player.id} className="text-lg">
                                    <strong className="text-red-300">{player.name}</strong> از بازی حذف شد. او می‌تواند وصیت کند.
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-lg text-green-400">
                        شب گذشته هیچ کشته‌ای نداشتیم!
                    </p>
                )}
            </div>
            <button onClick={onStartDay} className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded mt-6">
                شروع رای‌گیری
            </button>
        </div>
    );
}

const DayNominationPhase: React.FC<{
    day: number;
    onEndNominations: () => void;
    onEndDay: () => void;
    livingPlayers: Player[];
    nominationVotes: Record<string, number>;
    setNominationVotes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}> = ({ day, onEndNominations, onEndDay, livingPlayers, nominationVotes, setNominationVotes }) => {
    
    const handleVoteChange = (playerName: string, delta: number) => {
        setNominationVotes(prev => ({
            ...prev,
            [playerName]: Math.max(0, (prev[playerName] || 0) + delta)
        }));
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-2 text-center">روز {day} - مرحله اول رای‌گیری (اتهام)</h2>
             <p className="text-sm text-gray-400 mb-4 text-center">هر بازیکن می‌تواند حداکثر به ۲ نفر رأی دهد. دو نفری که بیشترین رأی را کسب کنند به دفاعیه می‌روند.</p>
            
            <button
                onClick={onEndDay}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors w-full mb-6"
            >
                پایان روز و رفتن به شب (بدون رای‌گیری)
            </button>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {livingPlayers.map(p => (
                    <div key={p.id} className="bg-gray-700/50 p-3 rounded-lg flex flex-col items-center">
                        <span className="font-semibold truncate mb-2">{p.name}</span>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleVoteChange(p.name, -1)} className="bg-red-600 w-7 h-7 rounded-full font-bold">-</button>
                            <span className="text-xl font-mono w-8 text-center">{nominationVotes[p.name] || 0}</span>
                            <button onClick={() => handleVoteChange(p.name, 1)} className="bg-green-600 w-7 h-7 rounded-full font-bold">+</button>
                        </div>
                    </div>
                ))}
            </div>
            
            <button
              onClick={onEndNominations}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              اعلام نتایج و رفتن به دفاعیه
            </button>
        </div>
    );
};

const DayTiebreakerPhase: React.FC<{
    day: number;
    onEndTiebreaker: () => void;
    candidates: string[];
    nominationVotes: Record<string, number>;
    setNominationVotes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    nomineesToSelect: number;
    livingPlayers: Player[];
}> = ({ day, onEndTiebreaker, candidates, nominationVotes, setNominationVotes, nomineesToSelect, livingPlayers }) => {
    
    const handleVoteChange = (playerName: string, delta: number) => {
        setNominationVotes(prev => ({
            ...prev,
            [playerName]: Math.max(0, (prev[playerName] || 0) + delta)
        }));
    };
    
    useEffect(() => {
        setNominationVotes(currentVotes => {
            const newVotes: Record<string, number> = {};
            candidates.forEach(c => {
                if (currentVotes[c]) {
                    newVotes[c] = currentVotes[c];
                }
            });
            return newVotes;
        });
    }, [candidates, setNominationVotes]);


    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-2 text-center">روز {day} - رأی‌گیری مجدد (PK)</h2>
            <p className="text-sm text-gray-400 mb-4 text-center">برای انتخاب {nomineesToSelect} نفر برای دفاعیه از بین بازیکنان زیر رأی‌گیری کنید.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {candidates.map(name => {
                    const player = livingPlayers.find(p => p.name === name);
                    if (!player) return null;
                    return (
                        <div key={player.id} className="bg-gray-700/50 p-3 rounded-lg flex flex-col items-center">
                            <span className="font-semibold truncate mb-2">{player.name}</span>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleVoteChange(player.name, -1)} className="bg-red-600 w-7 h-7 rounded-full font-bold">-</button>
                                <span className="text-xl font-mono w-8 text-center">{nominationVotes[player.name] || 0}</span>
                                <button onClick={() => handleVoteChange(player.name, 1)} className="bg-green-600 w-7 h-7 rounded-full font-bold">+</button>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <button
              onClick={onEndTiebreaker}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              پایان رأی‌گیری مجدد و اعلام نتایج
            </button>
        </div>
    );
};

const DayTrialPhase: React.FC<{ playersOnTrial: Player[]; onTrialEnd: () => void; }> = ({ playersOnTrial, onTrialEnd }) => {
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        if (timer > 0) {
            const timerId = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [timer]);

    const resetTimer = () => setTimer(60);

    return (
        <div className="p-4 text-center">
            <GavelIcon className="h-12 w-12 mx-auto text-yellow-400 mb-4" />
            <h2 className="text-xl font-bold mb-4">دفاعیه</h2>
            <p className="text-gray-400 mb-6">هر بازیکن ۶۰ ثانیه فرصت دارد تا از خود دفاع کند. (بدون تارگت، کاور یا اشاره مستقیم)</p>
            <div className="flex justify-center flex-wrap gap-4 mt-2 mb-6">
                {playersOnTrial.map(p => <span key={p.id} className="bg-yellow-900/50 text-yellow-300 px-4 py-2 rounded-full text-lg">{p.name}</span>)}
            </div>
            <div className="flex items-center justify-center gap-4">
                <div className="text-6xl font-mono text-white my-4 p-4 bg-gray-900/50 rounded-lg">
                    {timer}
                </div>
                <button onClick={resetTimer} title="ریست تایمر" className="bg-gray-600 hover:bg-gray-500 text-white font-bold p-3 rounded-full transition-colors">
                    <RefreshIcon className="h-6 w-6" />
                </button>
            </div>
            <button onClick={onTrialEnd} className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded mt-4">
                پایان دفاعیه و شروع رای‌گیری نهایی
            </button>
        </div>
    );
};

const DayFinalVotePhase: React.FC<{
    day: number;
    playersOnTrial: Player[];
    livingPlayersCount: number;
    finalVotes: Record<string, number>;
    setFinalVotes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    onEndFinalVote: () => void;
}> = ({ day, playersOnTrial, livingPlayersCount, finalVotes, setFinalVotes, onEndFinalVote }) => {

    const handleVoteChange = (playerName: string, delta: number) => {
        setFinalVotes(prev => ({
            ...prev,
            [playerName]: Math.max(0, (prev[playerName] || 0) + delta)
        }));
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-center">مرحله نهایی رای‌گیری (اخراج)</h2>
             {day === 1 ? (
                 <p className="text-center text-gray-400 mb-4">
                     <span className="font-bold text-yellow-300">قانون روز اول:</span> رأی‌گیری <strong className="text-white">اختیاری</strong> است. برای حذف، بازیکن باید <strong className="text-white">4 رأی</strong> بیاورد.
                 </p>
            ) : (
                 <p className="text-center text-gray-400 mb-4">
                     <span className="font-bold text-yellow-300">قانون روز دوم به بعد:</span> رأی‌گیری <strong className="text-white">اجباری</strong> است. بازیکنی که <strong className="text-white">بیشترین رأی</strong> را بیاورد حذف می‌شود.
                 </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {playersOnTrial.map(p => (
                    <div key={p.id} className="bg-gray-700/50 p-4 rounded-lg flex flex-col items-center">
                        <span className="font-bold text-lg truncate mb-3">{p.name}</span>
                        <div className="flex items-center gap-4">
                            <button onClick={() => handleVoteChange(p.name, -1)} className="bg-red-600 w-8 h-8 rounded-full font-bold text-lg">-</button>
                            <span className="text-2xl font-mono w-10 text-center">{finalVotes[p.name] || 0}</span>
                            <button onClick={() => handleVoteChange(p.name, 1)} className="bg-green-600 w-8 h-8 rounded-full font-bold text-lg">+</button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onEndFinalVote}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
                اعلام نتیجه نهایی و حذف بازیکن
            </button>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h3 className="text-xl font-bold text-yellow-300 mb-3 pb-2 border-b-2 border-gray-700">{title}</h3>
    <div className="space-y-2">
      {children}
    </div>
  </section>
);

const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 max-w-3xl w-full h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
          <h2 id="help-title" className="text-2xl font-bold text-red-500">راهنمای سناریو مافیا کلاسیک</h2>
          <button 
            onClick={onClose} 
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
            aria-label="بستن راهنما"
          >
            بستن
          </button>
        </div>
        <div className="p-6 text-gray-300 overflow-y-auto space-y-6">
          <Section title="معرفی سناریو">
            <p>
              مافیا کلاسیک، سناریوی استاندارد و محبوب بازی مافیا است که در آن شهروندان با قابلیت‌های ویژه تلاش می‌کنند تا تیم مافیا را قبل از اینکه در اقلیت قرار بگیرند، شناسایی و از بازی حذف کنند. این سناریو بر پایه استدلال، نقش‌های مخفی و همکاری تیمی بنا شده است.
            </p>
          </Section>
          
          <Section title="تیم مافیا">
            <ul className="list-disc pr-6 space-y-2">
              <li><strong className="text-red-400">رئیس مافیا (Godfather):</strong> رهبر تیم مافیا. استعلام کارآگاه برای او بار اول منفی (شهروند) است، اما اگر برای بار دوم استعلام شود، هویت مافیایی او فاش می‌شود.</li>
              <li><strong className="text-red-400">مافیای ساده (Simple Mafia):</strong> عضو تیم مافیا که استعلامش برای کارآگاه همیشه مثبت است.</li>
            </ul>
          </Section>

          <Section title="تیم شهروندان">
            <ul className="list-disc pr-6 space-y-2 mt-2">
              <li><strong className="text-blue-400">دکتر (Doctor):</strong> هر شب می‌تواند یک نفر را از شلیک مافیا نجات دهد. او می‌تواند خودش را بدون هیچ محدودیتی در طول بازی نجات دهد.</li>
              <li><strong className="text-blue-400">کارآگاه (Detective):</strong> هر شب می‌تواند نقش یک نفر را از گرداننده استعلام کند. گرداننده فقط مافیا بودن یا نبودن را اعلام می‌کند (با در نظر گرفتن قانون رئیس مافیا).</li>
              <li><strong className="text-blue-400">شهروند ساده (Citizen):</strong> قابلیت خاصی ندارد و باید با تحلیل و رای خود به پیروزی شهر کمک کند.</li>
            </ul>
          </Section>

          <Section title="مراحل بازی">
             <h4 className="text-lg font-semibold text-gray-100 mt-4 mb-2">فاز روز</h4>
            <ol className="list-decimal pr-6 space-y-2">
              <li><strong>اعلام نتایج شب:</strong> گرداننده اعلام می‌کند چه کسی(هایی) در شب گذشته از بازی حذف شده است. کشته شب حق وصیت دارد.</li>
              <li><strong>بحث و گفتگو:</strong> بازیکنان درباره اتفاقات شب و مظنونین خود صحبت می‌کنند. هر بازیکن در هر روز به غیر از نوبت صحبت خود، فقط یک نوبت چالش دارد.</li>
              <li><strong>رای‌گیری اول (اتهام):</strong> هر بازیکن به حداکثر دو نفر رای می‌دهد. دو نفری که بیشترین رای را بیاورند وارد دفاعیه می‌شوند. (در صورت تساوی، رای‌گیری مجدد یا PK انجام می‌شود).</li>
              <li><strong>دفاعیه:</strong> افراد متهم از خود دفاع می‌کنند.</li>
              <li><strong>رای‌گیری نهایی (اخراج):</strong> برای اخراج متهمان رای‌گیری می‌شود. در روز اول، اخراج با ۴ رای و اختیاری است. در روزهای بعد، اجباری و با بیشترین رای است. بازیکنی که با رأی‌گیری از بازی خارج می‌شود، نقشش فاش <strong>نمی‌شود</strong>.</li>
            </ol>
            <h4 className="text-lg font-semibold text-gray-100 mt-4 mb-2">فاز شب</h4>
            <ol className="list-decimal pr-6 space-y-2">
              <li><strong>بیدار شدن مافیا:</strong> اعضای تیم مافیا بیدار شده و یک نفر را برای حذف شدن انتخاب می‌کنند. آنها امکان شلیک به یاران خودی (خودزنی) را نیز دارند.</li>
              <li><strong>بیدار شدن دکتر:</strong> دکتر بیدار شده و یک نفر را برای نجات دادن انتخاب می‌کند.</li>
              <li><strong>بیدار شدن کارآگاه:</strong> کارآگاه بیدار شده و استعلام یک نفر را از گرداننده می‌گیرد.</li>
            </ol>
          </Section>
          
          <Section title="شرایط پیروزی">
             <ul className="list-disc pr-6 space-y-2">
              <li><strong className="text-blue-400">پیروزی شهروندان:</strong> تمام اعضای مافیا از بازی حذف شوند.</li>
              <li><strong className="text-red-400">پیروزی مافیا:</strong> تعداد مافیاهای زنده با تعداد شهروندان زنده برابر یا از آن بیشتر شود.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
};


export default App;
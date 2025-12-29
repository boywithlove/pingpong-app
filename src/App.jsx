import React, { useState, useEffect } from 'react';

export default function App() {
  // --- 상태 관리 ---
  const [gameStarted, setGameStarted] = useState(false);
  const [matchFinished, setMatchFinished] = useState(false);
  const [winner, setWinner] = useState(null);

  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  
  const [swapped, setSwapped] = useState(false);
  const [setsToWin, setSetsToWin] = useState(3); 
  const [history, setHistory] = useState([]);

  // 추가: 초기 서브권 상태 (A 또는 B)
  const [initialServer, setInitialServer] = useState('A');

  // --- 효과음 및 TTS 기능 ---
  const playBeep = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  };

const speakScore = (sA, sB) => {
    // 팀 이름이 없을 경우를 대비해 기본값 설정
    const nameA = teamAName || 'A팀';
    const nameB = teamBName || 'B팀';
    
    // 예: "나이스 팀 5 대 스마트 팀 3"
    const msg = new SpeechSynthesisUtterance(`${nameA} ${sA} 대  ${nameB} ${sB} `);
    
    msg.lang = 'ko-KR';
    msg.rate = 0.85; // 아까 조절한 천천히 말하는 속도
    window.speechSynthesis.speak(msg);
  };
  // --- 유틸리티 기능 ---
  const vibrate = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(50); } catch (e) { }
    }
  };

  const saveHistory = () => {
    setHistory(prev => [...prev, { scoreA, scoreB, setsA, setsB, swapped }]);
  };

  const undo = (e) => {
    e?.stopPropagation();
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setScoreA(lastState.scoreA);
    setScoreB(lastState.scoreB);
    setSetsA(lastState.setsA);
    setSetsB(lastState.setsB);
    setSwapped(lastState.swapped);
    setHistory(prev => prev.slice(0, -1));
  };

  // 서브권 로직 수정: 선택한 initialServer를 기준으로 계산
  const getServer = () => {
    const totalScore = scoreA + scoreB;
    let current;
    if (scoreA >= 10 && scoreB >= 10) {
      current = totalScore % 2 === 0 ? 'START' : 'OTHER';
    } else {
      current = Math.floor(totalScore / 2) % 2 === 0 ? 'START' : 'OTHER';
    }
    
    if (current === 'START') return initialServer;
    return initialServer === 'A' ? 'B' : 'A';
  };

  const handleScore = (target) => {
    if (matchFinished) return;
    vibrate();
    playBeep(); // 효과음
    saveHistory();
    
    let newA = scoreA;
    let newB = scoreB;

    if (target === 'A') {
      newA = scoreA + 1;
      setScoreA(newA);
      checkSetWin(newA, scoreB);
    } else {
      newB = scoreB + 1;
      setScoreB(newB);
      checkSetWin(scoreA, newB);
    }
    speakScore(newA, newB); // TTS 점수 안내
  };

  const checkSetWin = (sA, sB) => {
    if ((sA >= 11 && sA - sB >= 2) || (sB >= 11 && sB - sA >= 2)) {
      const setWinner = sA > sB ? 'A' : 'B';
      setTimeout(() => {
        if (setWinner === 'A') {
          const newSetsA = setsA + 1;
          setSetsA(newSetsA);
          if (newSetsA >= setsToWin) finishMatch(teamAName || 'A팀');
        } else {
          const newSetsB = setsB + 1;
          setSetsB(newSetsB);
          if (newSetsB >= setsToWin) finishMatch(teamBName || 'B팀');
        }
        setScoreA(0); setScoreB(0);
        setSwapped(prev => !prev);
        // 세트가 바뀌면 다음 세트 첫 서브권도 교체
        setInitialServer(prev => prev === 'A' ? 'B' : 'A');
      }, 300);
    }
  };

  const finishMatch = (name) => {
    setWinner(name);
    setMatchFinished(true);
  };

  const startGame = () => {
    setGameStarted(true);
    if (!teamAName) setTeamAName('A팀');
    if (!teamBName) setTeamBName('B팀');
  };

  const resetAll = () => {
    setScoreA(0); setScoreB(0); setSetsA(0); setSetsB(0);
    setGameStarted(false); setMatchFinished(false);
    setWinner(null); setHistory([]); setSwapped(false);
  };

  // --- 화면 1: 시작 화면 ---
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl">
          <div className="flex justify-center mb-6 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-red-600 rounded-2xl blur opacity-20"></div>
            <img 
              src="https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?q=80&w=1000&auto=format&fit=crop" 
              alt="Table Tennis" 
              className="relative w-40 h-28 object-cover rounded-xl shadow-lg border border-slate-700/50"
            />
          </div>

          <h1 className="text-2xl font-black text-center mb-6 tracking-tight">PINGPONG SCORE</h1>
          
          <div className="space-y-4 mb-8">
            <input 
              className="w-full bg-slate-800 border-none p-4 rounded-xl text-lg focus:ring-2 ring-blue-500 outline-none"
              placeholder="A팀 이름" value={teamAName} onChange={e => setTeamAName(e.target.value)}
            />
            <input 
              className="w-full bg-slate-800 border-none p-4 rounded-xl text-lg focus:ring-2 ring-red-500 outline-none"
              placeholder="B팀 이름" value={teamBName} onChange={e => setTeamBName(e.target.value)}
            />
            
            {/* 승리 조건 선택 */}
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-sm font-medium text-slate-400">승리 조건</span>
              <select 
                className="bg-transparent font-bold outline-none"
                value={setsToWin} onChange={e => setSetsToWin(Number(e.target.value))}
              >
                <option value={2}>3판 2선승</option>
                <option value={3}>5판 3선승</option>
                <option value={4}>7판 4선승</option>
              </select>
            </div>

            {/* 추가: 첫 서브권 선택 */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-sm font-medium text-slate-400 block mb-2">첫 서브권</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setInitialServer('A')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${initialServer === 'A' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  {teamAName || 'A팀'}
                </button>
                <button 
                  onClick={() => setInitialServer('B')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${initialServer === 'B' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                  {teamBName || 'B팀'}
                </button>
              </div>
            </div>
          </div>
          
          <button onClick={startGame} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-blue-900/40">
            경기 시작
          </button>
        </div>
      </div>
    );
  }

  const currentServer = getServer();

  // --- 화면 2: 경기 화면 (기존과 동일하되 시각적 서브 표시 포함) ---
  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden select-none">
      <div className="h-16 bg-slate-900 flex justify-between items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className={`text-xl font-black ${setsA > setsB ? 'text-blue-400' : 'text-slate-500'}`}>{setsA}</div>
          <div className="text-slate-700 text-xs font-bold uppercase tracking-widest">Sets</div>
          <div className={`text-xl font-black ${setsB > setsA ? 'text-red-400' : 'text-slate-500'}`}>{setsB}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={undo} disabled={history.length === 0} className="p-2 bg-slate-800 rounded-lg disabled:opacity-20 active:bg-slate-700 transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h12.5a5.5 5.5 0 010 11H13"/></svg>
          </button>
          <button onClick={resetAll} className="px-3 py-1 bg-red-900/20 text-red-500 rounded-lg font-bold text-xs uppercase tracking-wider">Reset</button>
        </div>
      </div>

      <div className="flex-1 flex text-center relative">
        {matchFinished && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="text-yellow-500 text-sm mb-2 font-black uppercase tracking-[0.3em]">Winner</div>
            <div className="text-5xl font-black mb-10">{winner}</div>
            <button onClick={resetAll} className="bg-white text-black px-8 py-3 rounded-full font-bold transition-transform active:scale-95">다시 하기</button>
          </div>
        )}

        {[
          { id: 'Left', team: swapped ? 'B' : 'A', name: swapped ? teamBName : teamAName, score: swapped ? scoreB : scoreA, border: 'border-r border-slate-900' },
          { id: 'Right', team: swapped ? 'A' : 'B', name: swapped ? teamAName : teamBName, score: swapped ? scoreA : scoreB, border: '' }
        ].map((side) => (
          <button 
            key={side.id}
            onClick={() => handleScore(side.team)}
            className={`flex-1 flex flex-col items-center justify-center relative active:bg-slate-950 transition-colors ${side.border}`}
          >
            <div className="mb-2 text-slate-500 font-bold text-sm tracking-widest uppercase">{side.name}</div>
            <div className="relative">
              <div className="text-[10rem] font-black leading-none italic tracking-tighter">{side.score}</div>
              {currentServer === side.team && (
                <div className="absolute -top-2 -right-6 w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="h-24 bg-slate-900 flex justify-around items-center px-10 border-t border-slate-800">
        <button onClick={(e) => { e.stopPropagation(); saveHistory(); swapped ? setScoreB(Math.max(0, scoreB-1)) : setScoreA(Math.max(0, scoreA-1)) }} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold active:bg-slate-700 border border-slate-700">-</button>
        <div className="text-[10px] text-slate-600 font-black tracking-[0.2em] uppercase">Score Control</div>
        <button onClick={(e) => { e.stopPropagation(); saveHistory(); swapped ? setScoreA(Math.max(0, scoreA-1)) : setScoreB(Math.max(0, scoreB-1)) }} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold active:bg-slate-700 border border-slate-700">-</button>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import Lobby from './components/Lobby'
import ChatBox from './components/ChatBox'
import GameInfo from './components/GameInfo' // Import mới
import { initialBoardState } from './utils/initialState'
import { isValidMove, isCheck, willCauseSelfCheck, isGameOver } from './utils/rules'
import { getBestMove } from './utils/ai' 
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, doc, getDoc, onSnapshot, updateDoc, setDoc, increment } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";

function App() {
  const [pieces, setPieces] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [turn, setTurn] = useState('r');
  const [message, setMessage] = useState(""); 
  const [winner, setWinner] = useState(null);
  const [winReason, setWinReason] = useState(null); 
  const [history, setHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  
  const [gameId, setGameId] = useState(null); 
  const [playerColor, setPlayerColor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [drawReq, setDrawReq] = useState(null);

  const [gameMode, setGameMode] = useState('online'); 
  const [isMuted, setIsMuted] = useState(false);
  const [boardWidth, setBoardWidth] = useState(560);
  const [installPrompt, setInstallPrompt] = useState(null);

  const INITIAL_GAME_TIME = 900;
  const INITIAL_MOVE_TIME = 120;
  const [redTime, setRedTime] = useState(INITIAL_GAME_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_GAME_TIME);
  const [currentMoveTime, setCurrentMoveTime] = useState(INITIAL_MOVE_TIME);

  const serverData = useRef({ redTime: INITIAL_GAME_TIME, blackTime: INITIAL_GAME_TIME, lastMoveTime: Date.now() });
  const lastMoveId = useRef(null); 
  const historyEndRef = useRef(null);
  const processedWinner = useRef(false); 

  const [replayMode, setReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPieces, setReplayPieces] = useState(initialBoardState);
  
  // STATE MỚI: HIỆU ỨNG LAST MOVE
  const [lastMove, setLastMove] = useState(null); 

  // --- HÀM PHÁT ÂM THANH ---
  const playSoundAndLog = (type) => {
    if (type === 'win') console.log("Bạn đã thắng");
    if (type === 'loss') console.log("Bạn đã thua");
    if (type === 'draw') console.log("Bạn đã hòa");
    if (type === 'check') console.log("Chiếu tướng");
    if (isMuted) return;
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(() => {});
  };

  const playResultSound = (winnerColor) => {
    if (processedWinner.current) return;
    processedWinner.current = true;
    if (winnerColor === 'draw') { playSoundAndLog('draw'); } 
    else if (winnerColor === playerColor) { playSoundAndLog('win'); } 
    else { playSoundAndLog('loss'); }
  };

  const playSound = (type) => { // Wrapper đơn giản
     if (!isMuted) new Audio(`/sounds/${type}.mp3`).play().catch(()=>{});
  };

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const handleInstallApp = async () => { if (!installPrompt) return; installPrompt.prompt(); const { outcome } = await installPrompt.userChoice; if (outcome === 'accepted') setInstallPrompt(null); };

  const handleCopyLink = () => {
    const textToCopy = `Vào chơi Cờ Tướng với mình nhé! Mã phòng: ${gameId}`;
    navigator.clipboard.writeText(textToCopy).then(() => alert("Đã copy mã phòng!")).catch(err => console.error(err));
  };

  // --- UPDATE STATE ---
  const updateGameState = async (newPieces, currentTurnPlaying, newHistoryEntry = null) => {
    const nextTurn = currentTurnPlaying === 'r' ? 'b' : 'r';
    
    const isMate = isGameOver(newPieces, nextTurn);
    if (isMate) {
        updateGameWinner(currentTurnPlaying, 'checkmate', false);
    }

    if (gameMode === 'ai') {
        setPieces(newPieces);
        setTurn(nextTurn);
        if (newHistoryEntry) setHistory(prev => [...prev, newHistoryEntry]);
        
        if (!isMate) {
            if (isCheck(newPieces, nextTurn)) {
                setMessage("⚠️ CHIẾU TƯỚNG!");
                if (currentTurnPlaying === 'b') playSoundAndLog('check');
            } else {
                setMessage("");
            }
        } else { setMessage(""); }
        return;
    }

    if (gameId) {
      const gameRef = doc(db, "games", gameId);
      const updateData = {
        pieces: newPieces,
        turn: nextTurn,
        redTime: redTime, 
        blackTime: blackTime,
        lastMoveTime: Date.now()
      };
      if (newHistoryEntry) updateData.history = [...history, newHistoryEntry];
      await updateDoc(gameRef, updateData);
    }
  };

  useEffect(() => {
    if (gameMode === 'ai' && !winner && turn === 'b') {
        const timer = setTimeout(() => {
            const move = getBestMove(pieces, 'b', history);
            if (move) {
                const pieceToMove = pieces.find(p => p.id === move.fromId);
                executeMove(pieceToMove, move.targetX, move.targetY);
            } else {
                updateGameWinner('r', 'checkmate');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [turn, gameMode, winner, pieces]);

  useEffect(() => {
    if (!gameId || gameMode === 'ai') return;
    const docRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPieces(data.pieces);
        setTurn(data.turn);
        setHistory(data.history || []);
        
        // SYNC LAST MOVE
        if (data.history && data.history.length > 0) {
            const last = data.history[data.history.length - 1];
            setLastMove({ fromX: last.fromX, fromY: last.fromY, toX: last.toX, toY: last.toY });
        }

        setWinner(data.winner);
        if (data.chat) setChatMessages(data.chat);
        if (data.winReason) setWinReason(data.winReason);
        if (data.drawRequest && data.drawRequest !== playerColor && !data.winner) { setDrawReq(data.drawRequest); } else { setDrawReq(null); }
        serverData.current = { redTime: data.redTime || INITIAL_GAME_TIME, blackTime: data.blackTime || INITIAL_GAME_TIME, lastMoveTime: data.lastMoveTime || Date.now() };
        syncTime();
        
        if (data.lastMoveTime !== lastMoveId.current) {
            lastMoveId.current = data.lastMoveTime;
            
            if (data.winner) {
                 if (!processedWinner.current) {
                    playResultSound(data.winner);
                 }
                 setMessage("");
            } 
            else {
                const justMoved = data.turn === 'r' ? 'b' : 'r';
                if (isCheck(data.pieces, justMoved)) {
                    setMessage("⚠️ CHIẾU TƯỚNG!");
                    playSoundAndLog('check');
                } else {
                    setMessage("");
                    if (justMoved !== playerColor) playSoundAndLog('move'); 
                }
            }
        }
      } else { alert("Phòng không tồn tại!"); leaveRoom(); }
    });
    return () => unsubscribe();
  }, [gameId, playerColor, gameMode]);

  const syncTime = () => {
    if (!gameId || winner || gameMode === 'ai') return;
    const now = Date.now();
    const elapsed = Math.floor((now - serverData.current.lastMoveTime) / 1000);
    if (turn === 'r') {
      setRedTime(Math.max(0, serverData.current.redTime - elapsed));
      setBlackTime(serverData.current.blackTime);
      setCurrentMoveTime(Math.max(0, INITIAL_MOVE_TIME - elapsed));
    } else {
      setBlackTime(Math.max(0, serverData.current.blackTime - elapsed));
      setRedTime(serverData.current.redTime);
      setCurrentMoveTime(Math.max(0, INITIAL_MOVE_TIME - elapsed));
    }
  };

  useEffect(() => {
    if (!gameId || winner) return;
    if (gameMode === 'ai') return; 
    const interval = setInterval(() => { syncTime(); }, 1000);
    return () => clearInterval(interval);
  }, [gameId, winner, turn, gameMode]);

  const handleLogin = async () => { try { const result = await signInWithPopup(auth, googleProvider); const user = result.user; const userRef = doc(db, "users", user.uid); const userSnap = await getDoc(userRef); if (!userSnap.exists()) { await setDoc(userRef, { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, email: user.email, wins: 0, losses: 0, joinedAt: new Date() }); } setCurrentUser(user); } catch (error) { console.error(error); alert("Đăng nhập thất bại!"); } };
  useEffect(() => { if (currentUser) { const unsub = onSnapshot(doc(db, "users", currentUser.uid), (doc) => { if(doc.exists()) setUserStats(doc.data()); }); return () => unsub(); } }, [currentUser]);
  useEffect(() => { if (gameId && !winner && turn === playerColor && gameMode === 'online') { if ((playerColor === 'r' && redTime <= 0) || (playerColor === 'b' && blackTime <= 0)) updateGameWinner(playerColor === 'r' ? 'b' : 'r', 'timeout'); if (currentMoveTime <= 0) updateGameWinner(playerColor === 'r' ? 'b' : 'r', 'timeout_move'); } }, [redTime, blackTime, currentMoveTime, gameId, winner, turn, playerColor, gameMode]);

  const handlePlayAI = () => { setGameId("OFFLINE-AI"); setGameMode('ai'); setPlayerColor('r'); setPieces(initialBoardState); setTurn('r'); setWinner(null); setHistory([]); setMessage(""); setRedTime(INITIAL_GAME_TIME); setBlackTime(INITIAL_GAME_TIME); processedWinner.current = false; setLastMove(null); };
  const resetGame = () => { setPieces(initialBoardState); setTurn('r'); setWinner(null); setWinReason(null); setMessage(""); setSelectedPiece(null); setHistory([]); setChatMessages([]); setRedTime(INITIAL_GAME_TIME); setBlackTime(INITIAL_GAME_TIME); setCurrentMoveTime(INITIAL_MOVE_TIME); setDrawReq(null); setGameMode('online'); setGameId(null); setPlayerColor(null); setReplayMode(false); processedWinner.current = false; setLastMove(null); };
  const leaveRoom = () => { resetGame(); };
  const updateGameWinner = async (winnerColor, reason = "checkmate", shouldPlaySound = true) => {
    if (shouldPlaySound) playResultSound(winnerColor);
    if (gameMode === 'ai') { setWinner(winnerColor); setWinReason(reason); return; }
    if (gameId) { const gameRef = doc(db, "games", gameId); const gameSnap = await getDoc(gameRef); const gameData = gameSnap.data(); if (gameData.winner) return; await updateDoc(gameRef, { winner: winnerColor, winReason: reason, status: 'finished', drawRequest: null }); if (winnerColor === 'draw') return; if (winnerColor === playerColor && currentUser) { const myRef = doc(db, "users", currentUser.uid); await updateDoc(myRef, { wins: increment(1) }); const opponentId = winnerColor === 'r' ? gameData.blackPlayerId : gameData.redPlayerId; if (opponentId) { const opRef = doc(db, "users", opponentId); await updateDoc(opRef, { losses: increment(1) }); } } }
  };
  const handleCreateGame = async () => { if (!currentUser) return alert("Bạn cần đăng nhập!"); try { const docRef = await addDoc(collection(db, "games"), { pieces: initialBoardState, turn: 'r', history: [], chat: [], winner: null, winReason: null, drawRequest: null, redTime: INITIAL_GAME_TIME, blackTime: INITIAL_GAME_TIME, lastMoveTime: Date.now(), redPlayerId: currentUser.uid, redPlayerName: currentUser.displayName, status: 'waiting', createdAt: new Date() }); setGameId(docRef.id); setPlayerColor('r'); setGameMode('online'); alert(`Tạo phòng thành công!`); } catch (e) { console.error(e); alert("Lỗi tạo phòng!"); } };
  const handleJoinGame = async (idInput) => { if (!currentUser) return alert("Bạn cần đăng nhập!"); const cleanId = idInput.trim(); if (!cleanId) return; try { const docRef = doc(db, "games", cleanId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { const gameData = docSnap.data(); if (gameData.blackPlayerId && gameData.blackPlayerId !== currentUser.uid) { alert("Phòng đã đủ người!"); return; } if (!gameData.blackPlayerId) { await updateDoc(docRef, { blackPlayerId: currentUser.uid, blackPlayerName: currentUser.displayName, status: 'playing' }); } setGameId(cleanId); setPlayerColor('b'); setGameMode('online'); } else { alert("Không tìm thấy phòng!"); } } catch (e) { console.error(e); alert("Lỗi kết nối!"); } };
  const handleSendMessage = async (text) => { if (!gameId || gameMode === 'ai') return; const senderName = currentUser ? currentUser.displayName : 'Khách'; const role = (playerColor === 'r' || playerColor === 'b') ? playerColor : 'spectator'; const newMessage = { sender: role, senderName: senderName, text: text, timestamp: Date.now() }; await updateDoc(doc(db, "games", gameId), { chat: [...chatMessages, newMessage] }); };
  const handleDrawRequest = async () => { if (!gameId || winner || gameMode === 'ai') return; if (window.confirm("Bạn muốn gửi yêu cầu HÒA cho đối thủ?")) { const gameRef = doc(db, "games", gameId); await updateDoc(gameRef, { drawRequest: playerColor }); alert("Đã gửi yêu cầu! Vui lòng chờ đối thủ phản hồi."); } };
  const handleAcceptDraw = () => { updateGameWinner('draw', 'draw'); setDrawReq(null); };
  const handleRejectDraw = async () => { if (!gameId || gameMode === 'ai') return; const gameRef = doc(db, "games", gameId); await updateDoc(gameRef, { drawRequest: null }); setDrawReq(null); };
  const createMoveLog = (piece, targetX, targetY) => { const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']; return `${['Xe','Mã','Tượng','Sĩ','Tướng','Pháo','Tốt'][['r','n','b','a','k','c','p'].indexOf(piece.type)]} (${letters[piece.x]}${9-piece.y} → ${letters[targetX]}${9-targetY})`; };
  const checkRepetition = (piece, targetX, targetY) => { const moveText = createMoveLog(piece, targetX, targetY); const myMoves = history.filter(h => h.turn === turn); const recentMoves = myMoves.slice(-10); let count = 0; for (let h of recentMoves) { if (h.text === moveText) count++; } return count >= 3; };
  const startReplay = () => { setReplayMode(true); jumpToMove(history.length); };
  const exitReplay = () => { setReplayMode(false); };
  const jumpToMove = (index) => { if (index < 0 || index > history.length) return; setReplayIndex(index); let simPieces = JSON.parse(JSON.stringify(initialBoardState)); for (let i = 0; i < index; i++) { const move = history[i]; if (move.isCapture && move.capturedPieceId) simPieces = simPieces.filter(p => p.id !== move.capturedPieceId); simPieces = simPieces.map(p => { if (p.id === move.pieceId) return { ...p, x: move.toX, y: move.toY }; return p; }); } setReplayPieces(simPieces); };

  // --- EXECUTE MOVE ---
  const executeMove = (piece, targetX, targetY, isCapture) => { 
      // 1. Detect capture
      const victim = pieces.find(p => p.x === targetX && p.y === targetY);
      const capture = !!victim;

      const moveText = createMoveLog(piece, targetX, targetY); 
      const newHistoryEntry = { 
          turn: turn, text: moveText, isCapture: capture, 
          pieceId: piece.id, fromX: piece.x, fromY: piece.y, toX: targetX, toY: targetY, 
          capturedPieceId: capture ? victim.id : null 
      }; 
      
      // Update local lastMove
      setLastMove({ fromX: piece.x, fromY: piece.y, toX: targetX, toY: targetY });

      let newPieces = [...pieces];
      if (capture) newPieces = newPieces.filter(p => p.id !== victim.id);
      newPieces = newPieces.map(p => p.id === piece.id ? { ...p, x: targetX, y: targetY } : p); 
      
      const nextTurn = turn === 'r' ? 'b' : 'r';
      const isMate = isGameOver(newPieces, nextTurn);
      
      if (isMate) {
          playResultSound(turn); 
          setMessage("");
      } else {
          const checked = isCheck(newPieces, turn);
          if (checked) {
              playSoundAndLog('check');
              setMessage("⚠️ CHIẾU TƯỚNG!");
          } else {
              playSoundAndLog(capture ? 'capture' : 'move');
              setMessage("");
          }
      } 
      
      updateGameState(newPieces, turn, newHistoryEntry, isMate); 
      setSelectedPiece(null); 
  };

  const handlePieceClick = (targetPiece) => { if (replayMode) return; if (winner) return; if (playerColor === 'spectator') return; if (gameId && gameMode === 'online') { if (turn !== playerColor) return; if (!selectedPiece && targetPiece.color !== playerColor) return; if (selectedPiece && targetPiece.color !== playerColor && turn !== playerColor) return; } if (gameMode === 'ai' && turn !== 'r') return; 
    if (!selectedPiece) { if (targetPiece.color !== turn) return; setSelectedPiece(targetPiece); return; } if (targetPiece.id === selectedPiece.id) { setSelectedPiece(null); return; } if (targetPiece.color === selectedPiece.color) { if (targetPiece.color === turn) setSelectedPiece(targetPiece); return; } 
    if (!isValidMove(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return; if (willCauseSelfCheck(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return; 
    const opponentColor = turn === 'r' ? 'b' : 'r'; const amIInCheck = isCheck(pieces, opponentColor); if (!amIInCheck && checkRepetition(selectedPiece, targetPiece.x, targetPiece.y)) { alert("Lỗi: Nước đi này đã lặp lại quá 3 lần! Vui lòng đi nước khác."); return; }
    executeMove(selectedPiece, targetPiece.x, targetPiece.y); 
  };
  
  const handleSquareClick = (x, y) => { if (replayMode) return; if (winner) return; if (playerColor === 'spectator') return; if (gameId && gameMode === 'online' && turn !== playerColor) return; if (gameMode === 'ai' && turn !== 'r') return; if (!selectedPiece) return; 
    if (!isValidMove(selectedPiece, x, y, pieces)) return; if (willCauseSelfCheck(selectedPiece, x, y, pieces)) return; 
    const opponentColor = turn === 'r' ? 'b' : 'r'; const amIInCheck = isCheck(pieces, opponentColor); if (!amIInCheck && checkRepetition(selectedPiece, x, y)) { alert("Lỗi: Nước đi này đã lặp lại quá 3 lần! Vui lòng đi nước khác."); return; }
    executeMove(selectedPiece, x, y); 
  };
  
  useEffect(() => { const handleResize = () => { const maxWidth = Math.min(window.innerWidth - 20, 560); setBoardWidth(maxWidth); }; window.addEventListener('resize', handleResize); handleResize(); return () => window.removeEventListener('resize', handleResize); }, []);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-800 font-sans flex flex-col items-center py-5 pb-20">
      <div className="flex items-center justify-between w-full max-w-4xl px-4 mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-500 tracking-widest drop-shadow-md">KỲ VƯƠNG ONLINE</h1>
          <div className="flex gap-2">
            {gameId && gameMode === 'online' && ( <button onClick={handleCopyLink} className="bg-slate-700 p-2 rounded-full border border-slate-500 hover:bg-slate-600 transition-colors shadow-lg" title="Copy mã phòng"> 🔗 </button> )}
            <button onClick={() => setIsMuted(!isMuted)} className="bg-slate-700 p-2 rounded-full border border-slate-500 hover:bg-slate-600 transition-colors shadow-lg">
                {isMuted ? "🔇" : "🔊"}
            </button>
          </div>
      </div>

      {!gameId ? (
        <Lobby onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} user={userStats || currentUser} onLogin={handleLogin} onPlayAI={handlePlayAI} showInstallButton={!!installPrompt} onInstallApp={handleInstallApp} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start w-full max-w-6xl px-2 animate-fade-in">
          
          <div className="relative flex flex-col items-center">
            
            {/* GAME INFO (CHỈ HIỆN KHI KO REPLAY) */}
            {!replayMode && (
                <GameInfo 
                    gameMode={gameMode}
                    gameId={gameId}
                    turn={turn}
                    winner={winner}
                    playerColor={playerColor}
                    currentUser={currentUser}
                    redTime={redTime}
                    blackTime={blackTime}
                    currentMoveTime={currentMoveTime}
                />
            )}

            {/* MESSAGE ALERT */}
            {message && !winner && !replayMode && <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-2xl animate-bounce font-bold border-2 border-yellow-400 z-50 text-sm whitespace-nowrap">{message}</div>}
            {drawReq && !winner && !replayMode && gameMode !== 'ai' && <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white p-4 rounded-xl border-2 border-yellow-500 shadow-2xl z-50 flex flex-col items-center gap-3 animate-bounce w-64"> <h3 className="font-bold text-yellow-400 text-center">🤝 CẦU HÒA?</h3> <div className="flex gap-2 w-full"> <button onClick={handleAcceptDraw} className="flex-1 bg-green-600 py-1 rounded text-sm">OK</button> <button onClick={handleRejectDraw} className="flex-1 bg-red-600 py-1 rounded text-sm">Hủy</button> </div> </div>}

            {/* WINNER POPUP */}
            {winner && !replayMode && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] rounded-lg text-center p-4">
                <h2 className={`text-4xl md:text-6xl font-bold mb-4 ${winner === 'draw' ? 'text-gray-300' : (winner === 'r' ? 'text-red-500' : 'text-white')}`}>{winner === 'draw' ? 'HÒA CỜ!' : (winner === 'r' ? 'ĐỎ THẮNG!' : 'ĐEN THẮNG!')}</h2>
                <p className="text-yellow-400 text-lg mb-6 font-mono">{winReason === 'checkmate' && "(Chiếu bí)"} {winReason === 'timeout' && "(Hết giờ tổng)"} {winReason === 'timeout_move' && "(Quá thời gian nước đi)"} {winReason === 'resign' && "(Đối thủ xin thua)"} {winReason === 'draw' && "(Đồng ý hòa)"}</p>
                <div className="flex gap-4">
                    <button onClick={startReplay} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 shadow-lg border border-blue-400">Xem lại</button>
                    <button onClick={leaveRoom} className="px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 shadow-lg border border-yellow-600">Thoát</button>
                </div>
                </div>
            )}

            {/* BÀN CỜ */}
            <Board 
                pieces={replayMode ? replayPieces : pieces} 
                onPieceClick={handlePieceClick} 
                onSquareClick={handleSquareClick} 
                selectedPiece={selectedPiece} 
                isFlipped={playerColor === 'b'} 
                boardWidth={boardWidth}
                lastMove={replayMode ? null : lastMove}
                checkedKingPos={replayMode ? null : (message.includes("CHIẾU") ? (turn === 'r' ? pieces.find(p=>p.type==='k'&&p.color==='r') : pieces.find(p=>p.type==='k'&&p.color==='b')) : null)}
            />

            {/* REPLAY CONTROLS */}
            {replayMode && (
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900 p-3 rounded-xl border border-yellow-500 shadow-2xl flex gap-3 z-50 items-center">
                    <button onClick={() => jumpToMove(0)} className="px-3 py-1 bg-slate-700 rounded text-white font-bold hover:bg-slate-600">|&lt;</button>
                    <button onClick={() => jumpToMove(replayIndex - 1)} className="px-3 py-1 bg-slate-700 rounded text-white font-bold hover:bg-slate-600">&lt;</button>
                    <span className="text-yellow-400 font-mono font-bold w-12 text-center text-lg">{replayIndex} / {history.length}</span>
                    <button onClick={() => jumpToMove(replayIndex + 1)} className="px-3 py-1 bg-slate-700 rounded text-white font-bold hover:bg-slate-600">&gt;</button>
                    <button onClick={() => jumpToMove(history.length)} className="px-3 py-1 bg-slate-700 rounded text-white font-bold hover:bg-slate-600">&gt;|</button>
                    <button onClick={exitReplay} className="ml-2 px-3 py-1 bg-red-600 rounded text-white font-bold hover:bg-red-500 border border-red-400 text-sm">X</button>
                </div>
            )}

            {/* NÚT CHỨC NĂNG */}
            {!winner && !replayMode && gameId && (playerColor === 'r' || playerColor === 'b') && (
                <div className="flex gap-2 mt-4 w-full justify-center" style={{ maxWidth: boardWidth }}>
                    {gameMode !== 'ai' && playerColor !== 'spectator' && (
                        <>
                        <button onClick={() => { if (window.confirm("Xin thua?")) { const opponent = playerColor === 'r' ? 'b' : 'r'; updateGameWinner(opponent, 'resign'); } }} className="flex-1 bg-red-900/80 hover:bg-red-800 text-red-100 font-bold py-2 rounded border border-red-700 text-sm">🏳️ Xin Thua</button>
                        <button onClick={handleDrawRequest} className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-2 rounded border border-slate-500 text-sm">🤝 Cầu Hòa</button>
                        </>
                    )}
                    {gameMode === 'ai' && (
                        <button onClick={leaveRoom} className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-2 rounded border border-slate-500 text-sm">Thoát</button>
                    )}
                </div>
            )}
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-[300px] px-2 lg:px-0">
            <div className="w-full h-[200px] lg:h-[300px] bg-slate-700 rounded-lg border-2 border-slate-600 flex flex-col shadow-xl"> <div className="bg-slate-900 p-2 text-center border-b border-slate-600"> <h3 className="text-yellow-500 font-bold text-sm uppercase">Biên Bản</h3> </div> <div className="flex-1 overflow-y-auto p-2 space-y-1"> {history.map((move, index) => ( <div key={index} className={`flex gap-2 text-xs cursor-pointer hover:bg-slate-600 p-1 rounded ${index === replayIndex - 1 && replayMode ? 'bg-yellow-800' : ''}`} onClick={() => replayMode && jumpToMove(index + 1)}> <span className="text-gray-500 w-5">{index + 1}.</span> <span className={`font-bold flex-1 ${move.turn === 'r' ? 'text-red-400' : 'text-white'}`}>{move.text}</span> {move.isCapture && <span className="text-yellow-500 text-[10px] bg-yellow-900/50 px-1 rounded">ĂN</span>} </div> ))} <div ref={historyEndRef} /> </div> </div>
            {gameMode === 'online' && gameId && <ChatBox messages={chatMessages} onSendMessage={handleSendMessage} myColor={playerColor} />}
          </div>

        </div>
      )}
    </div>
  )
}

export default App
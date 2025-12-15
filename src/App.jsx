import React, { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import Lobby from './components/Lobby'
import Timer from './components/Timer'
import ChatBox from './components/ChatBox'
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

  // STATE: CHẾ ĐỘ CHƠI
  const [gameMode, setGameMode] = useState('online'); 

  const INITIAL_GAME_TIME = 900;
  const INITIAL_MOVE_TIME = 120;
  const [redTime, setRedTime] = useState(INITIAL_GAME_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_GAME_TIME);
  const [currentMoveTime, setCurrentMoveTime] = useState(INITIAL_MOVE_TIME);
  const serverData = useRef({ redTime: INITIAL_GAME_TIME, blackTime: INITIAL_GAME_TIME, lastMoveTime: Date.now() });
  const historyEndRef = useRef(null);
  const [boardWidth, setBoardWidth] = useState(560);
  const [isMuted, setIsMuted] = useState(false);

  // --- LOGIC AI (MÁY ĐI) ---
  useEffect(() => {
    if (gameMode === 'ai' && !winner && turn === 'b') {
        const timer = setTimeout(() => {
            const move = getBestMove(pieces, 'b');
            if (move) {
                const pieceToMove = pieces.find(p => p.id === move.fromId);
                const isCapture = pieces.some(p => p.x === move.targetX && p.y === move.targetY);
                executeMove(pieceToMove, move.targetX, move.targetY, isCapture);
            } else {
                setWinner('r');
                setWinReason('checkmate');
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [turn, gameMode, winner, pieces]);

  // --- 1. LẮNG NGHE DỮ LIỆU TỪ SERVER ---
  useEffect(() => {
    if (!gameId || gameMode === 'ai') return;

    const docRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPieces(data.pieces);
        setTurn(data.turn);
        setHistory(data.history || []);
        setWinner(data.winner);
        if (data.chat) setChatMessages(data.chat);
        if (data.winReason) setWinReason(data.winReason);
        if (data.drawRequest && data.drawRequest !== playerColor && !data.winner) { setDrawReq(data.drawRequest); } else { setDrawReq(null); }
        serverData.current = { redTime: data.redTime !== undefined ? data.redTime : INITIAL_GAME_TIME, blackTime: data.blackTime !== undefined ? data.blackTime : INITIAL_GAME_TIME, lastMoveTime: data.lastMoveTime || Date.now() };
        syncTime();
        if (isCheck(data.pieces, data.turn)) setMessage(`⚠️ ${data.turn === 'r' ? 'ĐỎ' : 'ĐEN'} ĐANG CHIẾU TƯỚNG!`); else setMessage("");
      } else { 
        alert("Phòng không tồn tại!"); 
        leaveRoom(); 
      }
    });
    return () => unsubscribe();
  }, [gameId, playerColor, gameMode]);

  const syncTime = () => {
    if (!gameId || winner) return;
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

  const handlePlayAI = () => {
      setGameId("OFFLINE-AI"); 
      setGameMode('ai');
      setPlayerColor('r'); 
      setPieces(initialBoardState);
      setTurn('r');
      setWinner(null);
      setHistory([]);
      setMessage("");
      setRedTime(INITIAL_GAME_TIME);
      setBlackTime(INITIAL_GAME_TIME);
  };

  const resetGame = () => { 
      setPieces(initialBoardState); setTurn('r'); setWinner(null); setWinReason(null); setMessage(""); setSelectedPiece(null); setHistory([]); setChatMessages([]); setRedTime(INITIAL_GAME_TIME); setBlackTime(INITIAL_GAME_TIME); setCurrentMoveTime(INITIAL_MOVE_TIME); setDrawReq(null); 
      setGameMode('online'); setGameId(null); setPlayerColor(null);
  };
  
  const leaveRoom = () => { resetGame(); };

  const updateGameWinner = async (winnerColor, reason = "checkmate") => {
    if (gameMode === 'ai') {
        setWinner(winnerColor);
        setWinReason(reason);
        return;
    }
    if (gameId) { const gameRef = doc(db, "games", gameId); const gameSnap = await getDoc(gameRef); const gameData = gameSnap.data(); if (gameData.winner) return; await updateDoc(gameRef, { winner: winnerColor, winReason: reason, status: 'finished', drawRequest: null }); if (winnerColor === 'draw') return; if (winnerColor === playerColor && currentUser) { const myRef = doc(db, "users", currentUser.uid); await updateDoc(myRef, { wins: increment(1) }); const opponentId = winnerColor === 'r' ? gameData.blackPlayerId : gameData.redPlayerId; if (opponentId) { const opRef = doc(db, "users", opponentId); await updateDoc(opRef, { losses: increment(1) }); } } }
  };

  const handleCreateGame = async () => { if (!currentUser) return alert("Bạn cần đăng nhập!"); try { const docRef = await addDoc(collection(db, "games"), { pieces: initialBoardState, turn: 'r', history: [], chat: [], winner: null, winReason: null, drawRequest: null, redTime: INITIAL_GAME_TIME, blackTime: INITIAL_GAME_TIME, lastMoveTime: Date.now(), redPlayerId: currentUser.uid, redPlayerName: currentUser.displayName, status: 'waiting', createdAt: new Date() }); setGameId(docRef.id); setPlayerColor('r'); setGameMode('online'); alert(`Tạo phòng thành công!`); } catch (e) { console.error(e); alert("Lỗi tạo phòng!"); } };
  const handleJoinGame = async (idInput) => { if (!currentUser) return alert("Bạn cần đăng nhập!"); const cleanId = idInput.trim(); if (!cleanId) return; try { const docRef = doc(db, "games", cleanId); const docSnap = await getDoc(docRef); if (docSnap.exists()) { const gameData = docSnap.data(); if (gameData.blackPlayerId && gameData.blackPlayerId !== currentUser.uid) { alert("Phòng đã đủ người!"); return; } if (!gameData.blackPlayerId) { await updateDoc(docRef, { blackPlayerId: currentUser.uid, blackPlayerName: currentUser.displayName, status: 'playing' }); } setGameId(cleanId); setPlayerColor('b'); setGameMode('online'); } else { alert("Không tìm thấy phòng!"); } } catch (e) { console.error(e); alert("Lỗi kết nối!"); } };
  const handleSendMessage = async (text) => { if (!gameId || gameMode === 'ai') return; const senderName = currentUser ? currentUser.displayName : 'Khách'; const role = (playerColor === 'r' || playerColor === 'b') ? playerColor : 'spectator'; const newMessage = { sender: role, senderName: senderName, text: text, timestamp: Date.now() }; await updateDoc(doc(db, "games", gameId), { chat: [...chatMessages, newMessage] }); };
  const handleDrawRequest = async () => { if (!gameId || winner || gameMode === 'ai') return; if (window.confirm("Bạn muốn gửi yêu cầu HÒA cho đối thủ?")) { const gameRef = doc(db, "games", gameId); await updateDoc(gameRef, { drawRequest: playerColor }); alert("Đã gửi yêu cầu! Vui lòng chờ đối thủ phản hồi."); } };
  const handleAcceptDraw = () => { updateGameWinner('draw', 'draw'); setDrawReq(null); };
  const handleRejectDraw = async () => { if (!gameId || gameMode === 'ai') return; const gameRef = doc(db, "games", gameId); await updateDoc(gameRef, { drawRequest: null }); setDrawReq(null); };

  // --- HÀM CẬP NHẬT TRẠNG THÁI (ĐÃ BỔ SUNG) ---
  const updateGameState = async (newPieces, currentTurnPlaying, newHistoryEntry = null) => {
    const nextTurn = currentTurnPlaying === 'r' ? 'b' : 'r';
    
    if (isGameOver(newPieces, nextTurn)) {
        updateGameWinner(currentTurnPlaying, 'checkmate');
    }

    if (gameMode === 'ai') {
        setPieces(newPieces);
        setTurn(nextTurn);
        if (newHistoryEntry) setHistory(prev => [...prev, newHistoryEntry]);
        if (isCheck(newPieces, nextTurn)) setMessage(`⚠️ ${nextTurn === 'r' ? 'ĐỎ' : 'ĐEN'} ĐANG CHIẾU TƯỚNG!`);
        else setMessage("");
        return;
    }

    if (gameId) {
      const updateData = { pieces: newPieces, turn: nextTurn, redTime: redTime, blackTime: blackTime, lastMoveTime: Date.now() };
      if (newHistoryEntry) updateData.history = [...history, newHistoryEntry];
      await updateDoc(doc(db, "games", gameId), updateData);
    }
  };

  const createMoveLog = (piece, targetX, targetY) => { const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']; return `${['Xe','Mã','Tượng','Sĩ','Tướng','Pháo','Tốt'][['r','n','b','a','k','c','p'].indexOf(piece.type)]} (${letters[piece.x]}${9-piece.y} → ${letters[targetX]}${9-targetY})`; };
  
  // --- HÀM PHÁT ÂM THANH (ĐÃ BỔ SUNG) ---
  const playSound = (type) => {
    if (isMuted) return;
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(() => {});
  };

  const executeMove = (piece, targetX, targetY, isCapture) => { 
      const moveText = createMoveLog(piece, targetX, targetY); 
      const newHistoryEntry = { turn: turn, text: moveText, isCapture: isCapture }; 
      playSound(isCapture ? 'capture' : 'move'); 
      let newPieces; 
      if (isCapture) { 
          newPieces = pieces.filter(p => !(p.x === targetX && p.y === targetY)).map(p => { if (p.id === piece.id) return { ...p, x: targetX, y: targetY }; return p; }); 
      } else { 
          newPieces = pieces.map(p => { if (p.id === piece.id) return { ...p, x: targetX, y: targetY }; return p; }); 
      } 
      updateGameState(newPieces, turn, newHistoryEntry); 
      setSelectedPiece(null); 
  };

  const handlePieceClick = (targetPiece) => { if (winner) return; if (playerColor === 'spectator') return; if (gameId && gameMode === 'online') { if (turn !== playerColor) return; if (!selectedPiece && targetPiece.color !== playerColor) return; if (selectedPiece && targetPiece.color !== playerColor && turn !== playerColor) return; } if (gameMode === 'ai' && turn !== 'r') return; 
    if (!selectedPiece) { if (targetPiece.color !== turn) return; setSelectedPiece(targetPiece); return; } if (targetPiece.id === selectedPiece.id) { setSelectedPiece(null); return; } if (targetPiece.color === selectedPiece.color) { if (targetPiece.color === turn) setSelectedPiece(targetPiece); return; } if (!isValidMove(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return; if (willCauseSelfCheck(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return; executeMove(selectedPiece, targetPiece.x, targetPiece.y, true); };
  
  const handleSquareClick = (x, y) => { if (winner) return; if (playerColor === 'spectator') return; if (gameId && gameMode === 'online' && turn !== playerColor) return; if (gameMode === 'ai' && turn !== 'r') return; if (!selectedPiece) return; if (!isValidMove(selectedPiece, x, y, pieces)) return; if (willCauseSelfCheck(selectedPiece, x, y, pieces)) return; executeMove(selectedPiece, x, y, false); };
  
  useEffect(() => { const handleResize = () => { const maxWidth = Math.min(window.innerWidth - 20, 560); setBoardWidth(maxWidth); }; window.addEventListener('resize', handleResize); handleResize(); return () => window.removeEventListener('resize', handleResize); }, []);

  return (
    <div className="min-h-screen bg-slate-800 font-sans flex flex-col items-center py-5">
      <div className="flex items-center justify-between w-full max-w-4xl px-4 mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-yellow-500 tracking-widest drop-shadow-md">KỲ VƯƠNG ONLINE</h1>
          <button onClick={() => setIsMuted(!isMuted)} className="bg-slate-700 p-2 rounded-full border border-slate-500 hover:bg-slate-600 transition-colors shadow-lg">
            {isMuted ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 21 13.5m0 0-3.75 3.75M21 13.5H3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="yellow" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>}
          </button>
      </div>

      {!gameId ? (
        <Lobby onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} user={userStats || currentUser} onLogin={handleLogin} onPlayAI={handlePlayAI} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start animate-fade-in w-full max-w-6xl px-2">
          
          <div className="relative flex flex-col items-center">
            <div className="mb-2 flex flex-wrap justify-between items-center w-full" style={{ maxWidth: boardWidth }}>
                <div className="flex flex-col items-center w-20"> <div className="flex items-center gap-1 mb-1"> <div className="w-2 h-2 bg-black rounded-full border border-gray-500"></div> <Timer time={blackTime} isActive={turn === 'b' && !winner && gameMode !== 'ai'} /> </div> {turn === 'b' && !winner && gameMode !== 'ai' && <div className="text-red-400 font-mono font-bold text-[10px] animate-pulse">({currentMoveTime}s)</div>} </div>
                <div className="flex flex-col items-center gap-1 flex-1"> 
                    <div className="px-3 py-1 rounded bg-slate-700 text-white border border-slate-600 shadow text-xs"> 
                        {gameMode === 'ai' ? 'CHẾ ĐỘ LUYỆN TẬP (AI)' : `Phòng: ${gameId}`}
                    </div> 
                    <div className={`px-3 py-1 rounded font-bold text-xs border ${playerColor === 'r' ? 'bg-red-900 text-red-100 border-red-500' : playerColor === 'b' ? 'bg-black text-gray-300 border-gray-600' : 'bg-blue-900 text-blue-200 border-blue-500'}`}> {playerColor === 'r' ? 'BẠN LÀ ĐỎ' : playerColor === 'b' ? 'BẠN LÀ ĐEN' : 'BẠN LÀ KHÁN GIẢ'} </div> 
                </div>
                <div className="flex flex-col items-center w-20"> <div className="flex items-center gap-1 mb-1"> <Timer time={redTime} isActive={turn === 'r' && !winner && gameMode !== 'ai'} /> <div className="w-2 h-2 bg-red-600 rounded-full border border-red-300"></div> </div> {turn === 'r' && !winner && gameMode !== 'ai' && <div className="text-red-400 font-mono font-bold text-[10px] animate-pulse">({currentMoveTime}s)</div>} </div>
            </div>

            {message && !winner && <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-2xl animate-bounce font-bold border-2 border-yellow-400 z-50 text-sm whitespace-nowrap">{message}</div>}
            {drawReq && !winner && gameMode !== 'ai' && <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white p-4 rounded-xl border-2 border-yellow-500 shadow-2xl z-50 flex flex-col items-center gap-3 animate-bounce w-64"> <h3 className="font-bold text-yellow-400 text-center">🤝 CẦU HÒA?</h3> <div className="flex gap-2 w-full"> <button onClick={handleAcceptDraw} className="flex-1 bg-green-600 py-1 rounded text-sm">OK</button> <button onClick={handleRejectDraw} className="flex-1 bg-red-600 py-1 rounded text-sm">Hủy</button> </div> </div>}
            {winner && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] rounded-lg text-center p-4"> <h2 className={`text-4xl md:text-6xl font-bold mb-4 ${winner === 'draw' ? 'text-gray-300' : (winner === 'r' ? 'text-red-500' : 'text-white')}`}>{winner === 'draw' ? 'HÒA CỜ!' : (winner === 'r' ? 'ĐỎ THẮNG!' : 'ĐEN THẮNG!')}</h2> <p className="text-yellow-400 text-lg mb-6 font-mono">{winReason === 'checkmate' && "(Chiếu bí)"} {winReason === 'timeout' && "(Hết giờ tổng)"} {winReason === 'timeout_move' && "(Quá thời gian nước đi)"} {winReason === 'resign' && "(Đối thủ xin thua)"} {winReason === 'draw' && "(Đồng ý hòa)"}</p> <button onClick={leaveRoom} className="px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400">Thoát Phòng</button> </div>}

            <Board pieces={pieces} onPieceClick={handlePieceClick} onSquareClick={handleSquareClick} selectedPiece={selectedPiece} isFlipped={playerColor === 'b'} boardWidth={boardWidth} />

            {!winner && (
                <div className="flex gap-2 mt-4 w-full justify-center" style={{ maxWidth: boardWidth }}>
                    {/* NÚT CHỨC NĂNG (Ẩn Cầu Hòa khi chơi với AI) */}
                    <button onClick={() => { if (window.confirm("Xin thua?")) { const opponent = playerColor === 'r' ? 'b' : 'r'; updateGameWinner(opponent, 'resign'); } }} className="flex-1 bg-red-900/80 hover:bg-red-800 text-red-100 font-bold py-2 rounded border border-red-700 text-sm">🏳️ Xin Thua</button>
                    {gameMode !== 'ai' && <button onClick={handleDrawRequest} className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-2 rounded border border-slate-500 text-sm">🤝 Cầu Hòa</button>}
                </div>
            )}
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-[300px] px-2 lg:px-0">
            <div className="w-full h-[200px] lg:h-[300px] bg-slate-700 rounded-lg border-2 border-slate-600 flex flex-col shadow-xl"> <div className="bg-slate-900 p-2 text-center border-b border-slate-600"> <h3 className="text-yellow-500 font-bold text-sm uppercase">Biên Bản</h3> </div> <div className="flex-1 overflow-y-auto p-2 space-y-1"> {history.map((move, index) => ( <div key={index} className="flex gap-2 text-xs"> <span className="text-gray-500 w-5">{index + 1}.</span> <span className={`font-bold flex-1 ${move.turn === 'r' ? 'text-red-400' : 'text-white'}`}>{move.text}</span> {move.isCapture && <span className="text-yellow-500 text-[10px] bg-yellow-900/50 px-1 rounded">ĂN</span>} </div> ))} <div ref={historyEndRef} /> </div> </div>
            {gameMode === 'online' && gameId && <ChatBox messages={chatMessages} onSendMessage={handleSendMessage} myColor={playerColor} />}
          </div>

        </div>
      )}
    </div>
  )
}

export default App
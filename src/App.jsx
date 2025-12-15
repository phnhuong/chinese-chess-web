import React, { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import Lobby from './components/Lobby'
import Timer from './components/Timer'
import ChatBox from './components/ChatBox'
import { initialBoardState } from './utils/initialState'
import { isValidMove, isCheck, willCauseSelfCheck, isGameOver } from './utils/rules'
import { db, auth, googleProvider } from './firebase';
import { collection, addDoc, doc, getDoc, onSnapshot, updateDoc, setDoc, increment } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";

function App() {
  const [pieces, setPieces] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [turn, setTurn] = useState('r');
  const [message, setMessage] = useState(""); 
  const [winner, setWinner] = useState(null);
  const [history, setHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [gameId, setGameId] = useState(null); 
  const [playerColor, setPlayerColor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const INITIAL_GAME_TIME = 900;
  const INITIAL_MOVE_TIME = 120;
  const [redTime, setRedTime] = useState(INITIAL_GAME_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_GAME_TIME);
  const [currentMoveTime, setCurrentMoveTime] = useState(INITIAL_MOVE_TIME);
  const serverData = useRef({ redTime: INITIAL_GAME_TIME, blackTime: INITIAL_GAME_TIME, lastMoveTime: Date.now() });
  const historyEndRef = useRef(null);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, email: user.email, wins: 0, losses: 0, joinedAt: new Date() });
      }
      setCurrentUser(user);
    } catch (error) { console.error(error); alert("Đăng nhập thất bại!"); }
  };

  useEffect(() => {
    if (currentUser) {
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (doc) => { if(doc.exists()) setUserStats(doc.data()); });
        return () => unsub();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!gameId) return;
    const unsubscribe = onSnapshot(doc(db, "games", gameId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPieces(data.pieces);
        setTurn(data.turn);
        setHistory(data.history || []);
        setWinner(data.winner);
        if (data.chat) setChatMessages(data.chat);
        
        serverData.current = {
          redTime: data.redTime !== undefined ? data.redTime : INITIAL_GAME_TIME,
          blackTime: data.blackTime !== undefined ? data.blackTime : INITIAL_GAME_TIME,
          lastMoveTime: data.lastMoveTime || Date.now()
        };
        syncTime();
        if (isCheck(data.pieces, data.turn)) setMessage(`⚠️ ${data.turn === 'r' ? 'ĐỎ' : 'ĐEN'} ĐANG CHIẾU TƯỚNG!`);
        else setMessage("");
      } else { alert("Phòng không tồn tại!"); leaveRoom(); }
    });
    return () => unsubscribe();
  }, [gameId]);

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
    const interval = setInterval(() => { syncTime(); }, 1000);
    return () => clearInterval(interval);
  }, [gameId, winner, turn]);

  useEffect(() => {
    if (gameId && !winner && turn === playerColor) {
      if ((playerColor === 'r' && redTime <= 0) || (playerColor === 'b' && blackTime <= 0)) updateGameWinner(playerColor === 'r' ? 'b' : 'r');
      if (currentMoveTime <= 0) updateGameWinner(playerColor === 'r' ? 'b' : 'r');
    }
  }, [redTime, blackTime, currentMoveTime, gameId, winner, turn, playerColor]);

  const updateGameWinner = async (winnerColor) => {
    if (gameId) {
      const gameRef = doc(db, "games", gameId);
      const gameSnap = await getDoc(gameRef);
      const gameData = gameSnap.data();
      if (gameData.winner) return;

      // Cập nhật winner và status về 'finished' (nếu muốn lọc bỏ phòng đã chơi xong)
      await updateDoc(gameRef, { winner: winnerColor, status: 'finished' });

      if (winnerColor === playerColor && currentUser) {
          const myRef = doc(db, "users", currentUser.uid);
          await updateDoc(myRef, { wins: increment(1) });
          const opponentId = winnerColor === 'r' ? gameData.blackPlayerId : gameData.redPlayerId;
          if (opponentId) {
              const opRef = doc(db, "users", opponentId);
              await updateDoc(opRef, { losses: increment(1) });
          }
      }
    }
  };

  useEffect(() => { historyEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);
  const playSound = (type) => { const audio = new Audio(`/sounds/${type}.mp3`); audio.play().catch(() => {}); };
  const resetGame = () => { setPieces(initialBoardState); setTurn('r'); setWinner(null); setMessage(""); setSelectedPiece(null); setHistory([]); setChatMessages([]); setRedTime(INITIAL_GAME_TIME); setBlackTime(INITIAL_GAME_TIME); setCurrentMoveTime(INITIAL_MOVE_TIME); };
  const leaveRoom = () => { setGameId(null); setPlayerColor(null); resetGame(); };

  // --- HANDLE CREATE GAME (STATUS: WAITING) ---
  const handleCreateGame = async () => {
    if (!currentUser) return alert("Bạn cần đăng nhập!");
    try {
      const docRef = await addDoc(collection(db, "games"), {
        pieces: initialBoardState,
        turn: 'r',
        history: [],
        chat: [],
        winner: null,
        redTime: INITIAL_GAME_TIME,
        blackTime: INITIAL_GAME_TIME,
        lastMoveTime: Date.now(),
        redPlayerId: currentUser.uid,
        redPlayerName: currentUser.displayName,
        status: 'waiting', // TRẠNG THÁI CHỜ
        createdAt: new Date()
      });
      setGameId(docRef.id);
      setPlayerColor('r');
      alert(`Tạo phòng thành công!`);
    } catch (e) { console.error(e); alert("Lỗi tạo phòng!"); }
  };

  // --- HANDLE JOIN GAME (STATUS: PLAYING) ---
  const handleJoinGame = async (idInput) => {
    if (!currentUser) return alert("Bạn cần đăng nhập!");
    const cleanId = idInput.trim();
    if (!cleanId) return;
    try {
      const docRef = doc(db, "games", cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const gameData = docSnap.data();
        if (gameData.blackPlayerId && gameData.blackPlayerId !== currentUser.uid) {
            alert("Phòng đã đủ người!"); return;
        }
        if (!gameData.blackPlayerId) {
            await updateDoc(docRef, {
                blackPlayerId: currentUser.uid,
                blackPlayerName: currentUser.displayName,
                status: 'playing' // CẬP NHẬT TRẠNG THÁI ĐANG CHƠI
            });
        }
        setGameId(cleanId);
        setPlayerColor('b');
      } else { alert("Không tìm thấy phòng!"); }
    } catch (e) { console.error(e); alert("Lỗi kết nối!"); }
  };

  const handleSendMessage = async (text) => {
    if (!gameId) return;
    const senderName = currentUser ? currentUser.displayName : (playerColor === 'r' ? 'Đỏ' : 'Đen');
    const newMessage = { sender: playerColor, senderName: senderName, text: text, timestamp: Date.now() };
    await updateDoc(doc(db, "games", gameId), { chat: [...chatMessages, newMessage] });
  };

  const updateGameState = async (newPieces, currentTurnPlaying, newHistoryEntry = null) => {
    const nextTurn = currentTurnPlaying === 'r' ? 'b' : 'r';
    let newWinner = null;
    if (isGameOver(newPieces, nextTurn)) { newWinner = currentTurnPlaying; updateGameWinner(currentTurnPlaying); }

    if (gameId) {
      const updateData = { pieces: newPieces, turn: nextTurn, winner: newWinner, redTime: redTime, blackTime: blackTime, lastMoveTime: Date.now() };
      if (newHistoryEntry) updateData.history = [...history, newHistoryEntry];
      await updateDoc(doc(db, "games", gameId), updateData);
    } else {
      setPieces(newPieces); setTurn(nextTurn); serverData.current.lastMoveTime = Date.now(); 
      if (newHistoryEntry) setHistory(prev => [...prev, newHistoryEntry]);
      if (isCheck(newPieces, nextTurn)) setMessage(`⚠️ ${nextTurn === 'r' ? 'ĐỎ' : 'ĐEN'} ĐANG CHIẾU TƯỚNG!`); else setMessage("");
    }
  };

  const createMoveLog = (piece, targetX, targetY) => { const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']; return `${['Xe','Mã','Tượng','Sĩ','Tướng','Pháo','Tốt'][['r','n','b','a','k','c','p'].indexOf(piece.type)]} (${letters[piece.x]}${9-piece.y} → ${letters[targetX]}${9-targetY})`; };
  const executeMove = (piece, targetX, targetY, isCapture) => { const moveText = createMoveLog(piece, targetX, targetY); const newHistoryEntry = { turn: turn, text: moveText, isCapture: isCapture }; playSound(isCapture ? 'capture' : 'move'); let newPieces; if (isCapture) { newPieces = pieces.filter(p => !(p.x === targetX && p.y === targetY)).map(p => { if (p.id === piece.id) return { ...p, x: targetX, y: targetY }; return p; }); } else { newPieces = pieces.map(p => { if (p.id === piece.id) return { ...p, x: targetX, y: targetY }; return p; }); } updateGameState(newPieces, turn, newHistoryEntry); setSelectedPiece(null); };
  const handlePieceClick = (targetPiece) => { if (winner) return; if (gameId) { if (turn !== playerColor) return; if (!selectedPiece && targetPiece.color !== playerColor) return; if (selectedPiece && targetPiece.color !== playerColor && turn !== playerColor) return; } if (!selectedPiece) { if (targetPiece.color !== turn) return; setSelectedPiece(targetPiece); return; } if (targetPiece.id === selectedPiece.id) { setSelectedPiece(null); return; } if (targetPiece.color === selectedPiece.color) { if (targetPiece.color === turn) setSelectedPiece(targetPiece); return; } if (!isValidMove(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return; if (willCauseSelfCheck(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return; executeMove(selectedPiece, targetPiece.x, targetPiece.y, true); };
  const handleSquareClick = (x, y) => { if (winner) return; if (!selectedPiece) return; if (gameId && turn !== playerColor) return; if (!isValidMove(selectedPiece, x, y, pieces)) return; if (willCauseSelfCheck(selectedPiece, x, y, pieces)) return; executeMove(selectedPiece, x, y, false); };

  return (
    <div className="min-h-screen bg-slate-800 font-sans flex flex-col items-center py-5">
      <h1 className="text-4xl font-bold text-yellow-500 mb-4 tracking-widest drop-shadow-md">KỲ VƯƠNG ONLINE</h1>
      {!gameId ? (
        <Lobby onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} user={userStats || currentUser} onLogin={handleLogin} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in">
          <div className="relative">
            <div className="mb-4 flex justify-between items-center w-[560px]">
                <div className="flex flex-col items-center w-24"> <div className="flex items-center gap-2 mb-1"> <div className="w-3 h-3 bg-black rounded-full border border-gray-500"></div> <Timer time={blackTime} isActive={turn === 'b' && !winner} /> </div> {turn === 'b' && !winner && <div className="text-red-400 font-mono font-bold text-sm animate-pulse">(Còn {currentMoveTime}s)</div>} </div>
                <div className="flex flex-col items-center gap-1 flex-1"> <div className="px-4 py-1 rounded bg-slate-700 text-white border border-slate-600 shadow text-xs"> Phòng: <span className="text-yellow-400 font-mono font-bold select-all">{gameId}</span> </div> <div className={`px-4 py-1 rounded font-bold text-xs border ${playerColor === 'r' ? 'bg-red-900 text-red-100 border-red-500' : 'bg-black text-gray-300 border-gray-600'}`}> Bạn: {currentUser ? currentUser.displayName : (playerColor === 'r' ? 'ĐỎ' : 'ĐEN')} </div> </div>
                <div className="flex flex-col items-center w-24"> <div className="flex items-center gap-2 mb-1"> <Timer time={redTime} isActive={turn === 'r' && !winner} /> <div className="w-3 h-3 bg-red-600 rounded-full border border-red-300"></div> </div> {turn === 'r' && !winner && <div className="text-red-400 font-mono font-bold text-sm animate-pulse">(Còn {currentMoveTime}s)</div>} </div>
            </div>
            {message && !winner && <div className="absolute top-36 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-lg shadow-2xl animate-bounce font-bold border-4 border-yellow-400 z-50 text-xl whitespace-nowrap">{message}</div>}
            {winner && <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] rounded-lg text-center p-10"> <h2 className={`text-6xl font-bold mb-4 ${winner === 'r' ? 'text-red-500' : 'text-white'}`}>{winner === 'r' ? 'ĐỎ THẮNG!' : 'ĐEN THẮNG!'}</h2> {(winner === 'r' && blackTime <= 0) || (winner === 'b' && redTime <= 0) ? <p className="text-yellow-400 text-xl mb-8">(Hết giờ tổng)</p> : (winner === 'r' && currentMoveTime <= 0 && turn === 'b') || (winner === 'b' && currentMoveTime <= 0 && turn === 'r') ? <p className="text-yellow-400 text-xl mb-8">(Quá thời gian nước đi)</p> : <p className="text-gray-400 text-xl mb-8">(Chiếu bí)</p>} <button onClick={leaveRoom} className="px-8 py-3 bg-yellow-500 text-black font-bold text-2xl rounded-lg hover:bg-yellow-400 transition-colors shadow-lg">Thoát Phòng</button> </div>}
            <Board pieces={pieces} onPieceClick={handlePieceClick} onSquareClick={handleSquareClick} selectedPiece={selectedPiece} isFlipped={playerColor === 'b'} />
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-[300px] h-[300px] bg-slate-700 rounded-lg border-2 border-slate-600 flex flex-col shadow-xl"> <div className="bg-slate-900 p-2 text-center border-b border-slate-600"> <h3 className="text-yellow-500 font-bold text-lg uppercase">Biên Bản</h3> </div> <div className="flex-1 overflow-y-auto p-4 space-y-2"> {history.length === 0 ? <p className="text-gray-500 text-center italic mt-10">Chưa có nước đi nào...</p> : history.map((move, index) => ( <div key={index} className="flex gap-2 text-sm"> <span className="text-gray-500 w-6">{index + 1}.</span> <span className={`font-bold flex-1 ${move.turn === 'r' ? 'text-red-400' : 'text-white'}`}>{move.text}</span> {move.isCapture && <span className="text-yellow-500 text-xs bg-yellow-900/50 px-1 rounded">ĂN</span>} </div> ))} <div ref={historyEndRef} /> </div> </div>
            {gameId && <ChatBox messages={chatMessages} onSendMessage={handleSendMessage} myColor={playerColor} />}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
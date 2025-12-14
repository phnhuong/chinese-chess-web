import React, { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import Lobby from './components/Lobby'
import { initialBoardState } from './utils/initialState'
import { isValidMove, isCheck, willCauseSelfCheck, isGameOver } from './utils/rules'
import { db } from './firebase';
import { collection, addDoc, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";

function App() {
  const [pieces, setPieces] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [turn, setTurn] = useState('r');
  const [message, setMessage] = useState(""); 
  const [winner, setWinner] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [gameId, setGameId] = useState(null); 
  const [playerColor, setPlayerColor] = useState(null);

  const historyEndRef = useRef(null);

  useEffect(() => {
    if (!gameId) return;
    const docRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPieces(data.pieces);
        setTurn(data.turn);
        setHistory(data.history || []);
        setWinner(data.winner);
        if (isCheck(data.pieces, data.turn)) {
           setMessage(`⚠️ ${data.turn === 'r' ? 'ĐỎ' : 'ĐEN'} ĐANG CHIẾU TƯỚNG!`);
        } else {
           setMessage("");
        }
      } else {
        alert("Phòng không tồn tại!");
        setGameId(null);
        setPlayerColor(null);
        resetGame();
      }
    });
    return () => unsubscribe();
  }, [gameId]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const playSound = (type) => {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(() => {});
  };

  const resetGame = () => {
    setPieces(initialBoardState);
    setTurn('r');
    setWinner(null);
    setMessage("");
    setSelectedPiece(null);
    setHistory([]);
  };

  const leaveRoom = () => {
    setGameId(null);
    setPlayerColor(null);
    resetGame();
  };

  const handleCreateGame = async () => {
    try {
      const docRef = await addDoc(collection(db, "games"), {
        pieces: initialBoardState,
        turn: 'r',
        history: [],
        winner: null,
        createdAt: new Date()
      });
      setGameId(docRef.id);
      setPlayerColor('r');
      alert(`Tạo phòng thành công!\nMã: ${docRef.id}`);
    } catch (e) {
      console.error(e);
      alert("Lỗi tạo phòng!");
    }
  };

  const handleJoinGame = async (idInput) => {
    const cleanId = idInput.trim();
    if (!cleanId) return;
    try {
      const docRef = doc(db, "games", cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setGameId(cleanId);
        setPlayerColor('b');
      } else {
        alert("Không tìm thấy phòng!");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối!");
    }
  };

  const updateGameState = async (newPieces, currentTurnPlaying, newHistoryEntry = null) => {
    const nextTurn = currentTurnPlaying === 'r' ? 'b' : 'r';
    let newWinner = null;
    if (isGameOver(newPieces, nextTurn)) {
      newWinner = currentTurnPlaying;
    }

    if (gameId) {
      const gameRef = doc(db, "games", gameId);
      const updateData = {
        pieces: newPieces,
        turn: nextTurn,
        winner: newWinner
      };
      if (newHistoryEntry) {
        updateData.history = [...history, newHistoryEntry];
      }
      await updateDoc(gameRef, updateData);
    } else {
      setPieces(newPieces);
      setTurn(nextTurn);
      if (newHistoryEntry) setHistory(prev => [...prev, newHistoryEntry]);
      if (newWinner) setWinner(newWinner);
      
      if (isCheck(newPieces, nextTurn)) {
         setMessage(`⚠️ ${nextTurn === 'r' ? 'ĐỎ' : 'ĐEN'} ĐANG CHIẾU TƯỚNG!`);
      } else {
         setMessage("");
      }
    }
  };

  const createMoveLog = (piece, targetX, targetY) => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    const fromLabel = `${letters[piece.x]}${9 - piece.y}`;
    const toLabel = `${letters[targetX]}${9 - targetY}`;
    const pieceNames = { r: 'Xe', n: 'Mã', b: 'Tượng', a: 'Sĩ', k: 'Tướng', c: 'Pháo', p: 'Tốt' };
    return `${pieceNames[piece.type]} (${fromLabel} → ${toLabel})`;
  };

  const executeMove = (piece, targetX, targetY, isCapture) => {
    const moveText = createMoveLog(piece, targetX, targetY);
    const newHistoryEntry = { 
      turn: turn, 
      text: moveText, 
      isCapture: isCapture 
    };

    playSound(isCapture ? 'capture' : 'move');

    let newPieces;
    if (isCapture) {
      newPieces = pieces.filter(p => !(p.x === targetX && p.y === targetY)).map(p => {
          if (p.id === piece.id) return { ...p, x: targetX, y: targetY };
          return p;
        });
    } else {
      newPieces = pieces.map(p => {
        if (p.id === piece.id) return { ...p, x: targetX, y: targetY };
        return p;
      });
    }

    updateGameState(newPieces, turn, newHistoryEntry);
    setSelectedPiece(null);
  };

  const handlePieceClick = (targetPiece) => {
    if (winner) return;

    if (gameId) {
        if (turn !== playerColor) return;
        if (!selectedPiece && targetPiece.color !== playerColor) return;
    }

    if (!selectedPiece) {
      if (targetPiece.color !== turn) return; 
      setSelectedPiece(targetPiece);
      return;
    }

    if (targetPiece.id === selectedPiece.id) {
      setSelectedPiece(null);
      return;
    }
    if (targetPiece.color === selectedPiece.color) {
      if (targetPiece.color === turn) setSelectedPiece(targetPiece);
      return;
    }

    if (!isValidMove(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return;
    if (willCauseSelfCheck(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return;

    executeMove(selectedPiece, targetPiece.x, targetPiece.y, true);
  };

  const handleSquareClick = (x, y) => {
    if (winner) return;
    if (!selectedPiece) return;

    if (gameId && turn !== playerColor) return;

    if (!isValidMove(selectedPiece, x, y, pieces)) return;
    if (willCauseSelfCheck(selectedPiece, x, y, pieces)) return;

    executeMove(selectedPiece, x, y, false);
  };

  return (
    <div className="min-h-screen bg-slate-800 font-sans flex flex-col items-center py-5">
      <h1 className="text-4xl font-bold text-yellow-500 mb-4 tracking-widest drop-shadow-md">
        KỲ VƯƠNG ONLINE
      </h1>

      {!gameId ? (
        <Lobby onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in">
          
          <div className="relative">
            <div className="mb-4 flex justify-between items-center w-[560px]">
                <div className="px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 shadow text-sm">
                   Phòng: <span className="text-yellow-400 font-mono font-bold select-all">{gameId}</span>
                </div>
                <div className={`px-4 py-2 rounded font-bold border ${playerColor === 'r' ? 'bg-red-900 text-red-100 border-red-500' : 'bg-black text-gray-300 border-gray-600'}`}>
                   Bạn cầm: {playerColor === 'r' ? 'ĐỎ' : 'ĐEN'}
                </div>
                <button onClick={leaveRoom} className="text-xs text-red-400 hover:underline">Thoát</button>
            </div>

            <div className="mb-4 px-6 py-2 rounded-full bg-slate-700 border border-slate-600 flex justify-center items-center gap-3 shadow-lg">
                <span className="text-gray-300">Đang đi:</span>
                <span className={`font-bold text-lg px-4 py-1 rounded ${turn === 'r' ? 'bg-red-600 text-white' : 'bg-black text-white border border-gray-500'}`}>
                {turn === 'r' ? 'QUÂN ĐỎ' : 'QUÂN ĐEN'}
                </span>
            </div>

            {message && !winner && (
                <div className="absolute top-36 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-lg shadow-2xl animate-bounce font-bold border-4 border-yellow-400 z-50 text-xl whitespace-nowrap">
                {message}
                </div>
            )}

            {winner && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] rounded-lg">
                <h2 className={`text-6xl font-bold mb-8 ${winner === 'r' ? 'text-red-500' : 'text-white'}`}>
                    {winner === 'r' ? 'ĐỎ THẮNG!' : 'ĐEN THẮNG!'}
                </h2>
                <button onClick={leaveRoom} className="px-8 py-3 bg-yellow-500 text-black font-bold text-2xl rounded-lg hover:bg-yellow-400 transition-colors shadow-lg">
                    Thoát Phòng
                </button>
                </div>
            )}

            <Board 
                pieces={pieces} 
                onPieceClick={handlePieceClick} 
                onSquareClick={handleSquareClick}
                selectedPiece={selectedPiece}
                // DÒNG NÀY ĐỂ KÍCH HOẠT XOAY BÀN CỜ
                isFlipped={playerColor === 'b'} 
            />
          </div>

          <div className="w-[300px] h-[610px] bg-slate-700 rounded-lg border-2 border-slate-600 flex flex-col shadow-xl">
            <div className="bg-slate-900 p-3 text-center border-b border-slate-600">
                <h3 className="text-yellow-500 font-bold text-xl uppercase">Biên Bản</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {history.length === 0 ? (
                <p className="text-gray-500 text-center italic mt-10">Chưa có nước đi nào...</p>
                ) : (
                history.map((move, index) => (
                    <div key={index} className="flex gap-2 text-sm">
                    <span className="text-gray-500 w-6">{index + 1}.</span>
                    <span className={`font-bold flex-1 ${move.turn === 'r' ? 'text-red-400' : 'text-white'}`}>
                        {move.text}
                    </span>
                    {move.isCapture && <span className="text-yellow-500 text-xs bg-yellow-900/50 px-1 rounded">ĂN</span>}
                    </div>
                ))
                )}
                <div ref={historyEndRef} />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default App
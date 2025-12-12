import React, { useState } from 'react'
import Board from './components/Board'
import { initialBoardState } from './utils/initialState'
// IMPORT THÊM willCauseSelfCheck
import { isValidMove, isCheck, willCauseSelfCheck } from './utils/rules'

function App() {
  const [pieces, setPieces] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [turn, setTurn] = useState('r');
  const [message, setMessage] = useState(""); 

  // Hàm cập nhật chung sau khi đi quân
  const updateGameState = (newPieces, currentTurnPlaying) => {
    setPieces(newPieces);
    setSelectedPiece(null);
    
    const nextTurn = currentTurnPlaying === 'r' ? 'b' : 'r';
    setTurn(nextTurn);

    if (isCheck(newPieces, currentTurnPlaying)) {
      setMessage(`⚠️ ${currentTurnPlaying === 'r' ? 'ĐỎ' : 'ĐEN'} ĐANG CHIẾU TƯỚNG!`);
    } else {
      setMessage("");
    }
  };

  const handlePieceClick = (targetPiece) => {
    // 1. Chọn quân
    if (!selectedPiece) {
      if (targetPiece.color !== turn) return; 
      setSelectedPiece(targetPiece);
      return;
    }

    // 2. Bỏ chọn / Chọn lại
    if (targetPiece.id === selectedPiece.id) {
      setSelectedPiece(null);
      return;
    }
    if (targetPiece.color === selectedPiece.color) {
      if (targetPiece.color === turn) setSelectedPiece(targetPiece);
      return;
    }

    // 3. ĂN QUÂN (Capture)
    
    // Check 1: Luật di chuyển cơ bản
    const canMove = isValidMove(selectedPiece, targetPiece.x, targetPiece.y, pieces);
    if (!canMove) return;

    // Check 2: (MỚI) Không được đi nước làm Tướng mình bị chiếu
    if (willCauseSelfCheck(selectedPiece, targetPiece.x, targetPiece.y, pieces)) {
        console.log("Không được! Nước đi này khiến Tướng bị chiếu.");
        // Bạn có thể thêm thông báo UI ở đây nếu thích
        return; 
    }

    // Thực hiện ăn quân
    const newPieces = pieces
      .filter(p => p.id !== targetPiece.id)
      .map(p => {
        if (p.id === selectedPiece.id) {
          return { ...p, x: targetPiece.x, y: targetPiece.y };
        }
        return p;
      });
    
    updateGameState(newPieces, turn);
  };

  const handleSquareClick = (x, y) => {
    // DI CHUYỂN (Move)
    if (!selectedPiece) return;

    // Check 1: Luật di chuyển cơ bản
    const canMove = isValidMove(selectedPiece, x, y, pieces);
    if (!canMove) return;

    // Check 2: (MỚI) Không được đi nước làm Tướng mình bị chiếu
    if (willCauseSelfCheck(selectedPiece, x, y, pieces)) {
        console.log("Không được! Nước đi này khiến Tướng bị chiếu.");
        return;
    }

    // Thực hiện di chuyển
    const newPieces = pieces.map(p => {
      if (p.id === selectedPiece.id) {
        return { ...p, x: x, y: y };
      }
      return p;
    });

    updateGameState(newPieces, turn);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800 font-sans relative">
      <h1 className="text-4xl font-bold text-yellow-500 mb-4 tracking-widest drop-shadow-md">
        KỲ VƯƠNG ONLINE
      </h1>

      <div className="mb-6 px-6 py-2 rounded-full bg-slate-700 border border-slate-600 flex items-center gap-3 shadow-lg">
        <span className="text-gray-300 text-lg">Lượt đi:</span>
        <span className={`font-bold text-xl px-4 py-1 rounded ${turn === 'r' ? 'bg-red-600 text-white' : 'bg-black text-white border border-gray-500'}`}>
          {turn === 'r' ? 'QUÂN ĐỎ' : 'QUÂN ĐEN'}
        </span>
      </div>

      {message && (
        <div className="absolute top-24 bg-red-600 text-white px-8 py-3 rounded-lg shadow-2xl animate-bounce font-bold border-4 border-yellow-400 z-50 text-xl tracking-wider">
          {message}
        </div>
      )}
      
      <Board 
        pieces={pieces} 
        onPieceClick={handlePieceClick} 
        onSquareClick={handleSquareClick}
        selectedPiece={selectedPiece}
      />
      
      <p className="mt-6 text-gray-500 text-sm italic">
        Ngày 13: Chặn nước đi tự sát (Self-Check Prevention)
      </p>
    </div>
  )
}

export default App
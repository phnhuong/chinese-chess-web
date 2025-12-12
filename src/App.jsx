import React, { useState } from 'react'
import Board from './components/Board'
import { initialBoardState } from './utils/initialState'
// Import thêm isGameOver
import { isValidMove, isCheck, willCauseSelfCheck, isGameOver } from './utils/rules'

function App() {
  const [pieces, setPieces] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [turn, setTurn] = useState('r');
  const [message, setMessage] = useState(""); 
  
  // STATE MỚI: NGƯỜI CHIẾN THẮNG
  const [winner, setWinner] = useState(null); // 'r', 'b', hoặc null

  // Hàm reset game
  const resetGame = () => {
    setPieces(initialBoardState);
    setTurn('r');
    setWinner(null);
    setMessage("");
    setSelectedPiece(null);
  };

  const updateGameState = (newPieces, currentTurnPlaying) => {
    setPieces(newPieces);
    setSelectedPiece(null);
    
    // Xác định lượt tiếp theo
    const nextTurn = currentTurnPlaying === 'r' ? 'b' : 'r';
    setTurn(nextTurn);

    // 1. Kiểm tra Chiếu tướng
    const isChecking = isCheck(newPieces, currentTurnPlaying);
    if (isChecking) {
      setMessage(`⚠️ ${currentTurnPlaying === 'r' ? 'ĐỎ' : 'ĐEN'} ĐANG CHIẾU TƯỚNG!`);
    } else {
      setMessage("");
    }

    // 2. KIỂM TRA HẾT CỜ (CHECKMATE) - Logic Ngày 14
    // Kiểm tra phe "nextTurn" (người sắp phải đi) có còn nước đi nào không?
    if (isGameOver(newPieces, nextTurn)) {
      setWinner(currentTurnPlaying); // Người vừa đi là người thắng
    }
  };

  // --- Logic Click Quân ---
  const handlePieceClick = (targetPiece) => {
    if (winner) return; // Hết cờ thì không cho click nữa

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

    const canMove = isValidMove(selectedPiece, targetPiece.x, targetPiece.y, pieces);
    if (!canMove) return;

    if (willCauseSelfCheck(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return;

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

  // --- Logic Click Ô Trống ---
  const handleSquareClick = (x, y) => {
    if (winner) return;
    if (!selectedPiece) return;

    const canMove = isValidMove(selectedPiece, x, y, pieces);
    if (!canMove) return;

    if (willCauseSelfCheck(selectedPiece, x, y, pieces)) return;

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

      {message && !winner && (
        <div className="absolute top-24 bg-red-600 text-white px-8 py-3 rounded-lg shadow-2xl animate-bounce font-bold border-4 border-yellow-400 z-50 text-xl tracking-wider">
          {message}
        </div>
      )}

      {/* MÀN HÌNH CHIẾN THẮNG (Overlay) */}
      {winner && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100]">
          <h2 className={`text-6xl font-bold mb-8 ${winner === 'r' ? 'text-red-500' : 'text-white'}`}>
            {winner === 'r' ? 'ĐỎ THẮNG!' : 'ĐEN THẮNG!'}
          </h2>
          <button 
            onClick={resetGame}
            className="px-8 py-3 bg-yellow-500 text-black font-bold text-2xl rounded-lg hover:bg-yellow-400 transition-colors shadow-lg"
          >
            Ván Mới
          </button>
        </div>
      )}
      
      <Board 
        pieces={pieces} 
        onPieceClick={handlePieceClick} 
        onSquareClick={handleSquareClick}
        selectedPiece={selectedPiece}
      />
      
      <p className="mt-6 text-gray-500 text-sm italic">
        Ngày 14: Game Hoàn Thiện (Checkmate & Reset)
      </p>
    </div>
  )
}

export default App
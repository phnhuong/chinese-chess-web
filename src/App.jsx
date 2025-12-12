import React, { useState } from 'react'
import Board from './components/Board'
import { initialBoardState } from './utils/initialState'
// IMPORT HÀM KIỂM TRA LUẬT
import { isValidMove } from './utils/rules'

function App() {
  const [pieces, setPieces] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);
  
  // Quản lý lượt đi: 'r' (Red) hoặc 'b' (Black)
  const [turn, setTurn] = useState('r'); 

  // --- LOGIC XỬ LÝ CLICK VÀO QUÂN CỜ (Chọn hoặc Ăn) ---
  const handlePieceClick = (targetPiece) => {
    // TRƯỜNG HỢP 1: Chưa chọn quân nào cả
    if (!selectedPiece) {
      // Chỉ được chọn quân đúng lượt của mình
      if (targetPiece.color !== turn) return; 
      setSelectedPiece(targetPiece);
      return;
    }

    // TRƯỜNG HỢP 2: Đã chọn quân rồi, giờ click vào quân khác
    
    // A. Nếu click lại vào chính nó -> Bỏ chọn
    if (targetPiece.id === selectedPiece.id) {
      setSelectedPiece(null);
      return;
    }

    // B. Nếu click vào quân CÙNG MÀU -> Đổi sang chọn quân đó
    if (targetPiece.color === selectedPiece.color) {
      // Vẫn phải kiểm tra lại xem có đúng lượt không
      if (targetPiece.color === turn) {
        setSelectedPiece(targetPiece);
      }
      return;
    }

    // C. Nếu click vào quân KHÁC MÀU -> ĂN QUÂN (Capture) !!!
    
    // --- BƯỚC KIỂM TRA LUẬT (MỚI) ---
    // Hỏi trọng tài xem nước ăn quân này có hợp lệ không?
    const canMove = isValidMove(selectedPiece, targetPiece.x, targetPiece.y, pieces);
    if (!canMove) {
        console.log("Nước ăn quân sai luật!");
        return; // Nếu sai luật thì dừng lại, không làm gì cả
    }
    // --------------------------------

    // Nếu đúng luật thì thực hiện ăn quân:
    const newPieces = pieces
      .filter(p => p.id !== targetPiece.id) // 1. Xóa quân bị ăn
      .map(p => {
        if (p.id === selectedPiece.id) {
          return { ...p, x: targetPiece.x, y: targetPiece.y }; // 2. Di chuyển quân mình
        }
        return p;
      });
    
    setPieces(newPieces);
    setSelectedPiece(null);
    setTurn(turn === 'r' ? 'b' : 'r'); // 3. Đổi lượt
  };

  // --- LOGIC XỬ LÝ CLICK VÀO Ô TRỐNG (Di chuyển) ---
  const handleSquareClick = (x, y) => {
    if (!selectedPiece) return;

    // --- BƯỚC KIỂM TRA LUẬT (MỚI) ---
    // Hỏi trọng tài xem nước di chuyển này có hợp lệ không?
    const canMove = isValidMove(selectedPiece, x, y, pieces);
    if (!canMove) {
        console.log("Nước di chuyển sai luật!");
        return; // Dừng lại
    }
    // --------------------------------

    // Nếu đúng luật thì thực hiện di chuyển:
    const newPieces = pieces.map(p => {
      if (p.id === selectedPiece.id) {
        return { ...p, x: x, y: y };
      }
      return p;
    });

    setPieces(newPieces);
    setSelectedPiece(null);
    setTurn(turn === 'r' ? 'b' : 'r'); // Đổi lượt
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800 font-sans">
      <h1 className="text-4xl font-bold text-yellow-500 mb-4 tracking-widest drop-shadow-md">
        KỲ VƯƠNG ONLINE
      </h1>

      {/* HIỂN THỊ LƯỢT ĐI */}
      <div className="mb-6 px-6 py-2 rounded-full bg-slate-700 border border-slate-600 flex items-center gap-3 shadow-lg">
        <span className="text-gray-300 text-lg">Lượt đi:</span>
        <span className={`font-bold text-xl px-4 py-1 rounded ${turn === 'r' ? 'bg-red-600 text-white' : 'bg-black text-white border border-gray-500'}`}>
          {turn === 'r' ? 'QUÂN ĐỎ' : 'QUÂN ĐEN'}
        </span>
      </div>
      
      <Board 
        pieces={pieces} 
        onPieceClick={handlePieceClick} 
        onSquareClick={handleSquareClick}
        selectedPiece={selectedPiece}
      />
      
      <p className="mt-6 text-gray-500 text-sm italic">
        Ngày 8: Luật Xe và Pháo (Check vật cản)
      </p>
    </div>
  )
}

export default App
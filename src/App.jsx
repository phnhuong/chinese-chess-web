import React, { useState } from 'react'
import Board from './components/Board'
import { initialBoardState } from './utils/initialState'

function App() {
  const [pieces, setPieces] = useState(initialBoardState);
  
  // 1. Thêm State để lưu quân cờ đang được chọn (ban đầu là null - chưa chọn gì)
  const [selectedPiece, setSelectedPiece] = useState(null);

  // 2. Hàm xử lý khi click vào một quân cờ
  const handlePieceClick = (piece) => {
    console.log("Đã chọn quân:", piece.id); // In ra console để kiểm tra
    setSelectedPiece(piece);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800">
      <h1 className="text-4xl font-bold text-yellow-500 mb-8 tracking-widest drop-shadow-md">
        KỲ VƯƠNG ONLINE
      </h1>
      
      {/* 3. Truyền hàm xử lý và thông tin quân đang chọn xuống Board */}
      <Board 
        pieces={pieces} 
        onPieceClick={handlePieceClick} 
        selectedPiece={selectedPiece}
      />
      
      <p className="mt-6 text-gray-400 text-sm">
        Ngày 4: Tương tác - Chọn quân (Highlight)
      </p>
    </div>
  )
}

export default App
import React, { useState } from 'react'
import Board from './components/Board'
import { initialBoardState } from './utils/initialState'

function App() {
  const [pieces, setPieces] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);

  // Xử lý khi click vào quân cờ
  const handlePieceClick = (piece) => {
    // Nếu click vào chính quân đang chọn -> Bỏ chọn (Toggle)
    if (selectedPiece && selectedPiece.id === piece.id) {
        setSelectedPiece(null);
        return;
    }

    // Nếu đang chọn quân A mà click quân B (cùng phe) -> Chuyển sang chọn B
    if (selectedPiece && selectedPiece.color === piece.color) {
        setSelectedPiece(piece);
        return;
    }
    
    // Logic ăn quân sẽ làm sau. Hiện tại cứ click là chọn.
    setSelectedPiece(piece);
  };

  // --- HÀM MỚI: Xử lý khi click vào ô trống (Di chuyển) ---
  const handleSquareClick = (x, y) => {
    // Nếu chưa chọn quân nào thì click vào ô trống vô nghĩa -> Thoát
    if (!selectedPiece) return;

    // Tìm quân cờ đang chọn trong danh sách và cập nhật x, y mới
    const newPieces = pieces.map(p => {
      if (p.id === selectedPiece.id) {
        return { ...p, x: x, y: y }; // Tạo ra quân cờ mới với tọa độ mới
      }
      return p;
    });

    // Cập nhật lại State bàn cờ
    setPieces(newPieces);
    
    // Sau khi đi xong thì bỏ chọn
    setSelectedPiece(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800">
      <h1 className="text-4xl font-bold text-yellow-500 mb-8 tracking-widest drop-shadow-md">
        KỲ VƯƠNG ONLINE
      </h1>
      
      <Board 
        pieces={pieces} 
        onPieceClick={handlePieceClick} 
        onSquareClick={handleSquareClick} // Truyền hàm xử lý ô trống xuống
        selectedPiece={selectedPiece}
      />
      
      <p className="mt-6 text-gray-400 text-sm">
        Ngày 5: Di chuyển tự do (Click quân -> Click ô trống)
      </p>
    </div>
  )
}

export default App
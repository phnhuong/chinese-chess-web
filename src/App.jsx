import React, { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import { initialBoardState } from './utils/initialState'
import { isValidMove, isCheck, willCauseSelfCheck, isGameOver } from './utils/rules'

function App() {
  const [pieces, setPieces] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [turn, setTurn] = useState('r');
  const [message, setMessage] = useState(""); 
  const [winner, setWinner] = useState(null);

  // 1. STATE LỊCH SỬ NƯỚC ĐI
  // Mảng chứa các object: { turn: 'r', text: 'Pháo h2 -> e2' }
  const [history, setHistory] = useState([]);
  
  // Ref để tự động cuộn xuống cuối danh sách lịch sử
  const historyEndRef = useRef(null);

  // 2. HÀM PHÁT ÂM THANH
  const playSound = (type) => {
    // type = 'move' hoặc 'capture'
    // Lưu ý: File phải nằm trong thư mục public/sounds/
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(e => console.log("Chưa có file âm thanh hoặc lỗi play:", e));
  };

  // Cuộn xuống cuối mỗi khi history thay đổi
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);


  const resetGame = () => {
    setPieces(initialBoardState);
    setTurn('r');
    setWinner(null);
    setMessage("");
    setSelectedPiece(null);
    setHistory([]); // Xóa lịch sử
  };

  // Hàm tạo text mô tả nước đi (Hệ tọa độ quốc tế a-i, 0-9)
  const createMoveLog = (piece, targetX, targetY) => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    // Chuyển đổi tọa độ sang chuẩn
    const fromLabel = `${letters[piece.x]}${9 - piece.y}`;
    const toLabel = `${letters[targetX]}${9 - targetY}`;
    
    // Tên quân cờ (Map từ id)
    const pieceNames = { 
      r: 'Xe', n: 'Mã', b: 'Tượng', a: 'Sĩ', k: 'Tướng', c: 'Pháo', p: 'Tốt' 
    };
    const name = pieceNames[piece.type];

    return `${name} (${fromLabel} → ${toLabel})`;
  };

  // --- LOGIC XỬ LÝ CHUNG (Di chuyển hoặc Ăn) ---
  const executeMove = (piece, targetX, targetY, isCapture) => {
    // 1. Ghi log lịch sử TRƯỚC khi cập nhật state
    const moveText = createMoveLog(piece, targetX, targetY);
    setHistory(prev => [...prev, { 
      turn: turn, 
      text: moveText, 
      isCapture: isCapture 
    }]);

    // 2. Phát âm thanh
    playSound(isCapture ? 'capture' : 'move');

    // 3. Cập nhật vị trí quân
    let newPieces;
    if (isCapture) {
      // Ăn quân: Loại bỏ quân địch tại đích
      newPieces = pieces
        .filter(p => !(p.x === targetX && p.y === targetY)) // Xóa địch
        .map(p => {
          if (p.id === piece.id) return { ...p, x: targetX, y: targetY }; // Dời mình
          return p;
        });
    } else {
      // Di chuyển thường
      newPieces = pieces.map(p => {
        if (p.id === piece.id) return { ...p, x: targetX, y: targetY };
        return p;
      });
    }

    // 4. Cập nhật Game State (Lượt, Check, Winner)
    setPieces(newPieces);
    setSelectedPiece(null);
    
    const nextTurn = turn === 'r' ? 'b' : 'r';
    setTurn(nextTurn);

    if (isCheck(newPieces, turn)) { // Check phe vừa đi có chiếu phe kia không
      setMessage(`⚠️ ${turn === 'r' ? 'ĐỎ' : 'ĐEN'} ĐANG CHIẾU TƯỚNG!`);
    } else {
      setMessage("");
    }

    if (isGameOver(newPieces, nextTurn)) {
      setWinner(turn); // Người vừa đi thắng
    }
  };

  // --- CLICK QUÂN CỜ ---
  const handlePieceClick = (targetPiece) => {
    if (winner) return;

    // Chọn quân
    if (!selectedPiece) {
      if (targetPiece.color !== turn) return; 
      setSelectedPiece(targetPiece);
      return;
    }

    // Bỏ chọn / Chọn lại
    if (targetPiece.id === selectedPiece.id) {
      setSelectedPiece(null);
      return;
    }
    if (targetPiece.color === selectedPiece.color) {
      if (targetPiece.color === turn) setSelectedPiece(targetPiece);
      return;
    }

    // ĂN QUÂN
    if (!isValidMove(selectedPiece, targetPiece.x, targetPiece.y, pieces)) return;
    if (willCauseSelfCheck(selectedPiece, targetPiece.x, targetPiece.y, pieces)) {
       console.log("Cấm tự sát"); return;
    }

    // Thực thi ăn quân (True)
    executeMove(selectedPiece, targetPiece.x, targetPiece.y, true);
  };

  // --- CLICK Ô TRỐNG ---
  const handleSquareClick = (x, y) => {
    if (winner) return;
    if (!selectedPiece) return;

    if (!isValidMove(selectedPiece, x, y, pieces)) return;
    if (willCauseSelfCheck(selectedPiece, x, y, pieces)) return;

    // Thực thi di chuyển (False - không ăn)
    executeMove(selectedPiece, x, y, false);
  };

  return (
    <div className="min-h-screen bg-slate-800 font-sans flex flex-col items-center py-5">
      <h1 className="text-4xl font-bold text-yellow-500 mb-4 tracking-widest drop-shadow-md">
        KỲ VƯƠNG ONLINE
      </h1>

      {/* Container chính: Chia làm 2 cột (Bàn cờ | Lịch sử) khi màn hình rộng */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* CỘT TRÁI: BÀN CỜ */}
        <div className="relative">
          <div className="mb-4 px-6 py-2 rounded-full bg-slate-700 border border-slate-600 flex justify-center items-center gap-3 shadow-lg">
            <span className="text-gray-300 text-lg">Lượt đi:</span>
            <span className={`font-bold text-xl px-4 py-1 rounded ${turn === 'r' ? 'bg-red-600 text-white' : 'bg-black text-white border border-gray-500'}`}>
              {turn === 'r' ? 'QUÂN ĐỎ' : 'QUÂN ĐEN'}
            </span>
          </div>

          {message && !winner && (
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-lg shadow-2xl animate-bounce font-bold border-4 border-yellow-400 z-50 text-xl whitespace-nowrap">
              {message}
            </div>
          )}

          {winner && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] rounded-lg">
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
        </div>

        {/* CỘT PHẢI: LỊCH SỬ NƯỚC ĐI (UI MỚI) */}
        <div className="w-[300px] h-[550px] bg-slate-700 rounded-lg border-2 border-slate-600 flex flex-col shadow-xl">
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
                  {move.isCapture && (
                    <span className="text-yellow-500 text-xs bg-yellow-900/50 px-1 rounded">ĂN</span>
                  )}
                </div>
              ))
            )}
            <div ref={historyEndRef} />
          </div>

          <div className="p-3 border-t border-slate-600 bg-slate-800 flex justify-center">
             <button onClick={resetGame} className="text-sm text-gray-400 hover:text-white underline">
               Chơi lại từ đầu
             </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
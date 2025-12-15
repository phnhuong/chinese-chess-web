import React from 'react';
import Piece from './Piece';

// Nhận thêm prop boardWidth
const Board = ({ pieces, onPieceClick, onSquareClick, selectedPiece, isFlipped, boardWidth }) => { 
  
  // --- TÍNH TOÁN KÍCH THƯỚC ĐỘNG ---
  // Tỷ lệ bàn cờ: Rộng 9 ô, Cao 10 ô.
  // Khung ngoài: boardWidth (ví dụ 560px hoặc 350px trên mobile)
  // Chiều cao khung: boardWidth * 1.1 (tỷ lệ gần đúng)
  const boardHeight = boardWidth * 1.1; 
  
  // Padding lề: 8% chiều rộng
  const padding = boardWidth * 0.08; 
  
  // Kích thước thực của lưới cờ (trừ đi lề)
  const gridWidth = boardWidth - (padding * 2);
  const gridHeight = boardHeight - (padding * 2); // Xấp xỉ

  // Kích thước 1 ô cờ = gridWidth / 8 (vì có 8 khoảng cách cho 9 đường kẻ)
  const cellSize = gridWidth / 8;

  // Cập nhật lại Grid Height chuẩn theo cellSize
  // Có 9 khoảng cách dọc (10 đường) -> height = 9 * cellSize
  const finalGridHeight = cellSize * 9;
  
  // Chiều cao thực tế của khung gỗ
  const finalBoardHeight = finalGridHeight + (padding * 2);

  // --- HÀM TÍNH TỌA ĐỘ PIXEL TỪ X, Y ---
  const getPos = (x, y) => {
    // Nếu lật: x=0 -> 8
    const finalX = isFlipped ? (8 - x) : x;
    const finalY = isFlipped ? (9 - y) : y;

    return {
      left: finalX * cellSize,
      top: finalY * cellSize
    };
  };

  const renderIntersections = () => {
    const intersections = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const pos = getPos(x, y);
        intersections.push(
          <div 
            key={`${x}-${y}`}
            onClick={() => onSquareClick(x, y)}
            className="absolute z-10 cursor-pointer"
            style={{
              left: pos.left,
              top: pos.top,
              width: cellSize,
              height: cellSize,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      }
    }
    return intersections;
  };

  const renderCoordinates = () => {
    const coords = [];
    const letters = isFlipped 
      ? ['i', 'h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
      : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    
    // Font size dựa theo cellSize
    const fontSize = cellSize * 0.4;

    for (let i = 0; i < 9; i++) {
      coords.push(
        <span key={`top-${i}`} className="absolute font-bold font-mono uppercase select-none text-[#3e2723]" 
              style={{ left: i * cellSize, top: -padding * 0.6, fontSize: fontSize, transform: 'translateX(-50%)' }}>
          {letters[i]}
        </span>
      );
      coords.push(
        <span key={`bottom-${i}`} className="absolute font-bold font-mono uppercase select-none text-[#3e2723]" 
              style={{ left: i * cellSize, bottom: -padding * 0.6, fontSize: fontSize, transform: 'translateX(-50%)' }}>
          {letters[i]}
        </span>
      );
    }

    for (let i = 0; i < 10; i++) {
      const label = isFlipped ? i : 9 - i; 
      coords.push(
        <span key={`left-${i}`} className="absolute font-bold font-mono select-none text-[#3e2723]" 
              style={{ top: i * cellSize, left: -padding * 0.6, fontSize: fontSize, transform: 'translateY(-50%)' }}>
          {label}
        </span>
      );
      coords.push(
        <span key={`right-${i}`} className="absolute font-bold font-mono select-none text-[#3e2723]" 
              style={{ top: i * cellSize, right: -padding * 0.6, fontSize: fontSize, transform: 'translateY(-50%)' }}>
          {label}
        </span>
      );
    }
    return coords;
  };

  return (
    <div 
        className="bg-[#eecfa1] rounded-lg shadow-2xl relative border-4 border-[#eecfa1] transition-all duration-300"
        style={{ width: boardWidth, height: finalBoardHeight, padding: padding }}
    >
      {/* Lưới bàn cờ */}
      <div 
        className="relative border-2 border-[#5d4037]"
        style={{ width: gridWidth, height: finalGridHeight }}
      >
        {/* Vẽ Lưới bằng SVG cho sắc nét ở mọi kích thước */}
        <svg width="100%" height="100%" className="absolute top-0 left-0 z-0">
            {/* Kẻ ngang */}
            {Array.from({ length: 10 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={i * cellSize} x2={gridWidth} y2={i * cellSize} stroke="#5d4037" strokeWidth="1" />
            ))}
            {/* Kẻ dọc (bị ngắt bởi sông) */}
            {Array.from({ length: 9 }).map((_, i) => {
                if (i === 0 || i === 8) return ( // Biên dọc nối liền
                    <line key={`v-${i}`} x1={i * cellSize} y1="0" x2={i * cellSize} y2={finalGridHeight} stroke="#5d4037" strokeWidth="2" />
                );
                return ( // Đường giữa ngắt quãng
                    <React.Fragment key={`v-${i}`}>
                        <line x1={i * cellSize} y1="0" x2={i * cellSize} y2={cellSize * 4} stroke="#5d4037" strokeWidth="1" />
                        <line x1={i * cellSize} y1={cellSize * 5} x2={i * cellSize} y2={finalGridHeight} stroke="#5d4037" strokeWidth="1" />
                    </React.Fragment>
                );
            })}
            {/* Cửu cung */}
            <line x1={3*cellSize} y1="0" x2={5*cellSize} y2={2*cellSize} stroke="#5d4037" strokeWidth="1" />
            <line x1={5*cellSize} y1="0" x2={3*cellSize} y2={2*cellSize} stroke="#5d4037" strokeWidth="1" />
            
            <line x1={3*cellSize} y1={7*cellSize} x2={5*cellSize} y2={9*cellSize} stroke="#5d4037" strokeWidth="1" />
            <line x1={5*cellSize} y1={7*cellSize} x2={3*cellSize} y2={9*cellSize} stroke="#5d4037" strokeWidth="1" />
        </svg>

        {renderCoordinates()}

        {/* Sông */}
        <div 
            className="absolute flex justify-around items-center text-[#3e2723] font-bold z-0 pointer-events-none"
            style={{ 
                top: cellSize * 4, // Hàng thứ 5
                left: 2, 
                width: gridWidth - 4, 
                height: cellSize, 
                fontSize: cellSize * 0.5 
            }}
        >
            <span>SỞ HÀ</span>
            <span>HÁN GIỚI</span>
        </div>

        {renderIntersections()}

        {pieces && pieces.map((piece) => {
            const isSelected = selectedPiece && selectedPiece.id === piece.id;
            const pos = getPos(piece.x, piece.y);
            return (
              <Piece 
                key={piece.id} 
                piece={piece} 
                // TRUYỀN POS TÍNH TOÁN TỪ BOARD XUỐNG ĐỂ PIECE KHÔNG TỰ TÍNH NỮA
                // (Để Piece.jsx đơn giản hơn và responsive chuẩn hơn)
                customStyle={{
                    left: pos.left,
                    top: pos.top,
                    width: cellSize * 0.8, // Quân cờ nhỏ hơn ô một chút
                    height: cellSize * 0.8,
                    fontSize: cellSize * 0.4
                }}
                onClick={() => onPieceClick(piece)}
                isSelected={isSelected}
              />
            );
        })}

      </div>
    </div>
  );
};

export default Board;
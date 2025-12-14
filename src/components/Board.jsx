// src/components/Board.jsx
import React from 'react';
import Piece from './Piece';

const Board = ({ pieces, onPieceClick, onSquareClick, selectedPiece, isFlipped }) => { 
  
  // 1. HÀM VẼ LƯỚI TƯƠNG TÁC
  const renderIntersections = () => {
    const intersections = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const leftVal = isFlipped ? (8 - x) * 50 : x * 50;
        const topVal = isFlipped ? (9 - y) * 50 : y * 50;

        intersections.push(
          <div 
            key={`${x}-${y}`}
            onClick={() => onSquareClick(x, y)}
            className="absolute w-[50px] h-[50px] z-10 cursor-pointer"
            style={{
              left: `${leftVal}px`,
              top: `${topVal}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      }
    }
    return intersections;
  };

  // 2. HÀM VẼ TỌA ĐỘ
  const renderCoordinates = () => {
    const coords = [];
    const letters = isFlipped 
      ? ['i', 'h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
      : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    
    // Ngang
    for (let i = 0; i < 9; i++) {
      coords.push(
        <span key={`top-${i}`} className="absolute -top-12 text-[#3e2723] font-bold font-mono text-xl uppercase select-none" style={{ left: `${i * 50}px`, transform: 'translateX(-50%)' }}>
          {letters[i]}
        </span>
      );
      coords.push(
        <span key={`bottom-${i}`} className="absolute -bottom-12 text-[#3e2723] font-bold font-mono text-xl uppercase select-none" style={{ left: `${i * 50}px`, transform: 'translateX(-50%)' }}>
          {letters[i]}
        </span>
      );
    }

    // Dọc
    for (let i = 0; i < 10; i++) {
      const label = isFlipped ? i : 9 - i; 
      coords.push(
        <span key={`left-${i}`} className="absolute -left-12 text-[#3e2723] font-bold font-mono text-xl select-none" style={{ top: `${i * 50}px`, transform: 'translateY(-50%)' }}>
          {label}
        </span>
      );
      coords.push(
        <span key={`right-${i}`} className="absolute -right-12 text-[#3e2723] font-bold font-mono text-xl select-none" style={{ top: `${i * 50}px`, transform: 'translateY(-50%)' }}>
          {label}
        </span>
      );
    }
    return coords;
  };

  return (
    <div className="w-[560px] h-[610px] bg-[#eecfa1] rounded-lg shadow-2xl flex justify-center items-center relative border-4 border-[#eecfa1]">
      
      <div 
        className="w-[404px] h-[454px] border-2 border-[#5d4037] relative"
        style={{
          backgroundImage: `linear-gradient(#5d4037 1px, transparent 1px),
                            linear-gradient(90deg, #5d4037 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      >
        {renderCoordinates()}

        {/* --- DÒNG SÔNG --- */}
        {/* Đã chỉnh sửa: Luôn hiển thị xuôi chiều từ trái sang phải (Sở Hà -> Hán Giới) */}
        {/* Tôi xóa bỏ style flexDirection và dùng màu chữ đậm hơn (#3e2723) cho đẹp */}
        <div className="absolute top-[201px] left-[2px] w-[396px] h-[48px] bg-[#eecfa1] flex justify-around items-center text-[#3e2723] font-bold text-2xl z-0">
            <span>SỞ HÀ</span>
            <span>HÁN GIỚI</span>
        </div>
        
        {/* Cửu cung */}
        <div className="absolute top-[0px] left-[150px] w-[100px] h-[100px] z-0">
             <svg width="100%" height="100%">
               <line x1="0" y1="0" x2="100" y2="100" stroke="#5d4037" strokeWidth="1" />
               <line x1="100" y1="0" x2="0" y2="100" stroke="#5d4037" strokeWidth="1" />
             </svg>
        </div>
        <div className="absolute top-[350px] left-[150px] w-[100px] h-[100px] z-0">
             <svg width="100%" height="100%">
               <line x1="0" y1="0" x2="100" y2="100" stroke="#5d4037" strokeWidth="1" />
               <line x1="100" y1="0" x2="0" y2="100" stroke="#5d4037" strokeWidth="1" />
             </svg>
        </div>

        {renderIntersections()}

        {pieces && pieces.map((piece) => {
            const isSelected = selectedPiece && selectedPiece.id === piece.id;
            return (
              <Piece 
                key={piece.id} 
                piece={piece} 
                onClick={() => onPieceClick(piece)}
                isSelected={isSelected}
                isFlipped={isFlipped}
              />
            );
        })}

      </div>
    </div>
  );
};

export default Board;
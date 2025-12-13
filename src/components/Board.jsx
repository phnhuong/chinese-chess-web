// src/components/Board.jsx
import React from 'react';
import Piece from './Piece';

const Board = ({ pieces, onPieceClick, onSquareClick, selectedPiece }) => { 
  
  // 1. HÀM VẼ LƯỚI TƯƠNG TÁC (Bắt sự kiện click vào ô trống)
  const renderIntersections = () => {
    const intersections = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        intersections.push(
          <div 
            key={`${x}-${y}`}
            onClick={() => onSquareClick(x, y)}
            className="absolute w-[50px] h-[50px] z-10 cursor-pointer"
            style={{
              left: `${x * 50}px`,
              top: `${y * 50}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      }
    }
    return intersections;
  };

  // 2. HÀM VẼ TỌA ĐỘ CHUẨN QUỐC TẾ (WXF / UCI)
  // Ngang: a-i | Dọc: 9-0
  const renderCoordinates = () => {
    const coords = [];
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    
    // Vẽ chữ cái trục Ngang (a - i)
    for (let x = 0; x < 9; x++) {
      // Hàng chữ bên trên
      coords.push(
        <span key={`top-${x}`} className="absolute -top-8 text-[#5d4037] font-bold font-mono text-lg uppercase select-none" style={{ left: `${x * 50}px`, transform: 'translateX(-50%)' }}>
          {letters[x]}
        </span>
      );
      // Hàng chữ bên dưới
      coords.push(
        <span key={`bottom-${x}`} className="absolute -bottom-8 text-[#5d4037] font-bold font-mono text-lg uppercase select-none" style={{ left: `${x * 50}px`, transform: 'translateX(-50%)' }}>
          {letters[x]}
        </span>
      );
    }

    // Vẽ số trục Dọc (9 - 0)
    for (let y = 0; y < 10; y++) {
      // Logic: Hàng 0 (trên cùng) là số 9. Hàng 9 (dưới cùng) là số 0.
      const label = 9 - y; 
      
      // Cột số bên trái
      coords.push(
        <span key={`left-${y}`} className="absolute -left-8 text-[#5d4037] font-bold font-mono text-lg select-none" style={{ top: `${y * 50}px`, transform: 'translateY(-50%)' }}>
          {label}
        </span>
      );
      // Cột số bên phải
      coords.push(
        <span key={`right-${y}`} className="absolute -right-8 text-[#5d4037] font-bold font-mono text-lg select-none" style={{ top: `${y * 50}px`, transform: 'translateY(-50%)' }}>
          {label}
        </span>
      );
    }
    return coords;
  };

  return (
    // Tăng kích thước khung gỗ lên 500x550 để chứa đủ số tọa độ 2 bên
    <div className="w-[500px] h-[550px] bg-[#eecfa1] rounded-lg shadow-2xl flex justify-center items-center relative border-4 border-[#eecfa1]">
      
      {/* Lưới bàn cờ chính */}
      <div 
        className="w-[404px] h-[454px] border-2 border-[#5d4037] relative"
        style={{
          backgroundImage: `linear-gradient(#5d4037 1px, transparent 1px),
                            linear-gradient(90deg, #5d4037 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      >
        {/* --- HIỂN THỊ TỌA ĐỘ --- */}
        {renderCoordinates()}

        {/* Sông */}
        <div className="absolute top-[201px] left-[2px] w-[396px] h-[48px] bg-[#eecfa1] flex justify-around items-center text-[#5d4037] font-bold text-2xl z-0">
            <span>SỞ HÀ</span>
            <span>HÁN GIỚI</span>
        </div>
        
        {/* Cửu cung (Palace) - Vẽ bằng SVG */}
        {/* Cung trên */}
        <div className="absolute top-[0px] left-[150px] w-[100px] h-[100px] z-0">
             <svg width="100%" height="100%">
               <line x1="0" y1="0" x2="100" y2="100" stroke="#5d4037" strokeWidth="1" />
               <line x1="100" y1="0" x2="0" y2="100" stroke="#5d4037" strokeWidth="1" />
             </svg>
        </div>
        {/* Cung dưới */}
        <div className="absolute top-[350px] left-[150px] w-[100px] h-[100px] z-0">
             <svg width="100%" height="100%">
               <line x1="0" y1="0" x2="100" y2="100" stroke="#5d4037" strokeWidth="1" />
               <line x1="100" y1="0" x2="0" y2="100" stroke="#5d4037" strokeWidth="1" />
             </svg>
        </div>

        {/* Lưới tương tác (để click) */}
        {renderIntersections()}

        {/* Các quân cờ */}
        {pieces && pieces.map((piece) => {
            const isSelected = selectedPiece && selectedPiece.id === piece.id;
            return (
              <Piece 
                key={piece.id} 
                piece={piece} 
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
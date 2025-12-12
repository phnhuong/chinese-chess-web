import React from 'react';
import Piece from './Piece';

// Nhận thêm props: onSquareClick (hàm xử lý khi click vào ô trống)
const Board = ({ pieces, onPieceClick, onSquareClick, selectedPiece }) => { 
  
  // Hàm tạo ra 90 điểm giao nhau (9 cột x 10 hàng) để bắt sự kiện click
  const renderIntersections = () => {
    const intersections = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        intersections.push(
          <div 
            key={`${x}-${y}`}
            onClick={() => onSquareClick(x, y)} // Khi click vào đây, báo về App tọa độ x, y
            className="absolute w-[50px] h-[50px] z-10 cursor-pointer" // z-10 để nằm dưới quân cờ (z-20) nhưng trên bàn cờ
            style={{
              left: `${x * 50}px`,
              top: `${y * 50}px`,
              transform: 'translate(-50%, -50%)', // Căn giữa tâm giao điểm
              // border: '1px solid rgba(0,0,0,0.1)' // Bỏ comment dòng này nếu muốn nhìn thấy lưới để debug
            }}
          />
        );
      }
    }
    return intersections;
  };

  return (
    <div className="w-[450px] h-[500px] bg-[#eecfa1] rounded-lg shadow-2xl flex justify-center items-center relative border-4 border-[#eecfa1]">
      <div 
        className="w-[404px] h-[454px] border-2 border-[#5d4037] relative"
        style={{
          backgroundImage: `linear-gradient(#5d4037 1px, transparent 1px),
                            linear-gradient(90deg, #5d4037 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      >
        {/* Sông và Cửu cung (Giữ nguyên code cũ) */}
        <div className="absolute top-[201px] left-[2px] w-[396px] h-[48px] bg-[#eecfa1] flex justify-around items-center text-[#5d4037] font-bold text-2xl z-0">
            <span>SỞ HÀ</span>
            <span>HÁN GIỚI</span>
        </div>
        <div className="absolute top-[350px] left-[150px] w-[100px] h-[100px] z-0">
             <svg width="100%" height="100%"><line x1="0" y1="0" x2="100" y2="100" stroke="#5d4037" strokeWidth="1" /><line x1="100" y1="0" x2="0" y2="100" stroke="#5d4037" strokeWidth="1" /></svg>
        </div>
        <div className="absolute top-[0px] left-[150px] w-[100px] h-[100px] z-0">
             <svg width="100%" height="100%"><line x1="0" y1="0" x2="100" y2="100" stroke="#5d4037" strokeWidth="1" /><line x1="100" y1="0" x2="0" y2="100" stroke="#5d4037" strokeWidth="1" /></svg>
        </div>

        {/* 1. LƯỚI TƯƠNG TÁC (Mới thêm) - Nằm dưới cùng để bắt click nền */}
        {renderIntersections()}

        {/* 2. CÁC QUÂN CỜ - Nằm đè lên lưới */}
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
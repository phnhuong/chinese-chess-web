import React from 'react';
import Piece from './Piece';

// Nhận thêm props: onPieceClick và selectedPiece
const Board = ({ pieces, onPieceClick, selectedPiece }) => { 
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
        {/* Sông và Cửu cung giữ nguyên (tôi rút gọn để bạn dễ nhìn) */}
        <div className="absolute top-[201px] left-[2px] w-[396px] h-[48px] bg-[#eecfa1] flex justify-around items-center text-[#5d4037] font-bold text-2xl z-10">
            <span>SỞ HÀ</span>
            <span>HÁN GIỚI</span>
        </div>
        {/* ... (Giữ nguyên phần vẽ Cửu cung SVG ở đây) ... */}
        <div className="absolute top-[350px] left-[150px] w-[100px] h-[100px]">
             <svg width="100%" height="100%"><line x1="0" y1="0" x2="100" y2="100" stroke="#5d4037" strokeWidth="1" /><line x1="100" y1="0" x2="0" y2="100" stroke="#5d4037" strokeWidth="1" /></svg>
        </div>
        <div className="absolute top-[0px] left-[150px] w-[100px] h-[100px]">
             <svg width="100%" height="100%"><line x1="0" y1="0" x2="100" y2="100" stroke="#5d4037" strokeWidth="1" /><line x1="100" y1="0" x2="0" y2="100" stroke="#5d4037" strokeWidth="1" /></svg>
        </div>


        {/* --- CẬP NHẬT PHẦN RENDER QUÂN CỜ --- */}
        {pieces && pieces.map((piece) => {
            // Kiểm tra xem quân này có đang được chọn hay không?
            const isSelected = selectedPiece && selectedPiece.id === piece.id;

            return (
              <Piece 
                key={piece.id} 
                piece={piece} 
                onClick={() => onPieceClick(piece)} // Truyền hàm click
                isSelected={isSelected} // Truyền trạng thái chọn
              />
            );
        })}

      </div>
    </div>
  );
};

export default Board;
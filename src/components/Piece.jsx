import React from 'react';

// Nhận thêm props: onClick và isSelected
const Piece = ({ piece, onClick, isSelected }) => {
  
  const isRed = piece.color === 'red';
  const colorClass = isRed ? 'text-[#d63031] border-[#d63031]' : 'text-[#2d3436] border-[#2d3436]';
  const bgClass = 'bg-[#fdf5e6]';

  // --- XỬ LÝ HIỆU ỨNG CHỌN (HIGHLIGHT) ---
  // Nếu được chọn: Thêm vòng sáng màu xanh dương (ring-4 ring-blue-500) và phóng to nhẹ
  const selectedClass = isSelected 
    ? 'ring-4 ring-blue-500 scale-110 z-30 shadow-xl' 
    : 'hover:scale-110 z-20'; // Nếu chưa chọn thì chỉ hover mới to lên

  const style = {
    left: `${piece.x * 50}px`,
    top: `${piece.y * 50}px`,
    transform: 'translate(-50%, -50%)',
  };

  const getLabel = (type, color) => {
    const labels = {
      r: { k: '帥', a: '仕', b: '相', n: '傌', r: '俥', c: '炮', p: '兵' },
      b: { k: '將', a: '士', b: '象', n: '馬', r: '車', c: '砲', p: '卒' }
    };
    return labels[color][type];
  };

  return (
    <div 
      // Thêm sự kiện onClick
      onClick={onClick}
      // Thêm selectedClass vào className
      className={`absolute w-[40px] h-[40px] rounded-full border-2 flex justify-center items-center shadow-md cursor-pointer select-none transition-all duration-200 ${colorClass} ${bgClass} ${selectedClass}`}
      style={style}
    >
      <span className="text-xl font-bold font-serif" style={{ marginTop: '-2px' }}>
        {getLabel(piece.type, piece.color)}
      </span>
      
      {!isSelected && (
         <div className={`absolute w-[32px] h-[32px] rounded-full border border-dashed opacity-50 ${colorClass}`}></div>
      )}
    </div>
  );
};

export default Piece;
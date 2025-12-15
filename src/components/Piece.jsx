import React from 'react';

const Piece = ({ piece, onClick, isSelected, customStyle }) => {
  
  const isRed = piece.color === 'r';
  const colorClass = isRed ? 'text-[#d63031] border-[#d63031]' : 'text-[#2d3436] border-[#2d3436]';
  const bgClass = 'bg-[#fdf5e6]';

  const selectedClass = isSelected 
    ? 'ring-4 ring-blue-500 scale-110 z-30 shadow-xl' 
    : 'hover:scale-110 z-20';

  const getLabel = (type, color) => {
    const labels = {
      r: { k: '帥', a: '仕', b: '相', n: '傌', r: '俥', c: '炮', p: '兵' },
      b: { k: '將', a: '士', b: '象', n: '馬', r: '車', c: '砲', p: '卒' }
    };
    return labels[color][type];
  };

  return (
    <div 
      onClick={onClick}
      className={`absolute rounded-full border-2 flex justify-center items-center shadow-md cursor-pointer select-none transition-all duration-300 ${colorClass} ${bgClass} ${selectedClass}`}
      style={{
          ...customStyle,
          transform: 'translate(-50%, -50%)', // Luôn căn giữa điểm neo
          fontSize: customStyle.fontSize // Cỡ chữ động
      }}
    >
      <span className="font-bold font-serif" style={{ marginTop: '-10%' }}>
        {getLabel(piece.type, piece.color)}
      </span>
      
      {!isSelected && (
         <div className={`absolute w-[80%] h-[80%] rounded-full border border-dashed opacity-50 ${colorClass}`}></div>
      )}
    </div>
  );
};

export default Piece;
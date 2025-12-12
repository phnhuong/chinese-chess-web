import React from 'react';

const Piece = ({ piece }) => {
  // piece: là object chứa thông tin quân cờ (loại gì, màu gì, vị trí x, y)
  
  // 1. Xác định màu sắc (Đỏ hoặc Đen)
  const isRed = piece.color === 'red';
  const colorClass = isRed ? 'text-[#d63031] border-[#d63031]' : 'text-[#2d3436] border-[#2d3436]';
  const bgClass = 'bg-[#fdf5e6]'; // Màu nền quân cờ (trắng kem)

  // 2. Tính toán vị trí tuyệt đối trên bàn cờ
  // Mỗi ô rộng 50px.
  // Quân cờ nằm ngay giao điểm, nên ta dùng left/top theo tọa độ x, y.
  // transform translate để tâm quân cờ trùng với giao điểm.
  const style = {
    left: `${piece.x * 50}px`,
    top: `${piece.y * 50}px`,
    transform: 'translate(-50%, -50%)', // Căn giữa tâm
  };

  // 3. Hàm lấy chữ Hán dựa trên tên quân cờ
  const getLabel = (type, color) => {
    const labels = {
      r: { // Red (Đỏ)
        k: '帥', // Tướng (Soái)
        a: '仕', // Sĩ
        b: '相', // Tượng
        n: '傌', // Mã
        r: '俥', // Xe
        c: '炮', // Pháo
        p: '兵', // Tốt
      },
      b: { // Black (Đen)
        k: '將', // Tướng
        a: '士', // Sĩ
        b: '象', // Tượng
        n: '馬', // Mã
        r: '車', // Xe
        c: '砲', // Pháo
        p: '卒', // Tốt
      }
    };
    return labels[color][type];
  };

  return (
    <div 
      className={`absolute w-[40px] h-[40px] rounded-full border-2 flex justify-center items-center shadow-md cursor-pointer select-none transition-transform hover:scale-110 z-20 ${colorClass} ${bgClass}`}
      style={style}
    >
      <span className="text-xl font-bold font-serif" style={{ marginTop: '-2px' }}>
        {getLabel(piece.type, piece.color)}
      </span>
      
      {/* Vòng tròn nhỏ bên trong cho giống quân cờ thật */}
      <div className={`absolute w-[32px] h-[32px] rounded-full border border-dashed opacity-50 ${colorClass}`}></div>
    </div>
  );
};

export default Piece;
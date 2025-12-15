import React, { useEffect } from 'react';

// time: số giây còn lại (ví dụ 900s = 15 phút)
// isActive: có đang chạy hay không (đến lượt mình thì chạy)
// onTimeout: hàm gọi khi hết giờ
const Timer = ({ time, isActive, onTimeout }) => {
  
  // Định dạng giây thành MM:SS (Ví dụ: 65 -> 01:05)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`
      px-6 py-3 rounded-lg border-2 font-mono text-3xl font-bold shadow-lg transition-all
      ${isActive 
        ? 'bg-yellow-500 text-black border-yellow-300 scale-110 shadow-yellow-500/50' // Đang chạy: Nổi bật
        : 'bg-slate-700 text-gray-400 border-slate-600 opacity-80'} // Đang đợi: Mờ đi
    `}>
      {formatTime(time)}
    </div>
  );
};

export default Timer;
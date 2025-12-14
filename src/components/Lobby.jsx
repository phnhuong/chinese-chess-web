import React, { useState } from 'react';

const Lobby = ({ onCreateGame, onJoinGame }) => {
  const [joinId, setJoinId] = useState("");

  return (
    <div className="flex flex-col items-center gap-6 p-10 bg-slate-700 rounded-xl shadow-2xl border border-slate-600 max-w-md w-full">
      <h2 className="text-3xl font-bold text-yellow-500 uppercase tracking-widest">Sảnh Chờ</h2>
      
      {/* NÚT TẠO PHÒNG MỚI */}
      <button 
        onClick={onCreateGame}
        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg shadow-lg transition-transform active:scale-95"
      >
        ⚔️ TẠO PHÒNG MỚI
      </button>

      <div className="flex items-center w-full gap-2">
        <div className="h-[1px] bg-slate-500 flex-1"></div>
        <span className="text-slate-400 text-sm">HOẶC</span>
        <div className="h-[1px] bg-slate-500 flex-1"></div>
      </div>

      {/* KHUNG NHẬP MÃ PHÒNG */}
      <div className="w-full flex flex-col gap-2">
        <label className="text-gray-300 text-sm font-bold">Nhập Mã Phòng đấu:</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Ví dụ: aB3xD..."
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-yellow-500"
          />
          <button 
            onClick={() => onJoinGame(joinId)}
            disabled={!joinId}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold rounded shadow transition-colors"
          >
            VÀO
          </button>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 mt-4 text-center">
        Chia sẻ mã phòng cho bạn bè để cùng chơi.
      </p>
    </div>
  );
};

export default Lobby;
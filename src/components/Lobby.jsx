import React, { useState } from 'react';
import Leaderboard from './Leaderboard'; 
import RoomList from './RoomList';

// Nhận thêm prop: onPlayAI
const Lobby = ({ onCreateGame, onJoinGame, user, onLogin, onPlayAI }) => {
  const [joinId, setJoinId] = useState("");

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-6 p-10 bg-slate-700 rounded-xl shadow-2xl border border-slate-600">
        <h2 className="text-3xl font-bold text-yellow-500 uppercase tracking-widest">Kỳ Vương Online</h2>
        <p className="text-gray-300">Vui lòng đăng nhập để bắt đầu</p>
        <button onClick={onLogin} className="flex items-center gap-3 px-6 py-3 bg-white text-gray-800 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
          <span className="text-xl font-bold text-blue-600">G</span>
          Đăng nhập bằng Google
        </button>
        <Leaderboard />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start w-full max-w-5xl px-4">
        
        <div className="flex-1 flex flex-col items-center gap-6 p-8 bg-slate-700 rounded-xl shadow-2xl border border-slate-600 w-full">
            <div className="flex flex-col items-center gap-2 mb-2 w-full">
                <div className="flex items-center gap-4 w-full justify-center">
                    <img src={user.photoURL} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-yellow-500 shadow-lg object-cover" />
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-white">{user.displayName}</h2>
                        <div className="flex gap-2 text-xs font-bold mt-1">
                            <span className="bg-green-800 text-green-100 px-2 py-0.5 rounded border border-green-600">Thắng: {user.wins || 0}</span>
                            <span className="bg-red-800 text-red-100 px-2 py-0.5 rounded border border-red-600">Thua: {user.losses || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full flex gap-3">
                <button onClick={onCreateGame} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2">
                    <span>⚔️</span> TẠO PHÒNG
                </button>
                
                {/* NÚT CHƠI VỚI MÁY (MỚI) */}
                <button onClick={onPlayAI} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-lg shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2">
                    <span>🤖</span> LUYỆN TẬP
                </button>
            </div>

            <div className="w-full flex flex-col gap-2 p-4 bg-slate-800 rounded-lg border border-slate-600">
                <label className="text-gray-400 text-xs font-bold uppercase">Nhập mã phòng thủ công:</label>
                <div className="flex gap-2">
                    <input type="text" placeholder="Nhập ID..." value={joinId} onChange={(e) => setJoinId(e.target.value)} className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-yellow-500" />
                    <button onClick={() => onJoinGame(joinId)} disabled={!joinId} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-bold rounded text-sm shadow">VÀO</button>
                </div>
            </div>

            <RoomList onJoinRoom={onJoinGame} />
        </div>

        <div className="w-full md:w-80">
            <Leaderboard />
        </div>

    </div>
  );
};

export default Lobby;
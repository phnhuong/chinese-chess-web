import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

const RoomList = ({ onJoinRoom }) => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    // Lấy các phòng có status là 'waiting', sắp xếp mới nhất lên đầu
    // Lưu ý: Nếu Firebase báo lỗi Index, hãy mở Console (F12) và bấm vào link để tạo Index
    const q = query(
      collection(db, "games"),
      where("status", "==", "waiting"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomData = [];
      snapshot.forEach((doc) => {
        roomData.push({ id: doc.id, ...doc.data() });
      });
      setRooms(roomData);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full mt-6">
      <h3 className="text-gray-400 text-sm font-bold mb-3 uppercase tracking-wider border-b border-slate-600 pb-2">
        🔥 Sàn Đấu (Các phòng đang chờ)
      </h3>
      
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {rooms.length === 0 ? (
          <div className="text-center p-6 border-2 border-dashed border-slate-600 rounded-lg text-slate-500 text-sm italic">
            Hiện không có ai đang chờ.<br/>Hãy là người đầu tiên tạo phòng!
          </div>
        ) : (
          rooms.map(room => (
            <div key={room.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-600 shadow-sm hover:border-yellow-500 transition-all hover:bg-slate-750">
              <div className="flex items-center gap-3">
                {/* Avatar chủ phòng (nếu có thì tốt, không thì dùng icon mặc định) */}
                <div className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center text-red-200 font-bold border border-red-500">
                    R
                </div>
                <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">
                        {room.redPlayerName || "Ẩn danh"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                        ID: {room.id.slice(0, 6)}...
                    </span>
                </div>
              </div>
              
              <button 
                onClick={() => onJoinRoom(room.id)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded shadow-md active:scale-95 transition-transform"
              >
                THAM GIA
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Lấy top 10 người có số trận thắng cao nhất
        const q = query(
          collection(db, "users"),
          orderBy("wins", "desc"),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const userList = [];
        querySnapshot.forEach((doc) => {
          userList.push(doc.data());
        });
        
        setUsers(userList);
      } catch (error) {
        console.error("Lỗi lấy BXH:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden mt-8">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 p-3 text-center shadow-md">
        <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
          🏆 Bảng Xếp Hạng
        </h3>
      </div>

      <div className="p-4">
        {loading ? (
          <p className="text-gray-400 text-center py-4">Đang tải...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
        ) : (
          <ul className="space-y-3">
            {users.map((user, index) => {
              // Top 3 có màu đặc biệt
              let rankColor = "bg-slate-700 text-gray-300";
              if (index === 0) rankColor = "bg-yellow-500 text-black font-bold shadow-yellow-500/50";
              if (index === 1) rankColor = "bg-gray-300 text-black font-bold";
              if (index === 2) rankColor = "bg-orange-400 text-black font-bold";

              return (
                <li key={user.uid} className="flex items-center gap-3 bg-slate-700/50 p-2 rounded-lg hover:bg-slate-700 transition-colors">
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow ${rankColor}`}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full border border-slate-500" />

                  {/* Info */}
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-400">Thua: {user.losses}</p>
                  </div>

                  {/* Wins */}
                  <div className="text-right">
                    <span className="text-green-400 font-bold text-lg">{user.wins}</span>
                    <span className="text-xs text-gray-500 block">Thắng</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
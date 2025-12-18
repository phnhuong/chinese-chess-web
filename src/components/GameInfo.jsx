import React from 'react';
import Timer from './Timer';

const GameInfo = ({ 
  gameMode, gameId, 
  turn, winner, 
  playerColor, currentUser, 
  redTime, blackTime, currentMoveTime 
}) => {
  // Xác định ai là ai để hiển thị đúng vị trí
  // Logic: "Tôi" luôn ở dưới (bottom), "Đối thủ" luôn ở trên (top)
  const isSpectator = playerColor === 'spectator';
  const myColor = isSpectator ? 'r' : playerColor; // Khán giả xem góc nhìn Đỏ
  const opponentColor = myColor === 'r' ? 'b' : 'r';

  const myTime = myColor === 'r' ? redTime : blackTime;
  const opponentTime = myColor === 'r' ? blackTime : redTime;

  // Tên hiển thị (Tạm thời hardcode đối thủ, sau này lấy từ DB nếu muốn xịn hơn)
  const myName = currentUser ? currentUser.displayName : (myColor === 'r' ? 'Quân Đỏ' : 'Quân Đen');
  const opponentName = gameMode === 'ai' ? 'Máy (AI)' : 'Đối thủ';

  const PlayerCard = ({ name, time, color, isMe }) => {
    // Check xem có phải lượt người này không
    const isActive = turn === color && !winner;
    
    // Style màu sắc
    const bgClass = color === 'r' ? 'bg-red-900/90 border-red-600' : 'bg-slate-900/90 border-slate-600';
    const activeClass = isActive ? 'ring-2 ring-yellow-400 shadow-lg scale-[1.02]' : 'opacity-80 grayscale-[0.3]';

    return (
      <div className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-300 ${bgClass} ${activeClass}`}>
        
        {/* Avatar & Tên */}
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${color === 'r' ? 'bg-red-600 border-red-300 text-white' : 'bg-black border-gray-400 text-white'}`}>
                {color === 'r' ? 'Đ' : 'D'}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    {isMe ? (isSpectator ? 'Đang xem' : 'Bạn') : 'Đối thủ'}
                </span>
                <span className="text-sm font-bold text-white truncate w-24 md:w-32">{name}</span>
            </div>
        </div>

        {/* Đồng hồ */}
        <div className="flex flex-col items-end">
            <div className="scale-75 origin-right">
                <Timer time={time} isActive={isActive && gameMode !== 'ai'} />
            </div>
            {isActive && gameMode !== 'ai' && (
                <span className="text-[10px] font-mono font-bold text-yellow-400 animate-pulse">
                    Nước đi: {currentMoveTime}s
                </span>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-1 mb-2">
        {/* THẺ ĐỐI THỦ (TRÊN) */}
        <PlayerCard name={opponentName} time={opponentTime} color={opponentColor} isMe={false} />
        
        {/* INFO BAR GIỮA */}
        <div className="flex justify-between items-center px-2 py-1">
            <span className="text-[10px] text-slate-500 font-mono">
                {gameMode === 'ai' ? '🤖 AI TRAINING' : `ROOM: ${gameId?.slice(0,6)}`}
            </span>
            {winner && (
                <span className="text-xs font-bold text-yellow-500 animate-bounce">
                    {winner === 'draw' ? 'HÒA CỜ' : (winner === 'r' ? 'ĐỎ THẮNG' : 'ĐEN THẮNG')}
                </span>
            )}
        </div>

        {/* THẺ CỦA MÌNH (DƯỚI) */}
        <PlayerCard name={myName} time={myTime} color={myColor} isMe={true} />
    </div>
  );
};

export default GameInfo;
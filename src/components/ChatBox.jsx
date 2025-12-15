import React, { useState, useEffect, useRef } from 'react';

// Nhận props: messages (danh sách tin nhắn), onSendMessage (hàm gửi), myColor (để biết ai đang chat)
const ChatBox = ({ messages, onSendMessage, myColor }) => {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  return (
    <div className="w-[300px] h-[300px] bg-slate-700 rounded-lg border-2 border-slate-600 flex flex-col shadow-xl mt-4">
      {/* TIÊU ĐỀ */}
      <div className="bg-slate-900 p-2 text-center border-b border-slate-600">
        <h3 className="text-yellow-500 font-bold text-lg uppercase">Phòng Chat</h3>
      </div>

      {/* DANH SÁCH TIN NHẮN */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-800">
        {messages.length === 0 && (
          <p className="text-gray-500 text-xs text-center italic mt-4">Chưa có tin nhắn...</p>
        )}
        
        {messages.map((msg, index) => {
          const isMe = msg.sender === myColor;
          return (
            <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div 
                className={`px-3 py-1 rounded-lg text-sm max-w-[80%] break-words
                  ${isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-600 text-gray-200 rounded-bl-none'}
                `}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-500 mt-1">
                {isMe ? 'Bạn' : (msg.sender === 'r' ? 'Đỏ' : 'Đen')}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* KHUNG NHẬP LIỆU */}
      <form onSubmit={handleSend} className="p-2 border-t border-slate-600 bg-slate-700 flex gap-2">
        <input 
          type="text" 
          placeholder="Nhập tin nhắn..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-3 py-1 bg-slate-600 text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold transition-colors">
          Gửi
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
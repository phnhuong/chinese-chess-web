import React from 'react'

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800">
      <h1 className="text-4xl font-bold text-yellow-500 mb-10 tracking-widest">
        CỜ TƯỚNG - REACT TAILWIND
      </h1>
      
      {/* Khung bàn cờ demo */}
      <div className="w-[450px] h-[500px] bg-[#eecfa1] border-8 border-[#8b4513] rounded shadow-2xl flex items-center justify-center">
        <span className="text-[#8b4513] font-bold text-2xl border-2 border-[#8b4513] p-4">
          BÀN CỜ SẴN SÀNG
        </span>
      </div>
    </div>
  )
}

export default App
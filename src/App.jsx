import React from 'react'
// Import Component Board vừa làm
import Board from './components/Board'

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800">
      <h1 className="text-4xl font-bold text-yellow-500 mb-8 tracking-widest drop-shadow-md">
        KỲ VƯƠNG ONLINE
      </h1>
      
      {/* Đặt bàn cờ vào đây */}
      <Board />
      
      <p className="mt-6 text-gray-400 text-sm">
        React + Tailwind + Firebase
      </p>
    </div>
  )
}

export default App
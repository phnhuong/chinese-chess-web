import React, { useState } from 'react'
import Board from './components/Board'
// Import dữ liệu từ file riêng
import { initialBoardState } from './utils/initialState'

function App() {
  // Lấy dữ liệu từ file import vào State
  const [pieces, setPieces] = useState(initialBoardState);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-800">
      <h1 className="text-4xl font-bold text-yellow-500 mb-8 tracking-widest drop-shadow-md">
        KỲ VƯƠNG ONLINE
      </h1>
      
      {/* Truyền props vào Board */}
      <Board pieces={pieces} />
      
      <p className="mt-6 text-gray-400 text-sm">
        Ngày 3: Bày Binh Bố Trận (Clean Code)
      </p>
    </div>
  )
}

export default App
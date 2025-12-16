// src/utils/book.js

// Hàm chọn ngẫu nhiên có trọng số
// moves = [{ move: {...}, weight: 70 }, { move: {...}, weight: 30 }]
const weightedRandom = (moves) => {
  const totalWeight = moves.reduce((sum, item) => sum + item.weight, 0);
  let randomNum = Math.random() * totalWeight;
  
  for (let item of moves) {
    if (randomNum < item.weight) {
      return item.move;
    }
    randomNum -= item.weight;
  }
  return moves[0].move; // Fallback
};

export const getBookMove = (pieces, history) => {
    // 1. TRƯỜNG HỢP MÁY ĐI TIÊN (AI Cầm Đỏ - Hiếm gặp trong mode hiện tại nhưng cứ viết sẵn)
    if (history.length === 0) {
        const openMoves = [
            { move: { fromId: 'b_c2', targetX: 4, targetY: 2 }, weight: 40 }, // Pháo đầu (e2)
            { move: { fromId: 'b_b1', targetX: 4, targetY: 2 }, weight: 30 }, // Tượng 3 tấn 5 (Phi Tượng)
            { move: { fromId: 'b_p3', targetX: 4, targetY: 3 }, weight: 20 }, // Tốt 5 tấn 1 (Tiên Nhân Chỉ Lộ)
            { move: { fromId: 'b_n2', targetX: 6, targetY: 2 }, weight: 10 }, // Mã 8 tấn 7 (Khởi Mã)
        ];
        return weightedRandom(openMoves);
    }

    // Lấy nước đi cuối cùng của đối thủ
    const lastMove = history[history.length - 1]; 
    
    // --- KỊCH BẢN 1: ĐỐI PHƯƠNG ĐI PHÁO ĐẦU (Vào e2) ---
    if (lastMove.text.includes("Pháo") && lastMove.text.includes("e2")) {
        const possibleResponses = [];

        // Phương án A: Mã 8 tấn 7 (Bình Phong Mã - Chắc chắn)
        const kn8 = pieces.find(p => p.id === 'b_n2');
        if (kn8 && kn8.x === 7 && kn8.y === 0) {
            possibleResponses.push({ 
                move: { fromId: 'b_n2', targetX: 6, targetY: 2 }, 
                weight: 60 
            });
        }

        // Phương án B: Pháo 8 bình 5 (Thuận Pháo - Đôi công)
        const c8 = pieces.find(p => p.id === 'b_c2');
        if (c8 && c8.x === 7 && c8.y === 2) {
            // Check lộ 5 (trung lộ) có trống không (thường là có Tướng hoặc Sĩ, Pháo đè lên cũng được)
            // Logic đơn giản: Bình vào e2 (x=4)
             possibleResponses.push({ 
                move: { fromId: 'b_c2', targetX: 4, targetY: 2 }, 
                weight: 25 
            });
        }

        // Phương án C: Pháo 2 bình 5 (Nghịch Pháo - Rất gắt)
        const c2 = pieces.find(p => p.id === 'b_c1');
        if (c2 && c2.x === 1 && c2.y === 2) {
             possibleResponses.push({ 
                move: { fromId: 'b_c1', targetX: 4, targetY: 2 }, 
                weight: 15 
            });
        }

        if (possibleResponses.length > 0) return weightedRandom(possibleResponses);
    }

    // --- KỊCH BẢN 2: ĐỐI PHƯƠNG ĐI TƯỢNG (Phi Tượng Cuộc - c0 -> e2) ---
    if (lastMove.text.includes("Tượng") && lastMove.text.includes("e2")) {
        // Đáp trả: Tốt đầu (p3 -> p4) để kiềm chế
        const p5 = pieces.find(p => p.id === 'b_p3');
        if (p5 && p5.x === 4 && p5.y === 3) {
            return { fromId: 'b_p3', targetX: 4, targetY: 4 }; // Tấn 1
        }
    }

    // --- KỊCH BẢN 3: ĐỐI PHƯƠNG THÚC TỐT ĐẦU (Tiên Nhân Chỉ Lộ) ---
    if (lastMove.text.includes("Tốt") && (lastMove.text.includes("c3") || lastMove.text.includes("g3"))) {
        // Đáp trả 1: Đối Binh (Thúc tốt đầu lại)
        const p5 = pieces.find(p => p.id === 'b_p3');
        if (p5 && p5.x === 4 && p5.y === 3) {
             return { fromId: 'b_p3', targetX: 4, targetY: 4 };
        }
        // Đáp trả 2: Pháo 2 bình 3 (Tốt để pháo đánh)
        // ...
    }

    // Nếu không trúng tủ -> Trả về null để dùng Minimax tính
    return null;
};
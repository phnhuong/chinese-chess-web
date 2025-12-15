export const generateFen = (pieces, turn) => {
  let fen = "";
  
  // Duyệt từ hàng 0 (trên cùng) đến hàng 9 (dưới cùng)
  for (let y = 0; y < 10; y++) {
    let emptyCount = 0;
    
    for (let x = 0; x < 9; x++) {
      // Tìm quân cờ tại vị trí x, y
      const piece = pieces.find(p => p.x === x && p.y === y);
      
      if (piece) {
        // Nếu có ô trống trước đó -> ghi số vào
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        
        // Ghi ký tự quân cờ
        // Quân Đỏ -> Chữ Hoa, Quân Đen -> Chữ thường
        let char = piece.type.toUpperCase(); // Mặc định hoa (cho Đỏ)
        
        // Riêng quân Mã (n) và Tượng (b) của Đỏ đôi khi ký hiệu là N, B
        // Nhưng Stockfish Cờ Tướng dùng:
        // Đỏ: R N B A K C P
        // Đen: r n b a k c p
        
        if (piece.color === 'b') {
          char = char.toLowerCase();
        }
        
        fen += char;
      } else {
        emptyCount++;
      }
    }
    
    // Hết hàng -> ghi nốt số ô trống nếu có
    if (emptyCount > 0) {
      fen += emptyCount;
    }
    
    // Thêm dấu gạch chéo phân cách hàng (trừ hàng cuối)
    if (y < 9) {
      fen += "/";
    }
  }
  
  // Thêm lượt đi (w = Red, b = Black)
  // Lưu ý: Chuẩn FEN cờ tướng dùng 'w' cho Đỏ (Red/White), 'b' cho Đen
  const turnChar = turn === 'r' ? 'w' : 'b';
  
  fen += ` ${turnChar} - - 0 1`;
  
  return fen;
};
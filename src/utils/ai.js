import { isValidMove, willCauseSelfCheck } from './rules';

export const getBestMove = (pieces, turn) => {
  // 1. Lấy tất cả quân của phe máy
  const myPieces = pieces.filter(p => p.color === turn);
  const validMoves = [];

  // 2. Duyệt qua từng quân, tìm tất cả các ô có thể đi
  for (let piece of myPieces) {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        // Kiểm tra luật đi cơ bản
        if (isValidMove(piece, x, y, pieces)) {
          // Kiểm tra xem đi xong có bị "tự sát" không
          if (!willCauseSelfCheck(piece, x, y, pieces)) {
            // Nếu ổn -> Thêm vào danh sách nước đi tiềm năng
            validMoves.push({ 
                fromId: piece.id, 
                targetX: x, 
                targetY: y 
            });
          }
        }
      }
    }
  }

  // 3. Chọn ngẫu nhiên 1 nước đi trong danh sách
  if (validMoves.length > 0) {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }
  
  return null; // Hết cờ (Không còn nước đi)
};
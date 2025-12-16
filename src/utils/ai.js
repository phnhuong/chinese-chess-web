import { isValidMove, willCauseSelfCheck, isGameOver, isCheck } from './rules';

// 1. GIÁ TRỊ CƠ BẢN
const PIECE_VALUES = { k: 10000, r: 900, c: 450, n: 400, b: 200, a: 200, p: 100 };

// 2. BẢNG ĐIỂM VỊ TRÍ (Piece-Square Tables)
// Lưu ý: Bảng này viết cho QUÂN ĐỎ (đi từ dưới lên).
// Khi tính cho Quân Đen, ta sẽ lật ngược bảng lại (mirror).

// TỐT (PAWN): Qua sông (hàng 0-4) giá trị tăng mạnh. Tiến càng sâu càng mạnh.
const PAWN_PST = [
  [  0,  0,  0,  0,  0,  0,  0,  0,  0], // Hàng 0 (Đáy địch - Tốt lụt)
  [ 90, 90,110,120,120,120,110, 90, 90], // Hàng 1 (Áp sát cung)
  [ 90, 90,110,120,120,120,110, 90, 90],
  [ 70, 90,110,110,110,110,110, 90, 70],
  [ 70, 70, 70, 70, 70, 70, 70, 70, 70], // Hàng 4 (Vừa qua sông)
  [  0,  0,  0,  0,  0,  0,  0,  0,  0], // Hàng 5 (Sông - Bên mình)
  [  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [  0,  0,  0,  0,  0,  0,  0,  0,  0],
  [  0,  0,  0,  0,  0,  0,  0,  0,  0]  // Hàng 9 (Đáy nhà)
];

// MÃ (KNIGHT): Thích ở giữa, ghét ở biên.
const KNIGHT_PST = [
  [ 90, 90, 90, 96, 90, 96, 90, 90, 90],
  [ 90, 96,103, 97, 94, 97,103, 96, 90],
  [ 92, 98, 99,103, 99,103, 99, 98, 92],
  [ 93,108,100,107,100,107,100,108, 93], // Hàng tốt nhất (giữa bàn)
  [ 90,100, 99,103,100,103, 99,100, 90],
  [ 90, 98,101,102,103,102,101, 98, 90],
  [ 92, 94, 98, 95, 98, 95, 98, 94, 92],
  [ 93, 92, 94, 95, 92, 95, 94, 92, 93],
  [ 85, 90, 92, 93, 78, 93, 92, 90, 85],
  [ 88, 85, 90, 88, 90, 88, 90, 85, 88]
];

// XE (ROOK): Thích hàng ngang thoáng, thích áp cửu.
const ROOK_PST = [
  [100,100,100,100,100,100,100,100,100],
  [110,110,110,110,110,110,110,110,110],
  [100,100,100,100,100,100,100,100,100],
  [100,100,100,100,100,100,100,100,100],
  [100,100,100,100,100,100,100,100,100],
  [100,100,100,100,100,100,100,100,100],
  [100,100,100,100,100,100,100,100,100],
  [ 95,100,100,100,100,100,100,100, 95],
  [100,100,100,100,100,100,100,100,100], // Hàng áp đáy
  [ 90,100,100,100,100,100,100,100, 90]  // Xe ở góc khởi đầu thấp điểm hơn chút
];

// PHÁO (CANNON): Thích ở hàng 2 (pháo gánh), thích trung lộ.
const CANNON_PST = [
  [100,100, 96, 91, 90, 91, 96,100,100],
  [ 98, 98, 96, 92, 89, 92, 96, 98, 98],
  [ 97, 97, 96, 91, 92, 91, 96, 97, 97],
  [ 96, 99, 99, 98,100, 98, 99, 99, 96],
  [ 96, 96, 96, 96,100, 96, 96, 96, 96], 
  [ 95, 96, 99, 96,100, 96, 99, 96, 95], // Trung lộ mạnh
  [ 96, 96, 96, 96, 96, 96, 96, 96, 96],
  [ 97, 97, 97, 97, 97, 97, 97, 97, 97], // Hàng pháo đầu
  [ 96, 95, 98, 93, 93, 93, 98, 95, 96],
  [ 96, 96, 97, 90, 90, 90, 97, 96, 96]
];

// Các quân khác (Tướng, Sĩ, Tượng) ít di chuyển, ta để bảng phẳng (flat) hoặc đơn giản
const DEFAULT_PST = [
  [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0]
];

const PST = {
  p: PAWN_PST,
  n: KNIGHT_PST,
  r: ROOK_PST,
  c: CANNON_PST,
  k: DEFAULT_PST, a: DEFAULT_PST, b: DEFAULT_PST
};

// HÀM LẤY ĐIỂM VỊ TRÍ
const getPositionScore = (piece, x, y) => {
  const table = PST[piece.type];
  if (!table) return 0;

  if (piece.color === 'r') {
    // Quân Đỏ: Tra bảng trực tiếp
    return table[y][x];
  } else {
    // Quân Đen: Tra bảng ngược (Mirror)
    // Hàng y của Đen = Hàng (9-y) của Đỏ
    // Cột thì đối xứng nhưng bảng thường đối xứng trái phải nên không cần đảo cột (hoặc đảo x nếu cần)
    // Ở đây bảng của tôi đối xứng trái phải nên chỉ cần đảo Y.
    return table[9 - y][x];
  }
};

// --- HÀM ĐÁNH GIÁ (UPDATED) ---
const evaluateBoard = (pieces) => {
  let score = 0;
  for (let p of pieces) {
    const materialValue = PIECE_VALUES[p.type];
    const positionValue = getPositionScore(p, p.x, p.y);
    
    // Tổng điểm = Giá trị quân + Giá trị vị trí
    // Lưu ý: Giá trị vị trí trong bảng của tôi là số dương (~100).
    // Có thể cần scale lại nếu nó quá lớn so với giá trị quân.
    // Ở đây tôi đã chỉnh PIECE_VALUES lên hàng trăm để tương xứng.
    
    const totalValue = materialValue + positionValue;

    if (p.color === 'r') score += totalValue;
    else score -= totalValue;
  }
  return score;
};

// ... (GIỮ NGUYÊN PHẦN CÒN LẠI: getAllMoves, simulateMove, minimax, getBestMove) ...

// Copy lại các hàm cũ để đảm bảo file hoạt động (không bị thiếu)
const getAllMoves = (pieces, turn) => {
  const moves = [];
  const myPieces = pieces.filter(p => p.color === turn);
  for (let piece of myPieces) {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        if (isValidMove(piece, x, y, pieces)) {
          if (!willCauseSelfCheck(piece, x, y, pieces)) {
            moves.push({ fromId: piece.id, targetX: x, targetY: y, pieceType: piece.type, color: turn });
          }
        }
      }
    }
  }
  return moves;
};

const simulateMove = (currentPieces, move) => {
  return currentPieces
    .filter(p => !(p.x === move.targetX && p.y === move.targetY))
    .map(p => {
      if (p.id === move.fromId) return { ...p, x: move.targetX, y: move.targetY };
      return p;
    });
};

const minimax = (pieces, depth, alpha, beta, isMaximizingPlayer) => {
  if (depth === 0) return evaluateBoard(pieces);

  const turn = isMaximizingPlayer ? 'r' : 'b';
  const possibleMoves = getAllMoves(pieces, turn);

  if (possibleMoves.length === 0) return isMaximizingPlayer ? -100000 : 100000;

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (let move of possibleMoves) {
      const newPieces = simulateMove(pieces, move);
      const evalScore = minimax(newPieces, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; 
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let move of possibleMoves) {
      const newPieces = simulateMove(pieces, move);
      const evalScore = minimax(newPieces, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getBestMove = (pieces, turn) => {
  const DEPTH = 4; // Giữ nguyên độ sâu 4
  console.time("AI Thinking Time");
  const possibleMoves = getAllMoves(pieces, turn);
  let bestMove = null;
  let bestValue = Infinity; // Đen tìm Min
  let alpha = -Infinity;
  let beta = Infinity;

  // Move Ordering đơn giản: Ưu tiên quân Xe, Pháo, Mã đi trước để cắt tỉa nhanh hơn
  possibleMoves.sort((a, b) => {
      const scoreA = PIECE_VALUES[a.pieceType] || 0;
      const scoreB = PIECE_VALUES[b.pieceType] || 0;
      return scoreB - scoreA; // Giảm dần
  });

  for (let move of possibleMoves) {
    const newPieces = simulateMove(pieces, move);
    const boardValue = minimax(newPieces, DEPTH - 1, alpha, beta, true);
    
    if (boardValue < bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
    beta = Math.min(beta, bestValue);
  }
  console.timeEnd("AI Thinking Time");
  console.log(`AI chọn nước: ${bestValue}`);
  return bestMove;
};
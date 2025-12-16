import { isValidMove, willCauseSelfCheck, isGameOver, isCheck } from './rules';
import { getBookMove } from './book';

const PIECE_VALUES = { k: 10000, r: 900, c: 450, n: 400, b: 200, a: 200, p: 100 };

// --- BẢNG ĐIỂM VỊ TRÍ (PST) ---
const PAWN_PST = [
  [0,0,0,0,0,0,0,0,0], [90,90,110,120,120,120,110,90,90], [90,90,110,120,120,120,110,90,90], [70,90,110,110,110,110,110,90,70], [70,70,70,70,70,70,70,70,70],
  [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0]
];
const KNIGHT_PST = [
  [90,90,90,96,90,96,90,90,90], [90,96,103,97,94,97,103,96,90], [92,98,99,103,99,103,99,98,92], [93,108,100,107,100,107,100,108,93], [90,100,99,103,100,103,99,100,90],
  [90,98,101,102,103,102,101,98,90], [92,94,98,95,98,95,98,94,92], [93,92,94,95,92,95,94,92,93], [85,90,92,93,78,93,92,90,85], [88,85,90,88,90,88,90,85,88]
];
const ROOK_PST = [
  [100,100,100,100,100,100,100,100,100], [110,110,110,110,110,110,110,110,110], [100,100,100,100,100,100,100,100,100], [100,100,100,100,100,100,100,100,100], [100,100,100,100,100,100,100,100,100],
  [100,100,100,100,100,100,100,100,100], [100,100,100,100,100,100,100,100,100], [95,100,100,100,100,100,100,100,95], [100,100,100,100,100,100,100,100,100], [90,100,100,100,100,100,100,100,90]
];
const CANNON_PST = [
  [100,100,96,91,90,91,96,100,100], [98,98,96,92,89,92,96,98,98], [97,97,96,91,92,91,96,97,97], [96,99,99,98,100,98,99,99,96], [96,96,96,96,100,96,96,96,96], 
  [95,96,99,96,100,96,99,96,95], [96,96,96,96,96,96,96,96,96], [97,97,97,97,97,97,97,97,97], [96,95,98,93,93,93,98,95,96], [96,96,97,90,90,90,97,96,96]
];
const DEFAULT_TABLE = [
  [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0]
];

const PST = {
  p: PAWN_PST, 
  n: (typeof KNIGHT_PST !== 'undefined' ? KNIGHT_PST : DEFAULT_TABLE),
  r: (typeof ROOK_PST !== 'undefined' ? ROOK_PST : DEFAULT_TABLE),
  c: (typeof CANNON_PST !== 'undefined' ? CANNON_PST : DEFAULT_TABLE),
  k: DEFAULT_TABLE, a: DEFAULT_TABLE, b: DEFAULT_TABLE
};

// --- HELPER FUNCTIONS ---
const getPositionScore = (piece, x, y) => {
  const table = PST[piece.type] || DEFAULT_TABLE;
  if (x < 0 || x > 8 || y < 0 || y > 9) return 0;
  const score = (piece.color === 'r') ? table[y] && table[y][x] : table[9 - y] && table[9 - y][x];
  return typeof score === 'number' ? score : 0;
};

// Hàm thưởng điểm tấn công
const getAttackBonus = (piece, x, y, enemyKing) => {
  if (!enemyKing) return 0;
  const dist = Math.abs(x - enemyKing.x) + Math.abs(y - enemyKing.y);
  if (['r', 'n', 'c', 'p'].includes(piece.type) && dist <= 3) return 60;
  if (x === 4 && ['c', 'p', 'r'].includes(piece.type)) return 30;
  return 0;
};

const evaluateBoard = (pieces) => {
  let score = 0;
  const redKing = pieces.find(p => p.type === 'k' && p.color === 'r');
  const blackKing = pieces.find(p => p.type === 'k' && p.color === 'b');

  for (let p of pieces) {
    let val = PIECE_VALUES[p.type] || 0;
    val += getPositionScore(p, p.x, p.y);
    if (p.color === 'r' && blackKing) val += getAttackBonus(p, p.x, p.y, blackKing);
    else if (p.color === 'b' && redKing) val += getAttackBonus(p, p.x, p.y, redKing);

    if (p.color === 'r') score += val; else score -= val;
  }
  return score;
};

// --- MINIMAX CORE ---
const getAllMoves = (pieces, turn) => {
  const moves = [];
  const myPieces = pieces.filter(p => p.color === turn);
  for (let piece of myPieces) {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        if (isValidMove(piece, x, y, pieces) && !willCauseSelfCheck(piece, x, y, pieces)) {
          moves.push({ fromId: piece.id, targetX: x, targetY: y, pieceType: piece.type, color: turn });
        }
      }
    }
  }
  return moves;
};

const getCaptureMoves = (pieces, turn) => {
  const moves = [];
  const myPieces = pieces.filter(p => p.color === turn);
  for (let piece of myPieces) {
    for (let x = 0; x < 9; x++) {
      for (let y = 0; y < 10; y++) {
        const target = pieces.find(p => p.x === x && p.y === y);
        if (target && target.color !== turn) { 
             if (isValidMove(piece, x, y, pieces) && !willCauseSelfCheck(piece, x, y, pieces)) {
                moves.push({ fromId: piece.id, targetX: x, targetY: y, pieceType: piece.type, color: turn });
             }
        }
      }
    }
  }
  moves.sort((a, b) => {
      const victimA = pieces.find(p => p.x === a.targetX && p.y === a.targetY);
      const victimB = pieces.find(p => p.x === b.targetX && p.y === b.targetY);
      const valA = victimA ? PIECE_VALUES[victimA.type] : 0;
      const valB = victimB ? PIECE_VALUES[victimB.type] : 0;
      return valB - valA;
  });
  return moves;
};

const simulateMove = (currentPieces, move) => {
  return currentPieces.filter(p => !(p.x === move.targetX && p.y === move.targetY)).map(p => { if (p.id === move.fromId) return { ...p, x: move.targetX, y: move.targetY }; return p; });
};

const quiescence = (pieces, alpha, beta, isMaximizingPlayer) => {
  const standPat = evaluateBoard(pieces);
  if (isMaximizingPlayer) {
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (beta > standPat) beta = standPat;
  }
  const turn = isMaximizingPlayer ? 'r' : 'b';
  const captureMoves = getCaptureMoves(pieces, turn);
  for (let move of captureMoves) {
    const newPieces = simulateMove(pieces, move);
    const score = quiescence(newPieces, alpha, beta, !isMaximizingPlayer);
    if (isMaximizingPlayer) {
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    } else {
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
  }
  return isMaximizingPlayer ? alpha : beta;
};

// --- MINIMAX VỚI ƯU TIÊN THẮNG SỚM ---
const minimax = (pieces, depth, alpha, beta, isMaximizingPlayer) => {
  if (depth === 0) return quiescence(pieces, alpha, beta, isMaximizingPlayer);
  const turn = isMaximizingPlayer ? 'r' : 'b';
  const possibleMoves = getAllMoves(pieces, turn);
  
  // Nếu hết nước đi -> Trả về điểm cực lớn +/- Depth để ưu tiên đường ngắn nhất
  if (possibleMoves.length === 0) return isMaximizingPlayer ? (-100000 - depth) : (100000 + depth);

  possibleMoves.sort((a, b) => {
      const targetA = pieces.find(p => p.x === a.targetX && p.y === a.targetY);
      const targetB = pieces.find(p => p.x === b.targetX && p.y === b.targetY);
      const valA = targetA ? PIECE_VALUES[targetA.type] : 0;
      const valB = targetB ? PIECE_VALUES[targetB.type] : 0;
      return valB - valA;
  });

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

// --- HÀM TẠO CHUỖI NƯỚC ĐI ---
const getMoveString = (piece, targetX, targetY) => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    const names = { r: 'Xe', n: 'Mã', b: 'Tượng', a: 'Sĩ', k: 'Tướng', c: 'Pháo', p: 'Tốt' };
    return `${names[piece.type]} (${letters[piece.x]}${9 - piece.y} → ${letters[targetX]}${9 - targetY})`;
};

// --- MAIN FUNCTION ---
export const getBestMove = (pieces, turn, history) => {
  // 1. Sách
  if (turn === 'b' && history) {
      const bookMove = getBookMove(pieces, history);
      if (bookMove) {
          console.log("AI DÙNG SÁCH KHAI CUỘC");
          return bookMove;
      }
  }

  // 2. Minimax
  const DEPTH = 4;
  console.time("AI Thinking Time");
  
  const possibleMoves = getAllMoves(pieces, turn);
  let bestMove = null;
  let bestValue = Infinity; // Black minimizes
  let alpha = -Infinity;
  let beta = Infinity;

  possibleMoves.sort((a, b) => {
      const targetA = pieces.find(p => p.x === a.targetX && p.y === a.targetY);
      const targetB = pieces.find(p => p.x === b.targetX && p.y === b.targetY);
      return (targetB ? PIECE_VALUES[targetB.type] : 0) - (targetA ? PIECE_VALUES[targetA.type] : 0);
  });

  // --- LOGIC CHỐNG LẶP (ĐÃ CHỈNH SỬA) ---
  const aiHistory = history ? history.filter(h => h.turn === turn) : [];
  const recentMoves = aiHistory.slice(-12);

  for (let move of possibleMoves) {
    const newPieces = simulateMove(pieces, move);
    let boardValue = minimax(newPieces, DEPTH - 1, alpha, beta, true);
    
    // Check lặp
    const piece = pieces.find(p => p.id === move.fromId);
    const currentMoveStr = getMoveString(piece, move.targetX, move.targetY);
    let repCount = 0;
    for (let h of recentMoves) { if (h.text === currentMoveStr) repCount++; }
    
    // ĐƯỢC PHÉP LẶP 3 LẦN (NẾU repCount >= 3 TỨC LÀ ĐÃ ĐI 3 LẦN RỒI, SẮP ĐI LẦN 4 -> CẤM)
    if (repCount >= 3) { 
        boardValue += 200000; // Phạt nặng
        console.log(`Cấm lặp lần 4 (Trường chiếu): ${currentMoveStr}`); 
    }

    if (boardValue < bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
    beta = Math.min(beta, bestValue);
  }
  
  console.timeEnd("AI Thinking Time");
  console.log(`AI (Depth ${DEPTH}) chọn điểm: ${bestValue}`);
  
  return bestMove;
};